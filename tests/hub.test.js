import { describe, it, expect } from 'vitest'
import {
  UNO_UPDATE_TYPES,
  unoUpdateTypeLabel,
  VISIBILITY_OPTIONS,
  visibilityLabel,
  formatHubDate,
  formatHubDateTime,
  formatFileSize
} from '../src/utils/hub'

describe('utils/hub', () => {
  it('unoUpdateTypeLabel rotula os tipos conhecidos e devolve o valor como fallback', () => {
    expect(unoUpdateTypeLabel('atualizacao')).toBe('Atualização')
    expect(unoUpdateTypeLabel('manutencao')).toBe('Manutenção')
    expect(unoUpdateTypeLabel('bug')).toBe('Bug')
    expect(unoUpdateTypeLabel('instabilidade')).toBe('Instabilidade')
    expect(unoUpdateTypeLabel('desconhecido')).toBe('desconhecido')
  })

  it('UNO_UPDATE_TYPES lista os quatro tipos validos', () => {
    expect(UNO_UPDATE_TYPES.map((t) => t.value)).toEqual([
      'atualizacao',
      'manutencao',
      'bug',
      'instabilidade'
    ])
  })

  it('visibilityLabel rotula publico e exclusivo', () => {
    expect(visibilityLabel('public')).toBe('Público')
    expect(visibilityLabel('lema_client')).toBe('Exclusivo Cliente Lema')
    expect(visibilityLabel('x')).toBe('x')
  })

  it('VISIBILITY_OPTIONS expoe public e lema_client', () => {
    expect(VISIBILITY_OPTIONS.map((v) => v.value)).toEqual([
      'public',
      'lema_client'
    ])
  })

  it('formatHubDate formata data ISO no padrao pt-BR', () => {
    expect(formatHubDate('2026-08-13T10:00:00Z')).toMatch(/13 de ago/)
    expect(formatHubDate(null)).toBe('')
    expect(formatHubDate('invalido')).toBe('')
  })

  it('formatHubDateTime inclui hora e minuto', () => {
    const out = formatHubDateTime('2026-08-13T14:30:00-03:00')
    expect(out).toContain('13 de ago')
    expect(out).toContain('14:30')
  })

  it('formatFileSize formata bytes, KB e MB', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')
  })

  it('formatFileSize retorna vazio para valores invalidos', () => {
    expect(formatFileSize(null)).toBe('')
    expect(formatFileSize(undefined)).toBe('')
    expect(formatFileSize(-1)).toBe('')
  })
})
