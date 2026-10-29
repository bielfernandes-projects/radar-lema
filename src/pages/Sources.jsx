import { Typography } from '@mui/material'
import PublicPageShell, { Section } from '../components/PublicPageShell'
import { MAINTAINER } from '../config/site'

export default function Sources() {
  return (
    <PublicPageShell
      title="Fontes e créditos"
      description="De onde vêm as notícias e os artigos do RPPapp e como os direitos de cada fonte são respeitados."
      path="/fontes"
    >
      <Section title="Notícias">
        <Typography variant="body1">
          As notícias são reunidas de fontes públicas do setor (como Banco Central e Ministério da
          Previdência Social), filtradas por relevância para RPPS. Cada item mostra apenas um
          resumo e leva ao texto completo no site da fonte original, que detém os direitos.
        </Typography>
      </Section>
      <Section title="Artigos">
        <Typography variant="body1">
          Artigos e análises publicados pelo {MAINTAINER} são de autoria da equipe. Conteúdos de
          outras origens trazem o crédito e o link para a publicação original.
        </Typography>
      </Section>
      <Section title="Correções e remoção">
        <Typography variant="body1">
          Se você é titular de um conteúdo e quer corrigir o crédito ou pedir a remoção, use a
          página de Contato.
        </Typography>
      </Section>
    </PublicPageShell>
  )
}
