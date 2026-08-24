# Ingestão automática de artigos do blog da Lema

## Status

Aceito. Complementa a curadoria manual da aba Artigos sem substituir nem impedir o cadastro à mão de outras fontes.

## Contexto

A seção de Artigos do Radar Lema hoje contém apenas conteúdo escrito à mão pelo staff dentro da aplicação. Ao mesmo tempo, a Lema publica regularmente no próprio blog (`https://www.lemaef.com.br/blog/`) boletins econômicos, análises técnicas, relatórios macro e outras análises de valor para o público RPPS — e nenhum desse conteúdo chega automaticamente ao hub.

## Decisão

**Edge Function `blog-ingest` que puxa posts publicados no blog da Lema**, seguindo o mesmo padrão de ingestão agendada que já funciona para notícias (`ADR 0009`):

- A função acessa a REST API aberta do WordPress (`/wp-json/wp/v2/posts?_embed=true`) e normaliza os posts para o shape da tabela `articles`.
- **Deduplicação por `source_id`** (ID do post no WordPress), com **atualização automática quando `modified_gmt` muda** na fonte. Não re-descarga a capa se o URL dela não mudou.
- **Rastreamento de exclusões via tombstone table** `article_ingest_tombstones`: quando o staff exclui um artigo importado, o cron o pula indefinidamente — o botão excluir não fica quebrado.
- **Mirrors das capas no bucket `article-covers`**: WordPress gera 5 variantes de imagem; preferimos a de 300px (≈42–111 KB, bom balanço entre clareza e peso). Artigos sem imagem destacada caem no placeholder `BookOpen` (sem quebrar a simetria da grade).
- **Agendamento: 3× ao dia** (`0 10,16,22 * * *` UTC ≡ 7h, 13h, 19h Fortaleza). Padrão `pg_cron` + `pg_net` reutilizado do `radar-news-ingest`.

### Normalização e metadados

Mapeamento de campos do WordPress para `articles`:

| Campo em `articles` | Origem no WordPress | Tratamento |
|---|---|---|
| `title` | `title.rendered` | HTML limpo, entidades decodificadas |
| `subtitle`, `body` | `excerpt.rendered` | Teaser fornecido pelo WordPress, marcador `[…]` removido |
| `author` | Fixo | `'Lema'` — não usamos os logins do WP |
| `source_url` | `link` | URL pública do post no blog |
| `cover_url` | Media REST (`_embedded['wp:featuredmedia']`) | URL pública no bucket Supabase após espelho |
| `visibility` | Fixo | `'public'` — todos os posts do blog são públicos |
| `created_at` | `date_gmt` | Data de publicação no blog, não de importação — torna o ordenamento correto |
| Novos: `origin` | Fixo | `'blog'` (vs. `'staff'` para artigos manuais) |
| Novos: `source_id` | `id` do post | Chave de dedupe; índice único permissivo de `NULL` |
| Novos: `source_modified_at` | `modified_gmt` | Detecta atualizações na origem |
| Novos: `source_cover_url` | URL antes do espelho | Sinaliza quando rebaixar a capa de novo |

### Curadoria manual e ingestão coexistem

A tabela `articles` continua aceitando inserções manuais (staff cadastra à mão) e importadas automaticamente (cron). Sem conflito porque:

- Artigos manuais têm `origin = 'staff'` e `source_id = NULL`.
- Artigos do blog têm `origin = 'blog'` e `source_id = <ID do WordPress>`.
- O índice `idx_articles_source_id` é único e parcial (`WHERE source_id IS NOT NULL`), então múltiplos `NULL` não colidem.
- Editar e excluir em ManageHub permanecem em **todos** os artigos, qualquer que seja a origem. Exclusão automática dispara o trigger `article_delete_tombstone`, que grava o tombstone.

### Tombstones: exclusão permanente

Sem o mecanismo de tombstone, excluir um artigo do blog seria desfeito na próxima ingestão (o post ainda existe lá). A tabela `article_ingest_tombstones (source_id, deleted_at)` alimentada pelo trigger `AFTER DELETE` resolve isso:

