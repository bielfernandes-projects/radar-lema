# Landing pública com app privado e indexação por header

## Contexto

O ADR 0006 mantém conta grátis obrigatória e RLS autenticado. Para o Go Live
controlado precisamos de uma porta de entrada explicativa e de páginas
institucionais/legais acessíveis sem login, e o `noindex` global do
`index.html` impedia qualquer indexação.

## Decisão

- Em `/`, anônimo vê a landing (`Landing.jsx`, sem Sidebar/TopBar); logado
  continua vendo o Feed. Nenhuma mudança de RLS.
- Páginas públicas: `/privacidade`, `/termos`, `/sobre`, `/contato`, `/fontes`.
- Indexação decidida no servidor: `vercel.json` envia `X-Robots-Tag: noindex,
  nofollow` em todas as rotas **exceto** a landing e as páginas públicas.
  O `noindex` saiu do `index.html`. `robots.txt` segue `Allow: /` para o
  header ser lido e traz o `sitemap.xml`.
- Meta por rota via `usePageMeta` (sem dependência extra).
- PostHog só inicia após aceite no `ConsentBanner`; o cadastro exige aceite de
  Termos e Política (`accepted_terms_at` e `terms_version` no metadata).

## Consequências

- A landing é SPA renderizada no cliente (sem prerender). Se o Search Console
  mostrar problema de renderização, adicionar prerender.
- Novas rotas públicas exigem atualizar a lista do `source` em `vercel.json`
  e o `sitemap.xml`.
- `SITE_URL` (`src/config/site.js`), `sitemap.xml`, `robots.txt` e `index.html`
  trazem o domínio hoje; trocar todos quando o domínio de produção for definido.
