import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
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
import { NAV_ITEMS } from '../../utils/constants'

const ICONS = {
  CalendarDays: <CalendarDays size={24} />,
  Heart: <Heart size={24} />,
  History: <History size={24} />,
  Bell: <Bell size={24} />,
  Settings: <Settings size={24} />,
  FolderTree: <FolderTree size={24} />,
  UserCog: <UserCog size={24} />,
  ShieldCheck: <ShieldCheck size={24} />
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
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
            borderRadius: '10px',
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              lineHeight: 1.2,
              whiteSpace: 'normal'
            }
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: 'primary.main',
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 800
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
            sx={
              item.group === 'admin'
                ? {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    borderTop: '2px solid',
                    borderTopColor: 'primary.main'
                  }
                : undefined
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
