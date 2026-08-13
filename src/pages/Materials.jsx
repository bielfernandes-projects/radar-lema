import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Container,
  Grid,
  Skeleton,
  Typography
} from '@mui/material'
import { FileStack } from 'lucide-react'
import { fetchMaterials } from '../services/materialsData'
import MaterialCard from '../components/MaterialCard'
import EmptyState from '../components/EmptyState'

export default function Materials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchMaterials()
        setMaterials(data)
      } catch {
        setError('Erro ao carregar os materiais de apoio. Tente novamente.')
      }
      setLoading(false)
    }
    fetchData()
  }, [reload])

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Materiais de Apoio
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manuais, resoluções e guias para o dia a dia do RPPS.
      </Typography>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
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
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="Nenhum material publicado"
          message="Manuais, resoluções e guias disponibilizados pela Lema aparecem aqui."
        />
      ) : (
        <Grid container spacing={3}>
          {materials.map((material) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={material.id}>
              <MaterialCard material={material} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
