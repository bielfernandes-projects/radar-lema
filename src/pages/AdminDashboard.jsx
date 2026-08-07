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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
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

export default function AdminDashboard() {
  const { profile } = useAuth()
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
  const [editBusy, setEditBusy] = useState(false)

  const [resetUser, setResetUser] = useState(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetBusy, setResetBusy] = useState(false)

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
      .select('id, email, name, user_type, role, created_at')
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
  }

  const handleEdit = async () => {
    if (!editUser) return
    setEditBusy(true)
    const ok = await runAction(
      () => adminApi.update({ user_id: editUser.id, name: editName, user_type: editType }),
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
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
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Novo usuário
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Crescimento de usuários
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={toChartData(stats.users_by_month)}>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Favoritos por mês
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={toChartData(stats.favorites_by_month)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Favoritos" fill="#9c27b0" />
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
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {user.email} • {USER_TYPE_LABELS[user.user_type]} •{' '}
                        {user.role}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <IconButton
                        onClick={() => openEdit(user)}
                        aria-label="Editar usuário"
                        disabled={isSelf(user.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => setResetUser(user)}
                        aria-label="Redefinir senha"
                      >
                        <LockResetIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => setDeleteUser(user)}
                        color="error"
                        aria-label="Excluir usuário"
                        disabled={isSelf(user.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Divider sx={{ mt: 1.5 }} />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

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
              type="password"
              fullWidth
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              helperText="Mínimo de 6 caracteres. O usuário pode alterar depois na Config."
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
            type="password"
            fullWidth
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            helperText="Mínimo de 6 caracteres."
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
