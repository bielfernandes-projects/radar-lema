import { AppBar, Box, Button, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import { LogOut, LogIn, Moon, Sun } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useColorMode } from '../../contexts/ColorModeContext'
import { NAV_ITEMS } from '../../utils/constants'

const isActive = (pathname, itemPath) => {
  if (itemPath === '/') return pathname === '/'
  return pathname.startsWith(itemPath)
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const { mode, toggleColorMode } = useColorMode()

  const userWithType = user
    ? { ...user, user_type: profile?.user_type, role: profile?.role }
    : null

  return (
    <AppBar position="static">
      <Toolbar>
        <Box
          sx={{ flexGrow: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}
          onClick={() => navigate('/')}
        >
          <img src="/favicon-32x32.png" alt="" style={{ width: 32, height: 32, display: 'block' }} />
          <Typography variant="h6" component="div">
            Radar Lema
          </Typography>
        </Box>

        <Tooltip title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            aria-label="Alternar tema"
          >
            {mode === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          </IconButton>
        </Tooltip>

        {user ? (
          <Tooltip title="Sair">
            <IconButton
              color="inherit"
              aria-label="Sair"
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              onClick={async () => {
                await signOut()
                navigate('/login')
              }}
            >
              <LogOut size={22} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Entrar">
            <IconButton
              color="inherit"
              aria-label="Entrar"
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              onClick={() => navigate('/login')}
            >
              <LogIn size={22} />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {NAV_ITEMS
            .filter((item) => item.show(userWithType))
            .map((item) => {
              const active = isActive(location.pathname, item.path)
              const isAdmin = item.group === 'admin'
              return (
                <Box key={item.path} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isAdmin && (
                    <Box sx={{ width: 1, height: 24, bgcolor: 'rgba(255,255,255,0.5)', mx: 1 }} />
                  )}
                  <Button
                    color="inherit"
                    onClick={() => navigate(item.path)}
                    sx={{
                      fontWeight: active ? 800 : 600,
                      backgroundColor: isAdmin
                        ? active
                          ? 'rgba(255,255,255,0.28)'
                          : 'rgba(255,255,255,0.16)'
                        : active
                          ? 'rgba(255,255,255,0.2)'
                          : 'transparent',
                      border: isAdmin ? '1px solid rgba(255,255,255,0.45)' : 'none',
                      borderRadius: '10px',
                      px: 1.5,
                      '&:hover': {
                        backgroundColor: isAdmin
                          ? active
                            ? 'rgba(255,255,255,0.34)'
                            : 'rgba(255,255,255,0.26)'
                          : active
                            ? 'rgba(255,255,255,0.26)'
                            : 'rgba(255,255,255,0.12)'
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                </Box>
              )
            })}

          {user ? (
            <Button
              color="inherit"
              onClick={async () => {
                await signOut()
                navigate('/login')
              }}
            >
              Sair
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
