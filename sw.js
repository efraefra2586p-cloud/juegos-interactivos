// Service worker: cachea todo el "app shell" en la instalación para que la
// app funcione 100% offline después de la primera carga. Cache-first: si
// el archivo está en caché se sirve de ahí, si no, se pide a la red (y de
// paso se guarda para la próxima).
//
// IMPORTANTE: al agregar un archivo nuevo (ej. un juego nuevo en js/games/),
// hay que sumarlo a APP_SHELL y subir CACHE_NAME (v1 -> v2...) para que los
// dispositivos que ya instalaron la app bajen la versión nueva.
const CACHE_NAME = "ji-cache-v3";
const APP_SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/storage.js",
  "js/audio.js",
  "js/speech.js",
  "js/confetti.js",
  "js/main.js",
  "js/games/memorama.js",
  "js/games/sumas.js",
  "js/games/colores.js",
  "js/games/carrera.js",
  "js/games/frutas.js",
  "js/games/laberinto.js",
  "js/games/ingles.js",
  "js/games/rompecabezas.js",
  "js/games/abecedario.js",
  "js/games/buencorazon.js",
  "js/games/sonidos.js",
  "js/games/culturavial.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
