# Notícias de Mercado via ingestão agendada (não fetch ao vivo)

## Status

Superada em parte pela ADR `0009-agregador-rss-noticias.md`. Esta ADR
permanece válida quanto ao **padrão de ingestão agendada**; o que mudou foi
a **fonte de dados** (NewsAPI → agregador RSS próprio).

## Contexto

As Notícias de Mercado vêm de uma fonte externa. Duas opções: o app chama a
fonte ao vivo a cada visita à tela, ou uma Edge Function agendada puxa as
notícias e grava numa tabela própria (`news`) que o app lê.

## Decisão

**Ingestão agendada**: uma Edge Function (`news-ingest`) roda periodicamente
via `pg_cron` + `pg_net` (padrão já usado pelo `notification-scheduler`),
busca na fonte externa e grava em `news`. O app lê sempre do banco.

> Fonte externa: inicialmente a NewsAPI (query genérica de RPPS/economia);
> substituída por um agregador RSS próprio (feeds institucionais + Google
> Alerts) conforme a ADR `0009`.

## Alternativas consideradas

- **Fetch ao vivo da fonte externa**: descartado porque (1) impediria
  Curtidas e Comentários — é preciso um ID estável nosso por notícia; (2)
  expõe o app a rate-limit e indisponibilidade da fonte; (3) perde histórico.

## Consequências

- Notícias ficam sujeitas ao RLS e ao histórico; a tela não depende da
  disponibilidade da fonte no momento da visita.
- Os Artigos escritos pela Lema são o conteúdo rico; as Notícias são o
  monitoramento externo.
- A chave da fonte externa (quando houver) vive como secret no Supabase,
  nunca no frontend.
