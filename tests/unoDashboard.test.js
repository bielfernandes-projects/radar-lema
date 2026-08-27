import { describe, expect, it } from 'vitest'
import { buildUnoDashboardViewModel } from '../src/utils/unoDashboard'
import { compoundPercent } from '../src/utils/uno'

// Payload cru como o uno-proxy devolve: demonstrativo mensal (fundos) +
// uma resposta de evolucaoAnualCliente por ano civil do periodo.
const raw = {
  demonstrativo: [
    { fund_name: 'Fundo A', cotas_investidas: 1000, ultima_cota_mes: 100, var_fundo: '0,20', rendimento_financeiro: 900 },
    { fund_name: 'Fundo B', cotas_investidas: 1000, ultima_cota_mes: 50, var_fundo: '0,50', rendimento_financeiro: 300 }
  ],
  evolucoes: [
    {
      evolucaoPatrimonio: { '6/2026': 100000, '7/2026': 110000, '8/2026': 121000 },
      rentabilidades: { '6/2026': { mes: 1.0 }, '7/2026': { mes: 2.0 }, '8/2026': { mes: 1.5 } },
      metas: { '6/2026': { mes: 0.8 }, '7/2026': { mes: 0.9 }, '8/2026': { mes: 1.0 } }
    }
  ]
}

const opts = { period: '3', month: 8, year: 2026 } // janela Jun→Ago/2026

describe('buildUnoDashboardViewModel', () => {
  const vm = buildUnoDashboardViewModel(raw, opts)

  it('patrimonio = ultimo ponto da serie', () => {
    expect(vm.patrimonio).toBe(121000)
  })

  it('rentabilidade e meta do mes = ultimo ponto; acumulado = composto da janela', () => {
    expect(vm.rentabilidade.mes).toBe(1.5)
    expect(vm.meta.mes).toBe(1.0)
    expect(vm.rentabilidade.acum).toBeCloseTo(compoundPercent([1, 2, 1.5]), 6)
    expect(vm.meta.acum).toBeCloseTo(compoundPercent([0.8, 0.9, 1.0]), 6)
  })

  it('gap = rentabilidade - meta, mes e acumulado', () => {
    expect(vm.gap.mes).toBeCloseTo(0.5, 6)
    expect(vm.gap.acum).toBeCloseTo(vm.rentabilidade.acum - vm.meta.acum, 6)
  })

  it('VaR = media do var_fundo ponderada pelo saldo de cada fundo', () => {
    // 0,20*(100000/150000) + 0,50*(50000/150000)
    expect(vm.varValue).toBeCloseTo(0.3, 6)
  })

  it('evolution: um ponto por mes com patrimonio', () => {
    expect(vm.evolution).toEqual([
      { label: 'Jun/2026', valor: 100000 },
      { label: 'Jul/2026', valor: 110000 },
      { label: 'Ago/2026', valor: 121000 }
    ])
  })

  it('comparison: ultimo acumulado bate com compoundPercent da serie inteira', () => {
    const last = vm.comparison[vm.comparison.length - 1]
    expect(last.rentAcum).toBeCloseTo(compoundPercent([1, 2, 1.5]), 3)
    expect(last.metaAcum).toBeCloseTo(compoundPercent([0.8, 0.9, 1.0]), 3)
  })

  it('tooltips: mes com rendimento financeiro; acumulado com delta de patrimonio real', () => {
    expect(vm.tooltips.rentMes).toEqual({ pct: 1.5, rendimento: 1200 })
    expect(vm.tooltips.rentAcum.valor).toBe(21000) // 121000 - 100000
    expect(vm.tooltips.rentAcum.fromLabel).toBe('Jun/2026')
    expect(vm.tooltips.rentAcum.toLabel).toBe('Ago/2026')
  })

  it('payload vazio: tudo null / listas vazias, sem lancar', () => {
    const empty = buildUnoDashboardViewModel(null, opts)
    expect(empty.patrimonio).toBeNull()
    expect(empty.rentabilidade.acum).toBeNull()
    expect(empty.varValue).toBeNull()
    expect(empty.evolution).toEqual([])
    // comparison acompanha a serie de meses da janela (mesmo comportamento de
    // antes: um ponto por mes), mas com todos os valores null.
    expect(empty.comparison.every((p) => p.rentMes === null && p.metaMes === null)).toBe(true)
    expect(empty.tooltips.rentMes).toBeNull()
    expect(empty.tooltips.rentAcum).toBeNull()
  })
})
