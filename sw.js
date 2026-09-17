// sw.js — Service Worker de TrenTurnos v5
// Sube este archivo a la misma carpeta de GitHub Pages donde está tu
// HTML principal, reemplazando el que ya tenías.
//
// Esta versión añade el soporte para NOTIFICACIONES PUSH (avisos con
// la app cerrada), además de mantener el arreglo anterior del icono
// que desaparecía solo de la pantalla de inicio en Android.

const CACHE_NAME = 'trenturnos-v3'; // subido a v3 para forzar a refrescar la caché de todos los móviles
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
  if(event.request.method !== 'GET'){ return; }

  event.respondWith(
    fetch(event.request)
      .then(function(respuesta){
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
          return caches.match('./');
        });
      })
  );
});

/* ═══════════════════════════════════════════════════════════
   NUEVO — Confirmado por el usuario: notificaciones PUSH.
   Cuando llega un aviso (aunque la app esté cerrada), esto lo
   recibe y lo muestra como cualquier notificación normal del
   móvil.
═══════════════════════════════════════════════════════════ */
self.addEventListener('push', function(event){
  var datos = {};
  try{ datos = event.data ? event.data.json() : {}; }catch(e){ datos = {}; }
  var titulo = datos.titulo || 'TrenTurnos';
  var opciones = {
    body: datos.cuerpo || '',
    data: { url: datos.url || './' },
    tag: 'trenturnos-aviso',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

// Al tocar la notificación, abre la app (o la enfoca si ya está
// abierta en alguna pestaña), en vez de dejarla sin hacer nada.
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var destino = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(listaClientes){
      for(var i=0; i<listaClientes.length; i++){
        if('focus' in listaClientes[i]) return listaClientes[i].focus();
      }
      if(clients.openWindow) return clients.openWindow(destino);
    })
  );
});
