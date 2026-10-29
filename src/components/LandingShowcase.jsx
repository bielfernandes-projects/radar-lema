import { useEffect, useRef } from 'react'
import { Box, GlobalStyles, Typography, useMediaQuery, useTheme } from '@mui/material'
import {
  BookOpen,
  CalendarDots,
  ChartBar,
  FileText,
  House,
  MapPin,
  Newspaper
} from '@phosphor-icons/react'

const BLUE = '#2563eb'
const NAVY = '#0b1736'
const INK = '#1e293b'
const MUTED = '#5c6675'
const GAP = { xs: 5, md: 9 }

// Conteúdo ilustrativo: nada aqui é dado real do app.
const SCREENS = [
  {
    key: 'eventos',
    title: 'Eventos',
    icon: CalendarDots,
    rows: [
      { tag: 'Presencial', title: 'Encontro Nacional de Gestores de RPPS', meta: 'Brasília - DF', cover: true },
      { tag: 'Online', title: 'Webinar: Política de Investimentos 2027', meta: 'Online' }
    ]
  },
  {
    key: 'noticias',
    title: 'Notícias',
    icon: Newspaper,
    rows: [
      { tag: 'Mercado', title: 'Copom mantém a Selic e o mercado reage', meta: 'Há 2 horas', cover: true },
      { tag: 'Previdência', title: 'Novas regras para certificação de dirigentes', meta: 'Há 5 horas' }
    ]
  },
  {
    key: 'artigos',
    title: 'Artigos',
    icon: BookOpen,
    rows: [
      { tag: 'Análise', title: 'Como ler o boletim econômico do mês', meta: '6 min de leitura', cover: true },
      { tag: 'Comparativo', title: 'Títulos públicos x fundos de renda fixa', meta: '9 min de leitura' }
    ]
  },
  {
    key: 'materiais',
    title: 'Materiais de apoio',
    icon: FileText,
    rows: [
      { tag: 'Modelo', title: 'Modelo de ata do comitê de investimentos', meta: 'DOCX', cover: true },
      { tag: 'Guia', title: 'Checklist de prestação de contas', meta: 'PDF' }
    ]
  },
  { key: 'dashboard', title: 'Dashboard', icon: ChartBar, chart: true }
]

const NAV = [House, Newspaper, CalendarDots, FileText]
const BARS = [38, 52, 46, 64, 58, 78, 70]
const CARD_SHADOW = '0 1px 2px rgba(15,23,42,0.06)'

function Row({ tag, title, meta, place, cover, Icon }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2.5, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
      {cover && (
        <Box
          sx={{
            height: 78, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.9)',
            backgroundImage: `radial-gradient(80% 120% at 85% 0%, #3b82f6, transparent 70%), linear-gradient(135deg, ${NAVY}, #1e3a8a)`
          }}
        >
          <Icon size={30} />
        </Box>
      )}
      <Box sx={{ p: 1.75 }}>
        <Box sx={{ display: 'inline-block', px: 1, py: 0.25, borderRadius: 1, bgcolor: '#dbeafe', color: '#1e40af', fontSize: 10, fontWeight: 700 }}>
          {tag}
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, color: INK, mt: 0.75 }}>{title}</Typography>
        <Typography sx={{ fontSize: 11, color: MUTED, mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {place && <MapPin size={11} />}
          {meta}
        </Typography>
      </Box>
    </Box>
  )
}

