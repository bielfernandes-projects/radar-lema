import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, user_type, signOut } = useAuth()

  const isStaff = user_type === 'staff'

  const navItems = [
    { label: 'Eventos', path: '/', show: true },
    { label: 'Favoritos', path: '/favoritos', show: !!user },
    { label: 'Realizados', path: '/realizados', show: true },
    { label: 'Gestão', path: '/gestao', show: isStaff },
    { label: 'Categorias', path: '/categorias', show: isStaff }
  ]

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
          {navItems
            .filter((item) => item.show)
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
                {item.label}
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
