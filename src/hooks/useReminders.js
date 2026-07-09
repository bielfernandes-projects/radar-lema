import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useReminders() {
  const [remindersByEvent, setRemindersByEvent] = useState(new Map())
  const [loading, setLoading] = useState(true)

  const fetchReminders = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id

    if (!userId) {
      setRemindersByEvent(new Map())
      setLoading(false)
      return
    }

    const { data: reminders, error } = await supabase
      .from('event_reminders')
      .select('event_id, offset_minutes')
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao carregar lembretes:', error.message)
      setRemindersByEvent(new Map())
    } else {
      const map = new Map()
      for (const r of reminders) {
        const existing = map.get(r.event_id) || []
        existing.push(r.offset_minutes)
        map.set(r.event_id, existing.sort((a, b) => b - a))
      }
      setRemindersByEvent(map)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReminders()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchReminders()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [fetchReminders])

  const hasRemindersForEvent = useCallback(
    (eventId) => {
      return remindersByEvent.has(eventId)
    },
    [remindersByEvent]
  )

  const saveReminders = useCallback(
    async (eventId, offsets) => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        return { error: new Error('Usuario nao autenticado') }
      }

      const inserts = offsets.map((offset) => ({
        user_id: userId,
        event_id: eventId,
        offset_minutes: offset
      }))

      const { error } = await supabase
        .from('event_reminders')
        .upsert(inserts, {
          onConflict: 'user_id, event_id, offset_minutes',
          ignoreDuplicates: true
        })

      if (error) {
        console.error('Erro ao salvar lembretes:', error.message)
        return { error }
      }

      setRemindersByEvent((prev) => {
        const next = new Map(prev)
        next.set(eventId, offsets.sort((a, b) => b - a))
        return next
      })

      return { error: null }
    },
    []
  )

  const removeReminders = useCallback(
    async (eventId) => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        return { error: new Error('Usuario nao autenticado') }
      }

      const { error } = await supabase
        .from('event_reminders')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)

      if (error) {
        console.error('Erro ao remover lembretes:', error.message)
        return { error }
      }

      setRemindersByEvent((prev) => {
        const next = new Map(prev)
        next.delete(eventId)
        return next
      })

      return { error: null }
    },
    []
  )

  const removeOneReminder = useCallback(
    async (eventId, offset) => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        return { error: new Error('Usuario nao autenticado') }
      }

      const { error } = await supabase
        .from('event_reminders')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('offset_minutes', offset)

      if (error) {
        console.error('Erro ao remover lembrete:', error.message)
        return { error }
      }

      setRemindersByEvent((prev) => {
        const next = new Map(prev)
        const existing = next.get(eventId) || []
        const updated = existing.filter((o) => o !== offset)
        if (updated.length === 0) {
          next.delete(eventId)
        } else {
          next.set(eventId, updated)
        }
        return next
      })

      return { error: null }
    },
    []
  )

  return useMemo(
    () => ({
      remindersByEvent,
      hasRemindersForEvent,
      saveReminders,
      removeReminders,
      removeOneReminder,
      refresh: fetchReminders,
      loading
    }),
    [
      remindersByEvent,
      hasRemindersForEvent,
      saveReminders,
      removeReminders,
      removeOneReminder,
      fetchReminders,
      loading
    ]
  )
}
