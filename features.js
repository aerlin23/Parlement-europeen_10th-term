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
// Cavaliers nominatifs : chargement à la demande, indexé par identifiant MEP.
let cavalierIndexPromise=null;
function loadCavalierIndex(){
 if(!cavalierIndexPromise)cavalierIndexPromise=fetch('./cavaliers/index.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Index indisponible');return r.json()}).catch(e=>{cavalierIndexPromise=null;throw e});
 return cavalierIndexPromise;
}
async function printCavalier(m){
 const id=String(m.id);
 if(!/^\d+$/.test(id))return;
 let data;
 try{data=await loadCavalierIndex()}catch{notify('Les cavaliers ne sont pas encore publiés.');return}
 const item=data.entries?.[id];
 if(!item||item.country!==m.country||item.name!==m.name){notify('Aucun cavalier vérifié pour '+m.name);return}
 const url=new URL('./cavaliers/'+id+'.pdf',location.href);
 const dialog=document.createElement('dialog');dialog.className='vf-cavalier-dialog';
 const bar=document.createElement('div');bar.className='vf-cavalier-bar';
 const title=document.createElement('strong');title.textContent=m.name+' · Cavalier';
 const print=document.createElement('button');print.type='button';print.textContent='Imprimer';
 const open=document.createElement('a');open.href=url.href;open.target='_blank';open.rel='noopener';open.textContent='Ouvrir le PDF';
 const close=document.createElement('button');close.type='button';close.textContent='Fermer';
 const frame=document.createElement('iframe');frame.title='Aperçu du cavalier PDF';frame.src=url.href;
 print.onclick=()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch{open.click()}};
 close.onclick=()=>dialog.close();
 const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 bar.append(title,print,open,close);
 if(mobile){
  const email='mobileprint@europarl.europa.eu', panel=document.createElement('div');panel.style.cssText='padding:8px 12px;background:#fff;color:#263b50;font-size:12px;flex-shrink:0';
  const send=document.createElement('button');send.type='button';send.textContent='Imprimer via Mobile Print';send.disabled=true;
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copier l’adresse';
  const info=document.createElement('p');info.style.margin='5px 0';info.textContent='Préparation du PDF…';
  const guide=document.createElement('a');guide.href='https://mfd.europarl.europa.eu/pdf/mobile-printing-qsg_en.pdf';guide.target='_blank';guide.rel='noopener';guide.textContent='Guide officiel';
  const notes=document.createElement('small');notes.textContent='Mail professionnel : badge puis Secure print. Mail personnel : code reçu par mail puis Job Code. ';
  let file;
  fetch(url.href).then(async r=>{if(!r.ok)throw Error('PDF');const b=await r.blob();if(!(await b.slice(0,5).text()).startsWith('%PDF-'))throw Error('PDF');file=new File([b],'Cavalier-'+m.name.replace(/[^\p{L}\p{N}-]+/gu,'-')+'.pdf',{type:'application/pdf'});send.disabled=false;info.textContent='Choisissez votre messagerie puis collez '+email+' dans le destinataire.'}).catch(()=>{info.textContent='PDF indisponible. Essayez Ouvrir le PDF.'});
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(email);notify('Adresse copiée.')}catch{window.prompt('Copier l’adresse :',email)}};
  send.onclick=async()=>{if(!file)return;try{navigator.clipboard?.writeText(email).catch(()=>{})}catch{}try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Cavalier'});return}info.textContent='Partage indisponible : ouvrez le PDF et joignez-le à votre mail.';open.click()}catch(e){if(e.name!=='AbortError')info.textContent='Partage impossible : ouvrez le PDF et joignez-le manuellement.'}};
  panel.append(send,document.createTextNode(' '),copy,info,notes,guide);dialog.append(bar,panel,frame);
 }else dialog.append(bar,frame);
 document.body.append(dialog);
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
window.vademecumCardShare=m=>{
 const button=document.createElement('button');
 button.type='button';button.className='vf-share-icon';
 button.textContent='↗';button.title='Partager la fiche de '+m.name;button.setAttribute('aria-label',button.title);
 button.addEventListener('click',()=>share(m.name+' · Vademecum PE',internalUrl(m)));
 const actions=document.createElement('span');actions.className='vf-card-actions';
 const printer=document.createElement('button');printer.type='button';printer.className='vf-print-icon';printer.title='Imprimer le cavalier de '+m.name;printer.setAttribute('aria-label',printer.title);
 printer.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6zM18 12h1"/></svg>';
 printer.onclick=()=>printCavalier(m).catch(()=>notify('Impossible d’ouvrir le cavalier.'));
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