import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Chip,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import { fetchUnoUpdateById } from '../services/unoUpdatesData'
import { formatHubDateTime, unoUpdateTypeLabel } from '../utils/hub'
import PageSkeleton from '../components/PageSkeleton'
import Interactions from '../components/Interactions'

export default function UnoUpdateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [update, setUpdate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchUnoUpdateById(id)
        setUpdate(data)
      } catch {
        setError('Novidade não encontrada.')
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <PageSkeleton />
      </Container>
    )
  }

  if (error || !update) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Chip label={unoUpdateTypeLabel(update.type)} size="small" color="primary" />
        <Chip label={formatHubDateTime(update.created_at)} size="small" variant="outlined" />
      </Stack>

      <Typography variant="h4" component="h1" gutterBottom>
        {update.title}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
        {update.body}
      </Typography>

      <Interactions contentType="uno_update" contentId={update.id} />
    </Container>
  )
}
