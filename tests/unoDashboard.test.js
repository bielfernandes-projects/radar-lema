import { describe, expect, it } from 'vitest'
import { buildUnoDashboardViewModel } from '../src/utils/unoDashboard'

// Formato real de GET outer_api/dashboardCliente (recortado a 2 meses).
const raw = {
  cliente_id: 192,
  competencia: '09/2026',
  periodo: '12',
  inicio_periodo: '08/2026',
  fim_periodo: '09/2026',
  indicadores: {
    patrimonio: 251145388.64,
    rentabilidade: { mes: 1.31, mes_rs: 3266125.07, acumulada: 13.65, acumulada_rs: 31091095.76 },
    meta: { indice: 'IPCA', mes: 1.34, acumulada: 10.99 },
    gap: { mes: -0.03, acumulado: 2.66 },
    var: 0.17
  },
  evolucao_patrimonio: [
    { periodo: '08/2026', valor: 247879263.56 },
    { periodo: '09/2026', valor: 251145388.64 }
  ],
  comparativo: [
    { periodo: '08/2026', rentabilidade_mes: 0.9, meta_mes: 0.7, rentabilidade_acumulada: 12.2, meta_acumulada: 9.6 },
    { periodo: '09/2026', rentabilidade_mes: 1.31, meta_mes: 1.34, rentabilidade_acumulada: 13.65, meta_acumulada: 10.99 }
  ]
}

describe('buildUnoDashboardViewModel', () => {
  const vm = buildUnoDashboardViewModel(raw)

  it('indicadores vem como o UNO calculou', () => {
    expect(vm.patrimonio).toBe(251145388.64)
    expect(vm.rentabilidade).toEqual({ mes: 1.31, acum: 13.65 })
    expect(vm.meta).toEqual({ mes: 1.34, acum: 10.99 })
    expect(vm.gap).toEqual({ mes: -0.03, acum: 2.66 })
    expect(vm.varValue).toBe(0.17)
  })

  it('tooltips: R$ do mes e do acumulado, com o periodo em rotulo curto', () => {
    expect(vm.tooltips.rentMes).toEqual({ pct: 1.31, rendimento: 3266125.07 })
    expect(vm.tooltips.rentAcum).toEqual({ pct: 13.65, valor: 31091095.76, fromLabel: 'Ago/2026', toLabel: 'Set/2026' })
  })

  it('evolution e comparison: um ponto por mes, com rotulo Mes/Ano', () => {
    expect(vm.evolution).toEqual([
      { label: 'Ago/2026', valor: 247879263.56 },
      { label: 'Set/2026', valor: 251145388.64 }
    ])
    expect(vm.comparison[1]).toEqual({ label: 'Set/2026', rentMes: 1.31, metaMes: 1.34, rentAcum: 13.65, metaAcum: 10.99 })
  })

  it('payload vazio: tudo null / listas vazias, sem lancar', () => {
    const empty = buildUnoDashboardViewModel(null)
    expect(empty.patrimonio).toBeNull()
    expect(empty.rentabilidade.acum).toBeNull()
    expect(empty.varValue).toBeNull()
    expect(empty.evolution).toEqual([])
    expect(empty.comparison).toEqual([])
    expect(empty.tooltips).toEqual({ rentMes: null, rentAcum: null })
  })
})
