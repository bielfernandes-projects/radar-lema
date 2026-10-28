import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { logEvent } from '../lib/analytics'

// Só clientes entram nas métricas de uso; staff e super admin não são medidos.
export function useLogEvent() {
  const { profile } = useAuth()
  const measured = profile?.user_type === 'client'
  return useCallback(
    (event, path) => {
      if (measured) logEvent(event, path)
    },
    [measured]
  )
}
