import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import createAppTheme from './theme/theme'
import { AuthProvider } from './contexts/AuthContext'
import { ColorModeProvider, useColorMode } from './contexts/ColorModeContext'
import { routes } from './routes.jsx'
import { initPosthog } from './lib/posthog'

initPosthog()

const router = createBrowserRouter(routes)

function AppWithTheme() {
  const { mode } = useColorMode()
  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ColorModeProvider>
        <AppWithTheme />
      </ColorModeProvider>
    </AuthProvider>
  </StrictMode>
)
