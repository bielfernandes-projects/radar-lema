import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { fetchArticleById } from '../services/articlesData'
import { safeUrl } from '../utils/safeUrl'
import { formatHubDateTime } from '../utils/hub'
import Markdown from '../components/Markdown'
import PageSkeleton from '../components/PageSkeleton'
import ExclusiveBadge from '../components/ExclusiveBadge'
import Interactions from '../components/Interactions'

/** Mesma arte de reserva usada pelo ArticleCard. */
const FALLBACK_COVER = '/placeholder-article.png?v=1'

export default function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchArticleById(id)
        setArticle(data)
      } catch {
        setError('Artigo não encontrado.')
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

  if (error || !article) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  const coverSrc =
    (!imgFailed && article.cover_url && (safeUrl(article.cover_url) ?? article.cover_url)) ||
    FALLBACK_COVER

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Mesma regra do card: artigo sempre com imagem real. Sem capa propria
          (ou com capa que falhou), entra a arte padrao da Lema. */}
      <Paper elevation={2} sx={{ overflow: 'hidden', mb: 2, bgcolor: 'grey.200' }}>
        <Box
          component="img"
          src={coverSrc}
          alt={article.title}
          onError={() => setImgFailed(true)}
          sx={{ width: '100%', height: { xs: 220, md: 320 }, objectFit: 'cover', display: 'block' }}
        />
      </Paper>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        {article.visibility === 'lema_client' && <ExclusiveBadge />}
        <Chip label={formatHubDateTime(article.created_at)} size="small" variant="outlined" />
        {article.author && <Chip label={`Por ${article.author}`} size="small" variant="outlined" />}
      </Stack>

      <Typography variant="h4" component="h1" gutterBottom>
        {article.title}
      </Typography>

      {article.subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {article.subtitle}
        </Typography>
      )}

      <Markdown content={article.body} />

      {article.source_url && (
        <Stack sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderTopColor: 'divider' }}>
          {article.origin === 'blog' ? (
            <Button
              variant="contained"
              endIcon={<ExternalLink size={16} />}
              href={safeUrl(article.source_url) ?? article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ alignSelf: 'flex-start' }}
            >
              Ler no site da Lema
            </Button>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Publicado originalmente em{' '}
              <a
                href={safeUrl(article.source_url) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                {new URL(article.source_url).hostname.replace('www.', '')}
              </a>
            </Typography>
          )}
        </Stack>
      )}

      <Interactions contentType="article" contentId={article.id} />
    </Container>
  )
}
