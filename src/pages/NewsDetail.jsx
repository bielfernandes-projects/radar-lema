import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { fetchNewsById } from '../services/newsData'
import { safeUrl } from '../utils/safeUrl'
import { formatHubDateTime } from '../utils/hub'
import PageSkeleton from '../components/PageSkeleton'
import Interactions from '../components/Interactions'

export default function NewsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchNewsById(id)
        setNews(data)
      } catch {
        setError('Notícia não encontrada.')
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

  if (error || !news) {
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
        {news.source && <Chip label={news.source} size="small" variant="outlined" />}
        <Chip label={formatHubDateTime(news.published_at)} size="small" variant="outlined" />
      </Stack>

      <Typography variant="h4" component="h1" gutterBottom>
        {news.title}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
        {news.description}
      </Typography>

      <Button
        variant="contained"
        size="large"
        fullWidth
        href={safeUrl(news.url) ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<ExternalLink size={20} />}
        sx={{ mb: 3 }}
      >
        Ler matéria original
      </Button>

      <Interactions contentType="news" contentId={news.id} />
    </Container>
  )
}
