import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULTS = {
  push_enabled: false,
  email_enabled: false,
  categories_enabled: []
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id

    if (!userId) {
      setSettings({ ...DEFAULTS })
      setLoading(false)
      return
    }

    const { data: row, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao carregar configuracoes:', error.message)
      setSettings({ ...DEFAULTS })
    } else {
      setSettings(row ? { ...DEFAULTS, ...row } : { ...DEFAULTS })
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchSettings()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [fetchSettings])

  const saveSettings = useCallback(
    async (patch) => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        return { error: new Error('Usuario nao autenticado') }
      }

      const payload = {
        user_id: userId,
        ...patch,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) {
        console.error('Erro ao salvar configuracoes:', error.message)
        return { error }
      }

      setSettings((prev) => ({ ...DEFAULTS, ...prev, ...patch }))
      return { error: null }
    },
    []
  )

  return useMemo(
    () => ({
      settings,
      saveSettings,
      loading,
      refresh: fetchSettings
    }),
    [settings, saveSettings, loading, fetchSettings]
  )
}
