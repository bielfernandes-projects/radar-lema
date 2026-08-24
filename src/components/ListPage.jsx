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
import EmptyState from './EmptyState'

export default function ListPage({
  title,
  subtitle,
  fetchData,
  renderItem,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  countLabel,
  errorMessage,
  variant = 'grid',
  skeletonHeight = 260,
  skeletonCount = 6
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchData()
        setItems(data)
      } catch {
        setError(errorMessage || 'Erro ao carregar.')
      }
      setLoading(false)
    }
    load()
  }, [reload, fetchData, errorMessage])

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
      </Stack>
      {subtitle && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton variant="rounded" height={skeletonHeight} />
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
      ) : items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          message={emptyMessage}
        />
      ) : (
        <>
          {countLabel && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {items.length} {countLabel(items.length)}
            </Typography>
          )}
          <Grid container spacing={variant === 'list' ? 1.5 : 3}>
            {items.map((item) => (
              <Grid size={variant === 'list' ? 12 : { xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                {renderItem(item)}
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  )
}