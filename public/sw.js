const STATIC_CACHE = 'aero-static-v2'
const API_CACHE = 'aero-api-v1'
const APP_SHELL = ['/', '/offline', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

const cacheResponse = async (cacheName, request, response) => {
  if (!response || !response.ok) return response
  const cache = await caches.open(cacheName)
  cache.put(request, response.clone())
  return response
}

const networkFirst = async (request, cacheName, fallbackToOffline) => {
  try {
    const response = await fetch(request)
    return cacheResponse(cacheName, request, response)
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (fallbackToOffline) {
      const offline = await caches.match('/offline')
      if (offline) return offline
    }
    return Response.error()
  }
}

const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const networkPromise = fetch(request)
    .then((response) => cacheResponse(cacheName, request, response))
    .catch(() => null)

  if (cached) return cached
  const network = await networkPromise
  return network || Response.error()
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE, true))
    return
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, false))
    return
  }

  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('push', (event) => {
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { title: 'AERO CRM', body: event.data.text() }
    }
  }

  const title = data.title || 'AERO CRM'
  const options = {
    body: data.body || 'Yeni bildirim',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
      return undefined
    })
  )
})
