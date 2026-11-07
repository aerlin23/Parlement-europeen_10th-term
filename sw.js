/* Trombinoscope PE – service worker. Les portraits consultés sont mis en cache au fur et à mesure. */
const VERSION='pe-pwa-v8';
const CORE=VERSION+'-core',PHOTOS=VERSION+'-portraits';
const OFFLINE=['./','./index.html','./members.json','./committees.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./assets/parlement-logo.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CORE).then(cache=>cache.addAll(OFFLINE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('pe-pwa-')&&n!==CORE&&n!==PHOTOS).map(n=>caches.delete(n)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 // Ne pas intercepter les photos du Parlement européen : Safari iOS les charge directement.
 // Un échec de récupération en cache opaque ne doit jamais bloquer l'affichage du portrait.
 if(url.hostname==='www.europarl.europa.eu'&&url.pathname.startsWith('/mepphoto/'))return;
 // Logos des groupes : conserver en cache ceux que l'utilisateur a affichés.
 if(url.origin===self.location.origin&&url.pathname.includes('/assets/group-logo.')){
  event.respondWith(caches.open(CORE).then(async cache=>{
   const hit=await cache.match(request);
   try{const response=await fetch(request);if(response.ok)cache.put(request,response.clone()).catch(()=>{});return response}
   catch{return hit||Response.error()}
  }));
  return;
 }
 if(url.origin!==self.location.origin)return;
 const isDocument=request.mode==='navigate',isData=/\/(members|committees)\.json$/.test(url.pathname);
 if(isDocument||isData){
  event.respondWith(fetch(new Request(request,{cache:'no-store'})).then(async response=>{
   if(response.ok){const cache=await caches.open(CORE);cache.put(request,response.clone()).catch(()=>{});}
   return response;
  }).catch(async()=>{const cache=await caches.open(CORE);return (await cache.match(request))||(isDocument?await cache.match('./index.html'):undefined)||Response.error()}));
  return;
 }
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
  if(response.ok)caches.open(CORE).then(cache=>cache.put(request,response.clone())).catch(()=>{});
  return response;
 })));
});
