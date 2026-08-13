import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Container,
  Grid,
  Skeleton,
  Typography
} from '@mui/material'
import { Megaphone } from 'lucide-react'
import { fetchUnoUpdates } from '../services/unoUpdatesData'
import UnoUpdateCard from '../components/UnoUpdateCard'
import EmptyState from '../components/EmptyState'

export default function UnoUpdates() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchUnoUpdates()
        setUpdates(data)
      } catch {
        setError('Erro ao carregar as novidades do UNO. Tente novamente.')
      }
      setLoading(false)
    }
    fetchData()
  }, [reload])

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Novidades do UNO
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Atualizações, manutenções e avisos do sistema UNO.
      </Typography>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6 }} key={i}>
              <Skeleton variant="rounded" height={180} />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button size="small" color="inherit" onClick={() => setReload((r) => r + 1)}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      ) : updates.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma novidade publicada"
          message="Avisos do sistema UNO — atualizações, manutenção programada, bugs e instabilidades — aparecem aqui."
        />
      ) : (
        <Grid container spacing={3}>
          {updates.map((update) => (
            <Grid size={{ xs: 12, sm: 6 }} key={update.id}>
              <UnoUpdateCard update={update} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
