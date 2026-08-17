import { describe, expect, it } from 'vitest'
import {
  asArray,
  pickField,
  parseCommaNumber,
  normalizeFunds,
  summarizeFunds,
  pad2,
  monthRange,
  dateFromRow,
  evolutionLabel,
  normalizeEvolution,
  normalizeDashboardMetrics,
  normalizeClientName,
  monthsAgoRange,
  yearRange,
  rangeForPeriod
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

describe('dateFromRow e evolutionLabel', () => {
  it('monta data a partir de ano e mes', () => {
    const date = dateFromRow({ ano: 2025, mes: 3, patrimonio: 100 })
    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(2)
  })

  it('aceita data dd/mm/yyyy', () => {
    const date = dateFromRow({ data: '15/03/2025', saldo: 100 })
    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(2)
  })

  it('evolutionLabel formata como Mon/YYYY', () => {
    expect(evolutionLabel(new Date(2025, 2, 1))).toBe('Mar/2025')
    expect(evolutionLabel('31/12/2024')).toBe('Dez/2024')
    expect(evolutionLabel(null)).toBeNull()
  })
})

describe('normalizeEvolution', () => {
  it('normaliza série de patrimônio com datas variadas', () => {
    const rows = [
      { ano: 2023, mes: 3, patrimonio: 100000 },
      { data: '01/06/2023', saldo: 150000 },
      { competencia: '2023-09-01', valor: 200000 },
      { ano: 'invalido', mes: 99, saldo: 999 }
    ]
    expect(normalizeEvolution(rows)).toEqual([
      { label: 'Mar/2023', valor: 100000 },
      { label: 'Jun/2023', valor: 150000 },
      { label: 'Set/2023', valor: 200000 }
    ])
  })

  it('retorna lista vazia sem dados de evolução', () => {
    expect(normalizeEvolution(null)).toEqual([])
    expect(normalizeEvolution([])).toEqual([])
  })
})

describe('normalizeDashboardMetrics', () => {
  it('lê métricas com nomes de campo variáveis', () => {
    const metrics = normalizeDashboardMetrics({
      patrimonio: 247049086.7,
      rentabilidade_mes: 1.11,
      rentabilidade_acumulada: 39.45,
      meta_mes: 1.21,
      meta_acumulado: 33.3,
      gap_mes: -0.1,
      gap_acumulado: 6.15,
      var_1_252: 0.1763
    })
    expect(metrics.patrimonio).toBe(247049086.7)
    expect(metrics.rentabilidadeMes).toBe(1.11)
    expect(metrics.rentabilidadeAcum).toBe(39.45)
    expect(metrics.metaMes).toBe(1.21)
    expect(metrics.metaAcum).toBe(33.3)
    expect(metrics.gapMes).toBe(-0.1)
    expect(metrics.gapAcum).toBe(6.15)
    expect(metrics.varValue).toBe(0.1763)
  })

  it('lê métricas do último registro de uma série mensal', () => {
    const metrics = normalizeDashboardMetrics([
      { mes: 1, patrimonio: 100, rentabilidade_mes: 0.5 },
      { mes: 2, patrimonio: 200, rentabilidade_mes: 1.11, rentabilidade_acumulada: 39.45 }
    ])
    expect(metrics.patrimonio).toBe(200)
    expect(metrics.rentabilidadeMes).toBe(1.11)
    expect(metrics.rentabilidadeAcum).toBe(39.45)
  })

  it('retorna null para campos ausentes', () => {
    const metrics = normalizeDashboardMetrics({ patrimonio: 100 })
    expect(metrics.rentabilidadeMes).toBeNull()
    expect(metrics.gapAcum).toBeNull()
    expect(metrics.varValue).toBeNull()
  })

  it('trata payload nulo', () => {
    const metrics = normalizeDashboardMetrics(null)
    expect(metrics.patrimonio).toBeNull()
  })
})

describe('normalizeClientName', () => {
  it('extrai nome de campo cliente', () => {
    expect(normalizeClientName([{ cliente_nome: 'DEMONSTRAÇÃO - LEMA' }])).toBe('DEMONSTRAÇÃO - LEMA')
  })

  it('extrai nome de campo razao social', () => {
    expect(normalizeClientName([{ razao_social: 'RPPS Municipal' }])).toBe('RPPS Municipal')
  })

  it('tenta primeiro payload, depois o segundo', () => {
    expect(normalizeClientName([{}], [{ rpps: 'Previdência SC' }])).toBe('Previdência SC')
  })

  it('retorna string vazia para payloads vazios', () => {
    expect(normalizeClientName(null, undefined, [])).toBe('')
  })
})

describe('ranges de período', () => {
  it('monthsAgoRange monta janela terminando hoje', () => {
    const range = monthsAgoRange(36)
    expect(range.endDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(range.startDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('yearRange cobre o ano inteiro', () => {
    expect(yearRange(2025)).toEqual({
      startDate: '01/01/2025',
      endDate: '31/12/2025'
    })
  })

  it('rangeForPeriod escolhe entre ano e meses', () => {
    expect(rangeForPeriod('ano', 2025)).toEqual(yearRange(2025))
    expect(rangeForPeriod('24', 2025)).toEqual(monthsAgoRange(24))
  })
})
