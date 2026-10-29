import posthog from 'posthog-js'

const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const host = import.meta.env.VITE_POSTHOG_HOST
const CONSENT_KEY = 'rppapp:analytics-consent'

// 'granted' | 'denied' | null (ainda não escolheu)
export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY)
  } catch {
    return null
  }
}

function startPosthog() {
  if (!token || posthog.__loaded) return
  posthog.init(token, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: true
  })
}

// LGPD: o PostHog só inicia depois do aceite do usuário.
export function initPosthog() {
  if (getConsent() === 'granted') startPosthog()
}

export function setConsent(granted) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
  } catch {
    // sem localStorage: a escolha vale só nesta sessão
  }
  if (granted) startPosthog()
  else if (posthog.__loaded) posthog.opt_out_capturing()
}

// Sem token (dev/preview) ou sem aceite o PostHog não é inicializado: não capturar nada.
export function track(event, props) {
  if (posthog.__loaded) posthog.capture(event, props)
}

// Só o id e atributos de perfil; sem e-mail ou nome (LGPD).
export function identifyUser(userId, props) {
  if (posthog.__loaded) posthog.identify(userId, props)
}

export function resetIdentity() {
  if (posthog.__loaded) posthog.reset()
}

export { posthog }
