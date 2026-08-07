import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import { supabase } from '../lib/supabase'
import PasswordToggle from '../components/PasswordToggle'

export default function RecoverPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const recover = async () => {
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError('Link inválido ou expirado. Solicite uma nova recuperação.')
          setReady(false)
          setProcessing(false)
          return
        }
      }
      setProcessing(false)
      setReady(true)
    }

    recover()
  }, [searchParams])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Erro ao redefinir a senha. Tente novamente.')
      return
    }

    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper elevation={2} sx={{ p: 4, width: '100%', maxWidth: 440 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          Redefinir senha
        </Typography>

        {processing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : ready ? (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Nova senha"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              autoFocus
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showPassword}
                    onToggle={() => setShowPassword((prev) => !prev)}
                  />
                )
              }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3 }}>
              Salvar nova senha
            </Button>
          </Box>
        ) : (
          <Alert severity="error">{error}</Alert>
        )}
      </Paper>
    </Box>
  )
}
