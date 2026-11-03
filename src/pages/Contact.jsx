import { Typography } from '@mui/material'
import PublicPageShell, { Section } from '../components/PublicPageShell'
import MailLink from '../components/MailLink'
import { COMMERCIAL_EMAIL, SUPPORT_EMAIL } from '../config/site'

export default function Contact() {
  return (
    <PublicPageShell
      title="Contato"
      description="Fale com a equipe do RPPApp: suporte, feedback e divulgação de artigos."
      path="/contato"
    >
      <Section title="Fale com a gente">
        <Typography variant="body1">
          {SUPPORT_EMAIL ? (
            <>
              Suporte e feedback: <MailLink email={SUPPORT_EMAIL} />.
            </>
          ) : (
            'Suporte e feedback: fale com o seu contato na Lema.'
          )}
          {COMMERCIAL_EMAIL && (
            <>
              {' '}
              Comercial: <MailLink email={COMMERCIAL_EMAIL} />.
            </>
          )}
        </Typography>
      </Section>
      <Section title="Publique seus artigos">
        <Typography variant="body1">
          Quer ver seus artigos no RPPApp? Entre em contato conosco
          {SUPPORT_EMAIL && (
            <>
              {' '}
              pelo e-mail <MailLink email={SUPPORT_EMAIL} />
            </>
          )}
          .
        </Typography>
      </Section>
    </PublicPageShell>
  )
}
