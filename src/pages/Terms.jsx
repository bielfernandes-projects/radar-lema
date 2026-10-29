import { Typography } from '@mui/material'
import PublicPageShell, { Section } from '../components/PublicPageShell'
import { MAINTAINER, SITE_NAME, TERMS_VERSION } from '../config/site'

export default function Terms() {
  return (
    <PublicPageShell
      title="Termos de Uso"
      description="Condições de uso do RPPapp, o app gratuito para RPPS."
      path="/termos"
      draft={TERMS_VERSION}
    >
      <Section title="O serviço">
        <Typography variant="body1">
          O {SITE_NAME} é um aplicativo gratuito, mantido por {MAINTAINER}, que reúne eventos,
          notícias, artigos, materiais e novidades voltados a Regimes Próprios de Previdência
          Social (RPPS). Ao criar uma conta você declara que leu e aceita estes termos e a
          Política de Privacidade.
        </Typography>
      </Section>
      <Section title="Conta">
        <Typography variant="body1">
          Você é responsável pelas informações do cadastro e pela guarda da sua senha. Algumas
          áreas são exclusivas para clientes e podem exigir liberação pela equipe.
        </Typography>
      </Section>
      <Section title="Conteúdo">
        <Typography variant="body1">
          O conteúdo tem caráter informativo e não constitui recomendação de investimento nem
          consultoria. Notícias e artigos de terceiros pertencem às suas fontes e são sempre
          creditados com link para a origem.
        </Typography>
      </Section>
      <Section title="Uso adequado">
        <Typography variant="body1">
          É proibido tentar acessar áreas sem autorização, copiar o conteúdo em escala ou usar o
          app de forma que prejudique o serviço ou outros usuários.
        </Typography>
      </Section>
      <Section title="Disponibilidade e alterações">
        <Typography variant="body1">
          O serviço pode mudar, ficar indisponível ou ser encerrado. Podemos atualizar estes
          termos; mudanças relevantes serão comunicadas no app.
        </Typography>
      </Section>
    </PublicPageShell>
  )
}
