import { Typography } from '@mui/material'
import PublicPageShell, { Section } from '../components/PublicPageShell'
import { COMMERCIAL_EMAIL, SUPPORT_EMAIL } from '../config/site'

const FAQ = [
  ['O RPPapp é gratuito?', 'Sim. Criar a conta e usar o app não tem custo.'],
  ['Preciso de conta para ver o conteúdo?', 'Sim. A conta é grátis e o cadastro leva poucos minutos.'],
  ['Esqueci minha senha. E agora?', 'Na tela de login, toque em "Esqueci minha senha" e enviaremos um link para o seu e-mail.'],
  ['Como instalo no celular?', 'Abra o app no navegador e use "Instalar App" ou "Adicionar à Tela de Início".'],
  ['O que são as áreas exclusivas?', 'Recursos como o dashboard de investimentos são liberados para clientes do sistema UNO.']
]

export default function Contact() {
  return (
    <PublicPageShell
      title="Contato e perguntas frequentes"
      description="Fale com a equipe do RPPapp e veja as respostas para as dúvidas mais comuns."
      path="/contato"
    >
      <Section title="Fale com a gente">
        <Typography variant="body1">
          {SUPPORT_EMAIL
            ? `Suporte e feedback: ${SUPPORT_EMAIL}.`
            : 'Suporte e feedback: fale com o seu contato na Lema.'}
          {COMMERCIAL_EMAIL ? ` Comercial: ${COMMERCIAL_EMAIL}.` : ''}
        </Typography>
      </Section>
      <Section title="Perguntas frequentes">
        {FAQ.map(([question, answer]) => (
          <div key={question}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mt: 2 }}>
              {question}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {answer}
            </Typography>
          </div>
        ))}
      </Section>
    </PublicPageShell>
  )
}
