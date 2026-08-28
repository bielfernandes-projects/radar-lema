import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import createAppTheme from '../theme/theme'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useColorMode } from '../contexts/ColorModeContext'
import InstallAppIcon from '../components/InstallAppIcon'
import PasswordToggle from '../components/PasswordToggle'

export default function Login() {
  const navigate = useNavigate()
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotError, setForgotError] = useState('')

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
    setSubmitting(true)

    const { error: signInError } = await signIn(email, password)

    setSubmitting(false)

    if (signInError) {
      setError(translateError(signInError.message))
    } else {
      navigate('/')
    }
  }

  const openForgotDialog = () => {
    setForgotEmail(email)
    setForgotMessage('')
    setForgotError('')
    setForgotOpen(true)
  }

  const handleForgotSubmit = async (event) => {
    event.preventDefault()
    setForgotSending(true)
    setForgotMessage('')
    setForgotError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim(),
      { redirectTo: `${window.location.origin}/recuperar-senha` }
    )

    setForgotSending(false)

    if (resetError) {
      setForgotError('Erro ao enviar o e-mail. Tente novamente.')
    } else {
      setForgotMessage('Enviamos um link de recuperação para o seu e-mail.')
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          p: 2
        }}
      >
        <Paper
          elevation={2}
          sx={{ p: 4, position: 'relative', width: '100%', maxWidth: 480 }}
        >
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <InstallAppIcon pulse />
          </Box>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img
              src="/logo.png"
              alt="Radar Lema"
              style={{ width: 160, height: 'auto', display: 'block', margin: '0 auto' }}
            />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Inteligência e conteúdo exclusivo para RPPS
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
            />

            <TextField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showPassword}
                    onToggle={() => setShowPassword((prev) => !prev)}
                  />
                )
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Button size="small" onClick={openForgotDialog} sx={{ textTransform: 'none' }}>
                Esqueci minha senha
              </Button>
            </Box>

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
          </Box>

          <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle>Recuperar senha</DialogTitle>
            <Box component="form" onSubmit={handleForgotSubmit} noValidate>
              <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                  Informe o e-mail cadastrado e enviaremos um link para redefinir sua
                  senha.
                </DialogContentText>
                {forgotError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {forgotError}
                  </Alert>
                )}
                {forgotMessage && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {forgotMessage}
                  </Alert>
                )}
                <TextField
                  label="E-mail"
                  type="email"
                  fullWidth
                  autoFocus
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  required
                  autoComplete="email"
                  disabled={Boolean(forgotMessage)}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button onClick={() => setForgotOpen(false)} disabled={forgotSending}>
                  Fechar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={forgotSending || Boolean(forgotMessage)}
                >
                  {forgotSending ? <CircularProgress size={20} /> : 'Enviar link'}
                </Button>
              </DialogActions>
            </Box>
          </Dialog>
        </Paper>
      </Box>
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
