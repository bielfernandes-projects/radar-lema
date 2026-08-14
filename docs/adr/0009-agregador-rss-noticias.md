# Agregador próprio de notícias via RSS (substitui a NewsAPI)

## Status

Aceito. Substitui a fonte de dados da ADR `0008-noticias-ingestao-agendada`
(que permanece válida quanto ao padrão "ingestão agendada, não fetch ao vivo").

## Contexto

As Notícias de Mercado eram ingeridas da NewsAPI (`/v2/everything` com query
genérica de RPPS/economia). O resultado trazia muito ruído e pouco foco no
nicho institucional da Lema. Além disso, dependia de key externa, rate-limit e
janela de apenas 24h no plano Developer.

## Decisão

**Agregador próprio baseado em RSS**, mantendo o mesmo contêiner de ingestão:

- A Edge Function `news-ingest` deixa de chamar a NewsAPI e passa a baixar
  feeds RSS, parsear o XML (`fast-xml-parser` via esm.sh, no runtime Deno),
  normalizar para o shape da tabela `news` e gravar com **upsert dedupe por
  URL original da matéria** (`onConflict: "url"`, `ignoreDuplicates: true`).
- Fontes diretas: Investidor Institucional, ABIPEM, Gov.br/Previdência e
  Banco Central do Brasil (feed primário `api/feed/pt-br/OBCB/Noticias` com
  fallback para o feed real de notícias
  `api/feed/sitebcb/sitefeeds/noticias`).
- Fontes via Google Alerts (palavras-chave `RPPS`, `Regime Próprio de
  Previdência`, `CMN 5.272`, `CMN 4.963`): monitoram G1, Valor, InfoMoney
  etc. sem custo e sem key.
- Agendamento inalterado: `pg_cron` + `pg_net` (`radar-news-ingest`),
  agora **a cada 1 hora** (`0 * * * *`). Job registrado em deploy (não
  versionado) porque autentica com a service role key.

> **⚠️ Gov.br/Previdência**: o feed
> `https://www.gov.br/previdencia/pt-br/assuntos/noticias/RSS` está retornando
> **404** e o portal gov.br deixou de servir RSS nos caminhos `/RSS`
> (devolvem HTML). A entrada permanece na lista de fontes — a rodada reporta
> o erro por feed sem derrubar as demais — mas precisa de uma URL funcional
> ou de uma futura captura via HTML.

### Desduplicação e Google Alerts

A URL canônica de cada item é o link **final do artigo de terceiros**, não a
URL do feed. Os itens de Google Alerts apontam para um redirect do Google
(`https://www.google.com.br/url?q=<url-encoded>`); o parser extrai o
parâmetro `q=` e decodifica antes de gravar, garantindo que:

1. o dedupe compara as URLs reais das matérias (G1, Valor, InfoMoney);
2. itens repetidos entre alerts (ex.: mesma matéria em `RPPS` e
   `CMN 5.272`) colapsam num único registro na mesma rodada (Set em memória)
   e em rodadas seguintes (unique constraint).

### Normalização e tópicos

- `source`: nome do feed (fontes diretas) ou o sufixo " - <fonte>" do título
  do alerta (Google Alerts).
- `image_url`: melhor esforço — `<media:thumbnail>`, `<media:content>`,
  `<enclosure type="image/*">` ou `<img>` no description; `NULL` caso
  contrário (o `NewsCard`/`NewsDetail` têm fallback com ícone).
- `description`: HTML do feed é limpo (tags removidas, entidades decodificadas).
- `topic`: reescrita do mapa `TOPIC_KEYWORDS` para o vocabulário
  institucional (`rpps`, `regulamentacao`, `investimentos`, `mercado`,
  `economia`, `outros`).

### Observabilidade

A função retorna `{ inserted, fetched, skipped, feeds: [{ name, fetched,
valid, error? }] }` e loga erros via `console.error` (Logs do Supabase).
Sem tabela de histórico de rodadas nesta fase.

## Alternativas consideradas

- **GitHub Actions (cron)**: custo zero e sem timeout de Edge Function, mas
  introduz outro orquestrador fora do perímetro Supabase e exige a service
  role como secret de repositório. Sem ganho real para ~9 feeds.
- **Cron Triggers nativos do Supabase**: mesmo runtime; apenas remove o passo
  manual de registrar o job. Deixado como evolução operacional futura.
- **Cloudflare Workers / container (Railway, Render)**: provedor/serviço
  externo adicional, sem benefício para o volume atual.

## Consequências

- `NEWSAPI_KEY` deixa de existir; o secret pode ser removido do Supabase.
- Sem novas migrations: a tabela `news` (RLS, índices, `news_url_unique`) e
  as referências em `likes`/`comments`/`Moderation`/`ManageHub` permanecem.
- Na aba Notícias do `/gestao/hub` o staff pode **excluir** notícias
  indesejadas (a policy `news_write` FOR ALL já permitia); itens ainda
  presentes no feed voltam na próxima ingestão. Sem edição manual.
- Falha de um feed não derruba a rodada (`Promise.allSettled`); cada feed
  tem `fetch` com timeout de 30s e lista de fallback quando houver.
- Novas fontes entram apenas adicionando o par `{ name, url }` em `FEEDS` e
  redeployando a função.