1. Staff exclui um artigo via `/gestao/hub` → trigger grava o `source_id` em tombstones.
2. Próxima rodada do cron pula qualquer `source_id` listado.
3. Editores do blog podem reescrever o post (mudança em `modified_gmt`), mas o artigo importado **não** volta automaticamente.

Sobre **edição**: uma edição feita pelo staff no app se mantém indefinidamente, porque o cron só reescreve quando `source_gmt` muda. Só é desfeita se o post no WordPress for editado depois.

### Download e espelhamento de capas

O endpoint `/wp-json/wp/v2/posts?_embed` traz os detalhes da imagem destacada em `_embedded['wp:featuredmedia'][0].media_details.sizes`, com variantes: 150px, 300px, 768px, full. Escolha: **300px** (≈50–100 KB; imagens do WordPress costumam ser altas).

Fluxo por post:
1. Extrai a URL do 300px (fallback para medium_large, depois full).
2. Se é post novo ou a capa mudou desde a última importação, baixa.
3. Upload para `article-covers` com nome `{source_id}.jpg` (upsert, sobrescreve se houver).
4. Obtém a URL pública e grava em `cover_url`.

Post sem capa grava `cover_url = NULL`; o `ArticleCard` já tem fallback (`BookOpen` icon).

**CSP não muda**: capas saem do Supabase (`article-covers` bucket), dentro da política `img-src` existente.

### Observabilidade

Retorno da função: `{ inserted, updated, skipped, total_in_blog, processed }`.

- `inserted`: quantos artigos eram novos (source_id não existia).
- `updated`: quantos foram reescritos (modified_gmt mudou).
- `skipped`: quantos foram pulos (tombstone, sem modificação, erro de download).
- `total_in_blog`: contagem X-WP-Total do servidor (cresce com cada novo post).
- `processed`: inseridos + atualizados + pulados nesta rodada.

Logs via `console.error` no Supabase (Logs da Edge Function).

## Alternativas consideradas

- **Cron direto em pg_cron com pgsql**: descentraliza a lógica de parse/download; mais robusto para falhas de rede. Deixado como evolução.
- **Feed RSS do blog**: WordPress fornece `/blog/feed/`, mas não inclui a imagem destacada — apenas `<img>` no corpo (gráficos dos relatórios, não capa).
- **Spreadsheet ou formulário manual**: Lema já tem o blog em produção; automação poupa reentrada de dados.

## Consequências

- **Schema**: 4 colunas novas em `articles` (`origin`, `source_id`, `source_modified_at`, `source_cover_url`) + nova tabela `article_ingest_tombstones` + trigger/função + índice único parcial.
- **UI**:
  - Chip "Blog Lema" exibido no card e na gestão para artigos com `origin = 'blog'`.
  - Botão "Ler no site da Lema" em `ArticleDetail`, substituindo o hardcoded "LinkedIn".
  - Coluna origin visível na tabela de gestão.
- **Semantics**: conteúdo é sincronizado de uma única fonte externa (blog) para uma vitrine curada que também aceita outros artigos. Edições do staff têm precedência até o blog reescrever o post.
- **Observabilidade**: sem tabela de histórico de rodadas nesta fase.

## Agendamento em produção

O job `radar-blog-ingest` é registrado via `pg_cron` por um script de deploy (não versionado), semelhante ao `radar-news-ingest`. Autenticação: `Authorization: Bearer {SERVICE_ROLE_KEY}`, enviada pelo pg_net.

```sql
-- Executar uma única vez em deploy (não versionado)
SELECT cron.schedule(
  'radar-blog-ingest',
  '0 10,16,22 * * *', -- UTC: 07:00, 13:00, 19:00 Fortaleza
  'SELECT net.http_post(
    url := ''https://<project-id>.supabase.co/functions/v1/blog-ingest'',
    headers := jsonb_build_object(
      ''Authorization'', ''Bearer <SERVICE_ROLE_KEY>''
    ),
    body := ''''
  ) as request_id;'
);
```
