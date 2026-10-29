import { Box, GlobalStyles, Typography } from '@mui/material'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  MapPin,
  Newspaper
} from 'lucide-react'

const BLUE = '#2563eb'
const INK = '#1e293b'
const MUTED = '#5c6675'

// Conteúdo ilustrativo: nada aqui é dado real do app.
const SCREENS = [
  {
    key: 'eventos',
    title: 'Eventos',
    icon: CalendarDays,
    rows: [
      { tag: 'Presencial', title: 'Encontro Nacional de Gestores de RPPS', meta: 'Brasília - DF' },
      { tag: 'Online', title: 'Webinar: Política de Investimentos 2027', meta: 'Online' },
      { tag: 'Presencial', title: 'Congresso de Previdência Municipal', meta: 'Curitiba - PR' }
    ]
  },
  {
    key: 'noticias',
    title: 'Notícias',
    icon: Newspaper,
    rows: [
      { tag: 'Mercado', title: 'Copom mantém a Selic e o mercado reage', meta: 'Há 2 horas' },
      { tag: 'Previdência', title: 'Novas regras para certificação de dirigentes', meta: 'Há 5 horas' },
      { tag: 'Mercado', title: 'Inflação desacelera e abre espaço para prefixados', meta: 'Ontem' }
    ]
  },
  {
    key: 'artigos',
    title: 'Artigos',
    icon: BookOpen,
    rows: [
      { tag: 'Análise', title: 'Como ler o boletim econômico do mês', meta: '6 min de leitura' },
      { tag: 'Comparativo', title: 'Títulos públicos x fundos de renda fixa', meta: '9 min de leitura' },
      { tag: 'Análise', title: 'O que muda no cenário macro para o RPPS', meta: '5 min de leitura' }
    ]
  },
  {
    key: 'materiais',
    title: 'Materiais de apoio',
    icon: FileText,
    rows: [
      { tag: 'Modelo', title: 'Modelo de ata do comitê de investimentos', meta: 'DOCX' },
      { tag: 'Guia', title: 'Checklist de prestação de contas', meta: 'PDF' },
      { tag: 'Modelo', title: 'Modelo de política de investimentos', meta: 'DOCX' }
    ]
  },
  { key: 'dashboard', title: 'Dashboard', icon: BarChart3, chart: true }
]

const BARS = [38, 52, 46, 64, 58, 78, 70]

function Row({ tag, title, meta, place }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 1.25, boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }}>
      <Box sx={{ display: 'inline-block', px: 0.75, py: 0.125, borderRadius: 1, bgcolor: '#dbeafe', color: '#1e40af', fontSize: 9, fontWeight: 700 }}>
        {tag}
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: INK, mt: 0.5 }}>{title}</Typography>
      <Typography sx={{ fontSize: 10, color: MUTED, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {place && <MapPin size={10} />}
        {meta}
      </Typography>
    </Box>
  )
}

function Phone({ screen }) {
  const { title, icon: Icon, rows, chart } = screen
  return (
    <Box
      sx={{
        flexShrink: 0, width: { xs: 200, md: 232 }, aspectRatio: '9 / 18.5', p: '7px', borderRadius: '30px',
        bgcolor: '#0b1736', boxShadow: '0 40px 50px -30px rgba(11,23,54,0.55), inset 0 0 0 1px rgba(255,255,255,0.12)'
      }}
    >
      <Box sx={{ height: '100%', borderRadius: '24px', overflow: 'hidden', bgcolor: '#ebeef2', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ bgcolor: '#fff', px: 1.75, pt: 2.5, pb: 1.25, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #dce0e7' }}>
          <Box sx={{ width: 22, height: 22, borderRadius: 1.5, bgcolor: BLUE, color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon size={13} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: INK }}>{title}</Typography>
        </Box>
        <Box sx={{ flex: 1, p: 1.25, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
          {chart ? (
            <>
              <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 1.5, boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }}>
                <Typography sx={{ fontSize: 10, color: MUTED }}>Rentabilidade da carteira</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: INK, lineHeight: 1.2 }}>+8,4%</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 84, mt: 1.5 }}>
                  {BARS.map((h, i) => (
                    <Box key={i} sx={{ flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0', bgcolor: i === BARS.length - 1 ? BLUE : '#93c5fd' }} />
                  ))}
                </Box>
              </Box>
              {['Renda fixa', 'Renda variável', 'Exterior'].map((name, i) => (
                <Box key={name} sx={{ bgcolor: '#fff', borderRadius: 2, p: 1.25, boxShadow: '0 1px 2px rgba(15,23,42,0.06)' }}>
                  <Typography sx={{ fontSize: 10, color: MUTED, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{name}</span>
                    <span>{[72, 20, 8][i]}%</span>
                  </Typography>
                  <Box sx={{ height: 5, borderRadius: 3, bgcolor: '#dce0e7', mt: 0.75 }}>
                    <Box sx={{ width: `${[72, 20, 8][i]}%`, height: '100%', borderRadius: 3, bgcolor: BLUE }} />
                  </Box>
                </Box>
              ))}
            </>
          ) : (
            rows.map((row) => <Row key={row.title} {...row} place={screen.key === 'eventos'} />)
          )}
        </Box>
      </Box>
    </Box>
  )
}

const styles = (
  <GlobalStyles
    styles={{
      '@keyframes lp-marquee': { to: { transform: 'translateX(-50%)' } },
      '.lp-show-track': { animation: 'lp-marquee 48s linear infinite' },
      '.lp-show:hover .lp-show-track, .lp-show:focus-within .lp-show-track': { animationPlayState: 'paused' },
      // sem animação: vira faixa rolável à mão, e a cópia duplicada some
      '@media (prefers-reduced-motion: reduce)': {
        '.lp-show-track': { animation: 'none' },
        '.lp-show': { overflowX: 'auto' },
        '.lp-show-dup': { display: 'none' }
      }
    }}
  />
)

export default function LandingShowcase() {
  return (
    <Box
      className="lp-show"
      tabIndex={0}
      aria-label="Telas ilustrativas do RPPapp"
      sx={{
        overflow: 'hidden', py: 2,
        maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)'
      }}
    >
      {styles}
      <Box className="lp-show-track" sx={{ display: 'flex', gap: 3, width: 'max-content', pr: 3 }}>
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
