import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import {
  CalendarMonth,
  Favorite,
  History,
  Notifications,
  Settings,
  Category,
  ManageAccounts,
  AdminPanelSettings
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NAV_ITEMS } from '../../utils/constants'

const ICONS = {
  CalendarMonth: <CalendarMonth />,
  Favorite: <Favorite />,
  History: <History />,
  Notifications: <Notifications />,
  Settings: <Settings />,
  Category: <Category />,
  ManageAccounts: <ManageAccounts />,
  AdminPanelSettings: <AdminPanelSettings />
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()

  const userWithType = user
    ? { ...user, user_type: profile?.user_type, role: profile?.role }
    : null
  const visibleItems = NAV_ITEMS
    .filter((item) => item.show(userWithType))
    .map((item) => ({ ...item, icon: ICONS[item.icon] }))

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
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            px: { xs: 0.5, sm: 1 },
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }
        }}
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
