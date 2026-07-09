import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NAV_ITEMS } from '../../utils/constants'

const NAV_LABEL_OVERRIDES = {
  '/configuracoes': 'Configurações'
}

const isActive = (pathname, itemPath) => {
  if (itemPath === '/') return pathname === '/'
  return pathname.startsWith(itemPath)
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, signOut } = useAuth()

  const userWithType = user ? { ...user, user_type: profile?.user_type } : null

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Lema Discovery
        </Typography>

        {user ? (
          <IconButton
            color="inherit"
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            onClick={async () => {
              await signOut()
              navigate('/login')
            }}
          >
            <LogoutIcon />
          </IconButton>
        ) : (
          <IconButton
            color="inherit"
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            onClick={() => navigate('/login')}
          >
            <LoginIcon />
          </IconButton>
        )}

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {NAV_ITEMS
            .filter((item) => item.show(userWithType))
            .map((item) => {
              const active = isActive(location.pathname, item.path)
              return (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    fontWeight: active ? 700 : 500,
                    textDecoration: active ? 'underline' : 'none',
                    textUnderlineOffset: 4,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {NAV_LABEL_OVERRIDES[item.path] || item.label}
                </Button>
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
