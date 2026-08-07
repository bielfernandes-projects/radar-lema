import { Suspense, lazy } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import Navbar from './components/Layout/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const RecoverPassword = lazy(() => import('./pages/RecoverPassword'))
const EventList = lazy(() => import('./pages/EventList'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const Favorites = lazy(() => import('./pages/Favorites'))
const PastEvents = lazy(() => import('./pages/PastEvents'))
const ManageEvents = lazy(() => import('./pages/ManageEvents'))
const EventFormPage = lazy(() => import('./pages/EventFormPage'))
const Categories = lazy(() => import('./pages/Categories'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  )
}

function Layout() {
  return (
    <Box sx={{ pb: 0 }}>
      <Navbar />
      <Box component="main" sx={{ px: 2, pt: 1.5, pb: 2 }}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  )
}

export const routes = [
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageFallback />}>
        <Login />
      </Suspense>
    )
  },
  {
    path: '/criar-conta',
    element: (
      <Suspense fallback={<PageFallback />}>
        <SignUp />
      </Suspense>
    )
  },
  {
    path: '/recuperar-senha',
    element: (
      <Suspense fallback={<PageFallback />}>
        <RecoverPassword />
      </Suspense>
    )
  },
  {
    element: <Layout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <EventList /> },
          { path: 'evento/:id', element: <EventDetail /> },
          { path: 'favoritos', element: <Favorites /> },
          { path: 'realizados', element: <PastEvents /> },
          { path: 'configuracoes', element: <Settings /> }
        ]
      },
      {
        element: <ProtectedRoute requireStaff />,
        children: [
          { path: 'gestao', element: <ManageEvents /> },
          { path: 'gestao/novo', element: <EventFormPage /> },
          { path: 'gestao/:id/editar', element: <EventFormPage /> },
          { path: 'categorias', element: <Categories /> }
        ]
      },
      {
        element: <ProtectedRoute requireAdmin />,
        children: [{ path: 'admin', element: <AdminDashboard /> }]
      },
      { path: '*', element: <Navigate to="/login" replace /> }
    ]
  }
]
