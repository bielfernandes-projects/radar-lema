import { Outlet, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import Navbar from './components/Layout/Navbar'
import BottomNav from './components/Layout/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import Favorites from './pages/Favorites'
import PastEvents from './pages/PastEvents'
import ManageEvents from './pages/ManageEvents'
import EventFormPage from './pages/EventFormPage'
import Categories from './pages/Categories'
import Settings from './pages/Settings'

function Layout() {
  return (
    <Box sx={{ pb: { xs: 7, md: 0 } }}>
      <Navbar />
      <Box component="main" sx={{ px: 2, pt: 1.5, pb: 2 }}>
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  )
}

export const routes = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/criar-conta',
    element: <SignUp />
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
      { path: '*', element: <Navigate to="/login" replace /> }
    ]
  }
]
