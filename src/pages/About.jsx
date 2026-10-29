import { Typography } from '@mui/material'
import PublicPageShell, { Section } from '../components/PublicPageShell'
import { MAINTAINER, SITE_NAME } from '../config/site'

export default function About() {
  return (
    <PublicPageShell
      title="Sobre o RPPapp"
      description="O RPPapp é um app gratuito feito exclusivamente para RPPS: o guia de bolso de quem trabalha com regime próprio."
      path="/sobre"
    >
      <Section title="O que é">
        <Typography variant="body1">
          O {SITE_NAME} é o guia de bolso de quem trabalha com RPPS. Reúne num só lugar eventos do
          ecossistema, notícias de mercado, artigos e análises, materiais de apoio, novidades do
          sistema UNO e um dashboard de investimentos.
        </Typography>
      </Section>
      <Section title="Para quem é">
        <Typography variant="body1">
          Gestores, conselheiros, analistas e demais profissionais de Regimes Próprios de
          Previdência Social. O app é pensado exclusivamente para esse público e é gratuito.
        </Typography>
      </Section>
      <Section title="Quem mantém">
        <Typography variant="body1">
          O {SITE_NAME} é mantido por {MAINTAINER}, consultoria especializada em RPPS e
          desenvolvedora do sistema UNO.
        </Typography>
      </Section>
    </PublicPageShell>
  )
}
