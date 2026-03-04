const CACHE = 'bonjour-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// Daily reminder notification
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    if (list.length) return list[0].focus();
    return clients.openWindow('./index.html');
  }));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    // Store reminder time via IndexedDB or just use the alarm approach
    const { hour, minute } = e.data;
    scheduleDaily(hour, minute);
  }
});

function scheduleDaily(hour, minute) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;

  setTimeout(() => {
    self.registration.showNotification('Bonjour 🇫🇷', {
      body: 'Ton échauffement français t\'attend. Dix minutes.',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'daily-french',
      renotify: true,
      requireInteraction: false,
    });
    scheduleDaily(hour, minute); // reschedule for tomorrow
  }, delay);
}
