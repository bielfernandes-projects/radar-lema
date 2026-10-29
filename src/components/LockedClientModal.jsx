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
import { useEffect } from 'react'
import { track } from '../lib/posthog'
import { useLogEvent } from '../hooks/useLogEvent'
import { UNO_SALES_EMAIL as CONTACT_EMAIL } from '../config/site'

const mailtoHref = () =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    'Quero ser um Cliente Lema'
  )}&body=${encodeURIComponent(
    'Olá, equipe Lema!\n\nGostaria de saber mais sobre o plano de consultoria de investimentos para RPPS e me tornar um Cliente Lema.\n\nAguardo o contato. Obrigado!'
  )}`

export default function LockedClientModal({ open, onClose }) {
  const logEvent = useLogEvent()

  useEffect(() => {
    if (open) {
      track('cadeado_aberto')
      logEvent('lock_opened')
    }
  }, [open, logEvent])

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
          onClick={() => {
            track('cadeado_lead_clicado')
            logEvent('lock_clicked')
          }}
          variant="contained"
          startIcon={<Mail size={18} />}
        >
          Falar com um consultor
        </Button>
      </DialogActions>
    </Dialog>
  )
}
