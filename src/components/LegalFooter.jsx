import { Box, Link as MuiLink, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export const LEGAL_LINKS = [
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/termos', label: 'Termos de Uso' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/contato', label: 'Contato e FAQ' },
  { to: '/fontes', label: 'Fontes' }
]

export default function LegalFooter({ sx }) {
  return (
    <Box component="footer" sx={{ textAlign: 'center', py: 3, px: 2, ...sx }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
        {LEGAL_LINKS.map((item) => (
          <MuiLink
            key={item.to}
            component={Link}
            to={item.to}
            variant="body2"
            color="text.secondary"
            underline="hover"
          >
            {item.label}
          </MuiLink>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        © {new Date().getFullYear()} RPPapp
      </Typography>
    </Box>
  )
}
