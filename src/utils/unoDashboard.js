/**
 * View-model do Dashboard UNO.
 *
 * Antes: as ~90 linhas que combinavam os helpers de `uno.js` (media ponderada
 * de VaR, cadeia merged→range→series, os calculos de patrimonio/rentabilidade/
 * meta/gap, o loop de comparacao, os tooltips) viviam soltas no corpo de
 * `DashboardUno.jsx` e nao eram alcancaveis por teste — e todo o git log desse
 * arquivo eram bugs nessa montagem.
 *
 * Agora `buildUnoDashboardViewModel(raw, { period, month, year })` recebe o
 * payload cru do proxy (`{ demonstrativo, evolucoes }`) e devolve um view-model
 * plano; o componente so faz `useMemo` + JSX. Fixtures reais + esse view-model
 * sao a rede de regressao do cluster.
 */
import {
  normalizeFunds,
  summarizeFunds,
  rangeForPeriod,
  mergeEvolucaoAnual,
  monthsBetween,
  buildEvolucaoSeries,
  compoundPercent
} from './uno'

const round4 = (n) => Number(Number(n).toFixed(4))

/**
 * buildComparisonSeries: serie do grafico "Rentabilidade x Meta". Alem do
 * valor mensal, acumula o composto ponto a ponto (produto de 1 + v/100) —
 * o ultimo `rentAcum`/`metaAcum` bate com `compoundPercent` da serie inteira.
 */
function buildComparisonSeries(series) {
  let accRent = 1
  let accMeta = 1
  let hasRent = false
  let hasMeta = false
  return series.map((s) => {
    if (s.rentMes !== null) {
      accRent *= 1 + Number(s.rentMes) / 100
      hasRent = true
    }
    if (s.metaMes !== null) {
      accMeta *= 1 + Number(s.metaMes) / 100
      hasMeta = true
    }
    return {
      label: s.label,
      rentMes: s.rentMes !== null ? round4(s.rentMes) : null,
      metaMes: s.metaMes !== null ? round4(s.metaMes) : null,
      rentAcum: hasRent ? round4((accRent - 1) * 100) : null,
      metaAcum: hasMeta ? round4((accMeta - 1) * 100) : null
    }
  })
}

export function buildUnoDashboardViewModel(raw, { period, month, year }) {
  // VaR: media ponderada do VAR_PAR de cada fundo — unica coisa que ainda vem
  // do demonstrativo mensal. Patrimonio/Rentabilidade/Meta vem inteiros do
  // evolucaoAnualCliente (mesma fonte que o proprio UNO usa).
  const funds = normalizeFunds(raw?.demonstrativo)
  const summary = summarizeFunds(funds)
  const fundsSaldo = summary.totalSaldo
  const varValue =
    fundsSaldo > 0
      ? funds.reduce((acc, f) => acc + f.varFundo * (f.saldo / fundsSaldo), 0)
      : null

  const merged = mergeEvolucaoAnual(raw?.evolucoes)
  const range = rangeForPeriod(period, month, year)
  const series = buildEvolucaoSeries(merged, monthsBetween(range.startDate, range.endDate))

  const lastPoint = series.length > 0 ? series[series.length - 1] : null
  const patrimonio = lastPoint?.patrimonio ?? null
  const rentabilidadeMes = lastPoint?.rentMes ?? null
  const metaMes = lastPoint?.metaMes ?? null
  const rentabilidadeAcum = compoundPercent(series.map((s) => s.rentMes))
  const metaAcum = compoundPercent(series.map((s) => s.metaMes))
  const gapMes =
    metaMes !== null && rentabilidadeMes !== null ? rentabilidadeMes - metaMes : null
  const gapAcum =
    rentabilidadeAcum !== null && metaAcum !== null ? rentabilidadeAcum - metaAcum : null

  const firstPatrimonio = series.find((s) => s.patrimonio !== null)?.patrimonio ?? null

  // R$ do mes: rendimento financeiro do demonstrativo. R$ do acumulado:
  // diferenca de patrimonio real (ja livre de aportes/resgates).
  const rentMesTooltip =
    rentabilidadeMes !== null
      ? { pct: rentabilidadeMes, rendimento: summary.totalRendimento }
      : null
  const rentAcumTooltip =
    rentabilidadeAcum !== null && lastPoint && firstPatrimonio !== null
      ? {
          pct: rentabilidadeAcum,
          valor: (lastPoint.patrimonio ?? 0) - firstPatrimonio,
          fromLabel: series[0]?.label ?? null,
          toLabel: lastPoint.label
        }
      : null

  return {
    patrimonio,
    rentabilidade: { mes: rentabilidadeMes, acum: rentabilidadeAcum },
    meta: { mes: metaMes, acum: metaAcum },
    gap: { mes: gapMes, acum: gapAcum },
    varValue,
    tooltips: { rentMes: rentMesTooltip, rentAcum: rentAcumTooltip },
    evolution: series
      .filter((s) => s.patrimonio !== null)
      .map((s) => ({ label: s.label, valor: s.patrimonio })),
    comparison: buildComparisonSeries(series)
  }
}
