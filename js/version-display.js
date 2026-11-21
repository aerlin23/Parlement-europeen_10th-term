/* The active service worker is the release version authority. */
(function(){
 const labels=document.querySelectorAll('[aria-label^="Version affichée :"]');
 if(!labels.length)return;
 let sequence=0;
 function show(value){for(const label of labels){label.textContent=value;label.setAttribute('aria-label','Version affichée : '+value)}}
 function sync(){
  if(!('serviceWorker' in navigator)){show('Version non disponible');return}
  const worker=navigator.serviceWorker.controller;if(!worker)return;
  const id=++sequence, channel=new MessageChannel();
  const timeout=setTimeout(()=>{channel.port1.close();if(id===sequence)show('Version non disponible')},3000);
  channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();const m=/^pe-pwa-v(\d+)$/.exec(e.data?.version||'');if(id===sequence)show(m?'v'+m[1]:'Version non disponible')};
  try{worker.postMessage({type:'GET_VERSION'},[channel.port2])}catch{clearTimeout(timeout);channel.port1.close();show('Version non disponible')}
 }
 if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('controllerchange',sync);navigator.serviceWorker.ready.then(sync);sync();window.addEventListener('pageshow',sync)}else sync();
})();
