import { describe, it, expect } from 'vitest'
import { buildTourSteps } from '../src/tour/tourSteps'

const ids = (steps) => steps.map((s) => s.id)

describe('buildTourSteps', () => {
  it('sem instalar: boas-vindas, menu, eventos, noticias, sino, personalizar, fim', () => {
    expect(ids(buildTourSteps({ isMobile: true, showInstall: false }))).toEqual([
      'boas-vindas', 'menu', 'eventos', 'noticias', 'sino', 'personalizar', 'fim'
    ])
  })

  it('com instalar: o passo de instalacao vem logo depois das boas-vindas', () => {
    expect(ids(buildTourSteps({ isMobile: true, showInstall: true })).slice(0, 3)).toEqual([
      'boas-vindas', 'instalar', 'menu'
    ])
  })

  it('o alvo do menu muda entre celular e computador', () => {
    const menu = (isMobile) =>
      buildTourSteps({ isMobile, showInstall: false }).find((s) => s.id === 'menu').target
    expect(menu(true)).toBe('[data-tour="menu-mobile"]')
    expect(menu(false)).toBe('[data-tour="menu-desktop"]')
  })

  it('todo passo tem titulo e conteudo; passos centrais usam body', () => {
    for (const s of buildTourSteps({ isMobile: true, showInstall: true })) {
      expect(s.title).toBeTruthy()
      expect(s.content).toBeTruthy()
    }
    const welcome = buildTourSteps({ isMobile: true, showInstall: false })[0]
    expect(welcome.target).toBe('body')
    expect(welcome.placement).toBe('center')
  })
})
