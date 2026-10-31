import { CLIPS } from './content.js';

const CACHE = 'puppy-adventures-1.0.1';
const BASE = new URL('./', self.location.href);
const SHELL = ['./', './index.html', './fonts.css', './styles.css', './tablet.css', './app.js', './art.js', './audio.js', './content.js', './engine.js', './manifest.webmanifest', './assets/icon.svg', './assets/rubik-400.ttf', './assets/rubik-600.ttf', './assets/rubik-800.ttf'];
const ASSETS = [...SHELL, ...Object.keys(CLIPS).map(key => `./assets/audio/${key}.mp3`)];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new URL(url, BASE).href))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('puppy-adventures-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
