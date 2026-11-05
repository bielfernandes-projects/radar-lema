import { useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { HOME_BLOCKS } from '../config/homeBlocks'
import { resolveHomeLayout } from '../utils/homeLayout'

// Layout da home do usuario: ordem e visibilidade dos blocos. `save(null)` volta ao padrao.
export function useHomeLayout() {
  const { profile, refreshProfile } = useAuth()

  const layout = useMemo(
    () => resolveHomeLayout(profile?.home_layout, HOME_BLOCKS),
    [profile?.home_layout]
  )

  const save = useCallback(
    async (next) => {
      const { error } = await supabase.rpc('update_my_home_layout', { new_layout: next })
      if (error) throw error
      await refreshProfile()
    },
    [refreshProfile]
  )

  return { layout, save }
}
