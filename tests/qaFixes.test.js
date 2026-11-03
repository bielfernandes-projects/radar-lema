import { describe, expect, it } from 'vitest'
import { friendlyError } from '../src/utils/errors'
import { validIsoDate } from '../src/utils/dateFilters'
import { cleanProfileName, PROFILE_NAME_MAX } from '../src/utils/text'
import { filterEvents } from '../src/utils/filterEvents'

describe('friendlyError', () => {
  it('RLS (42501) vira mensagem amigavel, sem nome de tabela', () => {
    const err = { code: '42501', message: 'new row violates row-level security policy for table "categories"' }
    expect(friendlyError(err)).toBe('Você não tem permissão para esta ação.')
  })

  it('erro do PostgREST sem mapeamento cai no fallback, nunca no texto cru', () => {
    expect(friendlyError({ code: 'XX000', message: 'relation "x" does not exist' }, 'Erro ao salvar.')).toBe('Erro ao salvar.')
  })

  it('erro lancado pelo proprio app (sem code) passa intacto', () => {
    expect(friendlyError(new Error('Exclusão não permitida para esta novidade.'))).toBe('Exclusão não permitida para esta novidade.')
  })
})

describe('validIsoDate', () => {
  it('aceita data real e rejeita lixo e datas inexistentes', () => {
    expect(validIsoDate('2026-11-03')).toBe('2026-11-03')
    expect(validIsoDate('banana')).toBe('')
    expect(validIsoDate('2026-02-31')).toBe('')
    expect(validIsoDate('')).toBe('')
    expect(validIsoDate(null)).toBe('')
  })
})

describe('cleanProfileName', () => {
  it('tira < e >, apara e limita a 100 caracteres', () => {
    expect(cleanProfileName('  <b>Ana</b>  ')).toBe('bAna/b')
    expect(cleanProfileName('x'.repeat(5000))).toHaveLength(PROFILE_NAME_MAX)
  })
})

describe('filterEvents: Lema Edu', () => {
  const events = [
    { id: 1, is_lema_edu: true, is_past: true },
    { id: 2, is_lema_edu: false, is_past: true }
  ]
  it('com lemaEdu so sobram os eventos Lema Edu (a pagina Realizados precisa repassar o filtro)', () => {
    expect(filterEvents(events, { lemaEdu: true }, []).map((e) => e.id)).toEqual([1])
    expect(filterEvents(events, {}, []).map((e) => e.id)).toHaveLength(2)
  })
})
