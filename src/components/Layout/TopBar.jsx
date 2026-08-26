import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import { Menu, Sun, Moon, LogOut, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useColorMode } from '../../contexts/ColorModeContext'

export default function TopBar({ onMenuClick }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { mode, toggleColorMode } = useColorMode()
  const theme = useTheme()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ px: { xs: 1.5, md: 2 }, minHeight: 64 }}>
        <IconButton
          color="inherit"
          aria-label="Abrir menu"
          edge="start"
          sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' } }}
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </IconButton>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="button"
            onClick={() => navigate('/')}
            aria-label="Ir para o início"
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: 0,
              p: 0,
              m: 0,
              bgcolor: 'transparent',
              color: 'inherit',
              font: 'inherit'
            }}
          >
            <img src="/favicon-32x32.png" alt="" style={{ width: 28, height: 28, display: 'block' }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Radar Lema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>
            <IconButton
              color="inherit"
              onClick={toggleColorMode}
              aria-label="Alternar tema"
              sx={{ p: 0.75 }}
            >
              {mode === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </IconButton>
          </Tooltip>

          {user ? (
            <Tooltip title="Sair">
              <IconButton
                color="inherit"
                aria-label="Sair"
                onClick={handleLogout}
                sx={{ p: 0.75 }}
              >
                <LogOut size={22} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Entrar">
              <IconButton
                color="inherit"
                aria-label="Entrar"
                onClick={() => navigate('/login')}
                sx={{ p: 0.75 }}
              >
                <LogIn size={22} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}