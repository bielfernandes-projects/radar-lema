import { describe, it, expect } from 'vitest'
import { resolveHomeLayout } from '../src/utils/homeLayout'

const registry = [
  { id: 'a', defaultVisible: true },
  { id: 'b', defaultVisible: true },
  { id: 'c', defaultVisible: false }
]

describe('resolveHomeLayout', () => {
  it('sem layout salvo devolve o padrao', () => {
    expect(resolveHomeLayout(null, registry)).toEqual([
      { id: 'a', visible: true },
      { id: 'b', visible: true },
      { id: 'c', visible: false }
    ])
  })

  it('respeita ordem e visibilidade salvas', () => {
    const saved = [
      { id: 'b', visible: true },
      { id: 'a', visible: false },
      { id: 'c', visible: true }
    ]
    expect(resolveHomeLayout(saved, registry)).toEqual(saved)
  })

  it('bloco novo no registro entra no fim com a visibilidade padrao', () => {
    const saved = [{ id: 'b', visible: true }, { id: 'a', visible: true }]
    expect(resolveHomeLayout(saved, registry).map((i) => i.id)).toEqual(['b', 'a', 'c'])
    expect(resolveHomeLayout(saved, registry)[2].visible).toBe(false)
  })

  it('descarta ids desconhecidos e duplicados', () => {
    const saved = [
      { id: 'x', visible: true },
      { id: 'a', visible: true },
      { id: 'a', visible: false }
    ]
    const ids = resolveHomeLayout(saved, registry).map((i) => i.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('se tudo ficou desligado, liga o primeiro bloco do registro', () => {
    const saved = registry.map((b) => ({ id: b.id, visible: false }))
    const result = resolveHomeLayout(saved, registry)
    expect(result.filter((i) => i.visible).map((i) => i.id)).toEqual(['a'])
  })

  it('valor invalido cai no padrao', () => {
    expect(resolveHomeLayout('lixo', registry)).toEqual(resolveHomeLayout(null, registry))
    expect(resolveHomeLayout([null, 5, {}], registry)).toEqual(resolveHomeLayout(null, registry))
  })
})
