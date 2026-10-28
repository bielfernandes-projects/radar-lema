import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { sectionOf } from '../../lib/analytics'
import { useLogEvent } from '../../hooks/useLogEvent'

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 960)
  const location = useLocation()
  const logEvent = useLogEvent()

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 960)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isDesktop) {
      setMobileOpen(false)
    }
  }, [location.pathname, isDesktop])

  useEffect(() => {
    logEvent('screen_view', sectionOf(location.pathname))
  }, [location.pathname, logEvent])

  // Presenca ao vivo: sinal a cada 2 min enquanto a aba esta visivel.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') logEvent('ping')
    }, 120000)
    return () => clearInterval(id)
  }, [logEvent])

  const drawerWidth = 280

  return (
    <Box id="app-shell" sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Bar */}
      <TopBar onMenuClick={() => setMobileOpen(true)} />

      {/* Sidebar */}
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant={isDesktop ? 'permanent' : 'temporary'}
        width={drawerWidth}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          px: { xs: 2, md: 3 },
          py: 2,
          ml: { md: `${drawerWidth}px` },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        {children}
      </Box>
    </Box>
  )
}