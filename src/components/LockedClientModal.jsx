import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import { Lock, Mail } from 'lucide-react'

const CONTACT_EMAIL = 'comercial@lemaef.com.br'

const mailtoHref = () =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    'Quero ser um Cliente Lema'
  )}&body=${encodeURIComponent(
    'Olá, equipe Lema!\n\nGostaria de saber mais sobre o plano de consultoria de investimentos para RPPS e me tornar um Cliente Lema.\n\nAguardo o contato. Obrigado!'
  )}`

export default function LockedClientModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'secondary.light',
              color: 'secondary.main'
            }}
          >
            <Lock size={20} />
          </Box>
          <Typography variant="h6" component="span">
            Função exclusiva para Clientes Lema
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          O Dashboard UNO e os conteúdos exclusivos são um diferencial para
          Clientes Lema. Fale com um consultor Lema para aderir a um plano de
          consultoria de investimentos para RPPS e liberar esse e outros
          recursos.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Agora não</Button>
        <Button
          component="a"
          href={mailtoHref()}
          variant="contained"
          startIcon={<Mail size={18} />}
        >
          Falar com um consultor
        </Button>
      </DialogActions>
    </Dialog>
  )
}
