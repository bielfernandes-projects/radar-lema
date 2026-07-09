import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NAV_ITEMS } from '../../utils/constants'

const NAV_LABEL_OVERRIDES = {
  '/configuracoes': 'Configurações'
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

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {NAV_ITEMS
            .filter((item) => item.show(userWithType))
            .map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  fontWeight:
                    location.pathname === item.path ? 'bold' : 'normal'
                }}
              >
                {NAV_LABEL_OVERRIDES[item.path] || item.label}
              </Button>
            ))}

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
