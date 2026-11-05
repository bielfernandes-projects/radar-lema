import { Button, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import FaqList from '../components/FaqList'
import { SUPPORT_EMAIL } from '../config/site'

export default function Help() {
  const navigate = useNavigate()
  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Ajuda
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Respostas para as dúvidas mais comuns.
        {SUPPORT_EMAIL ? ` Não achou o que procurava? Escreva para ${SUPPORT_EMAIL}.` : ''}
      </Typography>
      <Button
        variant="outlined"
        size="large"
        sx={{ mb: 3, minHeight: 48 }}
        onClick={() => navigate('/', { state: { tour: true } })}
      >
        Ver o tutorial de novo
      </Button>
      <FaqList />
    </Container>
  )
}
