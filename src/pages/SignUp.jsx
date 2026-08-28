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
import { useColorMode } from '../contexts/ColorModeContext'
import { validatePassword } from '../utils/auth'
import PasswordToggle from '../components/PasswordToggle'

export default function SignUp() {
  const navigate = useNavigate()
  const { user, loading, signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  const { mode } = useColorMode()
  const theme = useMemo(() => createAppTheme(mode), [mode])

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

    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
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
      <ThemeProvider theme={theme}>
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
    <ThemeProvider theme={theme}>
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
              Crie sua conta para acessar conteúdo exclusivo para RPPS
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
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              helperText="Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo"
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showPassword}
                    onToggle={() => setShowPassword((prev) => !prev)}
                  />
                )
              }}
            />

            <TextField
              label="Confirmar senha"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  />
                )
              }}
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
    return 'A senha não atende aos requisitos de segurança.'
  }
  if (lower.includes('too many requests')) {
    return 'Muitas tentativas. Tente novamente mais tarde.'
  }
  return 'Erro ao criar conta. Tente novamente.'
}
