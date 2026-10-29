import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Container, Grid, Typography } from '@mui/material'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Newspaper,
  Sparkles
} from 'lucide-react'
import LegalFooter from '../components/LegalFooter'
import InstallAppButton from '../components/InstallAppButton'
import usePageMeta from '../hooks/usePageMeta'
import { SITE_NAME, SITE_URL } from '../config/site'

const TITLE = 'RPPapp: o guia de bolso para RPPS'
const DESCRIPTION =
  'App gratuito feito exclusivamente para RPPS: eventos, notícias de mercado, artigos, novidades do UNO, materiais de apoio e dashboard de investimentos.'

const FEATURES = [
  { icon: CalendarDays, title: 'Eventos', text: 'Agenda do ecossistema RPPS num só lugar.' },
  { icon: Newspaper, title: 'Notícias', text: 'Notícias de mercado e de previdência selecionadas para RPPS.' },
  { icon: BookOpen, title: 'Artigos', text: 'Análises e comparativos sobre RPPS e investimentos.' },
  { icon: FileText, title: 'Materiais de apoio', text: 'Documentos e modelos para o dia a dia do regime próprio.' },
  { icon: Sparkles, title: 'Novidades do UNO', text: 'Acompanhe as atualizações do sistema UNO.' },
  { icon: BarChart3, title: 'Dashboard de investimentos', text: 'Visão dos investimentos para clientes UNO.' }
]

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: DESCRIPTION,
      inLanguage: 'pt-BR',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' }
    },
    { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png` }
  ]
}

export default function Landing() {
  usePageMeta({ title: TITLE, description: DESCRIPTION, path: '/' })

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(JSON_LD)
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" component="header" sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <img src="/logo.png" alt="RPPapp" style={{ width: 120, height: 'auto', display: 'block' }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button component={Link} to="/login">
          Entrar
        </Button>
        <Button component={Link} to="/criar-conta" variant="contained">
          Criar conta grátis
        </Button>
      </Container>

      <Container maxWidth="md" component="main" sx={{ flexGrow: 1, py: { xs: 4, md: 8 } }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '3rem' } }}>
            O guia de bolso do seu RPPS
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" sx={{ mt: 2, fontWeight: 400 }}>
            Feito exclusivamente para RPPS. Eventos, notícias, artigos e ferramentas num app
            gratuito, direto no seu celular.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, mt: 4 }}>
            <Button component={Link} to="/criar-conta" variant="contained" size="large">
              Criar conta grátis
            </Button>
            <Button component={Link} to="/login" variant="outlined" size="large">
              Já tenho conta
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            100% gratuito. Sem cartão de crédito.
          </Typography>
        </Box>

        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: { xs: 6, md: 9 }, mb: 3, textAlign: 'center' }}>
          O que você encontra no RPPapp
        </Typography>
        <Grid container spacing={2}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Grid key={title} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', gap: 1.5, p: 2, border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Icon size={24} aria-hidden="true" />
                <Box>
                  <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {text}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: { xs: 6, md: 9 } }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            Instale no celular
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            O RPPapp funciona como aplicativo: abra pela tela inicial, sem loja de apps.
          </Typography>
          <Box sx={{ maxWidth: 320, mx: 'auto' }}>
            <InstallAppButton />
          </Box>
        </Box>
      </Container>

      <LegalFooter />
    </Box>
  )
}
