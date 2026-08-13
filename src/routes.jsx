import { Suspense, lazy } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

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

import Layout from './components/Layout/Layout'

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  )
}

function PageRoute({ Component }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  )
}

function LayoutRoute() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  )
}

export const routes = [
  {
    path: '/login',
    element: <PageRoute Component={Login} />
  },
  {
    path: '/criar-conta',
    element: <PageRoute Component={SignUp} />
  },
  {
    path: '/recuperar-senha',
    element: <PageRoute Component={RecoverPassword} />
  },
  {
    path: '/',
    element: <LayoutRoute />,
    children: [
      { index: true, element: <PageRoute Component={Feed} /> },
      { path: 'eventos', element: <PageRoute Component={EventList} /> },
      { path: 'evento/:id', element: <PageRoute Component={EventDetail} /> },
      { path: 'favoritos', element: <PageRoute Component={Favorites} /> },
      { path: 'realizados', element: <PageRoute Component={PastEvents} /> },
      { path: 'noticias', element: <PageRoute Component={News} /> },
      { path: 'noticia/:id', element: <PageRoute Component={NewsDetail} /> },
      { path: 'novidades-uno', element: <PageRoute Component={UnoUpdates} /> },
      { path: 'novidade/:id', element: <PageRoute Component={UnoUpdateDetail} /> },
      { path: 'artigos', element: <PageRoute Component={Articles} /> },
      { path: 'artigo/:id', element: <PageRoute Component={ArticleDetail} /> },
      { path: 'materiais', element: <PageRoute Component={Materials} /> },
      { path: 'configuracoes', element: <PageRoute Component={Settings} /> },
      { path: 'gestao', element: <PageRoute Component={ManageEvents} /> },
      { path: 'gestao/novo', element: <PageRoute Component={EventFormPage} /> },
      { path: 'gestao/:id/editar', element: <PageRoute Component={EventFormPage} /> },
      { path: 'gestao/hub', element: <PageRoute Component={ManageHub} /> },
      { path: 'gestao/artigos/novo', element: <PageRoute Component={ArticleFormPage} /> },
      { path: 'gestao/artigos/:id/editar', element: <PageRoute Component={ArticleFormPage} /> },
      { path: 'gestao/materiais/novo', element: <PageRoute Component={MaterialFormPage} /> },
      { path: 'gestao/materiais/:id/editar', element: <PageRoute Component={MaterialFormPage} /> },
      { path: 'gestao/novidades-uno/novo', element: <PageRoute Component={UnoUpdateFormPage} /> },
      { path: 'gestao/novidades-uno/:id/editar', element: <PageRoute Component={UnoUpdateFormPage} /> },
      { path: 'moderacao', element: <PageRoute Component={Moderation} /> },
      { path: 'categorias', element: <PageRoute Component={Categories} /> },
      { path: 'dashboard-uno', element: <PageRoute Component={DashboardUno} /> },
      { path: 'admin', element: <PageRoute Component={AdminDashboard} /> }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]