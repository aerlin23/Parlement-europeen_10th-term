/* Vademecum PE : ressources critiques hors-ligne et mises à jour consenties. */
const VERSION='pe-pwa-v181';
const MEDIA='pe-offline-official-media-v1';
const CORE=VERSION+'-core',PHOTOS=VERSION+'-portraits';
const OFFLINE=['./','./index.html','./smart-search.js','./features.js','./secretariat-general.html','./commission-europeenne.html','./institutions-agences.html','./assets/presidences-conseil-ue-2026-2030.svg','./presidences-cinema.html','./assets/presidences-conseil-ue-cinema.avif','./commission-members.json','./members.json','./coordinators.json','./changes.json','./hemicycle-seats.json','./hemicycle-str-coordinates.json','./hemicycle-bru-coordinates.json','./committees.json','./photo-assets.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./assets/parlement-logo.png','./assets/sg-juan-carlos-jimenez-marin.webp','./assets/sg-markus-winkler.webp','./assets/sg-alessandro-chiocchetti-user.webp','./assets/sg-markus-winkler-official.webp'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CORE);await cache.addAll(['./index.html','./members.json','./committees.json','./coordinators.json']);await Promise.allSettled(OFFLINE.filter(url=>!['./index.html','./members.json','./committees.json','./coordinators.json'].includes(url)).map(url=>cache.add(url)));})());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
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
  return await cache.match(request)||(isDocument?await cache.match('./index.html'):null)||Response.error();
 }
}
async function cachePhoto(request){
 const cache=await caches.open(PHOTOS);
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
 if((url.origin==='https://aerlin23.github.io'&&/^\/Commission-europeenne\/(photos\/\d+\.png|assets\/commission-logo\.svg)$/.test(url.pathname))||(url.origin==='https://www.europarl.europa.eu'&&/^\/(mepphoto|mepaudio)\/[0-9]+\.(jpg|mp3)$/.test(url.pathname))||(url.origin==='https://the-secretary-general.europarl.europa.eu'&&url.pathname.startsWith('/files/live/sites/secretarygeneral/files/images/'))){
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
 const isDocument=request.mode==='navigate';
 const isData=/\/(members|commission-members|committees|coordinators|photo-assets|hemicycle-seats|hemicycle-str-coordinates|hemicycle-bru-coordinates|changes)\.json$/.test(url.pathname);
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
