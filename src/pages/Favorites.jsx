import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Pagination,
  Typography,
  CircularProgress
} from '@mui/material'
import { useFavorites } from '../hooks/useFavorites'
import { filterEvents } from '../utils/filterEvents'
import { fetchFavoriteEventsWithMeta } from '../services/eventData'
import { getUserId } from '../utils/auth'
import { URL_PARAMS } from '../utils/constants'
import EventCard from '../components/EventCard'
import EventFilters from '../components/EventFilters'

const PAGE_SIZE = 12

export default function Favorites() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { favoriteIds, toggleFavorite, refresh } = useFavorites()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const userId = await getUserId()
        if (!userId) {
          setLoading(false)
          return
        }

        const result = await fetchFavoriteEventsWithMeta(userId)
        setCategories(result.categories)
        setEvents(result.events)
      } catch {
        setError('Erro ao carregar favoritos.')
      }

      setLoading(false)
    }

    fetchData()
  }, [favoriteIds])

  const filters = useMemo(() => ({
    q: searchParams.get(URL_PARAMS.SEARCH) || '',
    categories: searchParams.getAll(URL_PARAMS.CATEGORIES),
    modalities: searchParams.getAll(URL_PARAMS.MODALITIES),
    price: searchParams.get(URL_PARAMS.PRICE) || 'all',
    state: searchParams.get(URL_PARAMS.STATE) || '',
    datePresets: searchParams.getAll(URL_PARAMS.DATE)
  }), [searchParams])

  const filteredEvents = useMemo(() =>
    filterEvents(events, filters, categories),
  [events, filters, categories])

  const pageCount = Math.ceil(filteredEvents.length / PAGE_SIZE)
  const paginatedEvents = filteredEvents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  useEffect(() => {
    setPage(1)
  }, [searchParams])

  const handleToggleFavorite = async (eventId) => {
    const result = await toggleFavorite(eventId)
    if (!result?.error) {
      refresh()
    }
    return result
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Favoritos
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Voce ainda nao favoritou nenhum evento.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Salve eventos para acompanha-los depois.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Ver eventos
          </Button>
        </Box>
      ) : (
        <>
          <EventFilters categories={categories} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredEvents.length}{' '}
            {filteredEvents.length === 1
              ? 'evento favoritado'
              : 'eventos favoritados'}
          </Typography>

          <Grid container spacing={3}>
            {paginatedEvents.map((event) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={event.id}>
                <EventCard
                  event={event}
                  isFavorite={favoriteIds.has(event.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              </Grid>
            ))}
          </Grid>

          {filteredEvents.length === 0 && (
            <Alert severity="info" sx={{ mt: 4 }}>
              Nenhum favorito corresponde aos filtros selecionados.
            </Alert>
          )}

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  )
}
