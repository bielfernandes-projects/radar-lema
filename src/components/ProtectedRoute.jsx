import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isStaffTier, isSuperAdmin, isUnoClient } from '../utils/auth'
import { Box, CircularProgress } from '@mui/material'

export default function ProtectedRoute({ requireStaff, requireAdmin, requireUnoClient }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireStaff && !isStaffTier(profile)) {
    return <Navigate to="/" replace />
  }

  if (requireAdmin && !isSuperAdmin(profile)) {
    return <Navigate to="/" replace />
  }

  if (requireUnoClient && !isUnoClient(profile)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
