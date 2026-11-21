/* Téléchargement explicite des ressources officielles : le cache persiste entre versions. */
async function downloadOfficialOfflineMedia(){
 const button=document.getElementById('downloadOffline'),status=document.getElementById('offlineStatus');
 if(!('caches' in window)){status.textContent='Le stockage hors ligne n’est pas disponible sur ce navigateur.';return}
 if(!navigator.onLine){status.textContent='Connecte-toi à Internet pour commencer le téléchargement.';return}
 if(!members.length){status.textContent='La liste des députés doit d’abord être chargée.';return}
 button.disabled=true;
 if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
 const ids=[...new Set(members.map(m=>String(m.id)).filter(id=>/^\d+$/.test(id)))];
 const base='https://www.europarl.europa.eu/';
 const urls=ids.flatMap(id=>[
  photoAssets.photos.has(id)?new URL('./photos/'+id+'.jpg',location.href).href:base+'mepphoto/'+id+'.jpg',
  photoAssets.thumbs.has(id)?new URL('./thumbs/'+id+'.webp',location.href).href:null,
  base+'mepaudio/'+id+'.mp3'
 ].filter(Boolean));
 for(const url of Object.values(SG_PE_PHOTOS)){if(url.startsWith('https://the-secretary-general.europarl.europa.eu/'))urls.push(url)}
  try{
   const response=await fetch('./commission-members.json');
   if(response.ok){
    const commissioners=await response.json();
    for(const member of commissioners){if(member.localPhoto)urls.push(member.localPhoto);else if(member.photo)urls.push(member.photo)}
    urls.push('https://aerlin23.github.io/Commission-europeenne/assets/commission-logo.svg');
   }
  }catch(error){console.warn('Médias de la Commission indisponibles pour téléchargement',error)}

 // Conserver aussi les portraits externes de « Autres institutions ».
 // Les URL sont lues dans la page publiée pour rester synchronisées avec les fiches.
 try{
  const response=await fetch('./institutions-agences.html',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const html=await response.text();
  const portraits=[...html.matchAll(/"photo":"(https?:\\/\\/[^"]+)"/g)].map(match=>match[1]);
  urls.push(...portraits);
 }catch(error){console.warn('Portraits des autres institutions indisponibles au téléchargement',error)}

 // Les dépendances documentaires sont préparées sur demande, pas à chaque visite.
 // Le cache partagé persiste lors des changements de version de la PWA.
 const libraries=[
  'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs'
 ];
 const libraryFailures=[];
 try{
  const libraryCache=await caches.open('vf-document-libraries-v2');
  let prepared=0;
  for(const url of libraries){
   try{
    const request=new Request(url,{mode:'cors',credentials:'omit'});
    if(!await libraryCache.match(request)){
     const response=await fetch(request);
     if(!response.ok)throw Error('HTTP '+response.status);
     await libraryCache.put(request,response.clone());
    }
   }catch(error){libraryFailures.push(new URL(url).pathname.split('/').pop()+' : '+(error?.message||'réseau'))}
   prepared++;
   status.textContent='Préparation des bibliothèques : '+prepared+'/'+libraries.length+' · erreurs : '+libraryFailures.length;
  }
 }catch(error){libraryFailures.push('Stockage des bibliothèques indisponible')}

 const failedFiles=[];
 const memberById=new Map(members.map(m=>[String(m.id),m.name]));
 let done=0,failed=0,already=0,next=0;
 try{
  const cache=await caches.open('pe-offline-official-media-v1');
  const worker=async()=>{
   while(next<urls.length){
    const url=urls[next++];
    try{
     if(await cache.match(url)){already++;done++;continue}
     // no-cors autorise la conservation de ressources officielles tierces (réponse opaque).
     const response=await fetch(url,{mode:new URL(url).origin===location.origin?'same-origin':'no-cors',credentials:'omit',cache:'no-store'});
     if(!(response.ok||response.type==='opaque'))throw Error('réponse invalide');
     await cache.put(url,response);
     
    }catch(error){
     failed++;
     const photoOrAudio=url.match(/\/(mepphoto|mepaudio)\/([0-9]+)\./);
     const label=photoOrAudio
       ? (photoOrAudio[1]==='mepaudio'?'Audio':'Photo')+' : '+(memberById.get(photoOrAudio[2])||photoOrAudio[2])
       : (url.includes('secretary-general')?'Secrétariat général':'Commission européenne')+' : '+decodeURIComponent(url.split('/').pop().split('?')[0]);
     failedFiles.push(label+' ('+(error?.message||'erreur de réseau')+')');
    }
    done++;
    if(done%12===0||done===urls.length)status.textContent=
      'Téléchargement '+done+'/'+urls.length+' · erreurs : '+failed;
   }
  };
  await Promise.all(Array.from({length:4},()=>worker()));
  status.textContent=failed||libraryFailures.length
   ? 'Terminé : '+(done-failed)+'/'+done+' fichiers conservés ('+already+' déjà présents). '+failed+' échec(s) médias : '+failedFiles.slice(0,5).join(' ; ')+(failedFiles.length>5?' ; …':'')+' ; bibliothèques : '+(libraryFailures.length?libraryFailures.join(' ; '):'OK')+'. Vérifie le fonctionnement en mode avion.'
   : 'Terminé : '+done+' ressources conservées ('+already+' déjà présents). Vérifie le fonctionnement en mode avion.';
 }catch(error){status.textContent='Échec du stockage : espace insuffisant, navigateur incompatible ou accès réseau bloqué.'}
 finally{button.disabled=false;button.textContent='Compléter / actualiser les fichiers hors ligne'}
}
document.getElementById('downloadOffline').addEventListener('click',downloadOfficialOfflineMedia);

if('serviceWorker' in navigator){
 window.addEventListener('load',async()=>{
  const notice=$('appUpdateNotice'),apply=$('applyAppUpdate'),check=$('checkAppUpdate'),status=$('checkAppUpdateStatus');
  check.hidden=false;
  let registration,applying=false,updating=false,checking=false,lastCheck=0;
  const watched=new WeakSet();
  const reloadOnce=()=>{if(updating)return;updating=true;notice.hidden=true;location.reload()};
  const displayUpdate=()=>{
   const ready=!!registration?.waiting && registration.waiting.state==='installed';
   notice.hidden=!(ready||applying);
   if(!applying){apply.disabled=false;apply.textContent='Mettre à jour';}
   return ready;
  };
  const watch=worker=>{
   if(!worker||watched.has(worker))return;
   watched.add(worker);worker.addEventListener('statechange',displayUpdate);
  };
  const refresh=async(manual=false)=>{
   if(!registration||checking)return;
   if(!manual&&Date.now()-lastCheck<15000){displayUpdate();return}
   if(!navigator.onLine){if(manual)status.textContent=' · Hors connexion';return}
   checking=true;lastCheck=Date.now();
   if(manual){check.disabled=true;status.textContent=' · Vérification…'}
   try{
    await registration.update();
    watch(registration.installing);
    if(manual&&registration.installing){
     const worker=registration.installing;
     await new Promise(resolve=>{
      const done=()=>{if(['installed','activated','redundant'].includes(worker.state)){worker.removeEventListener('statechange',done);resolve()}};
      worker.addEventListener('statechange',done);done();setTimeout(resolve,15000);
     });
    }
    const ready=displayUpdate();
    if(manual){status.textContent=ready?' · Mise à jour disponible':registration.installing?' · Installation en cours':' · Aucune nouvelle version détectée';if(ready)notice.scrollIntoView({block:'center'})}
   }catch(error){if(manual)status.textContent=' · Vérification impossible, réessaie.'}
   finally{checking=false;check.disabled=false}
  };
  try{
   navigator.serviceWorker.addEventListener('controllerchange',()=>{
    // Ne pas interrompre un quiz ou une saisie sur une activation extérieure.
    if(applying)reloadOnce();else displayUpdate();
   });
   registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
   registration.addEventListener('updatefound',()=>{watch(registration.installing);displayUpdate()});
   watch(registration.installing);displayUpdate();
   apply.onclick=()=>{
    if(session){notice.firstChild.textContent='Termine le quiz avant la mise à jour. ';return}
    const worker=registration.waiting;
    if(!worker||worker.state!=='installed'){displayUpdate();return} 
    if(applying)return;
    applying=true;apply.disabled=true;apply.textContent='Mise à jour…';
    worker.addEventListener('statechange',()=>{
     if(worker.state==='activated'&&applying){reloadOnce();return}
     if(worker.state==='redundant'&&applying){applying=false;apply.disabled=false;apply.textContent='Mettre à jour';notice.firstChild.textContent='Mise à jour interrompue. Réessaie. ';displayUpdate()}
    });
    try{worker.postMessage({type:'SKIP_WAITING'})}catch(e){applying=false;displayUpdate();return}
    setTimeout(()=>{
     if(!applying||updating)return;
     if(worker.state==='activated'||registration.active===worker){reloadOnce();return}
     applying=false;displayUpdate();
     if(registration.waiting===worker)notice.firstChild.textContent='Mise à jour en attente. Réessaie. ';
     else status.textContent=' · Vérifie à nouveau la mise à jour.';
    },20000);
   };
   check.onclick=()=>refresh(true);
   refresh();
   document.addEventListener('visibilitychange',()=>{if(!document.hidden){displayUpdate();refresh()}});
   window.addEventListener('pageshow',event=>{if(event.persisted&&applying&&(!registration.waiting||registration.active?.state==='activated')){if(!registration.waiting){reloadOnce();return}}displayUpdate();refresh()});
   window.addEventListener('focus',()=>{displayUpdate();refresh()});
   window.addEventListener('online',()=>refresh());
  }catch(error){status.textContent=' · Vérification indisponible';check.onclick=()=>location.reload();console.warn('Mise à jour PWA indisponible',error)}
 });
}
