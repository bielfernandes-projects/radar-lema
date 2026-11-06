// Opcoes do joyride compartilhadas pelo tour da home e pelos mini-tours.
export const TOUR_OPTIONS = {
  zIndex: 1400, // acima do AppBar do MUI (1201) e dos dialogs (1300)
  scrollOffset: 96, // o AppBar fixo tem 64px: sem folga, o alvo rola para tras dele
  targetWaitTimeout: 4000, // listas carregam de forma assincrona
  beforeTimeout: 15000, // o hook `before` navega e espera a tela nova (waitForTarget, ate 10s)
  overlayColor: 'rgba(0,0,0,0.6)',
  primaryColor: '#1565c0',
  buttons: ['back', 'primary', 'skip'],
  blockTargetInteraction: true
}
