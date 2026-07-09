export const URL_PARAMS = {
  SEARCH: 'q',
  CATEGORIES: 'categoria',
  MODALITIES: 'modalidade',
  PRICE: 'valor',
  STATE: 'uf',
  DATE: 'data'
}

export const MODALITY_LABELS = {
  Presencial: 'presencial',
  Online: 'online',
  Híbrido: 'hibrido'
}

export const OFFSET_LABELS = {
  1440: '1 dia antes',
  60: '1 hora antes',
  30: '30 min antes',
  10: '10 min antes',
  5: '5 min antes'
}

export const OFFSET_ORDER = [1440, 60, 30, 10, 5]

export const UFs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
]

export const NAV_ITEMS = [
  { label: 'Eventos', path: '/', icon: 'CalendarMonth', show: () => true },
  { label: 'Favoritos', path: '/favoritos', icon: 'Favorite', show: (user) => !!user },
  { label: 'Realizados', path: '/realizados', icon: 'History', show: () => true },
  { label: 'Avisos', path: '/configuracoes', icon: 'Notifications', show: (user) => !!user },
  { label: 'Gestão', path: '/gestao', icon: 'Settings', show: (user) => user?.user_type === 'staff' },
  { label: 'Categorias', path: '/categorias', icon: 'Category', show: (user) => user?.user_type === 'staff' }
]
