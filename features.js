/* Fonctions complémentaires du Vademecum PE, sans compte ni transmission de favoris. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),key='vademecum-pe-favorites-v1';
let favorites=new Set();
try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(parsed))favorites=new Set(parsed.filter(x=>/^\d+$/.test(String(x))).map(String))}catch{}
window.vademecumFavoritesOnly=false;
window.vademecumIsFavorite=id=>favorites.has(String(id));
const banner=document.createElement('div');banner.className='vf-toolbar';
const toggle=document.createElement('button');toggle.type='button';toggle.className='vf-favorites-toggle';toggle.setAttribute('aria-pressed','false');
function updateToggle(){toggle.textContent='☆ Favoris ('+favorites.size+')';toggle.setAttribute('aria-pressed',String(window.vademecumFavoritesOnly))}
updateToggle();banner.append(toggle);
const filters=$('filters');if(filters)filters.after(banner);
toggle.addEventListener('click',()=>{
 window.vademecumFavoritesOnly=!window.vademecumFavoritesOnly;updateToggle();
 if(window.vademecumFavoritesOnly){
  for(const id of ['search','group','committee','function','country','gender','assignment','kind']){
   if($(id))$(id).value='';
  }
  if($('sort'))$('sort').value='name';
  if($('directoryTab'))$('directoryTab').click();
 }
 changeFilters();
});
function save(){try{localStorage.setItem(key,JSON.stringify([...favorites]))}catch{notify('Stockage local indisponible : les favoris pourraient ne pas être conservés.')}}
let toastTimer;
function notify(message){let node=$('vfStatus');if(!node){node=document.createElement('div');node.id='vfStatus';node.className='vf-status';node.setAttribute('role','status');document.body.append(node)}node.textContent=message;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.hidden=true},3500)}
function internalUrl(m){const url=new URL(location.pathname,location.origin);url.searchParams.set('person',String(m.id));return url.href}
async function share(title,url){
 try{
  if(navigator.share){await navigator.share({title,url});return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);notify('Lien copié.');return}
 }catch(error){if(error.name==='AbortError')return}
 window.prompt('Copier le lien :',url);
}
function report(m){
 const title='Erreur Vademecum PE — '+m.name;
 const body='Fiche : '+internalUrl(m)+'\n\nInformation à corriger :\n\nSource officielle (si disponible) :\n';
 location.href='mailto:frederic.perou@europarl.europa.eu?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(body);
}
window.vademecumCardActions=m=>{
 const row=document.createElement('div');row.className='vf-card-actions';
 const star=document.createElement('button');star.type='button';star.className='vf-action';star.textContent=favorites.has(String(m.id))?'★':'☆';
 star.title=favorites.has(String(m.id))?'Retirer des favoris':'Ajouter aux favoris';star.setAttribute('aria-label',star.title);star.setAttribute('aria-pressed',String(favorites.has(String(m.id))));
 star.addEventListener('click',()=>{
  const id=String(m.id);if(favorites.has(id))favorites.delete(id);else favorites.add(id);
  save();updateToggle();
  if(window.vademecumFavoritesOnly)changeFilters();
  else{star.textContent=favorites.has(id)?'★':'☆';star.title=favorites.has(id)?'Retirer des favoris':'Ajouter aux favoris';star.setAttribute('aria-label',star.title);star.setAttribute('aria-pressed',String(favorites.has(id)))}
 });
 const sharing=document.createElement('button');sharing.type='button';sharing.className='vf-action';sharing.textContent='Partager';sharing.title='Partager le lien vers cette fiche';sharing.addEventListener('click',()=>share(m.name+' · Vademecum PE',internalUrl(m)));
 const correction=document.createElement('button');correction.type='button';correction.className='vf-action vf-report';correction.textContent='Signaler';correction.title='Préparer un courriel de signalement';correction.addEventListener('click',()=>report(m));
 row.append(star,sharing,correction);return row;
};
// Lien vers un filtre de commission, séparé de la fiche du député.
const committee=$('committee');if(committee){
 const shareCommittee=document.createElement('button');shareCommittee.type='button';shareCommittee.className='vf-share-committee';shareCommittee.textContent='Partager cette commission';shareCommittee.hidden=true;
 committee.closest('label')?.after(shareCommittee);
 const refresh=()=>{shareCommittee.hidden=!committee.value};
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
 const category=$('vfChangeCategory'),list=$('vfChangeList'),more=$('vfChangeMore'),date=$('vfChangesDate');
 let items=[],limit=5;
 function draw(){
  list.replaceChildren();
  const current=items.filter(x=>!category.value||x.category===category.value);
  for(const event of current.slice(0,limit)){
   const li=document.createElement('li'),time=document.createElement('time');time.dateTime=event.date;time.textContent=new Date(event.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
   const kind=document.createElement('span');kind.className='vf-change-kind';kind.textContent=event.kind||event.category;
   li.append(time,document.createTextNode(' · '),kind,document.createTextNode(' · '));
   if(event.person){const link=document.createElement('a');link.href='?person='+encodeURIComponent(event.person);link.textContent=event.name||'Député';li.append(link,document.createTextNode(' — '))}
   else if(event.name)li.append(document.createTextNode(event.name+' — '));
   li.append(document.createTextNode(event.description||''));
   if(event.source){const proof=document.createElement('a');proof.href=event.source;proof.target='_blank';proof.rel='noopener noreferrer';proof.textContent=' Source';proof.className='vf-source';li.append(proof)}
   list.append(li);
  }
  more.hidden=current.length<=limit;
  if(!current.length){const li=document.createElement('li');li.textContent='Aucun changement enregistré pour cette catégorie.';list.append(li)}
 }
 category.addEventListener('change',()=>{limit=5;draw()});
 more.addEventListener('click',()=>{limit+=10;draw()});
 fetch('./changes.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Historique');return r.json()}).then(data=>{
  if(!Array.isArray(data.items))throw Error('Format');
  items=data.items.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a,b)=>b.date.localeCompare(a.date));
  if(date)date.textContent='Historique éditorial · '+items.length+' événements enregistrés';draw();
 }).catch(()=>{if(date)date.textContent='Historique temporairement indisponible';more.hidden=true});
}
})();