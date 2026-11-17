importScripts('version.js');
const V='convocunss-v'+APP_VERSION,F=['./','index.html','version.js','style.css','app.js','eps-core.js','lib/jspdf.umd.min.js','lib/xlsx.full.min.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/logo-unss.png'];
const T=2500; // si le réseau ne répond pas en 2,5 s, on sert la copie hors ligne
const net=r=>new Promise((ok,ko)=>{const t=setTimeout(()=>ko(new Error('timeout')),T);fetch(r,{cache:'no-cache'}).then(x=>{clearTimeout(t);ok(x)},e=>{clearTimeout(t);ko(e)})});
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(F.map(u=>fetch(u,{cache:'reload'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('convocunss')&&x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
// Réseau d'abord (dernière version en ligne), copie locale en secours (hors ligne ou réseau trop lent).
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||!q.url.startsWith(self.location.origin))return;
 e.respondWith(net(q).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(q,c))}return r})
  .catch(()=>caches.match(q,{ignoreSearch:true}).then(h=>h||(q.mode==='navigate'?caches.match('index.html').then(x=>x||caches.match('./')):undefined)||Response.error())))});
