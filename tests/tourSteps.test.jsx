import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { buildTourSteps } from '../src/tour/tourSteps'

const ids = (steps) => steps.map((s) => s.id)
const all = (opts) => buildTourSteps({ isMobile: true, showInstall: false, ...opts })

function readSrc(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return readSrc(p)
    return /\.(jsx?|tsx?)$/.test(e.name) ? [fs.readFileSync(p, 'utf8')] : []
  })
}

describe('buildTourSteps (tour unico, app inteiro)', () => {
  it('abre com boas-vindas e menu; o passo de instalacao vem logo depois das boas-vindas', () => {
    expect(ids(all()).slice(0, 2)).toEqual(['boas-vindas', 'menu'])
    expect(ids(all({ showInstall: true })).slice(0, 3)).toEqual(['boas-vindas', 'instalar', 'menu'])
  })

  it('percorre as telas na ordem do menu, sem voltar a uma tela ja visitada', () => {
    const sections = []
    for (const s of all()) {
      if (sections.at(-1) !== s.data.section) sections.push(s.data.section)
    }
    expect(sections).toEqual([
      'Início', 'Notícias', 'Artigos', 'Materiais de apoio', 'Eventos',
      'Favoritos', 'Novidades do UNO', 'Dashboard do UNO', 'Configurações', 'Ajuda'
    ])
  })

  it('todo passo tem path, titulo e conteudo, e os ids sao unicos', () => {
    const steps = all({ showInstall: true })
    for (const s of steps) {
      expect(s.path).toMatch(/^\//)
      expect(s.title).toBeTruthy()
      expect(s.content).toBeTruthy()
    }
    expect(new Set(ids(steps)).size).toBe(steps.length)
  })

  it('o alvo do menu muda entre celular e computador', () => {
    const menu = (isMobile) => all({ isMobile }).find((s) => s.id === 'menu').target
    expect(menu(true)).toBe('[data-tour="menu-mobile"]')
    expect(menu(false)).toBe('[data-tour="menu-desktop"]')
  })

  it('o ultimo passo fecha em Ajuda; se falta instalar, lembra de instalar', () => {
    const sem = all().at(-1)
    expect(sem).toMatchObject({ id: 'fim', path: '/ajuda/duvidas', target: 'body', placement: 'center' })
    expect(sem.title).toBe('Pronto!')
    expect(all({ showInstall: true }).at(-1).title).toMatch(/instale/i)
  })

  it('todo alvo data-tour existe no codigo-fonte (pega typo)', () => {
    const src = readSrc(path.resolve(import.meta.dirname, '../src')).join('\n')
    for (const s of all({ showInstall: true })) {
      if (s.target === 'body') continue
      expect(s.target).toMatch(/^\[data-tour="[a-z-]+"\]$/)
      const name = s.target.match(/"([a-z-]+)"/)[1]
      expect(src.includes(`"${name}"`) || src.includes(`'${name}'`), `data-tour "${name}" (${s.id})`).toBe(true)
    }
  })
})
