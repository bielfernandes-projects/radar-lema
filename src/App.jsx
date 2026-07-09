import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Toolbar } from '@mui/material'
import Navbar from './components/Layout/Navbar'
import BottomNav from './components/Layout/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import Favorites from './pages/Favorites'
import PastEvents from './pages/PastEvents'
import ManageEvents from './pages/ManageEvents'
import EventFormPage from './pages/EventFormPage'
import Categories from './pages/Categories'

function Layout() {
  return (
    <Box sx={{ pb: { xs: 7, md: 0 } }}>
      <Navbar />
      <Toolbar variant="dense" />
      <Box component="main" sx={{ p: 2 }}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<EventList />} />
            <Route path="/evento/:id" element={<EventDetail />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/realizados" element={<PastEvents />} />
          </Route>
          <Route element={<ProtectedRoute requireStaff />}>
            <Route path="/gestao" element={<ManageEvents />} />
            <Route path="/gestao/novo" element={<EventFormPage />} />
            <Route path="/gestao/:id/editar" element={<EventFormPage />} />
            <Route path="/categorias" element={<Categories />} />
          </Route>
        </Routes>
      </Box>
      <BottomNav />
    </Box>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Layout />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
