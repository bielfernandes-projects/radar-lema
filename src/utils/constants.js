import { isStaffTier, isSuperAdmin, isUnoClient } from './auth'

export const URL_PARAMS = {
  SEARCH: 'q',
  CATEGORIES: 'categoria',
  MODALITIES: 'modalidade',
  PRICE: 'valor',
  STATE: 'uf',
  DATE: 'data',
  DATE_FROM: 'data-inicio',
  DATE_TO: 'data-fim',
  LEMA_EDU: 'lema-edu'
}

export const MODALITY_OPTIONS = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Online', value: 'online' },
  { label: 'Híbrido', value: 'hibrido' }
]

export const MODALITY_LABELS = Object.fromEntries(
  MODALITY_OPTIONS.map((option) => [option.label, option.value])
)

export const REMINDER_UNITS = [
  { value: 'minute', label: 'minuto', plural: 'minutos', minutes: 1 },
  { value: 'hour', label: 'hora', plural: 'horas', minutes: 60 },
  { value: 'day', label: 'dia', plural: 'dias', minutes: 1440 },
  { value: 'week', label: 'semana', plural: 'semanas', minutes: 10080 },
  { value: 'month', label: 'mês', plural: 'meses', minutes: 43200 }
]

export const REMINDER_CHANNELS = [
  { value: 'push', label: 'Notificação' },
  { value: 'email', label: 'E-mail' }
]

export const UFs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
]

export const NAV_ITEMS = [
  { label: 'Eventos', path: '/eventos', icon: 'CalendarDays', show: () => true },
  { label: 'Notícias', path: '/noticias', icon: 'Newspaper', show: () => true },
  { label: 'Novidades UNO', path: '/novidades-uno', icon: 'Megaphone', show: () => true },
  { label: 'Artigos', path: '/artigos', icon: 'BookOpen', show: () => true },
  { label: 'Materiais', path: '/materiais', icon: 'FileStack', show: () => true },
  { label: 'Dashboard UNO', path: '/dashboard-uno', icon: 'LineChart', show: (user) => isUnoClient(user) },
  { label: 'Favoritos', path: '/favoritos', icon: 'Heart', show: (user) => !!user },
  { label: 'Realizados', path: '/realizados', icon: 'History', show: () => true },
  { label: 'Config', path: '/configuracoes', icon: 'Settings', show: (user) => !!user },
  { label: 'Categorias', path: '/categorias', icon: 'FolderTree', show: (user) => isStaffTier(user), group: 'staff' },
  { label: 'Gestão', path: '/gestao', icon: 'UserCog', show: (user) => isStaffTier(user), group: 'staff' },
  { label: 'Hub', path: '/gestao/hub', icon: 'LayoutGrid', show: (user) => isStaffTier(user), group: 'staff' },
  { label: 'Moderação', path: '/moderacao', icon: 'ShieldAlert', show: (user) => isStaffTier(user), group: 'staff' },
  { label: 'Painel Admin', path: '/admin', icon: 'ShieldCheck', show: (user) => isSuperAdmin(user), group: 'admin' }
]
