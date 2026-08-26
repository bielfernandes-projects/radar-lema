import { describe, expect, it } from 'vitest'
import {
  asArray,
  pickField,
  parseCommaNumber,
  normalizeFunds,
  summarizeFunds,
  pad2,
  monthRange,
  monthsAgoRange,
  yearRange,
  rangeForPeriod,
  parseDiaUltimaCota,
  yearsInRange,
  monthsBetween,
  mergeEvolucaoAnual,
  buildEvolucaoSeries,
  compoundPercent
} from '../src/utils/uno'

describe('asArray', () => {
  it('passa arrays direto', () => {
    expect(asArray([1, 2])).toEqual([1, 2])
  })

  it('extrai payload.data', () => {
    expect(asArray({ data: [1] })).toEqual([1])
  })

  it('extrai payload.result', () => {
    expect(asArray({ result: [1] })).toEqual([1])
  })

  it('retorna array vazio para formato desconhecido', () => {
    expect(asArray({ foo: 'bar' })).toEqual([])
    expect(asArray(null)).toEqual([])
    expect(asArray(undefined)).toEqual([])
  })
})

describe('pickField', () => {
  it('acha campo por padrão regex', () => {
    expect(pickField({ nome_fundo: 'FIA X', saldo: 100 }, [/saldo/i])).toBe(100)
    expect(pickField({ nome_fundo: 'FIA X', saldo: 100 }, [/nome/i])).toBe('FIA X')
  })

  it('respeita a ordem dos padrões na primeira chave que casar', () => {
    const row = { percentual: 5, saldo_total: 42 }
    expect(pickField(row, [/saldo/i])).toBe(42)
  })

  it('retorna undefined quando nada casa', () => {
    expect(pickField({ a: 1 }, [/saldo/i])).toBeUndefined()
    expect(pickField(null, [/saldo/i])).toBeUndefined()
  })
})

describe('parseCommaNumber', () => {
  it('converte string com virgula para numero', () => {
    expect(parseCommaNumber('0,386579085174')).toBeCloseTo(0.3866, 4)
  })

  it('aceita numero direto', () => {
    expect(parseCommaNumber(1.25)).toBe(1.25)
  })

  it('retorna 0 para undefined/null/vazio', () => {
    expect(parseCommaNumber(undefined)).toBe(0)
    expect(parseCommaNumber(null)).toBe(0)
    expect(parseCommaNumber('')).toBe(0)
  })
})

describe('normalizeFunds', () => {
  const payload = [
    { fund_name: 'Fundo A', cotas_investidas: 1000, ultima_cota_mes: 50, rendimento_percentual_fundo_mes_carteira: 1.5, var_fundo: '0,25', volatilidade: '0,30' },
    { fund_name: 'Fundo B', cotas_investidas: 2000, ultima_cota_mes: 10, rendimento_percentual_fundo_mes_carteira: -0.5, var_fundo: '0,10', volatilidade: '0,15' },
    { fund_name: 'Fundo Zerado', cotas_investidas: 0, ultima_cota_mes: 0, rendimento_percentual_fundo_mes_carteira: 0, var_fundo: '0', volatilidade: '0' }
  ]

  it('calcula saldo como cotas × cota e filtra saldo zero', () => {
    const funds = normalizeFunds(payload)
    expect(funds).toHaveLength(2)
    expect(funds[0]).toEqual({ name: 'Fundo A', saldo: 50000, rendimento: 0, percentual: 1.5, varFundo: 0.25, volatilidade: 0.3 })
    expect(funds[1]).toEqual({ name: 'Fundo B', saldo: 20000, rendimento: 0, percentual: -0.5, varFundo: 0.1, volatilidade: 0.15 })
  })

  it('aceita payload embrulhado em data', () => {
    const funds = normalizeFunds({ data: [payload[0]] })
    expect(funds).toHaveLength(1)
    expect(funds[0].name).toBe('Fundo A')
  })

  it('usa nome genérico quando não há nome', () => {
    const funds = normalizeFunds([{ cotas_investidas: 50, ultima_cota_mes: 10 }])
    expect(funds[0].name).toBe('Fundo')
  })

  it('aceita formato legado com campo saldo', () => {
    const funds = normalizeFunds([{ nome_fundo: 'Fundo Legado', saldo: 1000, rendimentonoPeriodo: 12.5, percentual: 25 }])
    expect(funds).toHaveLength(1)
    expect(funds[0]).toEqual({ name: 'Fundo Legado', saldo: 1000, rendimento: 12.5, percentual: 25, varFundo: 0, volatilidade: 0 })
  })
})

