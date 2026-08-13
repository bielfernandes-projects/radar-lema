# Cliente Lema identificado por flag manual `is_uno_client`

## Contexto

O hub diferencia **Cliente Lema** (acesso a conteúdo exclusivo e Dashboard
UNO) do usuário comum. O `user_type` existente (`client`/`ROLE_VIEWER`) não
distingue quem assina o UNO de quem criou conta gratuita. O vínculo real com
o banco do UNO só existe na fase de integração plena.

## Decisão

Adicionar a flag booleana **`profiles.is_uno_client`** (default `false`),
alternada manualmente pelo super admin no Painel Admin. É **ortogonal** ao
`user_type`: qualquer tier pode ou não ser Cliente Lema. Quando a integração
com o banco do UNO acontecer, a flag passa a ser **derivada** do vínculo da
conta (mesmo e-mail) em vez de manual.

## Alternativas consideradas

- **Vínculo automático por e-mail contra o UNO agora**: inviável — a
  integração com o banco do UNO é o passo futuro; não há fonte confiável para
  derivar o vínculo nesta fase.
- **Novo `user_type` (`lema_client`)**: descartado — mistura o eixo de
  permissão (o que se pode fazer) com o eixo de visibilidade (o que se pode
  ver); flag booleana é mais simples e captura exatamente a natureza
  "capacidade de visibilidade".

## Consequências

- Super admin ganha um switch "Cliente Lema" na gestão de usuários.
- RLS dos conteúdos `lema_client` usa `is_uno_client()` do perfil.
- A flag é reversível (troca manual) — adequada ao protótipo; a migração
  futura para vínculo derivado é uma mudança de fonte, não de modelo.
