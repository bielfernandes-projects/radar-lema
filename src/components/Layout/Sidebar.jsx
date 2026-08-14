import { useState } from 'react'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  useTheme
} from '@mui/material'
import {
  Home,
  Newspaper,
  BookOpen,
  Megaphone,
  FileStack,
  CalendarDays,
  Heart,
  History,
  Settings,
  FolderTree,
  UserCog,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  LogOut,
  LineChart,
  Lock
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isStaffTier, isSuperAdmin, isUnoClient } from '../../utils/auth'
import LockedClientModal from '../LockedClientModal'

const ICONS = {
  Home,
  Newspaper,
  BookOpen,
  Megaphone,
  FileStack,
  CalendarDays,
  Heart,
  History,
  Settings,
  FolderTree,
  UserCog,
  ShieldAlert,
  ShieldCheck,
  LineChart
}

const navStructure = [
  {
    group: 'main',
    label: 'Principal',
    items: [
      { key: 'home', label: 'Início', path: '/', icon: 'Home' },
      { key: 'news', label: 'Notícias', path: '/noticias', icon: 'Newspaper' },
      { key: 'articles', label: 'Artigos', path: '/artigos', icon: 'BookOpen' },
      { key: 'unoUpdates', label: 'Novidades UNO', path: '/novidades-uno', icon: 'Megaphone' },
      { key: 'materials', label: 'Materiais de Apoio', path: '/materiais', icon: 'FileStack' },
      {
        key: 'dashboardUno',
        label: 'Dashboard UNO',
        path: '/dashboard-uno',
        icon: 'LineChart',
        unoClientOnly: true
      },
      {
        key: 'events',
        label: 'Eventos',
        icon: 'CalendarDays',
        children: [
          { key: 'eventsList', label: 'Todos os Eventos', path: '/eventos' },
          { key: 'favorites', label: 'Favoritos', path: '/favoritos' },
          { key: 'past', label: 'Realizados', path: '/realizados' }
        ]
      },
      { key: 'settings', label: 'Configurações', path: '/configuracoes', icon: 'Settings', auth: true }
    ]
  },
  {
    group: 'staff',
    label: 'Gestão',
    items: [
      { key: 'hub', label: 'Hub', path: '/gestao/hub', icon: 'FolderTree' },
      {
        key: 'eventsMgmt',
        label: 'Eventos',
        icon: 'CalendarDays',
        children: [
          { key: 'eventsListMgmt', label: 'Gerenciar Eventos', path: '/gestao' },
          { key: 'categories', label: 'Categorias', path: '/categorias' }
        ]
      },
      { key: 'moderation', label: 'Moderação', path: '/moderacao', icon: 'ShieldAlert' }
    ],
    show: (profile) => isStaffTier(profile)
  },
  {
    group: 'admin',
    label: 'Administração',
    items: [
      { key: 'admin', label: 'Painel Admin', path: '/admin', icon: 'ShieldCheck' }
    ],
    show: (profile) => isSuperAdmin(profile)
  }
]

const isActive = (pathname, itemPath) => {
  if (itemPath === '/') return pathname === '/'
  return pathname.startsWith(itemPath)
}

