# Notícias de Mercado via ingestão agendada (não fetch ao vivo)

## Contexto

As Notícias de Mercado vêm de uma API externa (NewsAPI). Duas opções: o app
chama a API ao vivo a cada visita à tela, ou uma Edge Function agendada puxa
as notícias e grava numa tabela própria (`news`) que o app lê.

## Decisão

**Ingestão agendada**: uma Edge Function (`news-ingest`) roda periodicamente
via `pg_cron` + `pg_net` (padrão já usado pelo `notification-scheduler`),
busca na NewsAPI e grava em `news`. O app lê sempre do banco.

## Alternativas consideradas

- **Fetch ao vivo da API externa**: descartado porque (1) impediria Curtidas
  e Comentários — é preciso um ID estável nosso por notícia; (2) expõe o app
  a rate-limit e indisponibilidade da fonte; (3) perde histórico.

## Consequências

- Notícias ficam sujeitas ao RLS e ao histórico; a tela não depende da
  disponibilidade da API no momento da visita.
- A NewsAPI (plano Developer) devolve apenas as últimas 24h, sem corpo do
  artigo — adequado para a tela de Notícias; os Artigos escritos pela Lema
  são o conteúdo rico.
- A key da NewsAPI vive como secret no Supabase, nunca no frontend.
