function hemicycleMarker(){
 const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
 icon.setAttribute('class','hemicycle-symbol');icon.setAttribute('viewBox','0 0 24 15');icon.setAttribute('aria-hidden','true');
 for(const d of ['M1 14a11 11 0 0 1 22 0','M5 14a7 7 0 0 1 14 0','M9 14a3 3 0 0 1 6 0']){
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('fill','none');icon.append(path);
 }
 return icon;
}

const seatPlanURL={str:'https://www.europarl.europa.eu/plenary/fr/hemicycle.html',bru:'https://www.europarl.europa.eu/plenary/fr/hemicycle.html'};
const seatMapPromises={};
async function getSeatMap(city){
 if(!['str','bru'].includes(city))throw Error('Hémicycle inconnu');
 if(!seatMapPromises[city])seatMapPromises[city]=(async()=>{
  if(!('DecompressionStream' in window))throw Error('Décompression non disponible');
  const response=await fetch('./hemicycle-'+city+'-coordinates.json');
  if(!response.ok)throw Error('Coordonnées non disponibles');
  const data=await response.json();
  const raw=Uint8Array.from(atob(data.data),c=>c.charCodeAt(0));
  const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate'));
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
  if(bytes.length!==863*4)throw Error('Coordonnées incomplètes');
  const view=new DataView(bytes.buffer);
  const positions=Array.from({length:863},(_,i)=>[view.getUint16(i*4),view.getUint16(i*4+2)]);
  if(city==='bru'&&data.verifiedOverrides&&typeof data.verifiedOverrides==='object'){
   for(const [seat,position] of Object.entries(data.verifiedOverrides)){
    const index=Number(seat)-1;
    if(!Number.isInteger(index)||index<0||index>=positions.length)continue;
    if(!Array.isArray(position)||position.length!==2||!position.every(v=>Number.isInteger(v)&&v>0&&v<=1191))continue;
    positions[index]=position;
   }
  }
  if(city==='bru'&&Array.isArray(data.suppressedPositions)){for(const n of data.suppressedPositions){if(Number.isInteger(n)&&n>=1&&n<=positions.length)positions[n-1]=[0,0]}}
  if(city==='bru'){[positions[9],positions[10]]=[positions[10],positions[9]];}
  return positions;
 })().catch(error=>{delete seatMapPromises[city];throw error});
 return seatMapPromises[city];
}
function seatSVG(name,attributes={},content){
 const node=document.createElementNS('http://www.w3.org/2000/svg',name);
 Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,String(value)));
 if(content!==undefined)node.textContent=content;
 return node;
}
// Couleurs dédiées aux sièges : lisibles et distinctes sur le fond clair.
const SEAT_GROUP_COLORS={'PPE':'#2177bd','S&D':'#d7576e','PfE':'#414da0','ECR':'#4196c7','Renew':'#e3af2e','Verts/ALE':'#65a64c','The Left':'#b64584','ESN':'#53667f','NI':'#8f969f'};
const SEAT_GROUP_LABELS={'PPE':'PPE','S&D':'S&D','PfE':'Patriotes','ECR':'ECR','Renew':'Renew','Verts/ALE':'Verts/ALE','The Left':'The Left','ESN':'ESN','NI':'Non-inscrits'};
function seatGroupsForCity(city){
 const assigned=new Map();
 for(const m of members){
  const seat=hemicycleSeats[String(m.id)]?.[city];
  if(Number.isInteger(seat)&&seat>=1&&seat<=863&&Object.hasOwn(SEAT_GROUP_COLORS,m.group)){
   assigned.set(seat,m.group);
  }
 }
 return assigned;
}
async function showSeatOnPlan(city,number=null,memberName='',memberGroup='',options={}){
 const overview=number===null;
 // Conserver l'identité du député, pas le numéro de siège propre à une ville.
 let selectedMep=options.memberId?members.find(m=>String(m.id)===String(options.memberId)):(!overview?members.find(m=>hemicycleSeats[String(m.id)]?.[city]===number):null);
 const existing=document.querySelector('.seat-map-backdrop');
 const reuse=!!(existing&&options.keepMode&&existing.seatMapDetach);
 const previous=reuse?existing.seatMapDetach():null;
 if(existing&&!reuse)existing.querySelector('[aria-label="Fermer le plan"]')?.click();
 const backdrop=reuse?existing:el('div','seat-map-backdrop'),dialog=reuse?previous.dialog:el('section','seat-map-dialog');
 if(reuse){dialog.replaceChildren();dialog.classList.remove('seat-map-overview');}
 dialog.dataset.city=city;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
 dialog.setAttribute('aria-label','Localisation de la place en hémicycle');
 const head=el('div','seat-map-head'),heading=el('h2','',(city==='str'?'Strasbourg':'Bruxelles')+(overview?'':' · place '+number));
 const setPlanIcon=(button,kind,label)=>{
  const paths={search:'M21 21l-5-5 M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',rotate:'M20 7v5h-5 M20 12a8 8 0 1 0-2.3 5.7',portrait:'M4 7v5h5 M4 12a8 8 0 1 1 2.3 5.7',expand:'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M3 16v5h5',reduce:'M3 8h5V3 M21 8h-5V3 M16 21v-5h5 M8 21v-5H3'};
  const icon=seatSVG('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.9,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'});
  icon.append(seatSVG('path',{d:paths[kind]}));button.replaceChildren(icon);button.classList.add('seat-plan-icon-button');button.title=label;button.setAttribute('aria-label',label);
 };
 const close=el('button','', '×');close.type='button';close.setAttribute('aria-label','Fermer le plan');
 const expand=el('button','seat-map-expand','⛶ Plein écran');expand.type='button';expand.setAttribute('aria-pressed','false');setPlanIcon(expand,'expand','Plein écran');
 const rotate=el('button','seat-map-expand','⟳ Pivoter');rotate.type='button';
 setPlanIcon(rotate,'rotate','Pivoter l’écran en mode paysage');
 const groupHeader=el('button','seat-map-expand seat-map-groups-header','Groupes');
 groupHeader.type='button';groupHeader.title='Afficher les groupes politiques sur le plan';
 groupHeader.setAttribute('aria-pressed','false');
 groupHeader.hidden=true;
 const wholeHeader=el('button','seat-map-expand seat-whole-header','Vue entière');wholeHeader.type='button';wholeHeader.onclick=()=>camera?.fit(1,false);
 const readingMap=el('div','reading-mode seat-map-reading');readingMap.setAttribute('role','group');readingMap.setAttribute('aria-label','Taille de lecture du plan');
 const syncReadingMap=()=>{const mode=document.body.classList.contains('reading-large')?'large':'normal';for(const button of readingMap.children)button.setAttribute('aria-pressed',String(button.dataset.reading===mode));camera?.render()};
 for(const [mode,label] of [['normal','Standard'],['large','Agrandissement']]){const button=el('button','','A');button.type='button';button.dataset.reading=mode;button.title=label;button.setAttribute('aria-label','Lecture du plan : '+label);button.onclick=()=>{setReadingMode(mode);syncReadingMap()};readingMap.append(button)}
 const headActions=el('div','seat-map-head-actions');headActions.append(readingMap,wholeHeader,groupHeader,rotate,expand,close);
 head.append(heading,headActions);
 let orientationLocked=previous?.orientationLocked||false,camera=null,cinema=false;
 const setCinema=on=>{
  cinema=on;dialog.classList.toggle('seat-map-cinema',on);backdrop.classList.toggle('seat-map-cinema',on);
  groupHeader.hidden=!on;
  // Le mode paysage couvre l'écran sans étirement ; le doigt peut atteindre les bords opposés.
  if(camera)requestAnimationFrame(()=>camera.focusSeat());
 };
 const restoreOrientation=async()=>{
  if(orientationLocked&&screen.orientation?.unlock){
   try{screen.orientation.unlock()}catch{}
  }
  orientationLocked=false;
  setPlanIcon(rotate,'rotate','Pivoter l’écran en mode paysage');
  rotate.setAttribute('aria-pressed','false');
  setCinema(false);
 };
 rotate.setAttribute('aria-pressed','false');
 rotate.onclick=async()=>{
  if(cinema){
   await restoreOrientation();
   return;
  }
  // L'API de rotation exige le plein écran dans plusieurs navigateurs mobiles.
  if(!dialog.classList.contains('seat-map-expanded'))setExpanded(true);
  setCinema(true);
  if(document.fullscreenElement!==dialog&&typeof dialog.requestFullscreen==='function'){
   try{await dialog.requestFullscreen()}catch{}
  }
  if(screen.orientation?.lock){
   try{
    await screen.orientation.lock('landscape');
    orientationLocked=true;
    requestAnimationFrame(()=>{if(backdrop.isConnected&&camera)camera.focusSeat()});
    setPlanIcon(rotate,'portrait','Revenir en mode portrait');
    rotate.setAttribute('aria-pressed','true');
    return;
   }catch{}
  }
  setPlanIcon(rotate,'portrait','Quitter le mode paysage');rotate.setAttribute('aria-pressed','true');
  rotate.title='Tourne le téléphone manuellement si nécessaire ; appuie ici pour quitter le mode paysage';
 };
 const setExpanded=expanded=>{
  if(!expanded&&cinema){setCinema(false);if(orientationLocked&&screen.orientation?.unlock){try{screen.orientation.unlock()}catch{}}orientationLocked=false}
  backdrop.classList.toggle('seat-map-expanded',expanded);
  dialog.classList.toggle('seat-map-expanded',expanded);
  setPlanIcon(expand,expanded?'reduce':'expand',expanded?'Réduire':'Plein écran');
  expand.setAttribute('aria-pressed',String(expanded));
  if(camera)requestAnimationFrame(()=>{if(expanded)camera.focusSeat();else camera.resize()});
 };
 expand.onclick=async()=>{
  const expanded=!dialog.classList.contains('seat-map-expanded');
  setExpanded(expanded);
  if(!expanded&&document.fullscreenElement===dialog){
   try{await document.exitFullscreen()}catch{}
  }
 };
 const syncFullscreen=()=>{
  if(document.fullscreenElement!==dialog){
   restoreOrientation();
   if(dialog.classList.contains('seat-map-expanded')&&typeof dialog.requestFullscreen==='function'&&document.fullscreenEnabled)setExpanded(false);
  }
 };
 document.addEventListener('fullscreenchange',syncFullscreen);
 const detail=el('p','seat-map-caption',memberName+(memberGroup?' · '+(SEAT_GROUP_LABELS[memberGroup]||memberGroup):''));detail.hidden=overview;
 const area=el('div','seat-map-area','Chargement du plan…');
 const controls=el('div','seat-map-controls');
 const original=el('a','', 'Consulter le plan officiel actualisé');original.href=seatPlanURL[city];original.target='_blank';original.rel='noopener noreferrer';
 controls.append(original);
 const matchedMember=members.find(m=>hemicycleSeats[String(m.id)]?.[city]===number);
 if(matchedMember){
  const profile=el('a','seat-map-view-person','Voir la fiche de '+matchedMember.name);
  profile.href='?person='+encodeURIComponent(String(matchedMember.id));
  profile.title='Ouvrir la fiche dans Vademecum PE';
  controls.prepend(profile);
 }
 const citySwitch=el('div','seat-city-switch');
 {
  for(const [key,label] of [['str','Strasbourg'],['bru','Bruxelles']]){
   const button=el('button','seat-city-button',label);button.dataset.city=key;button.type='button';button.setAttribute('aria-pressed',String(key===city));button.onclick=()=>{
    if(key===city)return;
    const seat=selectedMep?hemicycleSeats[String(selectedMep.id)]?.[key]:null;
    const hasSeat=Number.isInteger(seat)&&seat>0;
    showSeatOnPlan(key,hasSeat?seat:null,hasSeat?selectedMep.name:'',hasSeat?selectedMep.group:'',{keepMode:true,expanded:dialog.classList.contains('seat-map-expanded'),cinema:cinema,memberId:selectedMep?.id});
   };citySwitch.append(button);
  }
  if(overview)dialog.classList.add('seat-map-overview');
 }
 const searchBox=el('div','seat-plan-search');
 const searchInput=el('input','');searchInput.type='search';searchInput.placeholder='Nom ou n° de siège…';searchInput.setAttribute('aria-label','Rechercher dans le plan');
 const searchResults=el('div','seat-plan-results');searchResults.hidden=true;
 searchBox.append(searchInput,searchResults);
 const searchToggle=el('button','seat-map-expand seat-search-toggle','⌕');searchToggle.type='button';searchToggle.title='Rechercher un député ou un siège';setPlanIcon(searchToggle,'search','Rechercher un député ou un siège');headActions.prepend(searchToggle);
 searchBox.hidden=false;
 searchToggle.setAttribute('aria-expanded',String(!searchBox.hidden));
 searchToggle.onclick=()=>{searchBox.hidden=!searchBox.hidden;searchToggle.setAttribute('aria-expanded',String(!searchBox.hidden));if(!searchBox.hidden)searchInput.focus()};
 dialog.append(head,detail,citySwitch,searchBox,area,controls);if(!reuse){backdrop.append(dialog);document.body.append(backdrop)}
 const previousFocus=previous?.previousFocus||document.activeElement;
 let releaseCameraListeners=()=>{};
 const dismiss=()=>{
  releaseCameraListeners();
  restoreOrientation();
  if(document.fullscreenElement===dialog)document.exitFullscreen().catch(()=>{});
  backdrop.remove();
  document.removeEventListener('keydown',escape);
  document.removeEventListener('fullscreenchange',syncFullscreen);
  if(previousFocus?.focus)previousFocus.focus();
 };
 const escape=e=>{if(e.key==='Escape')dismiss()};
 const onBackdropClick=e=>{if(e.target===backdrop)dismiss()};
 backdrop.seatMapDetach=()=>{
  releaseCameraListeners();
  document.removeEventListener('keydown',escape);
  document.removeEventListener('fullscreenchange',syncFullscreen);
  backdrop.removeEventListener('click',onBackdropClick);
  return {dialog,orientationLocked,previousFocus};
 };
 close.onclick=dismiss;backdrop.addEventListener('click',onBackdropClick);document.addEventListener('keydown',escape);close.focus();syncReadingMap();
 if(options.expanded)setExpanded(true);
 if(options.cinema){setCinema(true);setPlanIcon(rotate,'portrait',orientationLocked?'Revenir en mode portrait':'Quitter le mode paysage');rotate.setAttribute('aria-pressed','true')}

 try{
  const positions=await getSeatMap(city);
  if(!area.isConnected)return;
  const point=overview?(city==='bru'?[597.5,537.5]:[595,527.5]):positions[number-1];
  if(!point||!point[0]||!point[1]){area.textContent='Cette place ne possède pas de position graphique fiable sur le plan du '+(city==='bru'?'11 novembre 2026':'19 octobre 2026')+'. Consulte le plan officiel pour la vérifier.';return}
  area.replaceChildren();
  const fullView=city==='bru'?'335 350 525 375':'340 350 510 375';const svg=seatSVG('svg',{viewBox:fullView,class:'seat-map-canvas',role:'group','aria-label':'Plan interactif des sièges de '+(city==='bru'?'Bruxelles':'Strasbourg')+', place '+number+' repérée en bleu foncé'});
  svg.setAttribute('preserveAspectRatio',dialog.classList.contains('seat-map-expanded')?'xMidYMid slice':'xMidYMid meet');
  const base=fullView.split(' ').map(Number),bounds={x:base[0],y:base[1],w:base[2],h:base[3]};
  const view={x:bounds.x,y:bounds.y,w:bounds.w,h:bounds.h};
  const viewportRatio=()=>{const rect=svg.getBoundingClientRect();return rect.width>0&&rect.height>0?rect.width/rect.height:bounds.w/bounds.h};
  const zoomLevel=()=>bounds.w/view.w;
  let seatNumberLabels=null,selectedMarker=null,searchFocus=null,previewRing=null;
  const clampView=()=>{
   const ratio=viewportRatio();
   view.w=Math.min(Math.max(bounds.w,bounds.h*ratio),Math.max(bounds.w/20,view.w));
   view.h=view.w/ratio;
   view.x=view.w>=bounds.w?bounds.x+(bounds.w-view.w)/2:Math.max(bounds.x,Math.min(bounds.x+bounds.w-view.w,view.x));
   view.y=view.h>=bounds.h?bounds.y+(bounds.h-view.h)/2:Math.max(bounds.y,Math.min(bounds.y+bounds.h-view.h,view.y));
   if(searchFocus){view.x=searchFocus[0]-view.w/2;view.y=searchFocus[1]-view.h/2;searchFocus=null}
  };
  const renderCamera=()=>{
   clampView();
   svg.setAttribute('preserveAspectRatio','xMidYMid meet');
   svg.setAttribute('viewBox',view.x+' '+view.y+' '+view.w+' '+view.h);
   if(seatNumberLabels){
    const scale=svg.getBoundingClientRect().width/Math.max(view.w,1);
    const visible=scale>=3.4;
    seatNumberLabels.style.display=visible?'':'none';
    svg.classList.toggle('seat-numbers-visible',visible);
    if(visible){const large=document.body.classList.contains('reading-large');seatNumberLabels.setAttribute('font-size',String(Math.min(large?3.4:2.8,(large?16:12)/scale)))}
   }
   if(previewRing){const px=svg.getBoundingClientRect().width/Math.max(view.w,1);previewRing.setAttribute('r',String((2.45+2/Math.max(px,.1))))}
   if(selectedMarker){
    const px=svg.getBoundingClientRect().width/Math.max(view.w,1);
    const large=document.body.classList.contains('reading-large');
    const markerScale=(large?17:13)/(12*Math.max(px,.1));
    selectedMarker.setAttribute('transform','translate('+x+' '+y+') scale('+markerScale+') translate('+(-x)+' '+(-y)+')');
   }
  };
  const fitCamera=(scale=1,cover=false)=>{
   const ratio=viewportRatio();
   const fitW=cover?Math.min(bounds.w,bounds.h*ratio):Math.max(bounds.w,bounds.h*ratio);
   view.w=fitW/scale;view.h=view.w/ratio;
   view.x=bounds.x+(bounds.w-view.w)/2;view.y=bounds.y+(bounds.h-view.h)/2;
   renderCamera();
  };
  const zoomAt=(factor,px=.5,py=.5)=>{
   const beforeX=view.x+px*view.w,beforeY=view.y+py*view.h;
   view.w/=factor;view.h=view.w/viewportRatio();
   view.x=beforeX-px*view.w;view.y=beforeY-py*view.h;
   renderCamera();
  };
  camera={
   fit:fitCamera,zoomAt,render:renderCamera,
   focusSeat:()=>{if(overview){fitCamera(1,false);return}const ratio=viewportRatio();view.w=Math.min(bounds.w*.72,bounds.h*.72*ratio);view.h=view.w/ratio;view.x=point[0]-view.w/2;view.y=point[1]-view.h/2;renderCamera()},
   resize:()=>{const cx=view.x+view.w/2,cy=view.y+view.h/2;view.h=view.w/viewportRatio();view.x=cx-view.w/2;view.y=cy-view.h/2;renderCamera()}
  };
  const svgPosition=(clientX,clientY)=>{
   const rect=svg.getBoundingClientRect();
   return {x:(clientX-rect.left)/Math.max(rect.width,1),y:(clientY-rect.top)/Math.max(rect.height,1)};
  };
  // Recalcule le cadrage si l'écran pivote ou si le navigateur redimensionne la modale.
  const viewportObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>{if(backdrop.isConnected)camera.resize()}):null;
  viewportObserver?.observe(svg);
  const previousCleanup=releaseCameraListeners;
  releaseCameraListeners=()=>{viewportObserver?.disconnect();previousCleanup()};
  let gesture=null,suppressClickUntil=0;
  svg.addEventListener('touchstart',event=>{
   const t=[...event.touches];
   if(t.length===1)gesture={type:'pan',x:t[0].clientX,y:t[0].clientY,view:{...view}};
   else if(t.length>=2){const cx=(t[0].clientX+t[1].clientX)/2,cy=(t[0].clientY+t[1].clientY)/2;gesture={type:'pinch',distance:Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY),cx,cy,view:{...view}}}
  },{passive:true});
  svg.addEventListener('touchmove',event=>{
   if(!gesture)return;
   event.preventDefault();
   if(event.touches.length>1||gesture.type==='pinch'||Math.hypot(event.touches[0]?.clientX-gesture.x||0,event.touches[0]?.clientY-gesture.y||0)>6)suppressClickUntil=Date.now()+450;
   const t=[...event.touches];
   if(gesture.type==='pan'&&t.length===1){
    const p=svgPosition(t[0].clientX,t[0].clientY),start=svgPosition(gesture.x,gesture.y);
    view.x=gesture.view.x-(p.x-start.x)*gesture.view.w;view.y=gesture.view.y-(p.y-start.y)*gesture.view.h;view.w=gesture.view.w;view.h=gesture.view.h;renderCamera();
   }else if(t.length>=2){
    const cx=(t[0].clientX+t[1].clientX)/2,cy=(t[0].clientY+t[1].clientY)/2;
    if(gesture.type!=='pinch'){gesture={type:'pinch',distance:Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY),cx,cy,view:{...view}}}
    const factor=Math.max(0.1,Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY))/Math.max(gesture.distance,1);
    const p=svgPosition(gesture.cx,gesture.cy),centerX=gesture.view.x+p.x*gesture.view.w,centerY=gesture.view.y+p.y*gesture.view.h;
    view.w=gesture.view.w/factor;view.h=view.w/viewportRatio();view.x=centerX-p.x*view.w;view.y=centerY-p.y*view.h;renderCamera();
   }
  },{passive:false});
  svg.addEventListener('touchend',()=>{gesture=null},{passive:true});
  svg.addEventListener('touchcancel',()=>{gesture=null},{passive:true});
  svg.addEventListener('wheel',event=>{event.preventDefault();const p=svgPosition(event.clientX,event.clientY);zoomAt(event.deltaY<0?1.2:1/1.2,p.x,p.y)},{passive:false});
  let dragging=null;
  svg.addEventListener('mousedown',event=>{if(event.button!==0)return;dragging={x:event.clientX,y:event.clientY,view:{...view}}});
  const onDragMove=event=>{if(!dragging||!backdrop.isConnected)return;const start=svgPosition(dragging.x,dragging.y),end=svgPosition(event.clientX,event.clientY);view.x=dragging.view.x-(end.x-start.x)*dragging.view.w;view.y=dragging.view.y-(end.y-start.y)*dragging.view.h;renderCamera()};
  const onDragEnd=()=>{dragging=null};
  window.addEventListener('mousemove',onDragMove);
  window.addEventListener('mouseup',onDragEnd);
  const cleanupViewport=releaseCameraListeners;
  releaseCameraListeners=()=>{cleanupViewport();window.removeEventListener('mousemove',onDragMove);window.removeEventListener('mouseup',onDragEnd)};
  svg.addEventListener('dblclick',event=>{const p=svgPosition(event.clientX,event.clientY);zoomAt(1.7,p.x,p.y)});
  renderCamera();
  const preview=el('div','seat-person-preview');preview.hidden=true;preview.setAttribute('role','region');preview.setAttribute('aria-label','Député sélectionné');
  const previewInfo=el('div','seat-person-info'),previewName=el('a','seat-preview-name'),previewMeta=el('span','');
  previewInfo.append(previewName,previewMeta);
  const previewClose=el('button','seat-person-close','×');
  previewClose.type='button';previewClose.setAttribute('aria-label','Fermer l’identification');previewClose.onclick=()=>{preview.hidden=true};
  let previewSeat=null;
  const previewLocate=el('button','seat-person-locate');previewLocate.type='button';previewLocate.title='Recentrer sur le siège sélectionné';previewLocate.setAttribute('aria-label',previewLocate.title);
  const locateIcon=seatSVG('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','aria-hidden':'true'});
  locateIcon.append(seatSVG('circle',{cx:12,cy:12,r:7}),seatSVG('circle',{cx:12,cy:12,r:2.5}),seatSVG('path',{d:'M12 2V5 M12 19V22 M2 12H5 M19 12H22'}));previewLocate.append(locateIcon);
  previewLocate.onclick=()=>{
   const p=positions[(previewSeat??0)-1];if(!p||!p[0]||!p[1])return;
   const ratio=viewportRatio();
   const pixelWidth=svg.getBoundingClientRect().width;
   view.w=Math.min(bounds.w*.42,bounds.h*.55*ratio,pixelWidth>0?pixelWidth/3.8:Infinity);view.h=view.w/ratio;
   // Keep the selected seat above the preview, including short iPhone viewports.
   const mapRect=svg.getBoundingClientRect(),cardRect=preview.getBoundingClientRect();
   const safeFraction=mapRect.height>0?Math.max(.15,Math.min(.5,(cardRect.top-mapRect.top-28)/mapRect.height)): .35;
   searchFocus=[p[0],p[1]+view.h*(.5-safeFraction)];renderCamera();
  };
  const previewPhoto=el('a','seat-preview-photo');preview.append(previewPhoto,previewInfo,previewLocate,previewClose);
  previewRing=seatSVG('circle',{r:3.1,fill:'none',stroke:city==='bru'?'#a0802b':'#073b7e','stroke-width':1.5,'vector-effect':'non-scaling-stroke','pointer-events':'none',visibility:'hidden'});
  const showPreview=(m,n)=>{
   if(Date.now()<suppressClickUntil)return;
   previewSeat=n;selectedMep=m;rememberMep(m);
   const p=positions[n-1];if(p){previewRing.setAttribute('cx',p[0]);previewRing.setAttribute('cy',p[1]);previewRing.setAttribute('visibility','visible')}
   if(selectedMarker)selectedMarker.setAttribute('visibility','hidden');
   renderCamera();
   previewPhoto.replaceChildren(imageBox(m,false,true));
   previewName.textContent=m.name;
   previewMeta.replaceChildren(el('b','seat-preview-number',String(n)),document.createTextNode(' · '+(SEAT_GROUP_LABELS[m.group]||m.group||'')));
   const href='?person='+encodeURIComponent(String(m.id));
   previewPhoto.href=previewName.href=href;
   previewPhoto.title=previewName.title='Ouvrir la fiche de '+m.name;previewPhoto.setAttribute('aria-label',previewPhoto.title);
   previewPhoto.onclick=previewName.onclick=()=>{try{sessionStorage.setItem('pe-plan-return',JSON.stringify({city,view:{...view},n,expanded:dialog.classList.contains('seat-map-expanded'),cinema:cinema}))}catch{}};
   preview.hidden=false;
  };
  const background=seatSVG('g');
  const assignedGroups=seatGroupsForCity(city),seatCircles=[];
  const seatOwners=new Map();for(const m of members){const occupied=hemicycleSeats[String(m.id)]?.[city];if(Number.isInteger(occupied))seatOwners.set(occupied,m)}
  for(let i=0;i<positions.length;i++){
   const [x,y]=positions[i];if(!x||!y)continue;
   const seat=seatSVG('circle',{cx:x,cy:y,r:2.45,fill:'#a4b4c4',class:'seat-map-dot'});
   background.append(seat);
   seatCircles.push([seat,assignedGroups.get(i+1),seatOwners.get(i+1)]);
   const owner=seatOwners.get(i+1);
   if(owner){const hit=seatSVG('circle',{cx:x,cy:y,r:3.1,fill:'transparent',class:'seat-map-pick',tabindex:i+1===number?0:-1,role:'button','aria-label':'Place '+(i+1)+' : '+owner.name+' · '+owner.group});const tooltip=seatSVG('title',{},'Place '+(i+1)+' · '+owner.name+' · '+owner.group);hit.append(tooltip);const pick=()=>showPreview(owner,i+1);hit.addEventListener('click',()=>{hit.blur();pick()});hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();pick()}});background.append(hit)}
  }
  const normalizeSeatText=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const searchMatches=()=>{
   const q=normalizeSeatText(searchInput.value);if(!q)return [];
   const seat=/^([sb])?\s*(\d{1,3})$/i.exec(q);
   if(seat){const target=seat[1]==='s'?'str':seat[1]==='b'?'bru':city;const n=Number(seat[2]);const m=members.find(m=>hemicycleSeats[String(m.id)]?.[target]===n);return m?[{m,n,target}]:[]}
   return members.filter(m=>normalizeSeatText(m.name).includes(q)&&Number.isInteger(hemicycleSeats[String(m.id)]?.[city])).slice(0,6).map(m=>({m,n:hemicycleSeats[String(m.id)][city],target:city}));
  };
  const pickSearch=({m,n,target})=>{
   if(target!==city){showSeatOnPlan(target,n,m.name,m.group,{keepMode:true,expanded:dialog.classList.contains('seat-map-expanded'),cinema:cinema,memberId:m.id});return}
   const p=positions[n-1];if(!p||!p[0]||!p[1]){searchResults.replaceChildren(el('span','','Position non disponible'));searchResults.hidden=false;return}
   searchInput.value='';searchResults.hidden=true;searchResults.replaceChildren();searchInput.blur();
   if(selectedMarker)selectedMarker.setAttribute('visibility','hidden');
   suppressClickUntil=0;
   requestAnimationFrame(()=>{
    if(!backdrop.isConnected)return;
    const ratio=viewportRatio();
    view.w=Math.min(bounds.w*.42,bounds.h*.55*ratio);
    view.h=view.w/ratio;
    view.x=p[0]-view.w/2;view.y=p[1]-view.h/2;
    // Un siège périphérique doit lui aussi pouvoir être centré.
    searchFocus=p;renderCamera();
    showPreview(m,n);
   });
  };
  searchInput.oninput=()=>{searchResults.replaceChildren();const matches=searchMatches();for(const item of matches){const btn=el('button','',item.m.name+' · '+(item.target==='str'?'S':'B')+item.n+' · '+item.m.group);btn.type='button';btn.onclick=()=>pickSearch(item);searchResults.append(btn)}if(searchInput.value.trim()&&!matches.length)searchResults.append(el('span','','Aucun résultat'));searchResults.hidden=!searchInput.value.trim()};
  searchInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const item=searchMatches()[0];if(item)pickSearch(item)}};
  seatNumberLabels=seatSVG('g',{class:'seat-number-labels','aria-hidden':'true'});
  for(let i=0;i<positions.length;i++){
   const p=positions[i];if(!p||!p[0]||!p[1])continue;
   const label=seatSVG('text',{x:p[0],y:p[1],'text-anchor':'middle','dominant-baseline':'central','font-weight':700,fill:'#173548'},String(i+1));
   const owner=seatOwners.get(i+1);if(owner){label.setAttribute('pointer-events','all');label.setAttribute('class','seat-map-pick');label.addEventListener('click',()=>{label.blur?.();showPreview(owner,i+1)})}else label.setAttribute('pointer-events','none');
   seatNumberLabels.append(label);
  }
  seatNumberLabels.style.display='none';
  const [x,y]=point;
  const marker=seatSVG('g');
  selectedMarker=marker;
  const selectedOwner=seatOwners.get(number);
  if(selectedOwner){marker.setAttribute('role','button');marker.setAttribute('tabindex','0');marker.setAttribute('class','seat-map-pick');marker.setAttribute('aria-label','Identifier '+selectedOwner.name);const openSelected=()=>showPreview(selectedOwner,number);marker.addEventListener('click',openSelected);marker.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openSelected()}})}
  marker.append(seatSVG('circle',{cx:x,cy:y,r:13,fill:city==='bru'?'#f5e8bf':'#1e4b8b','fill-opacity':city==='bru'?'.55':'.17',stroke:city==='bru'?'#a0802b':'#1e4b8b','stroke-width':1.2}));
  marker.append(seatSVG('circle',{cx:x,cy:y,r:5,fill:city==='bru'?'#b9952e':'#073b7e',stroke:'white','stroke-width':2}));
  const labelX=Math.max(city==='bru'?365:365,Math.min(x,city==='bru'?830:815));
  const labelY=Math.max(367,y-27);
  marker.append(seatSVG('path',{d:`M${x} ${y-8} L${labelX} ${labelY+9}`,stroke:city==='bru'?'#a0802b':'#164b86','stroke-width':1.3}));
  marker.append(seatSVG('rect',{x:labelX-25,y:labelY-12,width:50,height:21,rx:8,fill:city==='bru'?'#f5e8bf':'#073b7e'}));
  marker.append(seatSVG('text',{x:labelX,y:labelY+2,'text-anchor':'middle',fill:city==='bru'?'#684e0e':'#fff','font-size':12,'font-weight':700},String(number)));
  svg.append(background,seatNumberLabels);
  // Les deux zones institutionnelles sont attestées sur le plan de Strasbourg.
  if(city==='str'){
   const institutions=seatSVG('g',{'pointer-events':'none','aria-label':'Zones institutionnelles'});
   institutions.append(seatSVG('text',{x:480,y:710,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#526575'},'Conseil'));
   institutions.append(seatSVG('text',{x:710,y:710,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'#526575'},'Commission'));
   svg.append(institutions);
  }
  if(!overview)svg.append(marker);svg.append(previewRing);area.append(svg,preview);
  requestAnimationFrame(()=>{if(!area.isConnected)return;if(options.view){Object.assign(view,options.view);renderCamera()}else camera.focusSeat()});
  let activeGroup=null;
  const legend=el('div','seat-group-legend');legend.hidden=true;legend.setAttribute('aria-label','Légende des groupes politiques');
  for(const [group,color] of Object.entries(SEAT_GROUP_COLORS)){
   if(![...assignedGroups.values()].includes(group))continue;
   const entry=el('button','seat-group-legend-item seat-group-filter');entry.type='button';entry.dataset.group=group;entry.setAttribute('aria-pressed','false');
   entry.onclick=()=>{activeGroup=activeGroup===group?null:group;paintGroups()};
   const dot=el('span','seat-group-dot');dot.style.backgroundColor=color;
   entry.append(dot,document.createTextNode(SEAT_GROUP_LABELS[group]));legend.append(entry);
  }
  const unassigned=assignedGroups.size<positions.filter(p=>p[0]&&p[1]).length;
  if(unassigned){const entry=el('span','seat-group-legend-item');const dot=el('span','seat-group-dot');dot.style.backgroundColor='#a4b4c4';entry.append(dot,document.createTextNode('Non attribué / non renseigné'));legend.append(entry)}
  area.append(legend);
  
  const groupBtn=el('button','seat-group-toggle','Vue groupes');groupBtn.type='button';groupBtn.setAttribute('aria-pressed','false');
  const planFilters=el('details','seat-extra-filters');
 const filterSummary=el('summary','','Filtres du plan');planFilters.append(filterSummary);
 const filterRow=el('div','seat-filter-row');
 const makeFilter=(label,items)=>{const select=el('select');select.setAttribute('aria-label',label);for(const [value,text] of [['',label],...items]){const option=el('option','',text);option.value=value;select.append(option)}filterRow.append(select);return select};
 const countryFilter=makeFilter('Tous les pays',[...new Set(members.map(m=>m.country))].sort((a,b)=>(fr[a]||a).localeCompare(fr[b]||b,'fr')).map(c=>[c,fr[c]||c]));
 const committeeFilter=makeFilter('Toutes les commissions',Object.keys(committeeDefs).sort().map(c=>[c,c]));
 const functionFilter=makeFilter('Toutes les fonctions',[['presidencype','Présidence du PE'],['quaestor','Questeurs'],['chair','Présidents de commission'],['vicechair','Vice-présidents de commission'],['grouppresident','Présidents de groupe'],['coord','Coordinateurs']]);
 const filterStatus=el('span','seat-filter-status');filterStatus.setAttribute('role','status');filterRow.append(filterStatus);planFilters.append(filterRow);
 searchBox.after(planFilters);
 for(const field of [countryFilter,committeeFilter,functionFilter])field.addEventListener('change',paintGroups);
 function paintGroups(){
   const on=groupBtn.getAttribute('aria-pressed')==='true';
   const a={country:countryFilter.value,committee:committeeFilter.value,func:functionFilter.value};let hits=0;const filtering=!!(a.country||a.committee||a.func);
   for(const [circle,group,owner] of seatCircles){
    circle.setAttribute('fill',on&&group?SEAT_GROUP_COLORS[group]:'#a4b4c4');
    const matches=(!on||!activeGroup||group===activeGroup)&&(!filtering||(owner&&matchesMultiSearch(owner,a)));if(matches&&owner)hits++;
    circle.setAttribute('opacity',matches?'1':'.15');
   }
   filterStatus.textContent=filtering?hits+' députés sur le plan':'';
   for(const button of legend.querySelectorAll('[data-group]'))button.setAttribute('aria-pressed',String(activeGroup===button.dataset.group));
  }
  groupHeader.onclick=()=>groupBtn.click();
  groupBtn.onclick=()=>{
   const groupsOn=groupBtn.getAttribute('aria-pressed')!=='true';
   groupBtn.setAttribute('aria-pressed',String(groupsOn));
   groupBtn.textContent=groupsOn?'Vue simple':'Vue groupes';
   groupHeader.textContent=groupsOn?'Sans groupes':'Groupes';
   groupHeader.setAttribute('aria-pressed',String(groupsOn));
   if(!groupsOn)activeGroup=null;paintGroups();
   legend.hidden=!groupsOn;
   svg.setAttribute('aria-label','Plan des sièges de '+(city==='bru'?'Bruxelles':'Strasbourg')+(groupsOn?', couleurs par groupe politique':'')+', place '+number+' repérée en bleu foncé');
  };
  controls.prepend(groupBtn);
  groupBtn.click();
  const zoomBtn=el('button','','Vue entière');
  zoomBtn.type='button';
  zoomBtn.onclick=()=>camera.fit(1,false);
  controls.prepend(zoomBtn);
  const zoomControls=el('div','seat-map-zoom');
  for(const [label,factor] of [['−',1/1.5],['+',1.5]]){const btn=el('button','',label);btn.type='button';btn.setAttribute('aria-label',factor>1?'Zoom avant':'Zoom arrière');btn.onclick=()=>camera.zoomAt(factor);zoomControls.append(btn)}
  const fit=el('button','','Vue entière');fit.type='button';fit.onclick=()=>camera.fit(1,false);zoomControls.append(fit);
  controls.prepend(zoomControls);
 }catch(error){if(area.isConnected)area.textContent='Plan indisponible sur cet appareil. Ouvre le PDF officiel pour consulter la place.';console.warn('Carte des places',error)}
}

document.getElementById('openHemicycle').addEventListener('click',()=>{
 let saved=null;try{saved=JSON.parse(sessionStorage.getItem('pe-plan-return')||'null');sessionStorage.removeItem('pe-plan-return')}catch{}
 if(saved&&['str','bru'].includes(saved.city)&&saved.view&&['x','y','w','h'].every(k=>Number.isFinite(saved.view[k]))){showSeatOnPlan(saved.city,null,'','',saved)}else showSeatOnPlan('str');
});
window.addEventListener('pageshow',event=>{if(event.persisted){try{sessionStorage.removeItem('pe-plan-return')}catch{}}});
function hemicycleBlock(m){
 const seats=hemicycleSeats[String(m.id)];if(!seats||(!Number.isInteger(seats.str)&&!Number.isInteger(seats.bru)))return null;
 const box=el('div','hemicycle-seats');box.setAttribute('aria-label','Places dans les hémicycles de Strasbourg et Bruxelles');
 for(const [key,label] of [['bru','Bru'],['str','Str']]){
  if(!Number.isInteger(seats[key]))continue;
  const row=el('span','hemicycle-row');row.dataset.city=key;
  row.append(hemicycleMarker(),el('span','',label),el('span','hemicycle-number',String(seats[key])));row.setAttribute('role','button');row.tabIndex=0;row.setAttribute('aria-label',`Voir la place ${seats[key]} sur le plan de ${key==='str'?'Strasbourg':'Bruxelles'} pour ${m.name}`);row.addEventListener('click',()=>showSeatOnPlan(key,seats[key],m.name,m.group));row.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showSeatOnPlan(key,seats[key],m.name,m.group)}});box.append(row);
 }
 box.title='Plans officiels du Parlement européen · Strasbourg 19/10/2026 · Bruxelles 11/11/2026';
 return box;
}
