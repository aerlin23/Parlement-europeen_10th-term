(()=>{'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',labels=['Prénom','Nom de famille','Titre','Organisation','Fonction'],collator=new Intl.Collator('fr',{sensitivity:'base'});let rows=[];
const core=window.CavalierCore,clean=s=>core.strip(s),cleanName=core.cleanName,full=core.display;
const ctx=document.createElement('canvas').getContext('2d');
function width(s,n){ctx.font='700 '+n+'px Arial, sans-serif';return ctx.measureText(s).width}
function fit(s,cap,max=530){let n=cap;while(n>12&&width(s,n)>max)n-=.5;return n}
function wrap(s,n,max=530){const lines=[];let line='';for(const w of s.split(/\s+/u)){const next=line?line+' '+w:w;if(line&&width(next,n)>max){lines.push(line);line=w}else line=next}if(line)lines.push(line);return lines}
// Partitionner les noms sur les espaces, sans couper les noms composés.
function nameLayout(n,cap){
 const words=n.split(/\s+/u).filter(Boolean),max=530;if(words.length>30||n.length>300)return {lines:[n],size:12};
 let best={lines:[n],size:fit(n,cap)};
 if(width(n,cap)<=max)return best;
 for(let k=2;k<=Math.min(3,words.length);k++){
  let candidate=null;
  function split(from,parts){
   if(parts.length===k-1){
    const lines=[...parts,words.slice(from).join(' ')];
    if(!lines[k-1])return;
    // Ne jamais isoler uniquement les initiales sur une ligne.
    if(lines.slice(0,-1).some(x=>/^(?:\p{L}\.[\s-]*)+$/u.test(x)))return;
    const widths=lines.map(x=>width(x,cap)),size=Math.min(...lines.map(x=>fit(x,cap)));
    const spread=Math.max(...widths)-Math.min(...widths);
    if(!candidate||size>candidate.size||size===candidate.size&&spread<candidate.spread)candidate={lines,size,spread};
    return;
   }
   for(let i=from+1;i<=words.length-(k-parts.length-1);i++)split(i,[...parts,words.slice(from,i).join(' ')]);
  }
  split(0,[]);
  if(candidate&&candidate.size>best.size)best=candidate;
  if(best.size>=cap)return best;
 }
 return best;
}
function model(r){
 const n=full(r),details=r.slice(2).map(clean).filter(Boolean);
 const name=nameLayout(n,details.length===1?55:50);
 let lines=details.flatMap(x=>wrap(x,35));
 if(lines.length>3)lines=details;
 const texts=[...name.lines,...lines],count=texts.length;
 let sizes=[...name.lines.map(()=>name.size),...lines.map(x=>fit(x,lines.length===3?30:35))];
 let positions;
 if(name.lines.length===1){
  positions=count===1?[630.5]:count===2?[561,729.2]:count===3?[563.4,694,782.3]:[525,622,707,782];
 }else{
  // Centrer le bloc dans la demi-page, en conservant des espaces de lecture.
  const gaps=sizes.slice(1).map((s,i)=>(sizes[i]+s)/2+(i===name.lines.length-1?22:13));
  const total=gaps.reduce((a,b)=>a+b,0);
  const available=365-(sizes[0]+sizes.at(-1))/2;
  if(total>available){const factor=available/total;for(let i=0;i<gaps.length;i++)gaps[i]*=factor}
  const height=gaps.reduce((a,b)=>a+b,0);
  positions=[631-height/2+(sizes[0]-sizes.at(-1))/4];
  for(const gap of gaps)positions.push(positions.at(-1)+gap);
 }
 const warning=sizes.some((s,i)=>s<(i<name.lines.length?28:20))||!cleanName(r[1])||texts.some((s,i)=>width(s,sizes[i])>530);
 return {texts,positions,sizes,count,warning,nameLines:name.lines.length}
}
function svg(r){const m=model(r),s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 595.276 841.89');s.setAttribute('role','img');s.setAttribute('aria-label',full(r));for(let side=0;side<2;side++){const g=document.createElementNS(NS,'g');if(side)g.setAttribute('transform','translate(595.276 841.89) rotate(180)');m.texts.forEach((str,i)=>{const t=document.createElementNS(NS,'text');t.setAttribute('x','297.638');t.setAttribute('y',m.positions[i]);t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','central');t.setAttribute('font-family','Arial, sans-serif');t.setAttribute('font-weight','700');t.setAttribute('font-size',m.sizes[i]);t.setAttribute('fill','#000');t.textContent=str;g.append(t)});s.append(g)}return s}
function refresh(){const list=$('previews');list.replaceChildren();let valid=0,invalid=0;rows.forEach((r,i)=>{const m=model(r),ok=!!cleanName(r[1])&&(r[0]?core.analyze(r.join('|')).accepted.length===1:true)&&!m.warning;const entry=$('entries').children[i];if(entry){entry.style.border=ok?'':'2px solid #b86b32';entry.title=ok?'':'À corriger : nom manquant ou texte trop long';}if(!ok){invalid++;return}valid++;const box=document.createElement('div');box.className='preview';const p=document.createElement('p');p.textContent=full(r);box.dataset.surname=cleanName(r[1]).toLocaleUpperCase('fr');box.append(svg(r),p);list.append(box)});$('previewPanel').hidden=!valid;$('print').disabled=!valid;$('status').textContent=valid+' cavalier(s) prêt(s)'+(invalid?' — '+invalid+' ligne(s) à corriger, exclue(s) de l’impression. Voir les champs encadrés en orange.':'');$('readyCount').textContent=valid;$('fixCount').textContent=invalid;$('importSummary').hidden=!rows.length&&!Number($('rejectedCount').textContent);$('status').textContent='';$('previews').dataset.excluded=String(invalid);document.dispatchEvent(new Event('vf-cavaliers-ready'))}
let expanded=-1,lastRemoved=null;
$('undoRemove').onclick=()=>{if(!lastRemoved)return;rows.splice(Math.min(lastRemoved.index,rows.length),0,lastRemoved.row);lastRemoved=null;expanded=-1;editor()};
function editor(){
 const div=$('entries');div.replaceChildren();
 rows.forEach((r,i)=>{
  const e=document.createElement('div');e.className='compact-entry';
  const head=document.createElement('div');head.className='entry-head';
  const identity=document.createElement('div');identity.className='entry-identity';
  const title=document.createElement('strong'),details=document.createElement('small');
  function updateIdentity(){title.textContent=[cleanName(r[0]),cleanName(r[1]).toLocaleUpperCase('fr')].filter(Boolean).join(' ')||'Nouveau participant';details.textContent=r.slice(2).map(clean).filter(Boolean).join(' · ');details.hidden=!details.textContent}
  updateIdentity();identity.append(title,details);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='entry-icon';toggle.title=expanded===i?'Replier':'Modifier';toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-expanded',String(expanded===i));toggle.innerHTML=expanded===i?'<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>':'<svg viewBox="0 0 24 24"><path d="m14 5 5 5M4 20l5-1L20 8l-5-5L4 14z"/></svg>';toggle.onclick=()=>{expanded=expanded===i?-1:i;editor()};
  const remove=document.createElement('button');remove.type='button';remove.className='entry-icon';remove.title='Supprimer';remove.setAttribute('aria-label','Supprimer '+title.textContent);remove.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>';remove.onclick=()=>{lastRemoved={row:rows[i].slice(),index:i};rows.splice(i,1);expanded=-1;editor()};
  head.append(identity,toggle,remove);e.append(head);
  const fields=document.createElement('div');fields.className='entry-fields';fields.hidden=expanded!==i;
  labels.forEach((label,n)=>{const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.value=r[n]||'';input.addEventListener('input',()=>{r[n]=input.value;updateIdentity();refresh()});l.append(input);fields.append(l)});
  const done=document.createElement('button');done.type='button';done.textContent='Valider';done.onclick=()=>{expanded=-1;editor()};fields.append(done);e.append(fields);div.append(e)
 });
 $('editor').hidden=!rows.length&&!lastRemoved;$('undoRemove').hidden=!lastRemoved;refresh()
}
window.vfSetCavalierRows=items=>{expanded=-1;rows=items.map(r=>r.slice());lastRemoved=null;editor()};
window.vfRecoverCavalier=r=>{rows.push(r.slice());expanded=rows.length-1;editor();$('entries').lastElementChild?.scrollIntoView({block:'nearest'})};
$('addCompact').onclick=()=>$('add').click();$('add').onclick=()=>{rows.push(['','','','','']);expanded=rows.length-1;editor();$('entries').lastElementChild?.querySelector('input').focus()};$('clear').addEventListener('click',e=>{if((rows.length||$('paste').value.trim())&&!confirm('Effacer toute la liste et les cavaliers préparés ?')){e.preventDefault();e.stopImmediatePropagation()}},true);
$('clear').onclick=()=>{rows=[];lastRemoved=null;expanded=-1;$('paste').value='';editor()};$('sort').onclick=()=>{expanded=-1;rows.sort((a,b)=>collator.compare(clean(a[1]),clean(b[1]))||collator.compare(clean(a[0]),clean(b[0])));editor()};
$('print').onclick=()=>{if(!$('print').disabled)window.vfOpenPreview?.()};
})();