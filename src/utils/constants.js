import { isStaffTier, isSuperAdmin } from './auth'

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

export const MODALITY_LABELS = {
  Presencial: 'presencial',
  Online: 'online',
  Híbrido: 'hibrido'
}

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
  { label: 'Eventos', path: '/', icon: 'CalendarMonth', show: () => true },
  { label: 'Favoritos', path: '/favoritos', icon: 'Favorite', show: (user) => !!user },
  { label: 'Realizados', path: '/realizados', icon: 'History', show: () => true },
  { label: 'Config', path: '/configuracoes', icon: 'Settings', show: (user) => !!user },
  { label: 'Categorias', path: '/categorias', icon: 'Category', show: (user) => isStaffTier(user) },
  { label: 'Gestão', path: '/gestao', icon: 'ManageAccounts', show: (user) => isStaffTier(user) },
  { label: 'Painel Admin', path: '/admin', icon: 'AdminPanelSettings', show: (user) => isSuperAdmin(user) }
]
