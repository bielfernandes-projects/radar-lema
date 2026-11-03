import { useEffect, useRef } from 'react'
import { Box, GlobalStyles, Typography, useMediaQuery, useTheme } from '@mui/material'

const NAVY = '#0b1736'
const GAP = { xs: 5, md: 9 }

// Prints reais do app em public/showcase.
const SCREENS = [
  { key: 'eventos', title: 'Eventos', img: '/showcase/eventos.jpg' },
  { key: 'noticias', title: 'Notícias', img: '/showcase/noticias.jpg' },
  { key: 'artigos', title: 'Artigos', img: '/showcase/artigos.jpg' },
  { key: 'dashboard', title: 'Dashboard', img: '/showcase/dashboard.jpg' }
]

function Phone({ screen: { title, img } }) {
  return (
    <Box
      sx={{
        flexShrink: 0, width: { xs: 232, md: 280 }, aspectRatio: '9 / 18.5', p: '8px', borderRadius: '36px',
        bgcolor: NAVY, boxShadow: '0 50px 60px -34px rgba(11,23,54,0.6), inset 0 0 0 1px rgba(255,255,255,0.12)'
      }}
    >
      <Box sx={{ height: '100%', borderRadius: '29px', overflow: 'hidden', bgcolor: '#ebeef2' }}>
        <img
          src={img}
          alt={`Tela de ${title} do RPPapp`}
          loading="lazy"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />
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
      aria-label="Telas do RPPapp"
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
