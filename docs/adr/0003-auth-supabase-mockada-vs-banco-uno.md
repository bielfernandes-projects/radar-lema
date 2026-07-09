# Auth mockada no Supabase vs leitura do banco do UNO

Decidimos que o protótipo usa usuários mockados no próprio Supabase (um
admin@lema.com com acesso de staff e um dirigente@lema.com com acesso
de cliente) em vez de ler a tabela `users` do banco do UNO para validar
credenciais.

O plano original era o app se conectar ao PostgreSQL do UNO e validar
email + senha (bcrypt) + plan_id. Porém o PO não tem acesso ao banco do
UNO nem às credenciais de conexão, e não pode alterar o código do UNO. A
autenticação cruzando os dois bancos exigiria um colaboração do time de
dev que não está disponível na fase de protótipo. Quando o dev assumir,
ele substitui a auth do Supabase pela leitura do banco do UNO (mesmo
fluxo: validar `users.email` + `users.password` com bcrypt, checar
`plan_id` e role, emitir JWT próprio do Discovery).