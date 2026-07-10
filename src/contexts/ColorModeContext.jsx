import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const ColorModeContext = createContext({ mode: 'light', toggleColorMode: () => {} })

export function ColorModeProvider({ children }) {
  const { profile } = useAuth()
  const email = profile?.email || 'anonymous'
  const storageKey = `theme-mode:${email}`

  const [mode, setMode] = useState(
    () => localStorage.getItem(storageKey) || 'light'
  )

  useEffect(() => {
    setMode(localStorage.getItem(storageKey) || 'light')
  }, [storageKey])

  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light'
          localStorage.setItem(storageKey, next)
          return next
        })
      }
    }),
    [mode, storageKey]
  )

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  return useContext(ColorModeContext)
}
