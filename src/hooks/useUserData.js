import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useUserData(fetchFn) {
  const [loading, setLoading] = useState(true)
  const fetchRef = useRef(fetchFn)
  fetchRef.current = fetchFn

  const execute = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id || null
    await fetchRef.current(userId)
    setLoading(false)
  }, [])

  useEffect(() => {
    execute()
    const { data: listener } = supabase.auth.onAuthStateChange(() => execute())
    return () => listener.subscription.unsubscribe()
  }, [execute])

  return { refresh: execute, loading }
}
