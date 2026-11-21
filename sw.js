/* Vademecum PE : ressources critiques hors-ligne et mises à jour consenties. */
const VERSION='pe-pwa-v364';
const MEDIA='pe-offline-official-media-v1';
const scopePath=new URL(self.registration.scope).pathname;
const previewName=scopePath.match(/\/(preview-v\d+)\/$/)?.[1];
const cachePrefix=previewName?'pe-'+previewName+'-':'pe-pwa-';
const CACHE_VERSION=previewName?cachePrefix+'two-themes-isolated':VERSION;
const CORE=CACHE_VERSION+'-core',PHOTOS=CACHE_VERSION+'-portraits';
const DOCUMENT_LIBRARIES='vf-document-libraries-v2';
const LIBRARY_URLS=new Set([
 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs'
]);
const CODE=['./css/directory-night-contrast.css?v=364','./js/cavalier-vector-pdf.js','./css/shared-cavaliers-base.css','./css/shared-layout.css','./css/shared-dark-controls.css','./css/shared-header.css','./css/shared-theme-toggle.css','./css/shared-night-theme.css','./css/shared-night-update.css','./js/version-display.js','./creation-cavaliers-editor-preview.js?v=364','./creation-cavaliers-preview.html','./cavaliers-core-preview.js?v=364','./cavaliers-assistant-preview.js?v=364','./css/navigation-final.css?v=325','./styles.css?v=360','./directory.js?v=225','./hemicycle.js?v=352','./interface.js?v=324','./quiz.js?v=360','./offline.js?v=336','./smart-search.js?v=225','./features.js?v=364'];
const OFFLINE=['./cavaliers/index.json','./outils.html','./outils.html?v=252','./outils.js?v=251','./creation-cavaliers.html','./contacts-personnels.html','./creation-cavaliers.html?v=305','./cavaliers-core.js?v=364','./creation-cavaliers-227.js','./cavaliers-assistant-232.js','./','./index.html','./smart-search.js','./features.js','./secretariat-general.html','./commission-europeenne.html','./institutions-agences.html','./assets/presidences-conseil-ue-2026-2030.svg','./presidences-cinema.html','./assets/presidences-conseil-ue-cinema.avif','./commission-members.json','./members.json','./coordinators.json','./changes.json','./hemicycle-seats.json','./hemicycle-str-coordinates.json','./hemicycle-bru-coordinates.json','./committees.json','./photo-assets.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./assets/parlement-logo.png','./assets/greens-logo.svg','./assets/sg-juan-carlos-jimenez-marin.webp','./assets/sg-markus-winkler.webp','./assets/sg-alessandro-chiocchetti-user.webp','./assets/sg-markus-winkler-official.webp'];
const ESSENTIAL=['./index.html','./home.html','./members.json','./committees.json','./coordinators.json','./changes.json',...CODE];
// Pages principales préchargées en priorité ; ressources secondaires non bloquantes.
const SECONDARY=['./creation-cavaliers.html','./contacts-personnels.html','./commission-europeenne.html','./institutions-agences.html','./outils.html','./secretariat-general.html','./hemicycle-seats.json','./hemicycle-str-coordinates.json','./hemicycle-bru-coordinates.json','./commission-members.json','./photo-assets.json','./cavaliers-core.js?v=361','./creation-cavaliers-227.js','./cavaliers-assistant-232.js','./outils.js?v=251'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CORE);
  await cache.addAll([...new Set(ESSENTIAL)].map(url=>new Request(url,{cache:'reload'})));
  await Promise.allSettled([...new Set([...SECONDARY,...OFFLINE])].filter(url=>!ESSENTIAL.includes(url)).map(url=>cache.add(new Request(url,{cache:'reload'}))));
 })());
});

