# Radar Lema

PWA standalone que reúne o ecossistema da Lema para RPPS — eventos, artigos,
notícias de mercado, novidades do sistema UNO, materiais de apoio e o
dashboard de investimentos do UNO — para clientes e staff da Lema.

> **Hub da Lema publicado em 14/08/2026**: o app passou de centralizador de
> eventos para hub da Lema — artigos, notícias de mercado, novidades UNO,
> materiais de apoio, curtidas/comentários com moderação, push por audiência
> e Dashboard UNO para Clientes Lema. O desenvolvimento do hub viveu na
> branch `feat/lema-hub` e foi consolidado na `main`.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 18 + Material UI v7 |
| Roteamento | react-router-dom v6 (Data Router) |
| Backend | Supabase (PostgreSQL + Storage + Auth) |
| PWA | `vite-plugin-pwa` + Workbox |
| Push | Web Push API + Edge Functions (`send-push`, `notification-scheduler`) |
| Testes | Vitest + Testing Library |

## Começando

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do Supabase
npm run dev
```

Abra http://localhost:5173.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção para `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint |
| `npm run test:run` | Suite Vitest |

## Supabase

O banco é versionado como migrations em `supabase/migrations/` (IaC via
`supabase` CLI, zero Dashboard):

```bash
supabase link --project-ref <ref>
supabase db push
node scripts/seed-mock-users.mjs   # usuários mock para o cloud
```

## Documentação

- `CONTEXT.md` — glossário e vocabulário do domínio.
- `architecture.md` — documento vivo da arquitetura e do histórico de mudanças.
- `DESIGN.md` — identidade visual (tema, cores, tipografia).
- `PLAN.md` — plano de implementação (eventos implementado + fases do hub).
- `PRODUCT.md` — visão de produto, personas e princípios de design.
- `push-notifications.md` — runbook de ativação das notificações push.
- `docs/adr/` — decisões de arquitetura registradas (ADR 0001–0009).

## Deploy

- **Vercel**: configuração em `vercel.json` (Vite, output `dist`, SPA fallback).
  Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (e `VITE_VAPID_PUBLIC_KEY`, `VITE_GOOGLE_MAPS_API_KEY` quando aplicável).
- **Supabase**: migrations e Edge Functions via `supabase` CLI.
