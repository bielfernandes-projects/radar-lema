import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  GlobalStyles,
  Typography,
  useTheme
} from '@mui/material'
import {
  BookOpen,
  CalendarDots,
  ChartBar,
  FileText,
  Megaphone,
  Newspaper
} from '@phosphor-icons/react'
import LegalFooter from '../components/LegalFooter'
import LandingShowcase from '../components/LandingShowcase'
import usePageMeta from '../hooks/usePageMeta'
import { SITE_NAME, SITE_URL } from '../config/site'
import FaqList from '../components/FaqList'
import { FAQ } from '../config/faq'
import { DISPLAY_FONT } from '../theme/theme'

const TITLE = 'RPPapp: o guia de bolso para RPPS'
const DESCRIPTION =
  'App gratuito feito exclusivamente para RPPS: eventos, notícias de mercado, artigos, novidades do UNO, materiais de apoio e dashboard de investimentos.'

const FEATURES = [
  { icon: CalendarDots, title: 'Eventos', text: 'Agenda do ecossistema RPPS num só lugar.' },
  { icon: Newspaper, title: 'Notícias', text: 'Notícias de mercado e de previdência selecionadas para RPPS.' },
  { icon: BookOpen, title: 'Artigos', text: 'Análises e comparativos sobre RPPS e investimentos.' },
  { icon: FileText, title: 'Materiais de apoio', text: 'Documentos e modelos para o dia a dia do regime próprio.' },
  { icon: Megaphone, title: 'Novidades do UNO', text: 'Acompanhe as atualizações do sistema UNO.' },
  { icon: ChartBar, title: 'Dashboard de investimentos', text: 'Visão dos investimentos para clientes UNO.' }
]

// Chips decorativos do hero (overlay com parallax); só ícone + título, aria-hidden.
const CHIPS = [
  { feature: FEATURES[0], top: '8%', left: '4%', speed: 'a' },
  { feature: FEATURES[1], top: '34%', left: '38%', speed: 'b' },
  { feature: FEATURES[3], top: '62%', left: '10%', speed: 'c' },
  { feature: FEATURES[4], top: '78%', left: '46%', speed: 'a' }
]

