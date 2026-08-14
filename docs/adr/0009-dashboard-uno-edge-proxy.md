# Dashboard UNO via Edge Function proxy

## Contexto

O Dashboard UNO reproduz a tela inicial do sistema UNO (situação dos
investimentos do RPPS) para Clientes Lema. A API do UNO (`outer_api` em
`unoapp.com.br`) é autenticada por um JWT fixo compartilhado
(`x-access-token`) — a mesma credencial para todas as chamadas. No protótipo,
todos os Clientes Lema veem o perfil de demonstração (`client_id = 192`).

## Decisão

O frontend **nunca chama a API do UNO diretamente**. Uma Edge Function
(`uno-proxy`) recebe a chamada do app, valida que o usuário é Cliente Lema
(`is_uno_client`), autentica na `outer_api` com o JWT (guardado em secret no
Supabase) e devolve os dados. Segue o padrão já usado por `send-push` e
`admin-users`.

## Alternativas consideradas

- **Chamada direta do frontend**: descartada — exporia o JWT compartilhado no
  bundle público e esbarraria em CORS da API do UNO.

## Consequências

- Credencial do UNO isolada no servidor (Edge Function + secret).
- A troca do perfil demo (192) pelo vínculo individual por e-mail, na
  integração plena, é uma mudança na `uno-proxy` — a UI do dashboard não muda.
- CORS na `uno-proxy` no padrão SEC-008 (origens Vercel + localhost, preflight
  OPTIONS), sem expor `*` — a função roda em `*.supabase.co` e o app em outra
  origem.
- `demonstrativoFundosCliente` só responde para **meses fechados**: o mês
  corrente (ainda aberto) devolve 400, erro do Comdinheiro repassado pela
  `outer_api`. O front faz fallback para o último mês fechado nesse endpoint;
  os demais (range de datas) seguem no período selecionado.
- ⚠️ O `api_uno.yml` que documenta a API contém secrets (JWT, `x-api-key`,
  credenciais comdinheiro) — está fora do git (`.gitignore`) e os tokens
  devem ser rotacionados.
