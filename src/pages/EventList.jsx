import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  IconButton,
  Pagination,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import { useFavorites } from '../hooks/useFavorites'
import { filterEvents } from '../utils/filterEvents'
import { fetchAllEventsWithMeta } from '../services/eventData'
import { URL_PARAMS } from '../utils/constants'
import EventCard from '../components/EventCard'
import EventFilters from '../components/EventFilters'

const PAGE_SIZE = 12

export default function EventList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { favoriteIds, toggleFavorite } = useFavorites()
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
        const result = await fetchAllEventsWithMeta()
        setCategories(result.categories)
        setEvents(result.events)
      } catch {
        setError('Erro ao carregar eventos. Tente novamente.')
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const filters = useMemo(() => ({
    q: searchParams.get(URL_PARAMS.SEARCH) || '',
    categories: searchParams.getAll(URL_PARAMS.CATEGORIES),
    modalities: searchParams.getAll(URL_PARAMS.MODALITIES),
    price: searchParams.get(URL_PARAMS.PRICE) || '',
    state: searchParams.get(URL_PARAMS.STATE) || '',
    datePresets: searchParams.getAll(URL_PARAMS.DATE)
  }), [searchParams])

  const hasFilters =
    filters.q.trim() ||
    filters.categories.length > 0 ||
    filters.modalities.length > 0 ||
    filters.price ||
    filters.state ||
    filters.datePresets.length > 0

  const clearFilters = () => {
    setSearchParams({})
  }

  const filteredEvents = useMemo(() =>
    filterEvents(events, filters, categories, { excludePast: true }),
  [events, filters, categories])

  const pageCount = Math.ceil(filteredEvents.length / PAGE_SIZE)
  const paginatedEvents = filteredEvents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  useEffect(() => {
    setPage(1)
  }, [searchParams])

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Eventos
          </Typography>
          <IconButton
            onClick={clearFilters}
            disabled={!hasFilters}
            aria-label="Limpar filtros"
          >
            <ClearAllIcon />
          </IconButton>
        </Stack>

        <TextField
          label="Buscar eventos"
          placeholder="Título ou descrição"
          value={filters.q}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams)
            if (e.target.value) {
              next.set(URL_PARAMS.SEARCH, e.target.value)
            } else {
              next.delete(URL_PARAMS.SEARCH)
            }
            setSearchParams(next)
          }}
          fullWidth
          size="small"
        />
      </Stack>

      <EventFilters categories={categories} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredEvents.length}{' '}
            {filteredEvents.length === 1
              ? 'evento encontrado'
              : 'eventos encontrados'}
          </Typography>

          <Grid container spacing={3}>
            {paginatedEvents.map((event) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={event.id}>
                <EventCard
                  event={event}
                  isFavorite={favoriteIds.has(event.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </Grid>
            ))}
          </Grid>

          {filteredEvents.length === 0 && (
            <Alert severity="info" sx={{ mt: 4 }}>
              Nenhum evento encontrado com os filtros selecionados.
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
