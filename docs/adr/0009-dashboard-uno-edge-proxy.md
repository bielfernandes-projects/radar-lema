# Dashboard UNO via Edge Function proxy

## Contexto

O Dashboard UNO reproduz a tela inicial do sistema UNO (situação dos
investimentos do RPPS) para Clientes Lema. A API do UNO (`outer_api` em
`unoapp.com.br`) é autenticada por um JWT fixo compartilhado
(`x-access-token`) — a mesma credencial para todas as chamadas. No protótipo,
todos os Clientes Lema veem o perfil de demonstração (`client_id = 192`, exceto
`demonstrativoFundosCliente` que usa `cliente_id`).

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

## Atualização (03/11/2026): rotas `dashboardCliente` e `melhoriasUNO`

O UNO criou `GET outer_api/dashboardCliente` (`cliente_id`, `mes`+`ano` opcionais,
`periodo` = `ano`/12/24/36/48/60), que devolve indicadores, evolução e comparativo já
calculados, **sem passar pelo Comdinheiro**. Consequências:

- O Dashboard faz **uma** chamada; saíram `demonstrativoFundosCliente` e
  `evolucaoAnualCliente` do proxy, o throttle de 20/min, o fallback de mês e o cache
  `uno_cache` (tabela removida pela migration `20261103000001_drop_uno_cache.sql`, e o
  botão "Atualizar").
- Sem `mes`/`ano` o UNO usa a última carteira fechada; o seletor de mês exibe a
  `competencia` devolvida. Mês sem carteira fechada responde 400 com mensagem clara.
- `melhoriasUNO` (conteúdo global do sininho do UNO) é lido ao vivo e mostrado na
  página Novidades UNO junto dos avisos do staff (`uno_updates`); novas melhorias no UNO
  aparecem sem passo manual.