export default function Sidebar({ open, onClose, variant = 'permanent', width = 280 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const theme = useTheme()
  const [expandedGroups, setExpandedGroups] = useState({ events: true, eventsMgmt: true })
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const visibleSections = navStructure.filter(section => !section.show || section.show(profile))

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  const handleNavClick = (path) => {
    navigate(path)
    if (variant === 'temporary') onClose()
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
    if (variant === 'temporary') onClose()
  }

  const content = (
    <Box
      sx={{
        width,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderRight: 1,
        borderColor: 'divider',
        transition: theme.transitions.create(['opacity']),
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: 64,
          borderBottom: 1,
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <img src="/favicon-32x32.png" alt="" style={{ width: 32, height: 32, flexShrink: 0 }} />
          <Typography variant="h6" component="div" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Radar Lema
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {visibleSections.map((section, sectionIndex) => (
          <Box key={section.group} sx={{ mb: 2 }}>
            {(section.group === 'staff' || section.group === 'admin' || section.group === 'logout') && sectionIndex > 0 && (
              <Divider sx={{ my: 1.5 }} />
            )}

            {(section.group !== 'logout') && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  px: 2,
                  mb: 0.5,
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {section.label}
              </Typography>
            )}

            <List disablePadding dense sx={{ px: 0.5 }}>
              {section.items.map((item) => {
                const IconComponent = ICONS[item.icon]
                const active = item.path ? isActive(location.pathname, item.path) : false
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedGroups[item.key]

                if (item.unoClientOnly) {
                  const locked = !isUnoClient(profile)
                  return (
                    <ListItemButton
                      key={item.key}
                      selected={active}
                      aria-disabled={locked}
                      onClick={() => (locked ? setClientModalOpen(true) : handleNavClick(item.path))}
                      sx={{
                        borderRadius: 1,
                        px: 1.5,
                        py: 0.75,
                        opacity: locked ? 0.55 : 1,
                        backgroundColor: active ? 'action.selected' : 'transparent',
                        '&:hover': { backgroundColor: active ? 'action.selected' : 'action.hover' }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: locked ? 'text.disabled' : active ? 'primary.main' : 'text.secondary',
                          display: 'flex',
                          justifyContent: 'center'
                        }}
                      >
                        <IconComponent size={20} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: active ? 700 : 500,
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      />
                      {locked && (
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
                          <Lock size={16} />
                        </Box>
                      )}
                    </ListItemButton>
                  )
                }

                if (hasChildren) {
                  return (
                    <Box key={item.key}>
                      <ListItemButton
                        onClick={() => toggleGroup(item.key)}
                        sx={{
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.75,
                          backgroundColor: active ? 'action.selected' : 'transparent',
                          '&:hover': { backgroundColor: active ? 'action.selected' : 'action.hover' }
                        }}
                        aria-expanded={isExpanded}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: active ? 'primary.main' : 'text.secondary',
                            display: 'flex',
                            justifyContent: 'center'
                          }}
                        >
                          <IconComponent size={20} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        />
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                          <ChevronDown
                            size={18}
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              color: 'text.secondary'
                            }}
                          />
                        </Box>
                      </ListItemButton>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ ml: 3.5, mb: 0.5 }}>
                          {item.children.map((child) => (
                            <ListItemButton
                              key={child.key}
                              selected={isActive(location.pathname, child.path)}
                              onClick={() => handleNavClick(child.path)}
                              sx={{
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.5,
                                backgroundColor: isActive(location.pathname, child.path) ? 'action.selected' : 'transparent',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary', mt: 0 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={child.label}
                                primaryTypographyProps={{
                                  fontSize: '0.8125rem',
                                  fontWeight: isActive(location.pathname, child.path) ? 600 : 400
                                }}
                              />
                            </ListItemButton>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  )
                }

                if (item.action === 'logout') {
                  return null
                }

                return (
                  <ListItemButton
                    key={item.key}
                    selected={active}
                    onClick={() => handleNavClick(item.path)}
                    sx={{
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.75,
                      backgroundColor: active ? 'action.selected' : 'transparent',
                      '&:hover': { backgroundColor: active ? 'action.selected' : 'action.hover' }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: active ? 'primary.main' : 'text.secondary',
                        display: 'flex',
                        justifyContent: 'center'
                      }}
                    >
                      <IconComponent size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 700 : 500,
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      {user && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', mt: 'auto' }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
              color: 'error.main',
              '&:hover': { backgroundColor: 'error.light', color: 'white' },
              '& .MuiListItemIcon-root': { color: 'inherit' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, display: 'flex', justifyContent: 'center' }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText
              primary="Sair"
              primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
            />
          </ListItemButton>
        </Box>
      )}

      <LockedClientModal open={clientModalOpen} onClose={() => setClientModalOpen(false)} />
    </Box>
  )

  if (variant === 'temporary') {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width,
            boxSizing: 'border-box',
            height: '100vh'
          }
        }}
      >
        {content}
      </Drawer>
    )
  }

  return (
    <Box
      sx={{
        width,
        flexShrink: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: theme.zIndex.drawer,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}
    >
      {content}
    </Box>
  )
}