const NAVY = '#0b1736'
const BLUE = '#2563eb' // blue[600]: branco sobre ele passa 4.5:1 (o 500 do tema não passa)
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'

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
    { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png` },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([name, text]) => ({
        '@type': 'Question',
        name,
        acceptedAnswer: { '@type': 'Answer', text }
      }))
    }
  ]
}

// Scroll-driven (CSS nativo) é só enhancement: sem suporte, tudo fica estático e visível.
const landingStyles = (
  <GlobalStyles
    styles={{
      // o tema usa overflow-x: hidden em html/body, o que desliga position: sticky
      'html, body': { overflowX: 'clip' },
      '@keyframes lp-grow': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      '@keyframes lp-mark': {
        from: { transform: 'translate3d(0,0,0) rotate(0deg)' },
        to: { transform: 'translate3d(-6%,14%,0) rotate(-4deg)' }
      },
      '@keyframes lp-par-a': { to: { transform: 'translate3d(0,-70px,0)' } },
      '@keyframes lp-par-b': { to: { transform: 'translate3d(0,-130px,0)' } },
      '@keyframes lp-par-c': { to: { transform: 'translate3d(0,-40px,0)' } },
      '@keyframes lp-float': {
        '0%, 100%': { translate: '0 0' },
        '50%': { translate: '0 -8px' }
      },
      '.lp-reveal-on .lp-reveal': {
        opacity: 0,
        transform: 'translateY(28px)',
        transition: `opacity 800ms ${EASE}, transform 800ms ${EASE}`,
        transitionDelay: 'var(--lp-delay, 0ms)'
      },
      '.lp-reveal-on .lp-reveal.lp-in': { opacity: 1, transform: 'none' },
      '@supports (animation-timeline: scroll())': {
        '.lp-progress': { animation: 'lp-grow linear both', animationTimeline: 'scroll(root block)' },
        '.lp-mark': {
          animation: 'lp-mark linear both',
          animationTimeline: 'scroll(root block)',
          animationRange: '0 120vh'
        },
        '.lp-par-a, .lp-par-b, .lp-par-c': {
          animationTimeline: 'scroll(root block)',
          animationRange: '0 100vh',
          animationFillMode: 'both',
          animationTimingFunction: 'linear'
        },
        '.lp-par-a': { animationName: 'lp-par-a' },
        '.lp-par-b': { animationName: 'lp-par-b' },
        '.lp-par-c': { animationName: 'lp-par-c' }
      },
      '@media (prefers-reduced-motion: reduce)': {
        '.lp-progress, .lp-mark, .lp-par-a, .lp-par-b, .lp-par-c, .lp-chip-in': {
          animation: 'none !important'
        },
        '.lp-reveal-on .lp-reveal': { opacity: 1, transform: 'none', transition: 'none' }
      }
    }}
  />
)

// Liga a classe .lp-in quando o elemento entra na viewport (uma vez só).
function useReveal(rootRef) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    setArmed(true)
    root.querySelectorAll('.lp-reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootRef])
  return armed
}

// Header transparente sobre o hero, sólido depois dele.
function useScrolledPast(sentinelRef) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [sentinelRef])
  return past
}

export default function Landing() {
  usePageMeta({ title: TITLE, description: DESCRIPTION, path: '/' })
  const theme = useTheme()
  const rootRef = useRef(null)
  const sentinelRef = useRef(null)
  const armed = useReveal(rootRef)
  const solid = useScrolledPast(sentinelRef)

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(JSON_LD)
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  const dark = theme.palette.mode === 'dark'
  // Logo escura só quando o header está sólido sobre fundo claro.
  const logo = solid && !dark ? '/logo-navy.svg' : '/logo-white.svg'

  return (
    <Box
      ref={rootRef}
      className={armed ? 'lp-reveal-on' : undefined}
      sx={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default',
        '& .MuiTypography-h1, & .MuiTypography-h2, & .MuiTypography-h3': { fontFamily: DISPLAY_FONT }
      }}
    >
      {landingStyles}

      <Box
        aria-hidden="true"
        className="lp-progress"
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 1300,
          bgcolor: BLUE, transformOrigin: '0 50%', transform: 'scaleX(0)'
        }}
      />

      <Box
        component="header"
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
          transition: `background-color 300ms ${EASE}, border-color 300ms ${EASE}`,
          bgcolor: solid ? 'background.paper' : 'transparent',
          borderBottom: 1,
          borderColor: solid ? 'divider' : 'transparent'
        }}
      >
        <Container maxWidth="lg" sx={{ height: 72, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link to="/" aria-label="RPPapp, página inicial" style={{ display: 'flex' }}>
            <img src={logo} alt="RPPapp" style={{ height: 40, width: 'auto', display: 'block' }} />
          </Link>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            component={Link}
            to="/login"
            sx={{ color: solid && !dark ? 'text.primary' : '#fff', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Entrar
          </Button>
          <Button
            component={Link}
            to="/criar-conta"
            variant="contained"
            sx={{ bgcolor: BLUE, color: '#fff', '&:hover': { bgcolor: '#1d4ed8' }, '&:active': { transform: 'scale(0.98)' } }}
          >
            Criar conta grátis
          </Button>
        </Container>
      </Box>

      {/* HERO */}
      <Box
        component="section"
        sx={{
          position: 'relative', overflow: 'hidden', bgcolor: NAVY, color: '#fff',
          minHeight: '100dvh', display: 'flex', alignItems: 'center',
          pt: '72px',
          backgroundImage: [
            'radial-gradient(60% 55% at 85% 20%, rgba(37,99,235,0.45), transparent 70%)',
            'radial-gradient(50% 50% at 0% 100%, rgba(59,130,246,0.22), transparent 70%)',
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)'
          ].join(','),
          backgroundSize: 'auto, auto, 56px 56px, 56px 56px'
        }}
      >
        {/* overlay: a marca em marca d'água, desce devagar com a rolagem */}
        <Box
          aria-hidden="true"
          className="lp-mark"
          sx={{
            position: 'absolute', right: { xs: '-30%', md: '-4%' }, top: { xs: '6%', md: '8%' },
            width: { xs: '90vw', md: '46vw' }, maxWidth: 700, opacity: 0.09, pointerEvents: 'none'
          }}
        >
          <img src="/logo-white.svg" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </Box>

        {/* overlay: chips em camadas com velocidades diferentes de parallax */}
        <Box
          aria-hidden="true"
          sx={{
            display: { xs: 'none', md: 'block' }, position: 'absolute', right: '3%', top: '16%',
            width: '40%', height: '68%', pointerEvents: 'none'
          }}
        >
          {CHIPS.map(({ feature: { icon: Icon, title }, top, left, speed }, i) => (
            <Box key={title} className={`lp-par-${speed}`} sx={{ position: 'absolute', top, left }}>
              <Box
                className="lp-chip-in"
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: 3,
                  bgcolor: 'rgba(15,28,64,0.82)', border: '1px solid rgba(255,255,255,0.14)',
                  boxShadow: '0 24px 48px -16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
                  animation: `lp-float ${5 + i}s ease-in-out ${i * 0.6}s infinite`
                }}
              >
                <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: BLUE, display: 'grid', placeItems: 'center' }}>
                  <Icon size={18} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {title}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 6, md: 10 } }}>
          <Box sx={{ maxWidth: { xs: '100%', md: 640 } }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.9rem', sm: '2.5rem', md: '3.25rem' }, lineHeight: 1.12,
                textWrap: 'balance', color: '#fff'
              }}
            >
              O guia de bolso do seu RPPS
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                mt: 3, fontFamily: 'inherit', fontWeight: 400, lineHeight: 1.6, maxWidth: '52ch',
                fontSize: { xs: '1.05rem', md: '1.2rem' }, color: 'rgba(255,255,255,0.82)'
              }}
            >
              Feito exclusivamente para RPPS. Eventos, notícias, artigos e ferramentas num app
              gratuito, direto no seu celular.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 5 }}>
              <Button
                component={Link}
                to="/criar-conta"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: BLUE, color: '#fff', px: 3.5, transition: `transform 200ms ${EASE}`,
                  '&:hover': { bgcolor: '#1d4ed8', transform: 'translateY(-2px)' },
                  '&:active': { transform: 'scale(0.98)' }
                }}
              >
                Criar conta grátis
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{
                  color: '#fff', borderColor: 'rgba(255,255,255,0.5)', px: 3.5,
                  '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                  '&:active': { transform: 'scale(0.98)' }
                }}
              >
                Já tenho conta
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.78)' }}>
              100% gratuito. Sem cartão de crédito.
            </Typography>
          </Box>
        </Container>
        <Box ref={sentinelRef} aria-hidden="true" sx={{ position: 'absolute', left: 0, bottom: 0, width: 1, height: 1 }} />
      </Box>

      {/* FUNCIONALIDADES: cartas que empilham sob a rolagem (sticky, sem JS) */}
      <Box component="section" sx={{ py: { xs: 8, md: 16 } }}>
        <Container
          maxWidth="lg"
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 4, md: 8 } }}
        >
          <Box className="lp-reveal" sx={{ alignSelf: 'start', position: { md: 'sticky' }, top: { md: 120 } }}>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: '1.5rem', md: '2.1rem' }, lineHeight: 1.2, textWrap: 'balance' }}
            >
              O que você encontra no RPPapp
            </Typography>
            <Box sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: BLUE, mt: 3 }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Box
                key={title}
                sx={{
                  position: 'sticky',
                  top: { xs: 88 + i * 10, md: 112 + i * 14 }
                }}
              >
                <Box
                  className="lp-reveal"
                  sx={{
                    p: 0.75, borderRadius: 4, bgcolor: 'divider',
                    boxShadow: '0 30px 40px -28px rgba(15,23,42,0.35)'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, p: { xs: 2.5, md: 3.5 },
                      borderRadius: 'calc(16px - 6px)', bgcolor: 'background.paper',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                      transition: `transform 500ms ${EASE}`,
                      '&:hover': { transform: 'translateY(-3px)' },
                      '&:hover .lp-icon': { transform: 'scale(1.08) rotate(-4deg)' }
                    }}
                  >
                    <Box
                      className="lp-icon"
                      sx={{
                        flexShrink: 0, width: { xs: 48, md: 60 }, height: { xs: 48, md: 60 }, borderRadius: 3,
                        bgcolor: BLUE, color: '#fff', display: 'grid', placeItems: 'center',
                        transition: `transform 500ms ${EASE}`
                      }}
                    >
                      <Icon size={28} aria-hidden="true" />
                    </Box>
                    <Box>
                      <Typography variant="h3" sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.3 }}>
                        {title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: '46ch' }}>
                        {text}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* O APP POR DENTRO: mockups em rolagem automática */}
      <Box component="section" sx={{ pb: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <Box className="lp-reveal" sx={{ textAlign: 'center', mb: { xs: 3, md: 5 } }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '2.1rem' }, lineHeight: 1.2, textWrap: 'balance' }}>
              Veja o RPPapp por dentro
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Telas ilustrativas.
            </Typography>
          </Box>
        </Container>
        <LandingShowcase />
      </Box>

      {/* FAQ */}
      <Box component="section" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            className="lp-reveal"
            sx={{ fontSize: { xs: '1.5rem', md: '2.1rem' }, lineHeight: 1.2, textAlign: 'center', textWrap: 'balance', mb: { xs: 3, md: 5 } }}
          >
            Perguntas frequentes
          </Typography>
          <Box className="lp-reveal">
            <FaqList />
          </Box>
        </Container>
      </Box>

      {/* CTA FINAL */}
      <Box component="section" sx={{ pb: { xs: 8, md: 14 } }}>
        <Container maxWidth="md">
          <Box
            className="lp-reveal"
            sx={{
              position: 'relative', overflow: 'hidden', borderRadius: 4, bgcolor: NAVY, color: '#fff',
              textAlign: 'center', px: { xs: 3, md: 8 }, py: { xs: 6, md: 8 },
              backgroundImage:
                'radial-gradient(70% 90% at 50% 0%, rgba(37,99,235,0.5), transparent 70%)'
            }}
          >
            <Typography variant="h2" sx={{ fontSize: { xs: '1.4rem', md: '1.9rem' }, color: '#fff', textWrap: 'balance' }}>
              Crie sua conta e comece agora
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 4, color: 'rgba(255,255,255,0.82)', textWrap: 'pretty' }}>
              O RPPapp é gratuito e funciona como aplicativo: depois de entrar, adicione à tela
              inicial do celular, sem loja de apps.
            </Typography>
            <Button
              component={Link}
              to="/criar-conta"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#fff', color: NAVY, px: 4, transition: `transform 200ms ${EASE}`,
                '&:hover': { bgcolor: '#e2e8f0', transform: 'translateY(-2px)' },
                '&:active': { transform: 'scale(0.98)' }
              }}
            >
              Criar conta grátis
            </Button>
          </Box>
        </Container>
      </Box>

      <LegalFooter sx={{ mt: 'auto' }} />
    </Box>
  )
}