describe('summarizeFunds', () => {
  it('soma saldo e rendimento e calcula percentual', () => {
    const funds = [
      { name: 'A', saldo: 50000, rendimento: 0, percentual: 0 },
      { name: 'B', saldo: 20000, rendimento: 0, percentual: 0 }
    ]
    expect(summarizeFunds(funds)).toEqual({
      totalSaldo: 70000,
      totalRendimento: 0,
      quantidade: 2,
      rendimentoPercentual: 0
    })
  })

  it('trata divisão por zero', () => {
    expect(summarizeFunds([]).rendimentoPercentual).toBe(0)
  })
})

describe('pad2 e monthRange', () => {
  it('pad2 completa com zero à esquerda', () => {
    expect(pad2(1)).toBe('01')
    expect(pad2(12)).toBe('12')
  })

  it('monthRange monta datas dd/mm/yyyy', () => {
    expect(monthRange(2, 2024)).toEqual({
      startDate: '01/02/2024',
      endDate: '29/02/2024'
    })
    expect(monthRange(8, 2026)).toEqual({
      startDate: '01/08/2026',
      endDate: '31/08/2026'
    })
  })
})

describe('ranges de período', () => {
  it('monthsAgoRange monta janela a partir da data de referência', () => {
    const range = monthsAgoRange(36, 8, 2026)
    expect(range.startDate).toBe('01/09/2023')
    expect(range.endDate).toBe('31/08/2026')
  })

  it('monthsAgoRange 12 meses termina no último dia do mês de referência', () => {
    const range = monthsAgoRange(12, 7, 2026)
    expect(range.startDate).toBe('01/08/2025')
    expect(range.endDate).toBe('31/07/2026')
  })

  it('yearRange cobre o ano inteiro', () => {
    expect(yearRange(2025)).toEqual({
      startDate: '01/01/2025',
      endDate: '31/12/2025'
    })
  })

  it('rangeForPeriod escolhe entre ano e meses', () => {
    expect(rangeForPeriod('ano', 6, 2025)).toEqual(yearRange(2025))
    expect(rangeForPeriod('24', 6, 2025)).toEqual(monthsAgoRange(24, 6, 2025))
  })
})

describe('parseDiaUltimaCota', () => {
  it('extrai month e year de formato DD/MM/YYYY', () => {
    expect(parseDiaUltimaCota('31/12/2025')).toEqual({ year: 2025, month: 12 })
    expect(parseDiaUltimaCota('01/08/2026')).toEqual({ year: 2026, month: 8 })
    expect(parseDiaUltimaCota('15/06/2024')).toEqual({ year: 2024, month: 6 })
  })

  it('retorna null para formato invalido', () => {
    expect(parseDiaUltimaCota('2025-12-31')).toBeNull()
    expect(parseDiaUltimaCota('abc')).toBeNull()
    expect(parseDiaUltimaCota(null)).toBeNull()
    expect(parseDiaUltimaCota(undefined)).toBeNull()
  })

  it('aceita espacos extras', () => {
    expect(parseDiaUltimaCota(' 31/12/2025 ')).toEqual({ year: 2025, month: 12 })
  })
})

