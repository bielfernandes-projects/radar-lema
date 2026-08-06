import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUserData } from './useUserData'

const DEFAULTS = {
  push_enabled: false,
  email_enabled: false,
  categories_enabled: []
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState(null)

  const { refresh, loading } = useUserData(async (userId) => {
    if (!userId) {
      setSettings({ ...DEFAULTS })
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
      const merged = row ? { ...DEFAULTS, ...row } : { ...DEFAULTS }
      setSettings(merged)
    }
  })

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
      refresh
    }),
    [settings, saveSettings, loading, refresh]
  )
}
