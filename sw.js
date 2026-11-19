/* Vademecum PE : ressources critiques hors-ligne et mises à jour consenties. */
const VERSION='pe-pwa-v293';
const MEDIA='pe-offline-official-media-v1';
const CORE=VERSION+'-core',PHOTOS=VERSION+'-portraits';
const CODE=['./styles.css?v=257','./directory.js?v=225','./hemicycle.js?v=225','./interface.js?v=284','./quiz.js?v=289','./offline.js?v=225','./smart-search.js?v=225','./features.js?v=234'];
const OFFLINE=['./outils.html','./outils.html?v=252','./outils.js?v=251','./creation-cavaliers.html','./contacts-personnels.html','./creation-cavaliers.html?v=293','./cavaliers-core.js?v=2','./creation-cavaliers-227.js','./cavaliers-assistant-232.js','./','./index.html','./smart-search.js','./features.js','./secretariat-general.html','./commission-europeenne.html','./institutions-agences.html','./assets/presidences-conseil-ue-2026-2030.svg','./presidences-cinema.html','./assets/presidences-conseil-ue-cinema.avif','./commission-members.json','./members.json','./coordinators.json','./changes.json','./hemicycle-seats.json','./hemicycle-str-coordinates.json','./hemicycle-bru-coordinates.json','./committees.json','./photo-assets.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./assets/parlement-logo.png','./assets/greens-logo.svg','./assets/sg-juan-carlos-jimenez-marin.webp','./assets/sg-markus-winkler.webp','./assets/sg-alessandro-chiocchetti-user.webp','./assets/sg-markus-winkler-official.webp'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CORE);await cache.addAll(['./index.html','./members.json','./committees.json','./coordinators.json',...CODE].map(url=>new Request(url,{cache:'reload'})));await Promise.allSettled(OFFLINE.filter(url=>!['./index.html','./members.json','./committees.json','./coordinators.json'].includes(url)).map(url=>cache.add(url)));})());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('pe-pwa-')&&k!==CORE&&k!==PHOTOS).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
async function fromNetworkOrCache(request,isDocument){
 const cache=await caches.open(CORE);
 try{
  const response=await fetch(new Request(request,{cache:'no-store'}));
  if(response.ok)await cache.put(request,response.clone());
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
 if(url.origin!==self.location.origin)return;
 // Les PDF de cavaliers sont servis à la demande, sans cache hors ligne systématique.
 if(/\/cavaliers\/\d+\.pdf$/.test(url.pathname))return;
 if(/\/cavaliers\/index\.json$/.test(url.pathname)){event.respondWith(fromNetworkOrCache(request,false));return;}
 if(/\/(?:creation-cavaliers(?:-\d+)?\.js|cavaliers-assistant(?:-\d+)?\.js)$/.test(url.pathname)){event.respondWith(fromNetworkOrCache(request,false));return;}
 const isDocument=request.mode==='navigate';
 const isData=/\/(members|commission-members|committees|coordinators|photo-assets|hemicycle-seats|hemicycle-str-coordinates|hemicycle-bru-coordinates|changes)\.json$/.test(url.pathname);
 if(isDocument&&(/\/$/.test(url.pathname)||/\/index\.html$/.test(url.pathname))){
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
