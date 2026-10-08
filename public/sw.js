/* ================================================================
   SERVICE WORKER - APLIKASI SURAT KEMANTREN TEGALREJO
   Versi: 6.0.0
   ================================================================ */

   const CACHE_VERSION = 'v6.0.0';
   const CACHE_NAME = `surat-kemantren-${CACHE_VERSION}`;
   const RUNTIME_CACHE = `surat-kemantren-runtime-${CACHE_VERSION}`;
   
   // File inti — WAJIB ada
   const CORE_ASSETS = [
     '/',
     '/index.html',
     '/manifest.json',
   ];
   
   // File opsional — kalau gagal, tidak masalah
   const OPTIONAL_ASSETS = [
     '/logo.png',
     '/icon-192.png',
     '/icon-512.png',
   ];
   
   // ================================================================
   // INSTALL
   // ================================================================
   self.addEventListener('install', (event) => {
     console.log('[SW] Installing', CACHE_VERSION);
     event.waitUntil(
       (async () => {
         const cache = await caches.open(CACHE_NAME);
   
         // Cache core assets
         try {
           await cache.addAll(CORE_ASSETS);
         } catch (err) {
           console.warn('[SW] Core cache partial fail:', err);
           // Fallback: cache satu-satu
           for (const url of CORE_ASSETS) {
             try { await cache.add(url); } catch (e) { console.warn('[SW] Skip:', url); }
           }
         }
   
         // Cache optional satu-satu
         for (const url of OPTIONAL_ASSETS) {
           try { await cache.add(url); } catch { console.warn('[SW] Skip optional:', url); }
         }
       })()
     );
     self.skipWaiting();
   });
   
   // ================================================================
   // ACTIVATE
   // ================================================================
   self.addEventListener('activate', (event) => {
     console.log('[SW] Activating', CACHE_VERSION);
     event.waitUntil(
       (async () => {
         const keys = await caches.keys();
         await Promise.all(
           keys.map((name) => {
             if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
               console.log('[SW] Delete old cache:', name);
               return caches.delete(name);
             }
           })
         );
         await self.clients.claim();
       })()
     );
   });
   
   // ================================================================
   // FETCH
   // ================================================================
   self.addEventListener('fetch', (event) => {
     const { request } = event;
     const url = new URL(request.url);
   
     // Skip non-GET
     if (request.method !== 'GET') return;
   
     // Skip protocol yang bukan http/https
     if (!url.protocol.startsWith('http')) return;
   
     // === API: Network only, dengan pesan error kalau offline ===
     if (url.pathname.startsWith('/api/')) {
       event.respondWith(
         fetch(request).catch(() =>
           new Response(
             JSON.stringify({
               success: false,
               error: 'Anda sedang offline. Periksa koneksi internet.',
             }),
             { status: 503, headers: { 'Content-Type': 'application/json' } }
           )
         )
       );
       return;
     }
   
     // === /uploads: biarkan browser handle (jangan di-cache) ===
     if (url.pathname.startsWith('/uploads/')) {
       return;
     }
   
     // === Navigasi HTML: Network First, fallback ke cache ===
     if (request.mode === 'navigate' || request.destination === 'document') {
       event.respondWith(
         (async () => {
           try {
             const networkRes = await fetch(request);
             // Simpan ke runtime cache
             if (networkRes && networkRes.status === 200) {
               const clone = networkRes.clone();
               const cache = await caches.open(RUNTIME_CACHE);
               cache.put(request, clone).catch(() => {});
             }
             return networkRes;
           } catch {
             // Fallback: cari di cache
             const cached = await caches.match(request);
             if (cached) return cached;
             const indexCached = await caches.match('/index.html');
             if (indexCached) return indexCached;
             return new Response('Offline', { status: 503 });
           }
         })()
       );
       return;
     }
   
     // === Asset lain (JS, CSS, gambar, font): Cache First ===
     event.respondWith(
       (async () => {
         const cached = await caches.match(request);
         if (cached) return cached;
   
         try {
           const networkRes = await fetch(request);
   
           // Hanya cache response yang valid
           if (
             networkRes &&
             networkRes.status === 200 &&
             (networkRes.type === 'basic' || networkRes.type === 'cors')
           ) {
             const clone = networkRes.clone();
             const cache = await caches.open(RUNTIME_CACHE);
             cache.put(request, clone).catch(() => {});
           }
   
           return networkRes;
         } catch {
           // Fallback untuk gambar
           if (request.destination === 'image') {
             const logo = await caches.match('/logo.png');
             if (logo) return logo;
           }
           return new Response('', { status: 503 });
         }
       })()
     );
   });
   
   // ================================================================
   // MESSAGE — untuk apply update dari UI
   // ================================================================
   self.addEventListener('message', (event) => {
     if (event.data && event.data.type === 'SKIP_WAITING') {
       self.skipWaiting();
     }
   });