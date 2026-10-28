import { supabase } from './supabase'

// Metricas de uso proprias (tabela app_events), lidas pelo painel Admin.
// Falha silenciosa: medir nunca pode atrapalhar o uso do app.
export function logEvent(event, path = null) {
  supabase
    .from('app_events')
    .insert({ event, path })
    .then(({ error }) => {
      if (error) console.debug('app_events:', error.message)
    })
    .catch(() => {})
}

// "/artigos/abc" e "/artigos" contam como a mesma secao.
export const sectionOf = (pathname) => `/${pathname.split('/')[1] || ''}`
