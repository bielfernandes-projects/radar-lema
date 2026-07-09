# App standalone vs módulo do UNO

Decidimos construir o Lema Discovery como um app standalone e independente,
fora do codebase do UNO, em vez de um novo módulo dentro do próprio UNO.

O UNO está em refatoração de Clean Architecture com 57 controllers legados e
trabalho em andamento de RBAC. O PO (Gabriel) não tem permissão para alterar
o código do UNO. Um protótipo vibe-coded precisa ser construído sem mexer no
UNO. O acesso dos clientes é restrito a quem tem login válido no UNO, mas a
integração de autenticação com o banco do UNO fica para o time de dev na
fase de migração — no protótipo, auth é mockada no próprio Supabase.