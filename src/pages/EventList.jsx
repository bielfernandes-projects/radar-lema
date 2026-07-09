import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  Pagination,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material'
import { supabase } from '../lib/supabase'
import { useFavorites } from '../hooks/useFavorites'
import { enrichEvents } from '../utils/events'
import { eventMatchesDatePresets } from '../utils/dateFilters'
import EventCard from '../components/EventCard'
import EventFilters from '../components/EventFilters'

const PAGE_SIZE = 12

function normalizeDate(dateInput) {
  if (!dateInput) return null
  return new Date(`${dateInput}T00:00:00`)
}

export default function EventList() {
  const [searchParams] = useSearchParams()
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

      const [
        { data: eventsData, error: eventsError },
        { data: categoriesData }
      ] = await Promise.all([
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ])

      if (eventsError) {
        setError('Erro ao carregar eventos. Tente novamente.')
        setLoading(false)
        return
      }

      const eventIds = eventsData.map((event) => event.id)

      const [{ data: photos }, { data: sessions }, { data: pastEvents }, { data: ongoingEvents }] =
        await Promise.all([
          supabase.from('event_photos').select('*').eq('sort_order', 0).in('event_id', eventIds),
          supabase.from('event_sessions').select('*').in('event_id', eventIds),
          supabase.from('v_past_events').select('id').in('id', eventIds),
          supabase.from('v_ongoing_events').select('id').in('id', eventIds)
        ])

      const pastIds = new Set(pastEvents?.map((e) => e.id) || [])
      const ongoingIds = new Set(ongoingEvents?.map((e) => e.id) || [])

      const enriched = enrichEvents(eventsData, photos, sessions, pastIds, ongoingIds)

      setCategories(categoriesData || [])
      setEvents(enriched)
      setLoading(false)
    }

    fetchData()
  }, [])

  const filters = useMemo(() => ({
    q: searchParams.get('q') || '',
    categories: searchParams.getAll('categoria'),
    modalities: searchParams.getAll('modalidade'),
    price: searchParams.get('valor') || 'all',
    state: searchParams.get('uf') || '',
    datePresets: searchParams.getAll('data')
  }), [searchParams])

  const filteredEvents = useMemo(() => {
    let result = events.filter((event) => !event.is_past)

    if (filters.q.trim()) {
      const term = filters.q.toLowerCase()
      result = result.filter(
        (event) =>
          event.title?.toLowerCase().includes(term) ||
          event.description?.toLowerCase().includes(term)
      )
    }

    if (filters.categories.length > 0) {
      const categoryNames = new Set(filters.categories)
      result = result.filter((event) =>
        categories.some(
          (c) => c.id === event.category_id && categoryNames.has(c.name)
        )
      )
    }

    if (filters.modalities.length > 0) {
      const labels = {
        Presencial: 'presencial',
        Online: 'online',
        Híbrido: 'hibrido'
      }
      const values = new Set(filters.modalities.map((m) => labels[m]))
      result = result.filter((event) => values.has(event.modality))
    }

    if (filters.price === 'free') {
      result = result.filter((event) => event.is_free)
    } else if (filters.price === 'paid') {
      result = result.filter((event) => !event.is_free)
    }

    if (filters.state) {
      result = result.filter((event) => event.state === filters.state)
    }

    if (filters.datePresets.length > 0) {
      result = result.filter((event) =>
        eventMatchesDatePresets(event.min_date, event.max_date, filters.datePresets)
      )
    }

    return result.sort((a, b) => {
      const da = normalizeDate(a.next_date) || new Date('9999-12-31')
      const db = normalizeDate(b.next_date) || new Date('9999-12-31')
      return da - db
    })
  }, [events, filters, categories])

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
      <Typography variant="h4" component="h1" gutterBottom>
        Eventos
      </Typography>

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
