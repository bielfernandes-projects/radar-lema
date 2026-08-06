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
  const target = eventId ? `/evento/${eventId}` : url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(target)
            return client.focus()
          }
        }
        return clients.openWindow(target)
      })
  )
})