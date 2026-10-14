const CACHE_NAME = 'tasktrack-static-v4';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll([
            OFFLINE_URL,
            '/tasktrack-mark.svg',
            '/manifest.webmanifest',
        ])),
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key.startsWith('tasktrack-') && key !== CACHE_NAME)
                .map((key) => caches.delete(key)),
        )),
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
        return;
    }

    if (url.pathname.startsWith('/build/assets/') || url.pathname.startsWith('/fonts/') || url.pathname === '/tasktrack-mark.svg') {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            })),
        );
    }
});