self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='GET_VERSION'&&event.ports[0])event.ports[0].postMessage({version:VERSION});
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith(cachePrefix)&&k!==CORE&&k!==PHOTOS).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
async function fromNetworkOrCache(request,isDocument){
 const cache=await caches.open(CORE);
 try{
  const response=await fetch(new Request(request,{cache:'no-store'}));
  if(response.ok){await cache.put(request,response.clone());return response;}
  if(response.status>=500){const fallback=await cache.match(request);if(fallback)return fallback;}
  return response;
 }catch{
  const exact=await cache.match(request);if(exact)return exact;
  if(isDocument){const samePage=await cache.match(request,{ignoreSearch:true});if(samePage)return samePage;
   return new Response('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hors connexion</title><body><h1>Page indisponible hors connexion</h1><p>Reconnectez-vous pour charger cette page.</p><a href="./">Retour au Vademecum</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});}
  return Response.error();
 }
}
async function cachePhoto(request){
 const cache=await caches.open(PHOTOS);
 const persistent=await caches.open(MEDIA);
 const saved=await persistent.match(request);
 if(saved)return saved;
 const hit=await cache.match(request);
 if(hit)return hit;
 try{
  const response=await fetch(request);
  if(response.ok){
   await cache.put(request,response.clone());
   const keys=await cache.keys();
   // Éviter un stockage illimité sur iOS et Android.
   if(keys.length>240)await Promise.all(keys.slice(0,keys.length-240).map(key=>cache.delete(key)));
  }
  return response;
 }catch{return Response.error()}
}
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 // Conserver les portraits et voix officiels dans un cache durable, même après mise à jour.
 if((url.origin==='https://aerlin23.github.io'&&/^\/Commission-europeenne\/(photos\/\d+\.(?:png|jpg|jpeg|webp)|assets\/commission-logo\.svg)$/.test(url.pathname))||(url.origin==='https://www.europarl.europa.eu'&&/^\/(mepphoto|mepaudio)\/[0-9]+\.(jpg|mp3)$/.test(url.pathname))||(url.origin==='https://the-secretary-general.europarl.europa.eu'&&url.pathname.startsWith('/files/live/sites/secretarygeneral/files/images/'))){
  event.respondWith((async()=>{
   const cache=await caches.open(MEDIA);
   const hit=await cache.match(url.href);
   if(hit)return hit;
   try{
    const response=await fetch(request);
    if(response.ok||response.type==='opaque')await cache.put(url.href,response.clone());
    return response;
   }catch{return Response.error()}
  })());
  return;
 }
 // Bibliothèques documentaires : cache utilisable sans réseau après le premier chargement.
 if(LIBRARY_URLS.has(url.href)){
  event.respondWith((async()=>{
   const cache=await caches.open(DOCUMENT_LIBRARIES);
   const saved=await cache.match(request);
   if(saved)return saved;
   try{
    const response=await fetch(request);
    if(response.ok||response.type==='opaque')await cache.put(request,response.clone());
    return response;
   }catch{return Response.error()}
  })());
  return;
 }
 if(url.origin!==self.location.origin||!url.pathname.startsWith(scopePath))return;
 // Laisser le navigateur charger un aperçu avant son premier enregistrement PWA.
 if(/^preview-v\d+(?:\/|$)/.test(url.pathname.slice(scopePath.length)))return;
 // Les PDF de cavaliers sont servis à la demande, sans cache hors ligne systématique.
 if(/\/cavaliers\/\d+\.pdf$/.test(url.pathname))return;
 if(/\/cavaliers\/index\.json$/.test(url.pathname)){event.respondWith(fromNetworkOrCache(request,false));return;}
 if(/\/(?:creation-cavaliers(?:-\d+)?\.js|cavaliers-assistant(?:-\d+)?\.js)$/.test(url.pathname)){event.respondWith(fromNetworkOrCache(request,false));return;}
 const isDocument=request.mode==='navigate';
 const isData=/\/(members|commission-members|committees|coordinators|photo-assets|hemicycle-seats|hemicycle-str-coordinates|hemicycle-bru-coordinates|changes)\.json$/.test(url.pathname);
 if(isDocument&&(url.pathname===scopePath||url.pathname===scopePath+'index.html')){
  event.respondWith((async()=>{const cache=await caches.open(CORE);return await cache.match('./index.html')||fetch(request)})());return;
 }
 if(isDocument||isData){event.respondWith(fromNetworkOrCache(request,isDocument));return}
 if(/\/(photos|thumbs)\/[0-9]+\.(jpg|webp)$/.test(url.pathname)){
  event.respondWith(cachePhoto(request));return;
 }
 // Les ressources statiques déjà enregistrées restent disponibles hors ligne.
 event.respondWith((async()=>{
  const cache=await caches.open(CORE);
  const hit=await cache.match(request);
  if(hit)return hit;
  try{
   const response=await fetch(request);
   if(response.ok)cache.put(request,response.clone()).catch(()=>{});
   return response;
  }catch{return Response.error()}
 })());
});
