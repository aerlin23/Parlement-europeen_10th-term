/* Téléchargement explicite des ressources officielles : le cache persiste entre versions. */
async function downloadOfficialOfflineMedia(){
 const button=document.getElementById('downloadOffline'),status=document.getElementById('offlineStatus');
 if(!('caches' in window)){status.textContent='Le stockage hors ligne n’est pas disponible sur ce navigateur.';return}
 if(!navigator.onLine){status.textContent='Connecte-toi à Internet pour commencer le téléchargement.';return}
 if(!members.length){status.textContent='La liste des députés doit d’abord être chargée.';return}
 button.disabled=true;
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
     if(navigator.storage?.persist&&!already&&done===0){navigator.storage.persist().catch(()=>{})}
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
  status.textContent=failed
   ? 'Terminé : '+(done-failed)+'/'+done+' fichiers conservés ('+already+' déjà présents). '+failed+' échec(s) : '+failedFiles.slice(0,5).join(' ; ')+(failedFiles.length>5?' ; …':'')+'. Vérifie le fonctionnement en mode avion.'
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
  const displayUpdate=()=>{
   if(registration?.waiting&&!applying){
    notice.hidden=false;
    return true;
   }
   return false;
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
    if(!updating){updating=true;location.reload()}
   });
   registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
   registration.addEventListener('updatefound',()=>{watch(registration.installing);displayUpdate()});
   watch(registration.installing);displayUpdate();
   apply.onclick=()=>{
    if(session){notice.firstChild.textContent='Termine le quiz avant la mise à jour. ';return}
    const worker=registration.waiting;
    if(!worker||applying)return;
    applying=true;apply.disabled=true;apply.textContent='Mise à jour…';
    worker.addEventListener('statechange',()=>{
     if(worker.state==='redundant'&&applying){applying=false;apply.disabled=false;apply.textContent='Mettre à jour';notice.firstChild.textContent='Mise à jour interrompue. Réessaie. ';displayUpdate()}
    });
    worker.postMessage({type:'SKIP_WAITING'});
   };
   check.onclick=()=>refresh(true);
   refresh();
   document.addEventListener('visibilitychange',()=>{if(!document.hidden){displayUpdate();refresh()}});
   window.addEventListener('pageshow',()=>{displayUpdate();refresh()});
   window.addEventListener('focus',()=>{displayUpdate();refresh()});
   window.addEventListener('online',()=>refresh());
  }catch(error){status.textContent=' · Vérification indisponible';check.onclick=()=>location.reload();console.warn('Mise à jour PWA indisponible',error)}
 });
}
