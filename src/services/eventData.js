import { supabase as _supabase } from '../lib/supabase'
import { enrichEvents } from '../utils/events'

export async function fetchMetadata(eventIds, { supabase } = { supabase: _supabase }) {
  if (!eventIds.length) {
    return { photos: [], sessions: [], pastIds: new Set(), ongoingIds: new Set() }
  }

  const [{ data: photos }, { data: sessions }, { data: pastEvents }, { data: ongoingEvents }] =
    await Promise.all([
      supabase.from('event_photos').select('*').eq('sort_order', 0).in('event_id', eventIds),
      supabase.from('event_sessions').select('*').in('event_id', eventIds),
      supabase.from('v_past_events').select('id').in('id', eventIds),
      supabase.from('v_ongoing_events').select('id').in('id', eventIds)
    ])

  return {
    photos: photos || [],
    sessions: sessions || [],
    pastIds: new Set(pastEvents?.map((e) => e.id) || []),
    ongoingIds: new Set(ongoingEvents?.map((e) => e.id) || [])
  }
}

export async function fetchCategories({ supabase } = { supabase: _supabase }) {
  const { data } = await supabase.from('categories').select('*').order('name')
  return data || []
}

export async function fetchAllEventsWithMeta({ supabase } = { supabase: _supabase }) {
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (eventsError) throw eventsError

  const eventIds = eventsData.map((e) => e.id)
  const meta = await fetchMetadata(eventIds, { supabase })

  return {
    events: enrichEvents(eventsData || [], meta.photos, meta.sessions, meta.pastIds, meta.ongoingIds),
    categories: await fetchCategories({ supabase })
  }
}

export async function fetchFavoriteEventsWithMeta(userId, { supabase } = { supabase: _supabase }) {
  const { data: favoritesData } = await supabase
    .from('favorites')
    .select('event_id')
    .eq('user_id', userId)

  const favoriteEventIds = favoritesData?.map((f) => f.event_id) || []

  if (favoriteEventIds.length === 0) {
    return { events: [], categories: await fetchCategories({ supabase }) }
  }

  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('id', favoriteEventIds)

  if (eventsError) throw eventsError

  const meta = await fetchMetadata(favoriteEventIds, { supabase })

  return {
    events: enrichEvents(eventsData || [], meta.photos, meta.sessions, meta.pastIds, meta.ongoingIds),
    categories: await fetchCategories({ supabase })
  }
}

export async function fetchPastEventsWithMeta({ supabase } = { supabase: _supabase }) {
  const { data: pastEvents, error: pastError } = await supabase
    .from('v_past_events')
    .select('*')

  if (pastError) throw pastError

  const eventIds = pastEvents?.map((e) => e.id) || []

  if (eventIds.length === 0) {
    return { events: [], categories: await fetchCategories({ supabase }) }
  }

  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)

  if (eventsError) throw eventsError

  const meta = await fetchMetadata(eventIds, { supabase })
  const allPastIds = new Set(eventIds)

  return {
    events: enrichEvents(eventsData || [], meta.photos, meta.sessions, allPastIds, new Set()),
    categories: await fetchCategories({ supabase })
  }
}
