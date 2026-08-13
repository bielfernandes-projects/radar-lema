import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
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
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton variant="rounded" height={380} />
            </Grid>
          ))}
        </Grid>
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
          <Grid container spacing={3}>
            {upcomingEvents.map((event) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={event.id}>
                <EventCard
                  event={event}
                  isFavorite={favoriteIds.has(event.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <SectionHeader icon={Newspaper} title="Notícias de mercado" onMore={() => navigate('/noticias')} />
        {news.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            As notícias mais recentes sobre RPPS e investimentos aparecem aqui.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {news.slice(0, 3).map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <NewsCard news={item} />
              </Grid>
            ))}
          </Grid>
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
          <Grid container spacing={3}>
            {articles.slice(0, 3).map((article) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
                <ArticleCard article={article} />
              </Grid>
            ))}
          </Grid>
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
          <Grid container spacing={3}>
            {updates.slice(0, 3).map((update) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={update.id}>
                <UnoUpdateCard update={update} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  )
}
