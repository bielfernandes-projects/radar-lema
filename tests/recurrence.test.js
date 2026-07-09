import { describe, expect, it } from 'vitest'
import { generateRecurringSessions } from '../src/utils/recurrence'

describe('generateRecurringSessions', () => {
  const baseSession = {
    start_date: '2025-01-06',
    start_time: '09:00:00',
    end_date: '2025-01-06',
    end_time: '12:00:00'
  }

  it('gera sessoes semanais ate a data limite', () => {
    const result = generateRecurringSessions(baseSession, 'semanal', '2025-02-03')

    expect(result).toHaveLength(5)
    expect(result[0]).toMatchObject({
      start_date: '2025-01-06',
      end_date: '2025-01-06',
      start_time: '09:00:00',
      end_time: '12:00:00',
      recurrence_instance: true
    })
    expect(result[4]).toMatchObject({
      start_date: '2025-02-03',
      end_date: '2025-02-03'
    })
  })

  it('gera sessoes quinzenais mantendo o dia da semana', () => {
    const result = generateRecurringSessions(baseSession, 'quinzenal', '2025-02-03')

    expect(result).toHaveLength(3)
    expect(result.map((s) => s.start_date)).toEqual([
      '2025-01-06',
      '2025-01-20',
      '2025-02-03'
    ])
  })

  it('gera sessoes mensais ajustando para o ultimo dia do mes quando necessario', () => {
    const result = generateRecurringSessions(
      { start_date: '2025-01-31', start_time: '09:00:00', end_date: '2025-01-31', end_time: '12:00:00' },
      'mensal',
      '2025-03-31'
    )

    expect(result).toHaveLength(3)
    expect(result.map((s) => s.start_date)).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-28'
    ])
  })

  it('nao gera sessoes apos a data limite', () => {
    const result = generateRecurringSessions(baseSession, 'semanal', '2025-01-05')

    expect(result).toHaveLength(0)
  })

  it('inclui a ultima sessao quando coincide com a data limite', () => {
    const result = generateRecurringSessions(baseSession, 'semanal', '2025-01-13')

    expect(result).toHaveLength(2)
  })

  it('retorna lista vazia quando falta algum parametro', () => {
    expect(generateRecurringSessions(null, 'semanal', '2025-01-31')).toEqual([])
    expect(generateRecurringSessions(baseSession, null, '2025-01-31')).toEqual([])
    expect(generateRecurringSessions(baseSession, 'semanal', null)).toEqual([])
  })
})
