import posthog from 'posthog-js'

const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const host = import.meta.env.VITE_POSTHOG_HOST

export function initPosthog() {
  if (!token || posthog.__loaded) return
  posthog.init(token, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: true
  })
}

// Sem token (dev/preview) o PostHog não é inicializado: não capturar nada.
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
