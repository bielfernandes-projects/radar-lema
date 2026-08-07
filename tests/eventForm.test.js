import { describe, it, expect } from 'vitest'
import { validate } from '../src/utils/eventForm'

const baseForm = {
  title: 'Evento',
  description: 'Descricao',
  modality: 'presencial',
  category_ids: ['c1'],
  is_tentative: false,
  is_free: true,
  price_from: '',
  city: 'Sao Paulo',
  state: 'SP',
  address: 'Rua A',
  url: 'https://example.com',
  is_recurring: false,
  recurrence_freq: 'semanal',
  recurrence_until: '2030-01-01'
}

const completeSessions = [
  {
    start_date: '2026-09-01',
    start_time: '09:00:00',
    end_date: '2026-09-01',
    end_time: '10:00:00'
  }
]

describe('validate', () => {
  it('aceita evento completo confirmado', () => {
    expect(validate(baseForm, completeSessions)).toBe('')
  })

  it('exige titulo mesmo quando a definir', () => {
    const form = { ...baseForm, is_tentative: true, title: '' }
    expect(validate(form, [])).toBe('Título é obrigatório.')
  })

  it('permite campos vazios quando a definir', () => {
    const form = {
      ...baseForm,
      is_tentative: true,
      description: '',
      category_ids: [],
      address: '',
      url: '',
      price_from: ''
    }
    expect(validate(form, [])).toBe('')
  })

  it('exige frequencia e data fim quando recorrência ligada e a definir', () => {
    const form = {
      ...baseForm,
      is_tentative: true,
      is_recurring: true,
      recurrence_freq: '',
      recurrence_until: ''
    }
    expect(validate(form, [])).toBe(
      'Preencha frequência e data fim para eventos recorrentes.'
    )
  })

  it('rejeita data fim de recorrência no passado quando a definir', () => {
    const form = {
      ...baseForm,
      is_tentative: true,
      is_recurring: true,
      recurrence_until: '2020-01-01'
    }
    expect(validate(form, [])).toBe(
      'Datas no passado. Ajuste a data fim da recorrência antes de salvar.'
    )
  })

  it('exige descrição quando confirmado', () => {
    const form = { ...baseForm, description: '' }
    expect(validate(form, completeSessions)).toBe('Descrição é obrigatória.')
  })

  it('exige link de inscrição quando confirmado', () => {
    const form = { ...baseForm, url: '' }
    expect(validate(form, completeSessions)).toBe(
      'Link de inscrição é obrigatório.'
    )
  })

  it('exige ao menos uma categoria quando confirmado', () => {
    const form = { ...baseForm, category_ids: [] }
    expect(validate(form, completeSessions)).toBe(
      'Selecione pelo menos uma categoria.'
    )
  })

  it('exige endereço para presencial quando confirmado', () => {
    const form = { ...baseForm, address: '' }
    expect(validate(form, completeSessions)).toBe(
      'Endereço é obrigatório para eventos presenciais ou híbridos.'
    )
  })

  it('exige ao menos uma sessão quando confirmado', () => {
    expect(validate(baseForm, [])).toBe('Adicione pelo menos uma sessão.')
  })

  it('exige data e horário completos nas sessões quando confirmado', () => {
    const incomplete = [
      { start_date: '', start_time: '', end_date: '', end_time: '' }
    ]
    expect(validate(baseForm, incomplete)).toBe(
      'Preencha data e horário de todas as sessões.'
    )
  })

  it('rejeita sessão com fim antes do início', () => {
    const reversed = [
      {
        start_date: '2026-09-01',
        start_time: '18:00:00',
        end_date: '2026-09-01',
        end_time: '09:00:00'
      }
    ]
    expect(validate(baseForm, reversed)).toBe(
      'A data/horário de fim deve ser depois do início em todas as sessões.'
    )
  })

  it('aceita sessão com fim no mesmo horário do início', () => {
    const same = [
      {
        start_date: '2026-09-01',
        start_time: '09:00:00',
        end_date: '2026-09-01',
        end_time: '09:00:00'
      }
    ]
    expect(validate(baseForm, same)).toBe('')
  })
})
