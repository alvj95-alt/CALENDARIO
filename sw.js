// sw.js — Service Worker de TrenTurnos v5
// Sube este archivo a la misma carpeta de GitHub Pages donde está tu
// HTML principal, reemplazando el que ya tenías. No hace falta tocar
// nada más — la próxima vez que el móvil se conecte, cogerá esta
// versión nueva automáticamente (por el cambio de CACHE_NAME de abajo).
//
// FIX — Confirmado por el usuario: el icono de la pantalla de inicio
// desaparecía solo en Android. La causa: cuando fallaba la red y la
// página pedida no estaba guardada en caché bajo esa URL exacta, el
// Service Worker devolvía "nada" (undefined) — Android interpreta eso
// como que la app está rota, y la desinstala sola sin avisar. Ahora,
// si no encuentra la página exacta, usa como último recurso la página
// principal ya guardada, para no devolver nunca "nada".

const CACHE_NAME = 'trenturnos-v2'; // subido de v1 a v2 a propósito, para forzar a limpiar la caché vieja (posiblemente rota) de todos los móviles
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
  // Solo se gestiona la caché para peticiones GET normales — las de
  // otro tipo (POST, etc.) se dejan pasar tal cual, sin tocarlas.
  if(event.request.method !== 'GET'){ return; }

  event.respondWith(
    fetch(event.request)
      .then(function(respuesta){
        // FIX — antes se guardaba CUALQUIER respuesta, incluidas
        // páginas de error. Ahora solo se guarda si de verdad cargó
        // bien (respuesta.ok), para no guardar por error una versión
        // rota como si fuera buena.
        if(respuesta && respuesta.ok){
          var copia = respuesta.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, copia).catch(function(){});
          });
        }
        return respuesta;
      })
      .catch(function(){
        return caches.match(event.request).then(function(match){
          if(match) return match;
          // FIX — Confirmado por el usuario: si no hay nada guardado
          // bajo esa URL exacta, en vez de devolver "nada" (lo que
          // Android interpreta como que la app está rota y la
          // desinstala sola), se usa como último recurso la página
          // principal ya guardada — así siempre hay algo que enseñar.
          return caches.match('./');
        });
      })
  );
});
