# Meta do Dashboard UNO é uma aproximação, não o valor exato do UNO

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
