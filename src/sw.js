import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

/* global clients */

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api/, /^\/storage/]
  })
)

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })]
  })
)

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      { cacheableResponse: { statuses: [0, 200] } }
    ]
  })
)

registerRoute(
  /^(?!.*placeholder-event).*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
  new StaleWhileRevalidate({
    cacheName: 'app-images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 })]
  })
)

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = { title: 'Radar Lema' }
  try {
    data = { ...data, ...(event.data ? event.data.json() : {}) }
  } catch {
    data = { title: 'Radar Lema', body: event.data ? event.data.text() : '' }
  }

  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data: { url: data.url || '/', eventId: data.eventId || null },
    vibrate: [100, 50, 100]
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const { url, eventId } = event.notification.data || {}

  // SEC-013: apenas navegacao same-origin. Se o push trouxer uma URL absoluta
  // de origem externa, ignoramos e caímos para a home em vez de abrir o link.
  let target = `${self.location.origin}/`
  if (eventId) {
    target = `${self.location.origin}/evento/${encodeURIComponent(eventId)}`
  } else if (url) {
    try {
      const parsed = new URL(url, self.location.origin)
      if (parsed.origin === self.location.origin) {
        target = parsed.href
      }
    } catch {
      target = `${self.location.origin}/`
    }
  }

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })

      const focused = windowClients.find((c) => c.focused)
      const visible = windowClients.find((c) => c.visibilityState === 'visible')
      const candidates = [focused, visible, ...windowClients].filter(Boolean)

      for (const client of candidates) {
        try {
          await client.navigate(target)
          return await client.focus()
        } catch {
          // tenta o proximo client da janela antes de abrir uma nova aba
        }
      }

      return clients.openWindow(target)
    })()
  )
})