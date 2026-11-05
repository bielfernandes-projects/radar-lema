import { BookOpen, CalendarDots, ChartLineUp, Megaphone, Newspaper } from '@phosphor-icons/react'

// Ordem aqui = ordem padrao da home. Para um bloco novo: adicionar aqui e em
// HOME_BLOCK_COMPONENTS (src/components/home/HomeBlocks.jsx).
export const HOME_BLOCKS = [
  { id: 'eventos', title: 'Próximos eventos', icon: CalendarDots, defaultVisible: true },
  { id: 'noticias', title: 'Notícias de mercado', icon: Newspaper, defaultVisible: true },
  { id: 'artigos', title: 'Artigos', icon: BookOpen, defaultVisible: true },
  { id: 'novidades-uno', title: 'Novidades do UNO', icon: Megaphone, defaultVisible: true },
  { id: 'dashboard-uno', title: 'Dashboard do UNO', icon: ChartLineUp, defaultVisible: false }
]
