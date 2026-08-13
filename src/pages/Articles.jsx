import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Container,
  Grid,
  Skeleton,
  Typography
} from '@mui/material'
import { BookOpen } from 'lucide-react'
import { fetchArticles } from '../services/articlesData'
import ArticleCard from '../components/ArticleCard'
import EmptyState from '../components/EmptyState'

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchArticles()
        setArticles(data)
      } catch {
        setError('Erro ao carregar os artigos. Tente novamente.')
      }
      setLoading(false)
    }
    fetchData()
  }, [reload])

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Artigos
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Análises, comparativos e estudos da Lema sobre RPPS e investimentos.
      </Typography>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={260} />
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
      ) : articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum artigo publicado"
          message="Análises, comparativos e estudos da Lema sobre RPPS e investimentos aparecem aqui."
        />
      ) : (
        <Grid container spacing={3}>
          {articles.map((article) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
