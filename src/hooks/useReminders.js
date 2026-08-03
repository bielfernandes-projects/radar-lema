import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUserData } from './useUserData'

export function useReminders() {
  const [remindersByEvent, setRemindersByEvent] = useState(new Map())

  const { refresh, loading } = useUserData(async (userId) => {
    if (!userId) {
      setRemindersByEvent(new Map())
      return
    }

    const { data: reminders, error } = await supabase
      .from('event_reminders')
      .select('event_id, offset_minutes, channel')
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao carregar lembretes:', error.message)
      setRemindersByEvent(new Map())
    } else {
      const map = new Map()
      for (const r of reminders) {
        const existing = map.get(r.event_id) || []
        existing.push({
          offset_minutes: r.offset_minutes,
          channel: r.channel
        })
        map.set(
          r.event_id,
          existing.sort((a, b) => b.offset_minutes - a.offset_minutes)
        )
      }
      setRemindersByEvent(map)
    }
  })

  const hasRemindersForEvent = useCallback(
    (eventId) => {
      return remindersByEvent.has(eventId)
    },
    [remindersByEvent]
  )

  const saveReminders = useCallback(
    async (eventId, entries) => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        return { error: new Error('Usuario nao autenticado') }
      }

      const inserts = entries.map((entry) => ({
        user_id: userId,
        event_id: eventId,
        offset_minutes: entry.offset_minutes,
        channel: entry.channel
      }))

      const { error } = await supabase
        .from('event_reminders')
        .upsert(inserts, {
          onConflict: 'user_id, event_id, offset_minutes, channel',
          ignoreDuplicates: true
        })

      if (error) {
        console.error('Erro ao salvar lembretes:', error.message)
        return { error }
      }

      setRemindersByEvent((prev) => {
        const next = new Map(prev)
        next.set(
          eventId,
          entries
            .slice()
            .sort((a, b) => b.offset_minutes - a.offset_minutes)
        )
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
    async (eventId, offsetMin, channel) => {
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
        .eq('offset_minutes', offsetMin)
        .eq('channel', channel)

      if (error) {
        console.error('Erro ao remover lembrete:', error.message)
        return { error }
      }

      setRemindersByEvent((prev) => {
        const next = new Map(prev)
        const existing = next.get(eventId) || []
        const updated = existing.filter(
          (e) => !(e.offset_minutes === offsetMin && e.channel === channel)
        )
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
      refresh,
      loading
    }),
    [
      remindersByEvent,
      hasRemindersForEvent,
      saveReminders,
      removeReminders,
      removeOneReminder,
      refresh,
      loading
    ]
  )
}
