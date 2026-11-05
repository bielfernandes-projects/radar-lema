import InstallGuide from './InstallGuide'

const center = { target: 'body', placement: 'center', skipBeacon: true }

// Funcao pura: o AppTour fixa o resultado na montagem.
export function buildTourSteps({ isMobile, showInstall }) {
  const steps = [
    {
      id: 'boas-vindas',
      ...center,
      title: 'Bem-vindo ao RPPApp',
      content: 'Vamos conhecer o app em 1 minuto. Você pode parar quando quiser.'
    }
  ]

  if (showInstall) {
    steps.push({
      id: 'instalar',
      ...center,
      title: 'Coloque o app na sua tela inicial',
      content: <InstallGuide />
    })
  }

  steps.push(
    {
      id: 'menu',
      target: isMobile ? '[data-tour="menu-mobile"]' : '[data-tour="menu-desktop"]',
      placement: isMobile ? 'bottom' : 'right',
      skipBeacon: true,
      title: 'O menu',
      content: 'Por aqui você chega a tudo: notícias, artigos, materiais de apoio e eventos.'
    },
    {
      id: 'eventos',
      target: '[data-tour="eventos"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Próximos eventos',
      content: 'Aqui aparecem os próximos congressos e cursos de RPPS. Toque num evento para ver os detalhes.'
    },
    {
      id: 'noticias',
      target: '[data-tour="noticias"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Notícias de mercado',
      content: 'As notícias mais recentes sobre RPPS e investimentos, reunidas num só lugar.'
    },
    {
      id: 'sino',
      target: '[data-tour="sino"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Avisos',
      content: 'O sininho mostra os avisos para você. Ative as notificações para não perder nada.'
    },
    {
      id: 'personalizar',
      target: '[data-tour="personalizar"]',
      placement: 'bottom',
      skipBeacon: true,
      title: 'Deixe do seu jeito',
      content: 'Aqui você escolhe o que aparece na sua tela inicial e em que ordem.'
    },
    {
      id: 'fim',
      ...center,
      title: 'Pronto!',
      content: 'Para ver este tutorial de novo, abra o menu, toque em Ajuda e depois em “Ver o tutorial de novo”.'
    }
  )

  return steps
}
