import { Container, Typography } from '@mui/material'
import FaqList from '../components/FaqList'
import { SUPPORT_EMAIL } from '../config/site'

export default function Help() {
  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Ajuda
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Respostas para as dúvidas mais comuns.
        {SUPPORT_EMAIL ? ` Não achou o que procurava? Escreva para ${SUPPORT_EMAIL}.` : ''}
      </Typography>
      <FaqList />
    </Container>
  )
}
