import InstallGuide from './InstallGuide'

// Um unico tour que percorre o app inteiro, na ordem do menu. Cada passo diz em que
// rota vive (`path`); o GuidedTour navega sozinho quando o passo seguinte e de outra tela.

const step = (section, path, id, target, title, content, placement = 'bottom') => ({
  id,
  path,
  target: `[data-tour="${target}"]`,
  placement,
  skipBeacon: true,
  title,
  content,
  data: { section }
})

const center = (section, path, id, title, content) => ({
  id,
  path,
  target: 'body',
  placement: 'center',
  skipBeacon: true,
  title,
  content,
  data: { section }
})

// Funcao pura: o GuidedTour fixa o resultado ao comecar.
export function buildTourSteps({ isMobile, showInstall }) {
  const steps = [
    center(
      'Início',
      '/',
      'boas-vindas',
      'Bem-vindo ao RPPApp',
      'Vamos conhecer o app inteiro, tela por tela, em poucos minutos. Você pode parar quando quiser.'
    )
  ]

  if (showInstall) {
    steps.push(center('Início', '/', 'instalar', 'Coloque o app na sua tela inicial', <InstallGuide />))
  }

  steps.push(
    step(
      'Início',
      '/',
      'menu',
      isMobile ? 'menu-mobile' : 'menu-desktop',
      'O menu',
      'Por aqui você chega a tudo: notícias, artigos, materiais de apoio e eventos.',
      isMobile ? 'bottom' : 'right'
    ),
    step(
      'Início',
      '/',
      'inicio-eventos',
      'eventos',
      'Tela inicial',
      'A tela inicial reúne o que há de mais novo: próximos eventos, notícias, artigos e novidades.'
    ),
    step('Início', '/', 'sino', 'sino', 'Avisos', 'O sininho mostra os avisos para você. Ative as notificações para não perder nada.'),
    step('Início', '/', 'personalizar', 'personalizar', 'Deixe do seu jeito', 'Aqui você escolhe o que aparece na sua tela inicial e em que ordem.'),

    step('Notícias', '/noticias', 'noticias-titulo', 'pagina-titulo', 'Notícias de mercado', 'Aqui ficam as notícias sobre RPPS e investimentos, atualizadas ao longo do dia.'),
    step('Notícias', '/noticias', 'noticias-item', 'pagina-primeiro-item', 'Abrir', 'Toque numa notícia para ler.'),

    step('Artigos', '/artigos', 'artigos-titulo', 'pagina-titulo', 'Artigos', 'Análises e estudos da Lema sobre RPPS e investimentos.'),
    step('Artigos', '/artigos', 'artigos-item', 'pagina-primeiro-item', 'Abrir', 'Toque num artigo para ler.'),

    step('Materiais de apoio', '/materiais', 'materiais-titulo', 'pagina-titulo', 'Materiais de apoio', 'Aqui estão os materiais para consultar e baixar.'),
    step('Materiais de apoio', '/materiais', 'materiais-item', 'pagina-primeiro-item', 'Abrir', 'Toque num material para abrir.'),

    step('Eventos', '/eventos', 'eventos-busca', 'eventos-busca', 'Buscar', 'Digite o nome do evento para procurar.'),
    step('Eventos', '/eventos', 'eventos-filtros', 'eventos-filtros', 'Filtros', 'Escolha categoria, modalidade ou estado para achar o evento certo.'),
    step('Eventos', '/eventos', 'eventos-item', 'primeiro-evento', 'Evento', 'Toque no cartão para ver os detalhes. O coração salva o evento nos seus favoritos.'),

    step('Favoritos', '/favoritos', 'favoritos-titulo', 'favoritos-titulo', 'Favoritos', 'Os eventos que você marcar com o coração aparecem aqui, para achar rápido depois.'),

    step('Novidades do UNO', '/novidades-uno', 'uno-titulo', 'pagina-titulo', 'Novidades do UNO', 'Avisos e novidades do sistema UNO.'),
    step('Novidades do UNO', '/novidades-uno', 'uno-item', 'pagina-primeiro-item', 'Abrir', 'Toque num aviso para ver os detalhes.'),

    step('Dashboard do UNO', '/dashboard-uno', 'dash-filtros', 'dash-filtros', 'Seu RPPS', 'Aqui aparece o nome do seu RPPS ou o de demonstração. Ao lado, escolha o mês e o ano.'),
    step('Dashboard do UNO', '/dashboard-uno', 'dash-periodo', 'dash-periodo', 'Período', 'Mude o período do gráfico, de 12 até 60 meses.'),
    step('Dashboard do UNO', '/dashboard-uno', 'dash-relatorio', 'dash-relatorio', 'Relatório', 'Toque aqui para gerar o relatório em PDF.'),

    step('Configurações', '/configuracoes', 'config-abas', 'config-abas', 'Suas configurações', 'Aqui você muda seus dados, avisos e lembretes.'),
    step('Configurações', '/configuracoes', 'config-instalar', 'config-instalar', 'Instalar o app', 'Aqui você instala o app na tela inicial do celular.'),

    step('Ajuda', '/ajuda/duvidas', 'ajuda-tutorial', 'ajuda-tutorial', 'Rever o tutorial', 'Quando quiser ver tudo isto de novo, é só tocar aqui.'),
    step('Ajuda', '/ajuda/duvidas', 'ajuda-faq', 'ajuda-faq', 'Dúvidas', 'Aqui estão as respostas para as dúvidas mais comuns.')
  )

  // Foco do produto: se ainda falta instalar, o ultimo passo lembra de novo.
  steps.push(
    showInstall
      ? center(
          'Ajuda',
          '/ajuda/duvidas',
          'fim',
          'Quase lá: instale o app',
          <>
            <p style={{ marginTop: 0 }}>Agora é só deixar o RPPApp na sua tela inicial:</p>
            <InstallGuide />
          </>
        )
      : center('Ajuda', '/ajuda/duvidas', 'fim', 'Pronto!', 'Agora você já conhece o RPPApp. Boa leitura!')
  )

  return steps
}
