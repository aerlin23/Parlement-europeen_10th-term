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
// Cavaliers : accès local volontaire, aucun transfert des documents vers le serveur.
let cavalierFiles=null;
const cavalierKey=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const cavalierOverrides={'Christine ANDERSON':'ANDERSON','Li ANDERSSON':'ANDERSSON','Bruno GONÇALVES':'GONÇALVES B','Sérgio GONÇALVES':'GONÇALVES S'};
function chooseCavalierFolder(){
 return new Promise(resolve=>{
  const input=document.createElement('input');input.type='file';input.webkitdirectory=true;input.multiple=true;input.style.display='none';document.body.append(input);
  input.addEventListener('change',()=>{cavalierFiles=Array.from(input.files).filter(f=>/\.pdf$/i.test(f.name));input.remove();resolve(cavalierFiles)},{once:true});
  input.addEventListener('cancel',()=>{input.remove();resolve(null)},{once:true});input.click();
 });
}
async function printCavalier(m){
 const files=cavalierFiles||await chooseCavalierFolder();
 if(!files)return;
 const override=cavalierOverrides[m.name];
 const surname=cavalierKey(m.lastName||'');
 const initial=cavalierKey(m.name).charAt(0);
 const key=f=>cavalierKey(f.name.replace(/\.pdf$/i,''));
 let matches=files.filter(f=>key(f)===cavalierKey(override||m.lastName));
 if(!override){const qualified=files.filter(f=>key(f)===surname+initial||key(f)===initial+surname);if(qualified.length)matches=qualified;}
 if(!matches.length||matches.length>1){
  notify('Sélectionne manuellement le cavalier de '+m.name);
  const input=document.createElement('input');input.type='file';input.accept='.pdf,application/pdf';input.style.display='none';document.body.append(input);
  input.onchange=()=>{const file=input.files[0];input.remove();if(file)previewCavalier(file,m)};input.addEventListener('cancel',()=>input.remove(),{once:true});input.click();return;
 }
 previewCavalier(matches[0],m);
}
function previewCavalier(file,m){
 const dialog=document.createElement('dialog');dialog.className='vf-cavalier-dialog';
 const bar=document.createElement('div');bar.className='vf-cavalier-bar';
 const title=document.createElement('strong');title.textContent=m.name+' · '+file.name;
 const print=document.createElement('button');print.type='button';print.textContent='Imprimer';
 const close=document.createElement('button');close.type='button';close.textContent='Fermer';
 const frame=document.createElement('iframe');frame.title='Aperçu du cavalier PDF';
 const url=URL.createObjectURL(file);frame.src=url;
 print.onclick=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch{window.open(url,'_blank','noopener')}};
 close.onclick=()=>dialog.close();
 bar.append(title,print,close);dialog.append(bar,frame);document.body.append(dialog);
 dialog.addEventListener('close',()=>{dialog.remove();URL.revokeObjectURL(url)},{once:true});dialog.showModal();
}
window.vademecumCardShare=m=>{
 const button=document.createElement('button');
 button.type='button';button.className='vf-share-icon';
 button.textContent='↗';button.title='Partager la fiche de '+m.name;button.setAttribute('aria-label',button.title);
 button.addEventListener('click',()=>share(m.name+' · Vademecum PE',internalUrl(m)));
 const actions=document.createElement('span');actions.className='vf-card-actions';
 const printer=document.createElement('button');printer.type='button';printer.className='vf-print-icon';printer.title='Imprimer le cavalier de '+m.name;printer.setAttribute('aria-label',printer.title);
 printer.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6zM18 12h1"/></svg>';
 printer.onclick=()=>printCavalier(m).catch(()=>notify('Impossible d’ouvrir le cavalier local.'));
 actions.append(printer,button);return actions;
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
 let items=[],limit=0;
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
  if(!current.length||!limit){const li=document.createElement('li');li.textContent=current.length?'Aucun changement enregistré ces deux derniers mois.':'Aucun changement enregistré.';list.append(li)}
 }
 more.addEventListener('click',()=>{limit+=10;draw()});
 fetch('./changes.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Historique');return r.json()}).then(data=>{
  if(!Array.isArray(data.items))throw Error('Format');
  items=data.items.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a,b)=>b.date.localeCompare(a.date));
  const cutoff=new Date();const day=cutoff.getDate();cutoff.setDate(1);cutoff.setMonth(cutoff.getMonth()-2);cutoff.setDate(Math.min(day,new Date(cutoff.getFullYear(),cutoff.getMonth()+1,0).getDate()));const key=[cutoff.getFullYear(),String(cutoff.getMonth()+1).padStart(2,'0'),String(cutoff.getDate()).padStart(2,'0')].join('-');limit=items.filter(x=>x.date>=key).length;if(date)date.hidden=true;draw();
 }).catch(()=>{if(date)date.textContent='Historique temporairement indisponible';more.hidden=true});
}
})();