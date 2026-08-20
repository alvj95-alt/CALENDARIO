// sw.js — Service Worker de TrenTurnos v5
// Sube este archivo UNA VEZ a la misma carpeta de GitHub Pages donde
// está tren_turnos_v5.html (normalmente la raíz del repositorio, o la
// misma carpeta donde vive ese HTML). No hace falta tocar nada más.
//
// Qué hace: guarda una copia de la página en el propio teléfono la
// primera vez que se abre, así que si luego no hay conexión, la app
// sigue abriendo (con los datos que ya tenía guardados localmente,
// como siempre). Cada vez que subas una versión nueva del HTML,
// cambia el número de versión (CACHE_NAME) de abajo para que los
// móviles de todo el mundo cojan la versión nueva en vez de la vieja
// guardada en caché.

const CACHE_NAME = 'trenturnos-v1';
const URLS_A_GUARDAR = [
  './',
  './index.html'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(URLS_A_GUARDAR).catch(function(){
        // Si alguna URL no se puede guardar (ej. nombre de archivo
        // distinto), no rompe la instalación del resto.
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(nombres){
      return Promise.all(
        nombres.filter(function(n){ return n !== CACHE_NAME; })
               .map(function(n){ return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  // Estrategia "red primero, caché de respaldo": si hay internet,
  // siempre coge la versión más reciente del servidor (para que los
  // cambios que subo lleguen enseguida); si no hay internet, usa la
  // última copia guardada.
  event.respondWith(
    fetch(event.request)
      .then(function(respuesta){
        var copia = respuesta.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copia); });
        return respuesta;
      })
      .catch(function(){ return caches.match(event.request); })
  );
});
