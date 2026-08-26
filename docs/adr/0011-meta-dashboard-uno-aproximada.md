# Meta do Dashboard UNO era uma aproximação — resolvido via `evolucaoAnualCliente`

> **Atualização (26/08/2026)**: resolvido. O Gabriel conseguiu acesso ao
> codebase do UNO e encontramos `outer_api/evolucaoAnualCliente` — um
> endpoint que já usa a mesma chave de integração que o `uno-proxy` usa hoje
> (não precisa de sessão de usuário) e devolve Patrimônio, Rentabilidade e
> Meta **mês a mês, pré-calculados pelo próprio UNO**, com a fórmula exata
> descrita abaixo já aplicada no servidor. O `DashboardUno.jsx` foi reescrito
> para consumir esse endpoint diretamente em vez de recalcular a Meta a
> partir de `metaClientePorAno`. Ver commit que referencia esta ADR para o
> código; a fórmula documentada abaixo continua válida como referência de
> como o UNO calcula internamente (fonte: `src/controllers/utils/targets_utils.js`
> e `src/controllers/outer_api.controller.js` do codebase do UNO).

## Contexto

O UNO calcula a "Meta" (mensal e acumulada) do dashboard como a composição de
dois componentes, confirmado ao vivo em `unoapp.com.br` (cliente "Demonstração
LEMA", tela Dashboard, tooltip do card Meta):

- **Mês**: `Meta = IPCA do mês + Juros atuarial do mês` (ex.: "IPCA 0,07% +
  Juros 0,51121% = Meta 0,58157%").
- **Acumulado**: composição multiplicativa dos dois componentes acumulados no
  período — `Meta_acum = (1 + IPCA_acum) × (1 + Juros_acum) − 1` (ex.: "IPCA
  14,84% + Juros 17,52874% = Meta acum. 34,97%" para 36 meses).

O `DashboardUno.jsx` do Radar Lema, hoje, **não replica essa fórmula**: calcula
`metaMes` dividindo a rentabilidade esperada anual (`metaClientePorAno`,
endpoint `outer_api`) por 12, e o acumulado por juros compostos simples sobre
essa mesma taxa anual. Isso é uma aproximação — não bate com o número exato do
UNO mês a mês, mesmo que a tendência geral seja parecida.

## Por que não foi corrigido agora

O IPCA do mês e a taxa de juros atuarial usados pelo UNO vêm de um endpoint
interno (`inflation_rates` / `getClientInflationRates`), que **exige o token
de sessão do usuário logado no UNO** — não o JWT de integração (`outer_api`)
que o `uno-proxy` usa hoje (ver ADR 0009). Isso já tinha sido tentado numa
sessão anterior (ver `normalizeInflationRates` e `computeDashboardMetrics` em
`src/utils/uno.js` — código morto, não usado pelo dashboard atual) e revertido
por esse motivo.

## Decisão

Manter a aproximação atual por enquanto. Registrado aqui para não cair no
esquecimento — decisão do Gabriel em 26/08/2026.

## Como resolver no futuro

Duas rotas possíveis, nenhuma delas simples:

1. **Pedir a LEMA/UNO acesso ao endpoint interno de inflação/meta atuarial**
   (ou um endpoint equivalente na `outer_api`) — é o único jeito de ficar
   idêntico de verdade, inclusive quando o dashboard passar a atender múltiplos
   clientes reais (não só o de demonstração).
2. **Aproximar sem depender do UNO**: IPCA mensal é público (ex. API do Banco
   Central / IBGE), mas a taxa de juros atuarial (~6% a.a. no caso do cliente
   de demonstração) é um parâmetro definido por RPPS/ano no relatório
   atuarial de cada cliente — precisaria ser cadastrada manualmente por nós,
   por cliente, e mesmo assim não haveria garantia de bater exatamente com o
   que o UNO mostra (a taxa pode ser revisada sem aviso).

## Gap remanescente: VaR (não resolvido)

Com acesso ao codebase do UNO (26/08/2026), confirmamos que Patrimônio,
Rentabilidade e Meta agora batem exatamente com o UNO real (via
`evolucaoAnualCliente`, ver commit que referencia esta ADR). O **VaR
continua sendo uma aproximação** e, ao testar lado a lado, ficou visivelmente
diferente do UNO real (ex.: Radar Lema mostrou 1,33% onde o UNO mostrava
0,19% para o mesmo cliente/mês/janela).

Causa raiz (`client/src/components/utils/utils.js:var5`,
`client/src/controllers/ClientController.js:loadClientDiaryPlsByLimit`,
`client/src/controllers/RiskController.js`): o UNO calcula um **VaR
paramétrico de carteira** (95% de confiança, `z = -1,64485`) a partir do
**histórico diário de retorno de toda a carteira** (até 252 dias — daí o
"1,252" ao lado do título "VaR" na tela do UNO, uma referência ao dia-1 até
o dia-252 da janela, não um valor calculado). Isso é fundamentalmente
diferente da média ponderada por saldo dos `var_fundo` individuais que o
Radar Lema usa hoje — VaR de carteira não é a soma ponderada dos VaRs dos
fundos (ignora a diversificação entre eles), por isso o número do Radar Lema
fica sistematicamente mais alto.

Os dados diários por cliente vêm de `getClientPortfolioRentsByLimit`
(`ClientAPI`), que é **autenticado por sessão de usuário** — mesma categoria
de bloqueio que a Meta tinha antes de acharmos `evolucaoAnualCliente`, mas
aqui não encontramos nenhum endpoint equivalente na `outer_api` que devolva
retorno diário da carteira inteira. Sem isso, não dá pra replicar o cálculo
corretamente. Mantido como aproximação (média ponderada por saldo dos
`var_fundo`), registrado aqui para não cair no esquecimento.
