/**
 * View-model do Dashboard UNO.
 *
 * `buildUnoDashboardViewModel(raw)` recebe a resposta crua de `dashboardCliente`
 * (o UNO ja entrega indicadores, evolucao e comparativo calculados) e devolve um
 * view-model plano; o componente so faz `useMemo` + JSX.
 */
import { MONTH_ABBR } from './uno'

const num = (v) => (v === null || v === undefined ? null : Number(v))

// "10/2025" -> "Out/2025"
function label(periodo) {
  const [month, year] = String(periodo ?? '').split('/')
  const abbr = MONTH_ABBR[Number(month) - 1]
  return abbr ? `${abbr}/${year}` : String(periodo ?? '')
}

export function buildUnoDashboardViewModel(raw) {
  const ind = raw?.indicadores
  const rentMes = num(ind?.rentabilidade?.mes)
  const rentAcum = num(ind?.rentabilidade?.acumulada)

  return {
    patrimonio: num(ind?.patrimonio),
    rentabilidade: { mes: rentMes, acum: rentAcum },
    meta: { mes: num(ind?.meta?.mes), acum: num(ind?.meta?.acumulada) },
    gap: { mes: num(ind?.gap?.mes), acum: num(ind?.gap?.acumulado) },
    varValue: num(ind?.var),
    tooltips: {
      rentMes: rentMes !== null ? { pct: rentMes, rendimento: num(ind.rentabilidade.mes_rs) } : null,
      rentAcum:
        rentAcum !== null
          ? {
              pct: rentAcum,
              valor: num(ind.rentabilidade.acumulada_rs),
              fromLabel: label(raw.inicio_periodo),
              toLabel: label(raw.fim_periodo)
            }
          : null
    },
    evolution: (raw?.evolucao_patrimonio ?? []).map((p) => ({ label: label(p.periodo), valor: Number(p.valor) })),
    comparison: (raw?.comparativo ?? []).map((c) => ({
      label: label(c.periodo),
      rentMes: num(c.rentabilidade_mes),
      metaMes: num(c.meta_mes),
      rentAcum: num(c.rentabilidade_acumulada),
      metaAcum: num(c.meta_acumulada)
    }))
  }
}
