const CACHE_NAME = 'karaoke-cache-v2'; // Incrementa esto siempre (v3, v4...)
const assets = [
    '/',
    'index.html',
    'style.css',
    'app.js',
    'songs.js',
    'logo.png',
    'manifest.json'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(assets)));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )));
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});