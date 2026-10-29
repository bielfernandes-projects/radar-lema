import { Box, Button, Typography } from '@mui/material'
import { Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { canAccessLemaExclusive } from '../utils/auth'
import { track } from '../lib/posthog'
import { UNO_SALES_EMAIL } from '../config/site'

const MAILTO = `mailto:${UNO_SALES_EMAIL}?subject=${encodeURIComponent(
  'Quero contratar o UNO'
)}&body=${encodeURIComponent(
  'Olá, equipe Lema!\n\nConheci o UNO pelo RPPapp e gostaria de contratar o sistema para o meu RPPS.\n\nAguardo o contato. Obrigado!'
)}`

// Convite de venda do UNO, exibido só para quem ainda não é Cliente Lema.
export default function UnoCta({ demo = false }) {
  const { profile } = useAuth()
  if (canAccessLemaExclusive(profile)) return null

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        p: 2, mb: 3, borderRadius: 2, border: 1, borderColor: 'primary.main', bgcolor: 'background.paper',
        '@media print': { display: 'none' }
      }}
    >
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Gostou? Contrate já o UNO.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {demo
            ? 'Você está vendo dados de demonstração. Com o UNO, o dashboard mostra a carteira do seu RPPS.'
            : 'Fale com um consultor Lema e conheça o sistema para a gestão do seu RPPS.'}
        </Typography>
      </Box>
      <Button
        component="a"
        href={MAILTO}
        variant="contained"
        startIcon={<Mail size={18} />}
        onClick={() => track('uno_cta_clicado', { origem: demo ? 'dashboard' : 'novidades' })}
      >
        Falar com um consultor
      </Button>
    </Box>
  )
}
