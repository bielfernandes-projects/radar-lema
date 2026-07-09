import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import {
  CalendarMonth,
  Favorite,
  History,
  Settings,
  Category
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, user_type } = useAuth()

  const isStaff = user_type === 'staff'

  const items = [
    { label: 'Eventos', path: '/', icon: <CalendarMonth />, show: true },
    {
      label: 'Favoritos',
      path: '/favoritos',
      icon: <Favorite />,
      show: !!user
    },
    { label: 'Realizados', path: '/realizados', icon: <History />, show: true },
    {
      label: 'Gestão',
      path: '/gestao',
      icon: <Settings />,
      show: isStaff
    },
    {
      label: 'Categorias',
      path: '/categorias',
      icon: <Category />,
      show: isStaff
    }
  ]

  const visibleItems = items.filter((item) => item.show)

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' }
      }}
      elevation={3}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(event, newValue) => {
          navigate(newValue)
        }}
        showLabels
      >
        {visibleItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            value={item.path}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
