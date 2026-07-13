import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

const ColorModeContext = createContext({ mode: 'light', toggleColorMode: () => {} })

function getStoredMode(storageKey) {
  const stored = localStorage.getItem(storageKey)
  if (stored === 'dark' || stored === 'light') return stored
  return null
}

function getInitialMode(storageKey) {
  const stored = getStoredMode(storageKey)
  if (stored) return stored
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ColorModeProvider({ children }) {
  const { profile } = useAuth()
  const email = profile?.email || 'anonymous'
  const storageKey = `theme-mode:${email}`

  const [mode, setMode] = useState(() => getInitialMode(storageKey))

  useEffect(() => {
    setMode(getInitialMode(storageKey))
  }, [storageKey])

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [mode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => {
      const stored = getStoredMode(storageKey)
      if (!stored) {
        setMode(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
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
