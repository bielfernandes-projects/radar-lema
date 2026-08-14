import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
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
import { useFavorites } from '../hooks/useFavorites'

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

  const upcomingEvents = filterEvents(events, {}, [], { excludePast: true }).slice(0, 4)

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
        <HorizontalScroller>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={380} />
          ))}
        </HorizontalScroller>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Radar Lema
        </Typography>
        <Typography variant="body1">
          Eventos, notícias de mercado, novidades do UNO e conteúdos exclusivos do
          ecossistema Lema para RPPS — tudo em um só lugar.
        </Typography>
      </Paper>

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
        ) : (
          <Stack spacing={1.5}>
            {news.slice(0, 5).map((item) => (
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
            {articles.slice(0, 3).map((article) => (
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
            {updates.slice(0, 3).map((update) => (
              <UnoUpdateCard key={update.id} update={update} />
            ))}
          </HorizontalScroller>
        )}
      </Box>
    </Container>
  )
}
