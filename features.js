/* Partage discret des fiches et historique éditorial. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
let toastTimer;
function notify(message){
 let node=$('vfStatus');
 if(!node){node=document.createElement('div');node.id='vfStatus';node.className='vf-status';node.setAttribute('role','status');document.body.append(node)}
 node.textContent=message;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.hidden=true},3500);
}
function internalUrl(m){const url=new URL(location.pathname,location.origin);url.searchParams.set('person',String(m.id));return url.href}
async function share(title,url){
 try{
  if(navigator.share){await navigator.share({title,url});return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);notify('Lien copié.');return}
 }catch(error){if(error.name==='AbortError')return}
 window.prompt('Copier le lien :',url);
}
window.vademecumCardShare=m=>{
 const button=document.createElement('button');
 button.type='button';button.className='vf-share-icon';
 button.textContent='↗';button.title='Partager la fiche de '+m.name;button.setAttribute('aria-label',button.title);
 button.addEventListener('click',()=>share(m.name+' · Vademecum PE',internalUrl(m)));
 return button;
};
const committee=$('committee');
if(committee){
 const container=document.createElement('div');container.className='vf-toolbar';
 const shareCommittee=document.createElement('button');shareCommittee.type='button';shareCommittee.className='vf-share-committee';
 shareCommittee.textContent='Partager cette commission';shareCommittee.hidden=true;
 container.append(shareCommittee);$('filters')?.after(container);
 const refresh=()=>{shareCommittee.hidden=!committee.value;container.hidden=!committee.value};
 window.vademecumRefreshCommitteeShare=refresh;
 committee.addEventListener('change',refresh);refresh();
 shareCommittee.addEventListener('click',()=>{
  if(!committee.value)return;
  const url=new URL(location.pathname,location.origin);url.searchParams.set('committee',committee.value);
  share('Commission '+committee.value+' · Vademecum PE',url.href);
 });
}
// Historique : réutiliser changes.json et ne jamais inventer de changements.
const history=$('vfHistory');
if(history){
 const list=$('vfChangeList'),more=$('vfChangeMore'),date=$('vfChangesDate');
 let items=[],limit=3;
 function draw(){
  list.replaceChildren();
  const current=items;
  for(const event of current.slice(0,limit)){
   const li=document.createElement('li'),time=document.createElement('time');time.dateTime=event.date;time.textContent=new Date(event.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
   const kind=document.createElement('span');kind.className='vf-change-kind';kind.textContent=event.kind||event.category;
   li.append(time,document.createTextNode(' · '),kind,document.createTextNode(' · '));
   if(event.person){const link=document.createElement('a');link.href='?person='+encodeURIComponent(event.person);link.textContent=event.name||'Député';li.append(link);if(event.description)li.append(document.createTextNode(' — '))}
   else if(event.name)li.append(document.createTextNode(event.name+(event.description?' — ':'')));
   if(event.description)li.append(document.createTextNode(event.description));
   if(event.source){const proof=document.createElement('a');proof.href=event.source;proof.target='_blank';proof.rel='noopener noreferrer';proof.textContent=' Source';proof.className='vf-source';li.append(proof)}
   list.append(li);
  }
  more.hidden=current.length<=limit;
  if(!current.length){const li=document.createElement('li');li.textContent='Aucun changement enregistré.';list.append(li)}
 }
 more.addEventListener('click',()=>{limit+=10;draw()});
 fetch('./changes.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Historique');return r.json()}).then(data=>{
  if(!Array.isArray(data.items))throw Error('Format');
  items=data.items.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a,b)=>b.date.localeCompare(a.date));
  if(date)date.hidden=true;draw();
 }).catch(()=>{if(date)date.textContent='Historique temporairement indisponible';more.hidden=true});
}
})();