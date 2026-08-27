/**
 * Árvore de navegação da Sidebar, resolvida contra o profile.
 *
 * Antes, "quem vê o quê" estava espalhado em três lugares no Sidebar:
 * `section.show(profile)`, uma checagem inline `unoClientOnly →
 * canAccessLemaExclusive`, e uma flag `auth: true` que era declarada nos dados
 * mas nunca lida no render (bug latente numa costura rasa). Como a Sidebar
 * inteira só é renderizada dentro de rotas protegidas, "exige autenticação"
 * não distingue nenhum item — a flag `auth` foi removida.
 *
 * `buildNavTree(profile)` resolve tudo num `state` por item
 * (`normal | group | locked | comingSoon`); o Sidebar só renderiza.
 */
import { isStaffTier, isSuperAdmin, canAccessLemaExclusive } from './auth'

const SECTIONS = [
  {
    group: 'main',
    label: 'Principal',
    items: [
      { key: 'home', label: 'Início', path: '/', icon: 'Home' },
      { key: 'news', label: 'Notícias', path: '/noticias', icon: 'Newspaper' },
      { key: 'articles', label: 'Artigos', path: '/artigos', icon: 'BookOpen' },
      { key: 'materials', label: 'Materiais de Apoio', path: '/materiais', icon: 'FileStack' },
      {
        key: 'events',
        label: 'Eventos',
        icon: 'CalendarDays',
        children: [
          { key: 'eventsList', label: 'Todos os Eventos', path: '/eventos' },
          { key: 'favorites', label: 'Favoritos', path: '/favoritos' },
          { key: 'past', label: 'Realizados', path: '/realizados' }
        ]
      },
      { key: 'unoUpdates', label: 'Novidades UNO', path: '/novidades-uno', icon: 'Megaphone' },
      {
        key: 'dashboardUno',
        label: 'Dashboard UNO',
        path: '/dashboard-uno',
        icon: 'LineChart',
        unoClientOnly: true
      },
      { key: 'settings', label: 'Configurações', path: '/configuracoes', icon: 'Settings' },
      {
        key: 'whatsappCommunity',
        label: 'Comunidade Lema',
        icon: 'MessageCircle',
        comingSoon: true
      }
    ]
  },
  {
    group: 'staff',
    label: 'Gestão',
    show: (profile) => isStaffTier(profile),
    items: [
      { key: 'hub', label: 'Hub', path: '/gestao/hub', icon: 'FolderTree' },
      {
        key: 'eventsMgmt',
        label: 'Eventos',
        icon: 'CalendarDays',
        children: [
          { key: 'eventsListMgmt', label: 'Gerenciar Eventos', path: '/gestao' },
          { key: 'categories', label: 'Categorias', path: '/categorias' }
        ]
      },
      { key: 'moderation', label: 'Moderação', path: '/moderacao', icon: 'ShieldAlert' }
    ]
  },
  {
    group: 'admin',
    label: 'Administração',
    show: (profile) => isSuperAdmin(profile),
    items: [{ key: 'admin', label: 'Painel Admin', path: '/admin', icon: 'ShieldCheck' }]
  }
]

function resolveItem(item, profile) {
  const children = item.children?.map((c) => ({ key: c.key, label: c.label, path: c.path }))
  let state = 'normal'
  if (item.comingSoon) state = 'comingSoon'
  else if (item.unoClientOnly && !canAccessLemaExclusive(profile)) state = 'locked'
  else if (children) state = 'group'
  return { key: item.key, label: item.label, path: item.path, icon: item.icon, state, children }
}

export function buildNavTree(profile) {
  return SECTIONS.filter((s) => !s.show || s.show(profile)).map((s) => ({
    group: s.group,
    label: s.label,
    items: s.items.map((item) => resolveItem(item, profile))
  }))
}
