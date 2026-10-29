import { Typography } from '@mui/material'
import PublicPageShell, { Section } from '../components/PublicPageShell'
import { DPO_EMAIL, MAINTAINER, SITE_NAME, SUPPORT_EMAIL, TERMS_VERSION } from '../config/site'

const contact = DPO_EMAIL || SUPPORT_EMAIL

export default function Privacy() {
  return (
    <PublicPageShell
      title="Política de Privacidade"
      description="Como o RPPapp coleta, usa e protege seus dados pessoais, conforme a LGPD."
      path="/privacidade"
      draft={TERMS_VERSION}
    >
      <Typography variant="body1" sx={{ mb: 3 }}>
        Esta política explica como o {SITE_NAME}, mantido por {MAINTAINER}, trata dados pessoais
        de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </Typography>
      <Section title="Dados que coletamos">
        <Typography variant="body1">
          Nome e e-mail informados no cadastro; tipo de conta e perfil de acesso; dados de uso do
          app (telas visitadas, conteúdos abertos, favoritos e eventos de navegação); e dados
          técnicos do dispositivo, como navegador e sistema operacional. Não coletamos dados
          sensíveis.
        </Typography>
      </Section>
      <Section title="Para que usamos">
        <Typography variant="body1">
          Criar e manter sua conta, liberar o acesso aos conteúdos, enviar e-mails de confirmação e
          recuperação de senha, entender quais conteúdos são úteis e melhorar o app.
        </Typography>
      </Section>
      <Section title="Medição de uso e cookies">
        <Typography variant="body1">
          Usamos o PostHog para medir o uso do app de forma anônima, somente se você aceitar o
          aviso de coleta. Sem o aceite, essa ferramenta não é iniciada. Também mantemos métricas
          de uso próprias, ligadas à sua conta, para entender o uso do app por clientes.
        </Typography>
      </Section>
      <Section title="Compartilhamento">
        <Typography variant="body1">
          Não vendemos seus dados. Eles são processados por provedores de infraestrutura
          necessários ao serviço (hospedagem, banco de dados, envio de e-mail e medição de uso).
        </Typography>
      </Section>
      <Section title="Retenção">
        <Typography variant="body1">
          Mantemos seus dados enquanto sua conta estiver ativa. Ao pedir a exclusão, removemos os
          dados pessoais, salvo quando a lei exigir guarda por mais tempo.
        </Typography>
      </Section>
      <Section title="Seus direitos">
        <Typography variant="body1">
          Você pode pedir acesso, correção, portabilidade, informação sobre compartilhamento,
          revogação de consentimento e exclusão dos seus dados.
          {contact ? ` Escreva para ${contact}.` : ' Use a página de Contato.'}
        </Typography>
      </Section>
    </PublicPageShell>
  )
}