describe('yearsInRange', () => {
  it('lista os anos cobertos por um intervalo dentro do mesmo ano', () => {
    expect(yearsInRange('01/01/2026', '31/12/2026')).toEqual([2026])
  })

  it('lista todos os anos entre inicio e fim, inclusive', () => {
    expect(yearsInRange('01/09/2023', '31/08/2026')).toEqual([2023, 2024, 2025, 2026])
  })
})

describe('monthsBetween', () => {
  it('lista os meses de um intervalo dentro do mesmo ano', () => {
    expect(monthsBetween('01/06/2026', '31/08/2026')).toEqual([
      { month: 6, year: 2026 },
      { month: 7, year: 2026 },
      { month: 8, year: 2026 }
    ])
  })

  it('atravessa a virada de ano corretamente', () => {
    const months = monthsBetween('01/11/2025', '31/01/2026')
    expect(months).toEqual([
      { month: 11, year: 2025 },
      { month: 12, year: 2025 },
      { month: 1, year: 2026 }
    ])
  })
})

describe('mergeEvolucaoAnual', () => {
  it('junta metas/rentabilidades/evolucaoPatrimonio de varios anos', () => {
    const merged = mergeEvolucaoAnual([
      { metas: { '1/2025': { mes: 0.5 } }, rentabilidades: { '1/2025': { mes: 1 } }, evolucaoPatrimonio: { '1/2025': 100 } },
      { metas: { '1/2026': { mes: 0.6 } }, rentabilidades: { '1/2026': { mes: 2 } }, evolucaoPatrimonio: { '1/2026': 200 } }
    ])
    expect(merged.metas['1/2025'].mes).toBe(0.5)
    expect(merged.metas['1/2026'].mes).toBe(0.6)
    expect(merged.evolucaoPatrimonio['1/2026']).toBe(200)
  })

  it('trata lista vazia/undefined', () => {
    expect(mergeEvolucaoAnual([])).toEqual({ metas: {}, rentabilidades: {}, evolucaoPatrimonio: {} })
    expect(mergeEvolucaoAnual(undefined)).toEqual({ metas: {}, rentabilidades: {}, evolucaoPatrimonio: {} })
  })
})

describe('buildEvolucaoSeries', () => {
  const merged = {
    metas: { '7/2026': { mes: 0.58 }, '8/2026': { mes: 0.6 } },
    rentabilidades: { '7/2026': { mes: 1.07 }, '8/2026': { mes: 1.2 } },
    evolucaoPatrimonio: { '7/2026': 245691649.98, '8/2026': 0 }
  }

  it('monta a serie com label e valores do UNO por mes', () => {
    const series = buildEvolucaoSeries(merged, [{ month: 7, year: 2026 }, { month: 8, year: 2026 }])
    expect(series[0]).toEqual({
      key: '7/2026',
      label: 'Jul/2026',
      month: 7,
      year: 2026,
      patrimonio: 245691649.98,
      rentMes: 1.07,
      metaMes: 0.58
    })
  })

  it('usa null quando o mes nao esta na resposta do UNO', () => {
    const series = buildEvolucaoSeries(merged, [{ month: 9, year: 2026 }])
    expect(series[0].patrimonio).toBeNull()
    expect(series[0].rentMes).toBeNull()
    expect(series[0].metaMes).toBeNull()
  })
})

describe('compoundPercent', () => {
  it('composicao multiplicativa, nao soma linear', () => {
    // (1.05 * 1.03 - 1) * 100 = 8.15
    expect(compoundPercent([5, 3])).toBeCloseTo(8.15, 4)
  })

  it('ignora meses sem valor', () => {
    expect(compoundPercent([5, null, 3, undefined])).toBeCloseTo(8.15, 4)
  })

  it('retorna null quando nao ha nenhum valor', () => {
    expect(compoundPercent([])).toBeNull()
    expect(compoundPercent([null, undefined])).toBeNull()
  })
})
