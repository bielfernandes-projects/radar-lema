import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Container,
  Grid,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useFavorites } from '../hooks/useFavorites'
import { filterEvents } from '../utils/filterEvents'
import { fetchPastEventsWithMeta } from '../services/eventData'
import { URL_PARAMS } from '../utils/constants'
import EventCard from '../components/EventCard'
import EventFilters from '../components/EventFilters'

const PAGE_SIZE = 12

export default function PastEvents() {
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
        const result = await fetchPastEventsWithMeta()
        setCategories(result.categories)
        setEvents(result.events)
      } catch {
        setError('Erro ao carregar eventos realizados.')
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const filters = useMemo(() => ({
    q: searchParams.get(URL_PARAMS.SEARCH) || '',
    categories: searchParams.getAll(URL_PARAMS.CATEGORIES),
    modalities: searchParams.getAll(URL_PARAMS.MODALITIES),
    price: searchParams.get(URL_PARAMS.PRICE) || 'all',
    state: searchParams.get(URL_PARAMS.STATE) || '',
    datePresets: searchParams.getAll(URL_PARAMS.DATE)
  }), [searchParams])

  const filteredEvents = useMemo(() =>
    filterEvents(events, filters, categories, { sortBy: 'max_date', sortDir: 'desc' }),
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
        <Typography variant="h4" component="h1">
          Realizados
        </Typography>

        <TextField
          label="Buscar realizados"
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
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton variant="rounded" height={380} />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredEvents.length}{' '}
            {filteredEvents.length === 1
              ? 'evento realizado'
              : 'eventos realizados'}
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
              Nenhum evento realizado encontrado com os filtros selecionados.
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
