import { Fragment, useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material'
import {
  LogOut,
  LogIn,
  Moon,
  Sun,
  Menu,
  CalendarDays,
  Heart,
  History,
  Bell,
  Settings,
  FolderTree,
  UserCog,
  ShieldCheck
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useColorMode } from '../../contexts/ColorModeContext'
import { NAV_ITEMS } from '../../utils/constants'

const ICONS = {
  CalendarDays: <CalendarDays size={22} />,
  Heart: <Heart size={22} />,
  History: <History size={22} />,
  Bell: <Bell size={22} />,
  Settings: <Settings size={22} />,
  FolderTree: <FolderTree size={22} />,
  UserCog: <UserCog size={22} />,
  ShieldCheck: <ShieldCheck size={22} />
}

const isActive = (pathname, itemPath) => {
  if (itemPath === '/') return pathname === '/'
  return pathname.startsWith(itemPath)
}

const navButtonSx = (active) => ({
  fontWeight: active ? 800 : 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
  borderRadius: '10px',
  px: 1.5,
  '&:hover': {
    backgroundColor: active ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.12)'
  }
})

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const { mode, toggleColorMode } = useColorMode()
  const [mobileOpen, setMobileOpen] = useState(false)

  const userWithType = user
    ? { ...user, user_type: profile?.user_type, role: profile?.role }
    : null

  const visibleItems = NAV_ITEMS.filter((item) => item.show(userWithType))
  const clientItems = visibleItems.filter((item) => !item.group)
  const staffItems = visibleItems.filter((item) => item.group === 'staff')
  const adminItems = visibleItems.filter((item) => item.group === 'admin')

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="Abrir menu"
          edge="start"
          sx={{ mr: 0.5, display: { xs: 'inline-flex', md: 'none' } }}
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={24} />
        </IconButton>

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
              onClick={handleLogout}
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
          {clientItems.map((item) => {
            const active = isActive(location.pathname, item.path)
            return (
              <Button key={item.path} color="inherit" onClick={() => navigate(item.path)} sx={navButtonSx(active)}>
                {item.label}
              </Button>
            )
          })}

          {staffItems.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.5,
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.08)'
              }}
            >
              {staffItems.map((item) => {
                const active = isActive(location.pathname, item.path)
                return (
                  <Button key={item.path} color="inherit" onClick={() => navigate(item.path)} sx={navButtonSx(active)}>
                    {item.label}
                  </Button>
                )
              })}
            </Box>
          )}

          {adminItems.map((item) => {
            const active = isActive(location.pathname, item.path)
            return (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  fontWeight: active ? 800 : 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  backgroundColor: active ? 'rgba(142,198,250,0.45)' : 'rgba(142,198,250,0.28)',
                  border: '1px solid rgba(255,255,255,0.45)',
                  borderRadius: '10px',
                  px: 1.5,
                  '&:hover': {
                    backgroundColor: active ? 'rgba(142,198,250,0.55)' : 'rgba(142,198,250,0.4)'
                  }
                }}
              >
                {item.label}
              </Button>
            )
          })}

          {user ? (
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}
        </Box>
      </Toolbar>

      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box
          sx={{ width: 260, height: '100%', display: 'flex', flexDirection: 'column' }}
          role="presentation"
          onClick={() => setMobileOpen(false)}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src="/favicon-32x32.png" alt="" style={{ width: 32, height: 32, display: 'block' }} />
            <Typography variant="h6">Radar Lema</Typography>
          </Box>
          <List>
            {visibleItems.map((item, index) => {
              const active = isActive(location.pathname, item.path)
              const prev = index > 0 ? visibleItems[index - 1] : null
              const startGroup = prev && prev.group !== item.group
              return (
                <Fragment key={item.path}>
                  {startGroup && <Divider sx={{ my: 1 }} />}
                  <ListItemButton
                    selected={active}
                    onClick={() => {
                      setMobileOpen(false)
                      navigate(item.path)
                    }}
                  >
                    <ListItemIcon>{ICONS[item.icon]}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { fontWeight: active ? 800 : 600 } }}
                    />
                  </ListItemButton>
                </Fragment>
              )
            })}
          </List>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" onClick={toggleColorMode}>
              {mode === 'dark' ? 'Tema claro' : 'Tema escuro'}
            </Button>
            {user ? (
              <Button variant="outlined" color="error" onClick={handleLogout}>
                Sair
              </Button>
            ) : (
              <Button variant="contained" onClick={() => navigate('/login')}>
                Entrar
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  )
}
