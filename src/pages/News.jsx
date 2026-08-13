import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
import { Newspaper } from 'lucide-react'
import { fetchNews } from '../services/newsData'
import NewsCard from '../components/NewsCard'
import EmptyState from '../components/EmptyState'

export default function News() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchNews()
        setNews(data)
      } catch {
        setError('Erro ao carregar notícias de mercado. Tente novamente.')
      }
      setLoading(false)
    }
    fetchData()
  }, [reload])

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notícias de Mercado
        </Typography>
      </Stack>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={280} />
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
      ) : news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Nenhuma notícia ainda"
          message="As notícias de mercado sobre RPPS e investimentos aparecem aqui automaticamente, atualizadas ao longo do dia."
        />
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {news.length} {news.length === 1 ? 'notícia disponível' : 'notícias disponíveis'}
          </Typography>
          <Grid container spacing={3}>
            {news.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <NewsCard news={item} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  )
}
