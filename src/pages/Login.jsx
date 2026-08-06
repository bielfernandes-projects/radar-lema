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
import InstallAppButton from '../components/InstallAppButton'

export default function Login() {
  const navigate = useNavigate()
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    setSubmitting(true)

    const { error: signInError } = await signIn(email, password)

    setSubmitting(false)

    if (signInError) {
      setError(translateError(signInError.message))
    } else {
      navigate('/')
    }
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
              Descubra o seu proximo evento para RPPS
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="E-mail"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <TextField
              label="Senha"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />

            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ display: 'block', mt: 1 }}
            >
              Ambientes de teste interno utilizam o cadastro abaixo.
            </Typography>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Entrar'}
            </Button>

            <Button
              component={Link}
              to="/criar-conta"
              variant="outlined"
              fullWidth
              size="large"
              sx={{ mt: 1 }}
            >
              Criar Conta
            </Button>

            <InstallAppButton />
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  )
}

function translateError(message) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (lower.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado.'
  }
  if (lower.includes('too many requests')) {
    return 'Muitas tentativas. Tente novamente mais tarde.'
  }
  return 'Erro ao entrar. Tente novamente.'
}
