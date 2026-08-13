import { Suspense, lazy } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import Navbar from './components/Layout/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const RecoverPassword = lazy(() => import('./pages/RecoverPassword'))
const Feed = lazy(() => import('./pages/Feed'))
const EventList = lazy(() => import('./pages/EventList'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const Favorites = lazy(() => import('./pages/Favorites'))
const PastEvents = lazy(() => import('./pages/PastEvents'))
const ManageEvents = lazy(() => import('./pages/ManageEvents'))
const EventFormPage = lazy(() => import('./pages/EventFormPage'))
const Categories = lazy(() => import('./pages/Categories'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const News = lazy(() => import('./pages/News'))
const NewsDetail = lazy(() => import('./pages/NewsDetail'))
const UnoUpdates = lazy(() => import('./pages/UnoUpdates'))
const UnoUpdateDetail = lazy(() => import('./pages/UnoUpdateDetail'))
const Articles = lazy(() => import('./pages/Articles'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'))
const Materials = lazy(() => import('./pages/Materials'))
const ManageHub = lazy(() => import('./pages/ManageHub'))
const ArticleFormPage = lazy(() => import('./pages/ArticleFormPage'))
const MaterialFormPage = lazy(() => import('./pages/MaterialFormPage'))
const UnoUpdateFormPage = lazy(() => import('./pages/UnoUpdateFormPage'))
const Moderation = lazy(() => import('./pages/Moderation'))
const DashboardUno = lazy(() => import('./pages/DashboardUno'))

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
          { index: true, element: <Feed /> },
          { path: 'eventos', element: <EventList /> },
          { path: 'evento/:id', element: <EventDetail /> },
          { path: 'favoritos', element: <Favorites /> },
          { path: 'realizados', element: <PastEvents /> },
          { path: 'noticias', element: <News /> },
          { path: 'noticia/:id', element: <NewsDetail /> },
          { path: 'novidades-uno', element: <UnoUpdates /> },
          { path: 'novidade/:id', element: <UnoUpdateDetail /> },
          { path: 'artigos', element: <Articles /> },
          { path: 'artigo/:id', element: <ArticleDetail /> },
          { path: 'materiais', element: <Materials /> },
          { path: 'configuracoes', element: <Settings /> }
        ]
      },
      {
        element: <ProtectedRoute requireUnoClient />,
        children: [{ path: 'dashboard-uno', element: <DashboardUno /> }]
      },
      {
        element: <ProtectedRoute requireStaff />,
        children: [
          { path: 'gestao', element: <ManageEvents /> },
          { path: 'gestao/novo', element: <EventFormPage /> },
          { path: 'gestao/:id/editar', element: <EventFormPage /> },
          { path: 'gestao/hub', element: <ManageHub /> },
          { path: 'gestao/artigos/novo', element: <ArticleFormPage /> },
          { path: 'gestao/artigos/:id/editar', element: <ArticleFormPage /> },
          { path: 'gestao/materiais/novo', element: <MaterialFormPage /> },
          { path: 'gestao/materiais/:id/editar', element: <MaterialFormPage /> },
          { path: 'gestao/novidades-uno/novo', element: <UnoUpdateFormPage /> },
          { path: 'gestao/novidades-uno/:id/editar', element: <UnoUpdateFormPage /> },
          { path: 'moderacao', element: <Moderation /> },
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
