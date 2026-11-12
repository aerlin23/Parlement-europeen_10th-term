/* Vademecum PE : ressources critiques hors-ligne et mises à jour consenties. */
const VERSION='pe-pwa-v32';
const CORE=VERSION+'-core',PHOTOS=VERSION+'-portraits';
const OFFLINE=['./','./index.html','./secretariat-general.html','./members.json','./hemicycle-seats.json','./committees.json','./photo-assets.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./assets/parlement-logo.png','./assets/sg-juan-carlos-jimenez-marin.webp','./assets/sg-markus-winkler.webp'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CORE).then(cache=>cache.addAll(OFFLINE)));
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
 // Les portraits officiels externes ne sont pas interceptés : Safari les gère directement.
 if(url.origin!==self.location.origin)return;
 const isDocument=request.mode==='navigate';
 const isData=/\/(members|committees|photo-assets|hemicycle-seats)\.json$/.test(url.pathname);
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
