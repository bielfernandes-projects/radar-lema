// Espera o alvo de um passo existir no DOM (a tela nova carrega sob demanda e a lista busca dados).
// Sempre resolve: se estourar o tempo, deixa o joyride decidir (ele pula o passo se o alvo nao existir).
export function waitForTarget(selector, timeout = 10000, interval = 100) {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      if (document.querySelector(selector) || Date.now() - start >= timeout) resolve()
      else setTimeout(tick, interval)
    }
    tick()
  })
}
