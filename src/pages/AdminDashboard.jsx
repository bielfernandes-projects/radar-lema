import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip as MuiTooltip,
  Typography
} from '@mui/material'
import { Trash2, Pencil, KeyRound, UserPlus, ExternalLink } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { adminApi, USER_TYPES, ROLE_BY_USER_TYPE } from '../services/adminApi'
import { fetchUnoClients } from '../services/unoClientsData'
import PasswordToggle from '../components/PasswordToggle'
import PageSkeleton from '../components/PageSkeleton'

const emptyStats = {
  total_users: 0,
  total_events: 0,
  total_favorites: 0,
  users_by_month: [],
  favorites_by_month: []
}

const USER_TYPE_LABELS = {
  client: 'Cliente',
  staff: 'Staff',
  super_admin: 'Super Admin'
}

const toChartData = (rows) =>
  (rows || []).map(({ month, count }) => ({
    month: month ? month.split('-').reverse().join('/') : month,
    count
  }))

const POSTHOG_INTEGRATIONS_URL =
  'https://vercel.com/bielfernandes-projects-projects/~/integrations'

function ObservabilityPanel() {
  const trackingAtivo = Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN)

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">Observabilidade</Typography>
            <Chip
              label={trackingAtivo ? 'Rastreamento ativo' : 'Rastreamento inativo'}
              color={trackingAtivo ? 'success' : 'default'}
              size="small"
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            O Radar Lema envia eventos de uso (cliques, áreas de mais interação,
            tempo de permanência, navegação entre páginas) para o PostHog via
            integração nativa da Vercel. Os dashboards, heatmaps e funis reais
            ficam no próprio PostHog — abra pelo link abaixo para explorar as
            métricas.
          </Typography>
          <Box>
            <Button
              variant="contained"
              endIcon={<ExternalLink size={18} />}
              component="a"
              href={POSTHOG_INTEGRATIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir métricas no PostHog
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(emptyStats)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'client'
  })
  const [createBusy, setCreateBusy] = useState(false)

  const [editUser, setEditUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('client')
  const [editIsUnoClient, setEditIsUnoClient] = useState(false)
  const [editUnoClientId, setEditUnoClientId] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [unoClients, setUnoClients] = useState([])

  const [resetUser, setResetUser] = useState(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const [deleteUser, setDeleteUser] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const isSelf = (userId) => profile?.id === userId

  const loadAll = async () => {
    setLoading(true)
    setError('')

    const { data: statsData, error: statsError } = await supabase.rpc(
      'admin_dashboard_stats'
    )
    if (statsError) {
      setError('Erro ao carregar estatísticas.')
    } else {
      setStats(statsData || emptyStats)
    }

    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, name, user_type, role, is_uno_client, uno_client_id, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      setError('Erro ao carregar usuários.')
    } else {
      setUsers(usersData || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    fetchUnoClients().then(setUnoClients).catch(() => {})
  }, [])

  const runAction = async (fn, okMessage) => {
    setNotice('')
    try {
      await fn()
      if (okMessage) setNotice(okMessage)
      await loadAll()
      return true
    } catch (err) {
      setError(err?.message || 'Erro ao executar a operação.')
      return false
    }
  }

  const handleCreate = async () => {
    if (
      !createForm.name.trim() ||
      !createForm.email.trim() ||
      !createForm.password
    ) {
      setError('Preencha nome, e-mail e senha.')
      return
    }
    setCreateBusy(true)
    const ok = await runAction(
      () => adminApi.create(createForm),
      'Usuário criado com sucesso.'
    )
    setCreateBusy(false)
    if (ok) {
      setCreateOpen(false)
      setCreateForm({ name: '', email: '', password: '', user_type: 'client' })
    }
  }

  const openEdit = (user) => {
    setEditUser(user)
    setEditName(user.name || '')
    setEditType(user.user_type)
    setEditIsUnoClient(user.is_uno_client === true)
    setEditUnoClientId(user.uno_client_id || '')
  }

  const handleEdit = async () => {
    if (!editUser) return
    setEditBusy(true)
    const ok = await runAction(
      () => adminApi.update({
        user_id: editUser.id,
        name: editName,
        user_type: editType,
        is_uno_client: editIsUnoClient,
        uno_client_id: editIsUnoClient ? (editUnoClientId || null) : null
      }),
      'Usuário atualizado.'
    )
    setEditBusy(false)
    if (ok) setEditUser(null)
  }

  const handleReset = async () => {
    if (!resetUser || !resetPassword) return
    setResetBusy(true)
    const ok = await runAction(
      () => adminApi.resetPassword({ user_id: resetUser.id, password: resetPassword }),
      'Senha redefinida.'
    )
    setResetBusy(false)
    if (ok) {
      setResetUser(null)
      setResetPassword('')
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleteBusy(true)
    const ok = await runAction(
      () => adminApi.remove({ user_id: deleteUser.id }),
      'Usuário excluído.'
    )
    setDeleteBusy(false)
    if (ok) setDeleteUser(null)
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <PageSkeleton lines={8} />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">
          Painel Admin
        </Typography>
        {tab === 'overview' && (
          <Button
            variant="contained"
            startIcon={<UserPlus size={20} />}
            onClick={() => setCreateOpen(true)}
          >
            Novo usuário
          </Button>
        )}
      </Stack>

      <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Visão geral" value="overview" />
        <Tab label="Observabilidade" value="observability" />
      </Tabs>

      {tab === 'overview' && error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
          action={
            <Button size="small" color="inherit" onClick={loadAll}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {tab === 'overview' && (
      <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Usuários', value: stats.total_users },
          { label: 'Eventos', value: stats.total_events },
          { label: 'Favoritos', value: stats.total_favorites }
        ].map(({ label, value }) => (
          <Grid size={{ xs: 12, sm: 4 }} key={label}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de {label.toLowerCase()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Crescimento de usuários
              </Typography>
              <Box sx={{ position: 'relative', width: '100%', height: 260, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={toChartData(stats.users_by_month)}
                    margin={{ top: 5, right: 65, bottom: 5, left: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Usuários" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Favoritos por mês
              </Typography>
              <Box sx={{ position: 'relative', width: '100%', height: 260, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={toChartData(stats.favorites_by_month)}
                    margin={{ top: 5, right: 65, bottom: 5, left: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Favoritos" fill="#e0436f" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usuários cadastrados
          </Typography>

          {users.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum usuário cadastrado.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {users.map((user) => (
                <Box key={user.id}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1">
                          {user.name || user.email}
                        </Typography>
                        {isSelf(user.id) && (
                          <Chip label="Você" size="small" color="primary" />
                        )}
                        {user.is_uno_client === true && (
                          <Chip label="Cliente Lema" size="small" color="secondary" />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {user.email} • {USER_TYPE_LABELS[user.user_type]} •{' '}
                        {user.role}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <MuiTooltip title="Editar usuário">
                        <IconButton
                          onClick={() => openEdit(user)}
                          aria-label="Editar usuário"
                          disabled={isSelf(user.id)}
                        >
                          <Pencil size={20} />
                        </IconButton>
                      </MuiTooltip>
                      <MuiTooltip title="Redefinir senha do usuário">
                        <IconButton
                          onClick={() => setResetUser(user)}
                          aria-label="Redefinir senha"
                        >
                          <KeyRound size={20} />
                        </IconButton>
                      </MuiTooltip>
                      <MuiTooltip title="Excluir usuário">
                        <IconButton
                          onClick={() => setDeleteUser(user)}
                          color="error"
                          aria-label="Excluir usuário"
                          disabled={isSelf(user.id)}
                        >
                          <Trash2 size={20} />
                        </IconButton>
                      </MuiTooltip>
                    </Stack>
                  </Stack>
                  <Divider sx={{ mt: 1.5 }} />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {tab === 'observability' && <ObservabilityPanel />}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar usuário</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
            <TextField
              label="Senha"
              type={showCreatePassword ? 'text' : 'password'}
              fullWidth
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              helperText="Mínimo de 6 caracteres. O usuário pode alterar depois na Config."
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showCreatePassword}
                    onToggle={() => setShowCreatePassword((prev) => !prev)}
                  />
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="create-user-type-label">Tipo de usuário</InputLabel>
              <Select
                labelId="create-user-type-label"
                label="Tipo de usuário"
                value={createForm.user_type}
                onChange={(e) =>
                  setCreateForm({ ...createForm, user_type: e.target.value })
                }
              >
                {USER_TYPES.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Role: {ROLE_BY_USER_TYPE[createForm.user_type]}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={createBusy}>
            {createBusy ? <CircularProgress size={20} /> : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar usuário</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-user-type-label">Tipo de usuário</InputLabel>
              <Select
                labelId="edit-user-type-label"
                label="Tipo de usuário"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
              >
                {USER_TYPES.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Role: {ROLE_BY_USER_TYPE[editType]}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={editIsUnoClient}
                  onChange={(e) => setEditIsUnoClient(e.target.checked)}
                />
              }
              label="Cliente Lema (acesso exclusivo)"
            />
            <Typography variant="caption" color="text.secondary">
              Libera artigos/materiais exclusivos e o Dashboard UNO para esta conta.
            </Typography>
            {editIsUnoClient && (
              <FormControl fullWidth>
                <InputLabel id="edit-uno-client-label">Cliente UNO vinculado</InputLabel>
                <Select
                  labelId="edit-uno-client-label"
                  label="Cliente UNO vinculado"
                  value={editUnoClientId}
                  onChange={(e) => setEditUnoClientId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Nenhum (Dashboard UNO fica bloqueado)</em>
                  </MenuItem>
                  {unoClients.map((c) => (
                    <MenuItem key={c.uno_client_id} value={c.uno_client_id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancelar</Button>
          <Button onClick={handleEdit} variant="contained" disabled={editBusy}>
            {editBusy ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!resetUser} onClose={() => setResetUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Redefinir senha</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Defina a nova senha para {resetUser?.email}. O usuário pode alterá-la
            depois na Configurações.
          </DialogContentText>
          <TextField
            label="Nova senha"
            type={showResetPassword ? 'text' : 'password'}
            fullWidth
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            helperText="Mínimo de 6 caracteres."
            InputProps={{
              endAdornment: (
                <PasswordToggle
                  show={showResetPassword}
                  onToggle={() => setShowResetPassword((prev) => !prev)}
                />
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetUser(null)}>Cancelar</Button>
          <Button onClick={handleReset} variant="contained" disabled={resetBusy || !resetPassword}>
            {resetBusy ? <CircularProgress size={20} /> : 'Redefinir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)}>
        <DialogTitle>Excluir usuário</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir {deleteUser?.name || deleteUser?.email}?
            O usuário perderá o acesso e não poderá mais entrar. Esta ação não
            pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUser(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteBusy}>
            {deleteBusy ? <CircularProgress size={20} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!notice}
        autoHideDuration={3000}
        onClose={() => setNotice('')}
        message={notice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  )
}
