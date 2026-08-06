import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import createAppTheme from '../theme/theme'
import { useAuth } from '../contexts/AuthContext'

export default function SignUp() {
  const navigate = useNavigate()
  const { user, loading, signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  const lightTheme = useMemo(() => createAppTheme('light'), [])

  useEffect(() => {
    if (!loading && user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  if (loading) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)

    const { error: signUpError } = await signUp({ email, password, name })

    setSubmitting(false)

    if (signUpError) {
      setError(translateError(signUpError.message))
      return
    }

    if (!user) {
      setPendingConfirmation(true)
    } else {
      navigate('/')
    }
  }

  if (pendingConfirmation) {
    return (
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <img
              src="/logo.png"
              alt="Radar Lema"
              style={{ width: 160, height: 'auto', display: 'block', margin: '0 auto' }}
            />
            <Typography variant="h6" sx={{ mt: 3 }}>
              Verifique seu e-mail
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enviamos um link de confirmação para {email}. Clique no link para
              ativar sua conta e depois faça login.
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              Ir para o login
            </Button>
          </Paper>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img
              src="/logo.png"
              alt="Radar Lema"
              style={{ width: 160, height: 'auto', display: 'block', margin: '0 auto' }}
            />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Crie sua conta para acompanhar os eventos para RPPS
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Nome"
              fullWidth
              margin="normal"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              autoFocus
            />

            <TextField
              label="E-mail"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />

            <TextField
              label="Senha"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              helperText="Mínimo de 6 caracteres"
            />

            <TextField
              label="Confirmar senha"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Criar Conta'}
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 2 }}
            >
              Já tem conta?{' '}
              <Button component={Link} to="/login" size="small" sx={{ textTransform: 'none' }}>
                Entrar
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  )
}

function translateError(message) {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Este e-mail já está cadastrado. Tente fazer login.'
  }
  if (lower.includes('password')) {
    return 'A senha deve ter no mínimo 6 caracteres.'
  }
  if (lower.includes('too many requests')) {
    return 'Muitas tentativas. Tente novamente mais tarde.'
  }
  return 'Erro ao criar conta. Tente novamente.'
}
