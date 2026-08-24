import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Container,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { visuallyHidden } from '@mui/utils'
import { ChevronRight, Newspaper, Megaphone, CalendarDays, BookOpen } from 'lucide-react'
import { fetchAllEventsWithMeta } from '../services/eventData'
import { fetchNews } from '../services/newsData'
import { fetchUnoUpdates } from '../services/unoUpdatesData'
import { fetchArticles } from '../services/articlesData'
import { filterEvents } from '../utils/filterEvents'
import EventCard from '../components/EventCard'
import NewsCard from '../components/NewsCard'
import UnoUpdateCard from '../components/UnoUpdateCard'
import ArticleCard from '../components/ArticleCard'
import HorizontalScroller from '../components/HorizontalScroller'
import { CARD_HEIGHT_WITH_MEDIA } from '../theme/cardLayout'
import { useFavorites } from '../hooks/useFavorites'

/** Quantas noticias o feed mostra, no carrossel mobile e na lista desktop. */
const NEWS_COUNT = 5

/**
 * Quantos itens cada carrossel mostra. No mobile e rolagem lateral, entao cabem
 * 5. No desktop o carrossel quebra em grade, e a contagem tem que fechar a
 * linha exatamente — 3 na faixa de 3 colunas, 4 na de 4 — senao sobra uma
 * segunda linha incompleta.
 */
function useFeedItemCount() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isWide = useMediaQuery(theme.breakpoints.up('lg'))

  if (isMobile) return 5
  return isWide ? 4 : 3
}

function SectionHeader({ icon: Icon, title, to, onMore }) {
  const navigate = useNavigate()
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 2 }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Icon size={22} />
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
      </Stack>
      <Button
        size="small"
        endIcon={<ChevronRight size={18} />}
        onClick={() => (onMore ? onMore() : navigate(to))}
      >
        Ver todos
      </Button>
    </Stack>
  )
}

export default function Feed() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const itemCount = useFeedItemCount()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [events, setEvents] = useState([])
  const [news, setNews] = useState([])
  const [updates, setUpdates] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [eventsResult, newsResult, updatesResult, articlesResult] = await Promise.all([
          fetchAllEventsWithMeta(),
          fetchNews(),
          fetchUnoUpdates(),
          fetchArticles()
        ])
        setEvents(eventsResult.events)
        setNews(newsResult)
        setUpdates(updatesResult)
        setArticles(articlesResult)
      } catch {
        setError('Erro ao carregar o feed. Tente novamente.')
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const upcomingEvents = filterEvents(events, {}, [], {
    excludePast: true
  }).slice(0, itemCount)

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
        <HorizontalScroller>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={CARD_HEIGHT_WITH_MEDIA} />
          ))}
        </HorizontalScroller>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* A home nao tem mais cabecalho visivel, mas a pagina ainda precisa de
          um h1: sem ele as secoes (h2) ficariam orfas para leitor de tela. */}
      <Typography variant="h1" sx={visuallyHidden}>
        Radar Lema
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <SectionHeader
          icon={CalendarDays}
          title="Próximos eventos"
          onMore={() => navigate('/eventos')}
        />
        {upcomingEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum evento confirmado por enquanto.
          </Typography>
        ) : (
          <HorizontalScroller columns={{ md: 3, lg: 4 }}>
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isFavorite={favoriteIds.has(event.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </HorizontalScroller>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <SectionHeader icon={Newspaper} title="Notícias de mercado" onMore={() => navigate('/noticias')} />
        {news.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            As notícias mais recentes sobre RPPS e investimentos aparecem aqui.
          </Typography>
        ) : isMobile ? (
          <HorizontalScroller>
            {news.slice(0, NEWS_COUNT).map((item) => (
              <NewsCard key={item.id} news={item} layout="card" />
            ))}
          </HorizontalScroller>
        ) : (
          <Stack spacing={1.5}>
            {news.slice(0, NEWS_COUNT).map((item) => (
              <NewsCard key={item.id} news={item} layout="list" />
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <SectionHeader
          icon={BookOpen}
          title="Artigos"
          onMore={() => navigate('/artigos')}
        />
        {articles.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Análises e estudos da Lema sobre RPPS e investimentos.
          </Typography>
        ) : (
          <HorizontalScroller>
            {articles.slice(0, itemCount).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </HorizontalScroller>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <SectionHeader
          icon={Megaphone}
          title="Novidades do UNO"
          onMore={() => navigate('/novidades-uno')}
        />
        {updates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Avisos do sistema UNO — atualizações, manutenções e instabilidades.
          </Typography>
        ) : (
          <HorizontalScroller>
            {updates.slice(0, itemCount).map((update) => (
              <UnoUpdateCard key={update.id} update={update} />
            ))}
          </HorizontalScroller>
        )}
      </Box>
    </Container>
  )
}
