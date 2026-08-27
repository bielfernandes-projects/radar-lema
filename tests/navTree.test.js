import { describe, expect, it } from 'vitest'
import { buildNavTree } from '../src/utils/navTree'

const keysByGroup = (tree) =>
  Object.fromEntries(tree.map((s) => [s.group, s.items.map((i) => i.key)]))
const itemState = (tree, key) =>
  tree.flatMap((s) => s.items).find((i) => i.key === key)?.state

describe('buildNavTree', () => {
  it('cliente comum vê só a seção principal, sem Gestão nem Administração', () => {
    const tree = buildNavTree({ user_type: 'client' })
    expect(tree.map((s) => s.group)).toEqual(['main'])
  })

  it('staff ganha a seção de Gestão', () => {
    const tree = buildNavTree({ user_type: 'staff' })
    expect(tree.map((s) => s.group)).toEqual(['main', 'staff'])
  })

  it('super admin vê tudo, inclusive Administração', () => {
    const tree = buildNavTree({ user_type: 'super_admin' })
    expect(tree.map((s) => s.group)).toEqual(['main', 'staff', 'admin'])
  })

  it('role legada ROLE_SUPER_ADMIN também vê tudo', () => {
    const tree = buildNavTree({ role: 'ROLE_SUPER_ADMIN' })
    expect(tree.map((s) => s.group)).toEqual(['main', 'staff', 'admin'])
  })

  it('Dashboard UNO fica travado para quem não é Cliente Lema', () => {
    expect(itemState(buildNavTree({ user_type: 'client' }), 'dashboardUno')).toBe('locked')
  })

  it('Dashboard UNO abre para Cliente Lema', () => {
    expect(itemState(buildNavTree({ is_uno_client: true }), 'dashboardUno')).toBe('normal')
  })

  it('Super Admin tem acesso total: Dashboard UNO nunca trava', () => {
    expect(itemState(buildNavTree({ user_type: 'super_admin' }), 'dashboardUno')).toBe('normal')
  })

  it('Comunidade Lema é sempre "em breve"; Eventos é um grupo', () => {
    const tree = buildNavTree({ user_type: 'client' })
    expect(itemState(tree, 'whatsappCommunity')).toBe('comingSoon')
    expect(itemState(tree, 'events')).toBe('group')
  })

  it('não há mais flag "auth" morta nos itens', () => {
    const tree = buildNavTree({ user_type: 'super_admin' })
    for (const item of tree.flatMap((s) => s.items)) {
      expect(item).not.toHaveProperty('auth')
    }
  })

  it('itens de menu por seção (regressão do espaço de chaves)', () => {
    expect(keysByGroup(buildNavTree({ user_type: 'super_admin' }))).toEqual({
      main: ['home', 'news', 'articles', 'materials', 'events', 'unoUpdates', 'dashboardUno', 'settings', 'whatsappCommunity'],
      staff: ['hub', 'eventsMgmt', 'moderation'],
      admin: ['admin']
    })
  })
})
