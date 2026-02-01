self.addEventListener('push', function (event) {
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

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