function Phone({ screen }) {
  const { title, icon: Icon, rows, chart } = screen
  return (
    <Box
      sx={{
        flexShrink: 0, width: { xs: 232, md: 280 }, aspectRatio: '9 / 18.5', p: '8px', borderRadius: '36px',
        bgcolor: NAVY, boxShadow: '0 50px 60px -34px rgba(11,23,54,0.6), inset 0 0 0 1px rgba(255,255,255,0.12)'
      }}
    >
      <Box sx={{ height: '100%', borderRadius: '29px', overflow: 'hidden', bgcolor: '#ebeef2', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ bgcolor: '#fff', px: 2.25, pt: 1.5, pb: 1.5, borderBottom: '1px solid #dce0e7' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: INK, mb: 1.5 }}>
            <span>9:41</span>
            <Box sx={{ width: 48, height: 6, borderRadius: 3, bgcolor: NAVY, mt: 0.25 }} />
            <span>100%</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: BLUE, color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Icon size={16} />
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: INK }}>{title}</Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: 1.75, display: 'flex', flexDirection: 'column', gap: 1.75, overflow: 'hidden' }}>
          {chart ? (
            <>
              <Box sx={{ bgcolor: '#fff', borderRadius: 2.5, p: 2, boxShadow: CARD_SHADOW }}>
                <Typography sx={{ fontSize: 11, color: MUTED }}>Rentabilidade da carteira</Typography>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: INK, lineHeight: 1.2 }}>+8,4%</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 110, mt: 2 }}>
                  {BARS.map((h, i) => (
                    <Box key={i} sx={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', bgcolor: i === BARS.length - 1 ? BLUE : '#93c5fd' }} />
                  ))}
                </Box>
              </Box>
              {['Renda fixa', 'Renda variável'].map((name, i) => (
                <Box key={name} sx={{ bgcolor: '#fff', borderRadius: 2.5, p: 1.75, boxShadow: CARD_SHADOW }}>
                  <Typography sx={{ fontSize: 11, color: MUTED, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{name}</span>
                    <span>{[72, 28][i]}%</span>
                  </Typography>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#dce0e7', mt: 1 }}>
                    <Box sx={{ width: `${[72, 28][i]}%`, height: '100%', borderRadius: 3, bgcolor: BLUE }} />
                  </Box>
                </Box>
              ))}
            </>
          ) : (
            rows.map((row) => <Row key={row.title} {...row} Icon={Icon} place={screen.key === 'eventos'} />)
          )}
        </Box>

        <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #dce0e7', display: 'flex', justifyContent: 'space-around', py: 1.5 }}>
          {NAV.map((NavIcon, i) => (
            <Box key={i} sx={{ color: NavIcon === Icon ? BLUE : '#9aa2b1', display: 'grid', placeItems: 'center' }}>
              <NavIcon size={20} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

const styles = (
  <GlobalStyles
    styles={{
      '@keyframes lp-marquee': { to: { transform: 'translateX(-50%)' } },
      // desktop: loop por CSS; mobile (< md): rolagem horizontal manual + auto-avanço por JS
      '@media (min-width: 900px)': {
        '.lp-show-track': { animation: 'lp-marquee 60s linear infinite' }
      },
      // sem animação: vira faixa rolável à mão, e a cópia duplicada some
      '@media (prefers-reduced-motion: reduce)': {
        '.lp-show-track': { animation: 'none' },
        '.lp-show': { overflowX: 'auto' },
        '.lp-show-dup': { display: 'none' }
      }
    }}
  />
)

// Mobile: o usuário pode arrastar a faixa; ela segue avançando sozinha e pausa durante o toque.
function useMobileAutoScroll(ref) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    const el = ref.current
    if (!isMobile || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let pos = el.scrollLeft
    let paused = false
    let timer
    let raf
    const half = () => el.scrollWidth / 2 // a lista está duplicada: metade = uma volta
    const hold = () => {
      paused = true
      clearTimeout(timer)
    }
    const release = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        pos = el.scrollLeft
        paused = false
      }, 2000)
    }
    const wrap = () => {
      if (el.scrollLeft >= half()) el.scrollLeft -= half()
      else if (el.scrollLeft <= 0) el.scrollLeft += half()
    }
    const tick = () => {
      if (!paused) {
        pos += 0.6
        if (pos >= half()) pos -= half()
        el.scrollLeft = pos
      }
      raf = requestAnimationFrame(tick)
    }

    el.addEventListener('touchstart', hold, { passive: true })
    el.addEventListener('touchend', release, { passive: true })
    el.addEventListener('touchcancel', release, { passive: true })
    el.addEventListener('scroll', wrap, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      el.removeEventListener('touchstart', hold)
      el.removeEventListener('touchend', release)
      el.removeEventListener('touchcancel', release)
      el.removeEventListener('scroll', wrap)
    }
  }, [isMobile, ref])
}

export default function LandingShowcase() {
  const ref = useRef(null)
  useMobileAutoScroll(ref)

  return (
    <Box
      ref={ref}
      className="lp-show"
      aria-label="Telas ilustrativas do RPPapp"
      sx={{
        overflowX: { xs: 'auto', md: 'hidden' }, overflowY: 'hidden', py: 3,
        scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)'
      }}
    >
      {styles}
      {/* pr = gap: mantém o loop de -50% sem salto */}
      <Box className="lp-show-track" sx={{ display: 'flex', gap: GAP, pr: GAP, width: 'max-content' }}>
        {SCREENS.map((s) => (
          <Phone key={s.key} screen={s} />
        ))}
        <Box className="lp-show-dup" aria-hidden="true" sx={{ display: 'contents' }}>
          {SCREENS.map((s) => (
            <Phone key={`dup-${s.key}`} screen={s} />
          ))}
        </Box>
      </Box>
    </Box>
  )
}
