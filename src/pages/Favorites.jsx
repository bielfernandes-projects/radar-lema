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
import { supabase } from '../lib/supabase'
import { useFavorites } from '../hooks/useFavorites'
import { enrichEvents } from '../utils/events'
import EventCard from '../components/EventCard'
import EventFilters from '../components/EventFilters'

const PAGE_SIZE = 12

function getMonthRange(year, month) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0]
  }
}

function applyDatePreset(preset) {
  const now = new Date()
  if (preset === 'this-month') {
    return getMonthRange(now.getFullYear(), now.getMonth())
  }
  if (preset === 'next-month') {
    return getMonthRange(now.getFullYear(), now.getMonth() + 1)
  }
  return null
}

function normalizeDate(dateInput) {
  if (!dateInput) return null
  return new Date(`${dateInput}T00:00:00`)
}

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

      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id

      if (!userId) {
        setLoading(false)
        return
      }

      const [{ data: favoritesData }, { data: categoriesData }] = await Promise.all([
        supabase.from('favorites').select('event_id').eq('user_id', userId),
        supabase.from('categories').select('*').order('name')
      ])

      const favoriteEventIds = favoritesData?.map((f) => f.event_id) || []

      if (favoriteEventIds.length === 0) {
        setCategories(categoriesData || [])
        setEvents([])
        setLoading(false)
        return
      }

      const [{ data: eventsData, error: eventsError }, { data: photos }, { data: sessions }, { data: pastEvents }, { data: ongoingEvents }] =
        await Promise.all([
          supabase.from('events').select('*').in('id', favoriteEventIds),
          supabase.from('event_photos').select('*').eq('order', 0).in('event_id', favoriteEventIds),
          supabase.from('event_sessions').select('*').in('event_id', favoriteEventIds),
          supabase.from('v_past_events').select('id').in('id', favoriteEventIds),
          supabase.from('v_ongoing_events').select('id').in('id', favoriteEventIds)
        ])

      if (eventsError) {
        setError('Erro ao carregar favoritos.')
        setLoading(false)
        return
      }

      const pastIds = new Set(pastEvents?.map((e) => e.id) || [])
      const ongoingIds = new Set(ongoingEvents?.map((e) => e.id) || [])
      const enriched = enrichEvents(eventsData || [], photos, sessions, pastIds, ongoingIds)

      setCategories(categoriesData || [])
      setEvents(enriched)
      setLoading(false)
    }

    fetchData()
  }, [favoriteIds])

  const filters = useMemo(() => ({
    q: searchParams.get('q') || '',
    categories: searchParams.getAll('categoria'),
    modalities: searchParams.getAll('modalidade'),
    price: searchParams.get('valor') || 'all',
    city: searchParams.get('cidade') || '',
    state: searchParams.get('uf') || '',
    datePreset: searchParams.get('data') || '',
    dateFrom: searchParams.get('de') || '',
    dateTo: searchParams.get('ate') || ''
  }), [searchParams])

  const filteredEvents = useMemo(() => {
    let result = events

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

    if (filters.city.trim()) {
      const term = filters.city.toLowerCase()
      result = result.filter((event) => event.city?.toLowerCase().includes(term))
    }

    if (filters.state) {
      result = result.filter((event) => event.state === filters.state)
    }

    const dateRange = applyDatePreset(filters.datePreset)
    const from = dateRange?.from || filters.dateFrom
    const to = dateRange?.to || filters.dateTo

    if (from || to) {
      const fromDate = normalizeDate(from)
      const toDate = normalizeDate(to)
      result = result.filter((event) => {
        const min = normalizeDate(event.min_date)
        const max = normalizeDate(event.max_date)
        if (!min || !max) return false
        if (fromDate && max < fromDate) return false
        if (toDate && min > toDate) return false
        return true
      })
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
