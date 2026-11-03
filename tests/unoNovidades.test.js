import { describe, expect, it } from 'vitest'
import { mergeNovidades } from '../src/utils/uno'

const melhoria = (id, title, date) => ({ improvement_id: id, improvement_title: title, improvement_date: date })
const aviso = (id, title, created_at) => ({ id, title, created_at })

describe('mergeNovidades', () => {
  const out = mergeNovidades(
    [
      aviso('a', 'Dashboard e Relatório de Custos de Investimentos', '2026-08-13T10:00:00Z'),
      aviso('b', 'Manutenção programada', '2026-08-20T10:00:00Z')
    ],
    [melhoria(31, 'Dashboard e relatorio de custos de investimentos ', '2026-08-05T00:00:00.000Z'), melhoria(32, 'Segregação', '2026-08-13T00:00:00.000Z')]
  )

  it('aviso manual com o mesmo titulo (sem acento/caixa/espaco) de uma melhoria do UNO some', () => {
    expect(out.find((n) => n.id === 'a')).toBeUndefined()
  })

  it('aviso sem equivalente no UNO e as melhorias ficam, da mais nova pra mais antiga', () => {
    expect(out.map((n) => n.id)).toEqual(['b', 'uno-32', 'uno-31'])
  })
})
