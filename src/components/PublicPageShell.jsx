import { Box, Button, Container, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import LegalFooter from './LegalFooter'
import usePageMeta from '../hooks/usePageMeta'

// Casca das páginas públicas (sem login): header com logo, conteúdo e rodapé legal.
export default function PublicPageShell({ title, description, path, draft, children }) {
  usePageMeta({ title, description, path })

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="md" component="header" sx={{ py: 2, display: 'flex', alignItems: 'center' }}>
        <Link to="/" aria-label="RPPapp, página inicial">
          <img src="/logo.png" alt="RPPapp" style={{ width: 120, height: 'auto', display: 'block' }} />
        </Link>
        <Box sx={{ flexGrow: 1 }} />
        <Button component={Link} to="/login" size="small">
          Entrar
        </Button>
      </Container>
      <Container maxWidth="md" component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>
        {draft && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Texto em revisão jurídica. Última atualização: {draft}.
          </Typography>
        )}
        {children}
      </Container>
      <LegalFooter />
    </Box>
  )
}

export function Section({ title, children }) {
  return (
    <Box component="section" sx={{ mb: 3 }}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}
