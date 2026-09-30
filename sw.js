const CACHE = 'rutina-osea-v5';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  const req = e.request;
  const esShell = req.mode === 'navigate' || req.destination === 'document';

  if(esShell){
    // network-first para el shell de la app: así los cambios se ven al recargar,
    // y solo se cae a la caché cuando no hay conexión.
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, clone); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(cached){ return cached || caches.match('./index.html'); });
      })
    );
    return;
  }

  // resto de assets: cache-first con revalidación en segundo plano.
  e.respondWith(
    caches.match(req).then(function(cached){
      const fetchPromise = fetch(req).then(function(res){
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, clone); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
