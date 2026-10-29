import { Typography } from '@mui/material'
import PublicPageShell, { Section } from '../components/PublicPageShell'
import { COMMERCIAL_EMAIL, SUPPORT_EMAIL } from '../config/site'
import { FAQ } from '../config/faq'

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
