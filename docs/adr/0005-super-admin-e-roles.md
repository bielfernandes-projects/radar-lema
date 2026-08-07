# Super Admin e novo modelo de roles

## Contexto

Até então o Radar tinha dois tipos de usuário, com autorização resolvida por
duas camadas independentes e com semântica conflitante:

- **Frontend** autoriza o "tier staff" por `user_type === 'staff'` (rotas,
  nav, botão de editar).
- **Banco (RLS)** autoriza **escrita** por `role === 'ROLE_SUPER_ADMIN'`
  (`is_super_admin()`) e **leitura de eventos não confirmados** por
  `user_type === 'staff'` (`is_staff()`).

Resultado: uma conta `staff` sem role `ROLE_SUPER_ADMIN` passaria no frontend
e leria eventos "a definir", mas falharia em qualquer INSERT/UPDATE/DELETE de
evento. E qualquer evolução para "staff que gerencia eventos" e "admin que
gera usuários" exigiria desenrolar essas camadas.

O stakeholder pediu:
- um `super_admin` que acessa um painel de administração (dashboard +
  gestão de usuários: criar com senha escolhida, editar tipo/role, redefinir
  senha, excluir);
- um `staff` que apenas gerencia eventos;
- o `client` como leitor.

## Decisão

Adotar três tiers com `user_type` + `role` pareados:

| user_type | role | Acesso |
|---|---|---|
| `super_admin` | `ROLE_SUPER_ADMIN` | Tudo (staff) + Painel Admin `/admin` (dashboard e gestão de usuários) |
| `staff` | `ROLE_ADMIN` | Visualiza, cria, edita, duplica e exclui eventos; gerencia categorias |
| `client` | `ROLE_VIEWER` | Somente leitura: lista, filtra, favorita, compartilha |

### Regras de autorização

- **Frontend** centraliza as checagens em `utils/auth.js`:
  - `isStaffTier(profile)` → `user_type IN ('staff','super_admin')` — quem
    gerencia eventos (rotas `gestao`, `categorias`, editar no detalhe).
  - `isSuperAdmin(profile)` → `user_type === 'super_admin'` ou
    `role === 'ROLE_SUPER_ADMIN'` — quem acessa o Painel Admin.
  - `ProtectedRoute` ganha `requireAdmin` (novo), mantendo `requireStaff`.
- **Banco (RLS)**:
  - `is_staff()` redefinido para `user_type IN ('staff','super_admin')` —
    usado na leitura de eventos "a definir" **e** na **escrita** de
    eventos/categorias/sessões/fotos/`event_categories` (antes
    `is_super_admin()`).
  - `is_super_admin()` (por role) permanece para ler todos os `profiles`.
  - Agregados cross-usuário (totais e crescimento mensal) só via RPC
    `admin_dashboard_stats()` (SECURITY DEFINER, valida super admin), pois
    `favorites` tem RLS por `user_id`.

### Gestão de usuários

- Criar usuário com senha escolhida, editar tipo/role, redefinir senha e
  excluir não são possíveis com a anon key (RLS). Foi criada a **Edge
  Function `admin-users`** (service role) que valida o chamador como
  `ROLE_SUPER_ADMIN` (via JWT do app + `profiles`) e expõe `create`,
  `update`, `reset_password` e `delete`. Segue o padrão do `send-push`.
- O cliente usa `services/adminApi.js` para chamar a função com o
  `access_token` do usuário logado.
- Novos cadastros públicos (`signUp`) nascem `client`/`ROLE_VIEWER`
  (trigger `on_auth_user_created` atualizado).
- Alteração de própria senha fica na **Config** (card "Alterar senha"):
  confere a senha atual com `signInWithPassword` e aplica
  `supabase.auth.updateUser({ password })`.

## Alternativas consideradas

- **`user_type` único expandido (ex.: `staff` com flag)** — descartado: a
  necessidade de painel de usuários é uma capacidade distinta e o par
  `user_type`/`role` já existia; manter dois eixos permite auditoria e
  futuras roles (ex.: BACKOFFICE) sem quebrar RLS.
- **Gestão de usuários via RPC SQL `SECURITY DEFINER`** — descartado:
  criar usuário com password-hash e confirmar identidade dentro do SQL é
  frágil e muda conforme o formato de senha do GoTrue; a Edge Function com
  service role reutiliza a API oficial do Auth.
- **Permitir escrita em `profiles` para super admin no RLS** — descartado:
  alterações de tipo/role seguem passando pela Edge Function (que também
  sincroniza `user_metadata`), mantendo `profiles` imutável via API pública.

## Consequências

- O tier `staff` (ROLE_ADMIN) agora realmente gerencia eventos (RLS de
  escrita liberada); `super_admin` acumula gestão de usuários.
- Um `super_admin` não é bloqueado das rotas de staff: `requireStaff`
  passou a aceitar os dois tiers.
- Contas legadas são reclassificadas na migração (staff → super_admin;
  client → ROLE_VIEWER); a conta principal
  (`gabrielfernandes@lemaef.com.br`) é garantida como super admin (a
  migração e o script `scripts/promote-super-admin.mjs`).
- Novo endpoint de Edge Function (`admin-users`) precisa ser deployado
  junto; `admin_dashboard_stats()` e as políticas atualizadas precisam ser
  aplicados (migration `20260807000000_super_admin_roles.sql`).
- Riscos: exclusão acidental de usuário é irreversível (o dashboard impede
  excluir/editar a própria conta); redefinir senha desloga sessões ativas do
  usuário alvo.
