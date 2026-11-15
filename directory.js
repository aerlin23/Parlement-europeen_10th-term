
'use strict';

/* Barre alphabétique au bas de l'écran, uniquement dans l'annuaire. */
(function initAlphaFloating(){
 const bar=document.getElementById('alphaFloating'),letters=document.getElementById('alphaLetters'),top=document.getElementById('alphaTop'),bottom=document.getElementById('alphaBottom');
 if(!bar||!letters||!top||!bottom)return;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 // En bas de la liste, le navigateur A–Z bascule sur les suppléants visibles.
 const navigationContext=()=>{
  const substitutes=document.getElementById('substitutesSection');
  const useSubstitutes=substitutes&&!substitutes.hidden&&substitutes.getBoundingClientRect().top<=window.innerHeight*.48;
  return useSubstitutes
   ?{items:substituteMembers,grid:document.getElementById('substitutesGrid'),load:index=>{while(substitutesVisible<=index)appendSubstitutesPage();}}
   :{items:filtered,grid:document.getElementById('grid'),load:index=>{while(directoryVisible<=index)appendDirectoryPage();}};
 };
 for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
  const b=document.createElement('button');b.type='button';b.textContent=letter;b.dataset.letter=letter;b.title='Aller à la lettre '+letter;
  b.setAttribute('aria-label','Aller aux députés dont le nom commence par '+letter);
  b.addEventListener('click',()=>{
   const context=navigationContext();
   if(!Array.isArray(context.items))return;
   const targetLetter=b.dataset.letter;
   const alphabetical=typeof surname==='function'&&typeof norm==='function';
   if(!alphabetical)return;
   if(context.grid?.id==='grid'&&document.getElementById('sort')?.value!=='name'){
    document.getElementById('sort').value='name';render();
   }
   const items=context.grid?.id==='grid'?filtered:context.items;
   const index=items.findIndex(m=>norm(surname(m)).charAt(0).toUpperCase()===targetLetter);
   if(index<0)return;
   context.load(index);
   const card=context.grid?.children[index];
   if(card){b.blur();card.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'});}
  });
  letters.append(b);
 }
 // La lettre accentuée correspond au premier député de la rangée visible.
 // Les noms sont pris dans l'ordre effectivement affiché (filtres inclus).
 let currentLetter='';
 function syncCurrentLetter(){
  const context=navigationContext();
  if(!Array.isArray(context.items)||!context.items.length||typeof surname!=='function'||typeof norm!=='function')return;
  const grid=context.grid,cards=grid?.children;
  if(!cards?.length)return;
  const focusLine=window.innerHeight*.28;
  let visibleIndex=cards.length-1;
  for(let i=0;i<cards.length;i++){
   const box=cards[i].getBoundingClientRect();
   if(box.bottom>=focusLine){visibleIndex=i;break}
  }
  const initial=norm(surname(context.items[visibleIndex])).charAt(0).toUpperCase();
  if(!/^[A-Z]$/.test(initial)||initial===currentLetter)return;
  currentLetter=initial;
  for(const button of letters.children){
   const selected=button.dataset.letter===initial;
   button.classList.toggle('alpha-current',selected);
   if(selected)button.setAttribute('aria-current','true');
   else button.removeAttribute('aria-current');
  }
  const selected=letters.querySelector('.alpha-current');
  if(selected&&letters.scrollWidth>letters.clientWidth){
   const position=selected.offsetLeft-letters.offsetLeft-(letters.clientWidth-selected.offsetWidth)/2;
   letters.scrollLeft=Math.max(0,position);
  }
 }
 // N'apparaît qu'après un geste de défilement rapide, puis reste accessible
 // brièvement pour permettre de toucher une lettre sans masquer les fiches.
 let showUntil=0,hideTimer=0,lastY=window.scrollY,lastTime=performance.now(),scheduled=false;
 const refresh=()=>{
  const section=document.getElementById('directory'),active=section&&!section.hidden&&document.getElementById('secretariatPanel')?.hidden;
  const enough=document.documentElement.scrollHeight>window.innerHeight+500;
  const context=navigationContext();
  const enoughCards=Array.isArray(context.items)&&context.items.length>=10;
  const atBottom=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-100;
  bar.hidden=!active||!enough||!enoughCards||atBottom||performance.now()>=showUntil;
  if(!bar.hidden&&Array.isArray(context.items)&&typeof surname==='function'&&typeof norm==='function'){
   const initials=new Set(context.items.map(m=>norm(surname(m)).charAt(0).toUpperCase()));
   for(const b of letters.children)b.disabled=!initials.has(b.dataset.letter);
   syncCurrentLetter();
  }else if(!active||!enough||!enoughCards){currentLetter=''}

 };
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh()})}};
 const onScroll=()=>{
  const now=performance.now(),y=window.scrollY,dy=Math.abs(y-lastY),dt=Math.max(now-lastTime,1);
  // Seuil en vitesse ou en distance pour les gestes rapides sur mobile.
  const fast=(dy/dt>=0.7&&dy>=12)||dy>=95;
  // Une fois révélée par un défilement rapide, la barre reste visible
  // uniquement tant que le défilement continue et disparaît 1,8 seconde après l'arrêt.
  if(fast||showUntil>now){
   showUntil=now+1800;
   clearTimeout(hideTimer);
   hideTimer=setTimeout(schedule,1820);
  }
  lastY=y;lastTime=now;
  schedule();
 };
 const scrollByThird=direction=>{
  const context=navigationContext();
  if(!Array.isArray(context.items)||!context.items.length||!context.grid)return;
  const step=Math.ceil(context.items.length/3),cards=context.grid.children;
  const viewportTop=window.scrollY+Math.min(window.innerHeight*.18,110);
  let currentIndex=0;
  for(let i=0;i<cards.length;i++){
   if(cards[i].getBoundingClientRect().top+window.scrollY<=viewportTop)currentIndex=i;
   else break;
  }
  const target=Math.max(0,Math.min(context.items.length-1,currentIndex+direction*step));
  context.load(target);
  context.grid.children[target]?.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'});
 };
 top.addEventListener('click',()=>scrollByThird(-1));
 bottom.addEventListener('click',()=>scrollByThird(1));
 bar.addEventListener('pointerleave',schedule);
 bar.addEventListener('focusout',()=>requestAnimationFrame(schedule));
 window.addEventListener('scroll',onScroll,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('load',schedule);
 if('ResizeObserver' in window)new ResizeObserver(schedule).observe(document.body);
 window.updateAlphaFloating=schedule;
 schedule();
})();
const CONFIG={general:true,repo:'Parlement-europeen_10th-term',short:'PE',localPhotos:false,updated:'2026-11-14'};
const $=id=>document.getElementById(id);
// Translittération pour recherche et navigation A-Z : les noms affichés restent inchangés.
const LATIN_FOLDS={'ß':'ss','ẞ':'ss','æ':'ae','Æ':'ae','œ':'oe','Œ':'oe','ø':'o','Ø':'o','ł':'l','Ł':'l','đ':'d','Đ':'d','ð':'d','Ð':'d','þ':'th','Þ':'th','ı':'i','İ':'i','ħ':'h','Ħ':'h','ŋ':'n','Ŋ':'n','ŀ':'l','Ŀ':'l','ĸ':'k','Ə':'e','ə':'e'};
const norm=s=>String(s||'').replace(/[ßẞæÆœŒøØłŁđĐðÐþÞıİħĦŋŊŀĿĸƏə]/g,c=>LATIN_FOLDS[c]).normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('fr');
const fr={Croatia:'Croatie',Cyprus:'Chypre',Estonia:'Estonie',Finland:'Finlande',Ireland:'Irlande',Luxembourg:'Luxembourg',Malta:'Malte',Romania:'Roumanie',Slovenia:'Slovénie',Sweden:'Suède',Austria:'Autriche',Belgium:'Belgique',Bulgaria:'Bulgarie',Czechia:'Tchéquie','Czech Republic':'Tchéquie',Denmark:'Danemark',France:'France',Germany:'Allemagne',Greece:'Grèce',Hungary:'Hongrie',Italy:'Italie',Latvia:'Lettonie',Lithuania:'Lituanie',Netherlands:'Pays-Bas',Poland:'Pologne',Portugal:'Portugal',Slovakia:'Slovaquie',Spain:'Espagne'};
const flags={Croatia:'🇭🇷',Cyprus:'🇨🇾',Estonia:'🇪🇪',Finland:'🇫🇮',Ireland:'🇮🇪',Luxembourg:'🇱🇺',Malta:'🇲🇹',Romania:'🇷🇴',Slovenia:'🇸🇮',Sweden:'🇸🇪',Austria:'🇦🇹',Belgium:'🇧🇪',Bulgaria:'🇧🇬',Czechia:'🇨🇿','Czech Republic':'🇨🇿',Denmark:'🇩🇰',France:'🇫🇷',Germany:'🇩🇪',Greece:'🇬🇷',Hungary:'🇭🇺',Italy:'🇮🇹',Latvia:'🇱🇻',Lithuania:'🇱🇹',Netherlands:'🇳🇱',Poland:'🇵🇱',Portugal:'🇵🇹',Slovakia:'🇸🇰',Spain:'🇪🇸'};
const flagCodes={Austria:'at',Belgium:'be',Bulgaria:'bg',Croatia:'hr',Cyprus:'cy',Czechia:'cz','Czech Republic':'cz',Denmark:'dk',Estonia:'ee',Finland:'fi',France:'fr',Germany:'de',Greece:'gr',Hungary:'hu',Ireland:'ie',Italy:'it',Latvia:'lv',Lithuania:'lt',Luxembourg:'lu',Malta:'mt',Netherlands:'nl',Poland:'pl',Portugal:'pt',Romania:'ro',Slovakia:'sk',Slovenia:'si',Spain:'es',Sweden:'se'};
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s.split('-').reverse().join('/'):'date non précisée';
function surname(m){if(m.lastName)return m.lastName;const words=m.name.trim().split(/\s+/),i=words.findIndex(w=>/\p{L}/u.test(w)&&w===w.toLocaleUpperCase('fr')&&w!==w.toLocaleLowerCase('fr'));return i>=0?words.slice(i).join(' '):words.at(-1)}
function coords(m){return Array.isArray(m.coordinators)?m.coordinators:[]}
function committeeCoordinatorEntries(m,committee=field('committee')){
 const id=String(m.id);
 const records=coordinatorAssignments.filter(a=>a.id===id&&a.group===m.group&&committeesOf(m).some(c=>c.code===a.committee)&&(!committee||a.committee===committee)&&['coordinator','co-coordinator'].includes(a.role));
 if(records.length)return records;
 // Données présentes dans la fiche MEP, lorsque la base externe est indisponible.
 return coords(m).filter(c=>committeesOf(m).some(x=>x.code===c.committee)&&(!committee||c.committee===committee)).map(c=>({id,committee:c.committee,group:m.group,role:'coordinator',source:c.source,sourceDate:c.sourceDate}));
}
let committeeDefs={},publishedCommitteeDefs={};
function committeesOf(m){return Array.isArray(m.committees)?m.committees:[]}
function afs(m){return Array.isArray(m.parliamentaryFunctions)?m.parliamentaryFunctions:[]}
function field(id){return $(id)?.value||''}
function groupPresident(m){return /^(Co)?président(e)?$/i.test(m.role||'')}
const HEAD_COUNTRY_CODES={"Austria":"AT","Belgium":"BE","Bulgaria":"BG","Croatia":"HR","Cyprus":"CY","Czechia":"CZ","Czech Republic":"CZ","Denmark":"DK","Estonia":"EE","Finland":"FI","France":"FR","Germany":"DE","Greece":"GR","Hungary":"HU","Ireland":"IE","Italy":"IT","Latvia":"LV","Lithuania":"LT","Luxembourg":"LU","Malta":"MT","Netherlands":"NL","Poland":"PL","Portugal":"PT","Romania":"RO","Slovakia":"SK","Slovenia":"SI","Spain":"ES","Sweden":"SE"};
function fnEntries(m){const functions=afs(m).map(f=>({...f,checkedAt:f.checkedAt||m.committeesCheckedAt}));const out=functions.filter(f=>f.type.startsWith('EP_'));if(m.role)out.push({type:'GROUP',label:m.role+' · '+(m.group||CONFIG.short),source:m.roleSource,checkedAt:m.roleCheckedAt,sourceDate:m.roleSourceDate});out.push(...functions.filter(f=>!f.type.startsWith('EP_')));if(m.headOfDelegation&&field('group')===m.group&&m.group)out.push({type:'HEAD',label:(m.gender==='FEMALE'?'Cheffe':'Chef')+' de délégation · '+(HEAD_COUNTRY_CODES[m.country]||m.country),source:m.headSource,checkedAt:m.headCheckedAt});for(const c of committeeCoordinatorEntries(m)){out.push({type:'COORD',label:field('committee')?'Coordinateur':'Coordinateur '+c.committee,source:c.source,checkedAt:c.checkedAt,sourceDate:c.sourceDate});}return out}
function matchesFunction(m,f){if(!f)return true;if(f==="commissionbureau")return afs(m).some(x=>["COMMITTEE_CHAIR","COMMITTEE_VICE_CHAIR"].includes(x.type)&&(!field("committee")||x.committee===field("committee")));if(f==="presidencype")return afs(m).some(x=>["EP_PRESIDENT","EP_VICE_PRESIDENT"].includes(x.type));const types={president:'EP_PRESIDENT',vice:'EP_VICE_PRESIDENT',quaestor:'EP_QUAESTOR',chair:'COMMITTEE_CHAIR',vicechair:'COMMITTEE_VICE_CHAIR'};if(types[f])return afs(m).some(x=>x.type===types[f]&&(!['chair','vicechair'].includes(f)||((!field('committee')||x.committee===field('committee'))&&(!field('kind')||committeeDefs[x.committee]?.type===field('kind'))))); if(f==='bureau')return afs(m).some(x=>x.type.startsWith('EP_'));if(f==='groupleadership')return groupPresident(m)||/vice-président/i.test(m.role||'');if(f==='grouppresident')return groupPresident(m);if(f==='groupvice')return /vice-président/i.test(m.role||'');if(f==='head')return !!m.headOfDelegation&&!!field('group')&&m.group===field('group');if(f==='coord')return committeeCoordinatorEntries(m).length>0;return false}
function committeeBox(m){const box=el('div','committee-box');for(const [status,label] of [['MEMBER','Titulaires']]){const list=committeesOf(m).filter(c=>c.status===status&&committeeDefs[c.code]?.type==='standing').sort((a,b)=>a.code.localeCompare(b.code));if(!list.length)continue;const row=status==='SUBSTITUTE'?el('details','committee-substitutes'):el('div','committee-members');if(status==='SUBSTITUTE')row.append(el('summary','',label+' · '+list.length));else row.append(el('span','committee-heading',label+' : '));for(const c of list){const def=committeeDefs[c.code]||{},tag=el('a','committee-tag',c.code+(def.type==='subcommittee'?' (sous-comm.)':def.type==='special'?' (spéciale)':''));tag.title=def.name||c.code;const url=safeLink(def.source);if(url){tag.href=url;tag.target='_blank';tag.rel='noopener'}row.append(tag)}box.append(row)}return box.childNodes.length?box:null}

function safeLink(url){try{const u=new URL(url);const hosts=['europarl.europa.eu','www.europarl.europa.eu','esn-group.eu','patriotsforeurope.eu','www.patriotsforeurope.eu','eppgroup.eu','www.eppgroup.eu','socialistsanddemocrats.eu','www.socialistsanddemocrats.eu','ecrgroup.eu','www.ecrgroup.eu','reneweuropegroup.eu','www.reneweuropegroup.eu','greens-efa.eu','www.greens-efa.eu','left.eu','www.left.eu'];return u.protocol==='https:'&&(hosts.includes(u.hostname)||u.hostname.endsWith('.europarl.europa.eu'))?u.href:null}catch{return null}}
function rank(m){const committee=field("committee");if(committee){const functions=afs(m).filter(f=>f.committee===committee);return functions.some(f=>f.type==="COMMITTEE_CHAIR")?0:functions.some(f=>f.type==="COMMITTEE_VICE_CHAIR")?1+Math.min(5,functions.find(f=>f.type==="COMMITTEE_VICE_CHAIR")?.protocolRank||5)/10:2;}const has=t=>afs(m).some(f=>f.type===t),gp=groupPresident(m),first=/^Premi(?:er|ère)/i.test(m.role||''),gv=/vice-président/i.test(m.role||'');if(field('group'))return gp?0:first?1:gv?2:m.role?3:has('EP_PRESIDENT')?4:has('EP_VICE_PRESIDENT')?5:has('EP_QUAESTOR')?6:has('COMMITTEE_CHAIR')?7:has('COMMITTEE_VICE_CHAIR')?8:coords(m).length?9:10;if(CONFIG.general)return has('EP_PRESIDENT')?0:has('EP_VICE_PRESIDENT')?1:has('EP_QUAESTOR')?2:gp?3:first?4:gv?5:has('COMMITTEE_CHAIR')?6:has('COMMITTEE_VICE_CHAIR')?7:m.role?8:coords(m).length?10:11;return gp?0:first?1:gv?2:has('EP_PRESIDENT')?3:has('EP_VICE_PRESIDENT')?4:has('EP_QUAESTOR')?5:has('COMMITTEE_CHAIR')?6:has('COMMITTEE_VICE_CHAIR')?7:m.role?8:m.headOfDelegation?9:coords(m).length?10:11}
let members=[],published=[],filtered=[],training=false,session=null,imported=false;
let coordinatorAssignments=[];
let photoAssets={photos:new Set(),thumbs:new Set()};
let hemicycleSeats={};
function imageBox(m,hiddenName=false,priority=false){
 const box=el('div',hiddenName?'study-photo':'portrait'),img=el('img');
 const id=encodeURIComponent(m.id);
 const local='./photos/'+id+'.jpg';
 const thumb='./thumbs/'+id+'.webp';
 const official='https://www.europarl.europa.eu/mepphoto/'+id+'.jpg';
 img.alt=hiddenName?'Portrait à identifier':m.name;
 img.width=hiddenName?450:220;img.height=hiddenName?550:270;
 img.loading=hiddenName||priority?'eager':'lazy';img.decoding='async';if(priority&&!hiddenName)img.fetchPriority='high';
 const availableLocal=photoAssets.photos.has(String(m.id));
 const availableThumb=photoAssets.thumbs.has(String(m.id));
 const attempts=hiddenName?(availableLocal?[local,official]:[official]):[...(availableThumb?[thumb]:[]),...(availableLocal?[local]:[]),official];
 if(attempts[0]===official)img.referrerPolicy='no-referrer';
 let attempt=0;
 img.onerror=()=>{
  if(++attempt<attempts.length){
   if(attempts[attempt]===official)img.referrerPolicy='no-referrer';
   img.src=attempts[attempt];return;
  }
  const fallback=el('div','fallback',hiddenName?'Photo indisponible':m.name.split(' ').map(w=>w[0]).slice(0,2).join(''));
  if(img.isConnected)img.replaceWith(fallback);else box.replaceChildren(fallback);
 };
 img.src=attempts[0];box.append(img);return box
}
function countryLabel(m){
 const box=el('div','country'),code=flagCodes[m.country];
 if(code){
  const img=el('img','country-flag');
  img.src='https://flagcdn.com/w40/'+code+'.png';
  img.alt='';img.width=20;img.height=15;img.loading='lazy';img.decoding='async';
  img.onerror=()=>{img.replaceWith(document.createTextNode((flags[m.country]||'')+' '))};
  box.append(img);
 }else if(flags[m.country])box.append(document.createTextNode(flags[m.country]+' '));
 box.append(document.createTextNode(fr[m.country]||m.country));
 return box;
}
function badges(m,entries=fnEntries(m)){const box=el('div','badges');for(const f of entries){const cls=f.type.startsWith('EP_')?'badge institutional':f.type.startsWith('COMMITTEE_')?'badge committee-role':f.type==='HEAD'?'badge head':f.type==='COORD'?'badge coord':'badge';box.append(el('span',cls,f.label))}return box}
function sources(m){const list=fnEntries(m);const cs=committeesOf(m).filter(c=>c.status==='MEMBER').map(c=>committeeDefs[c.code]).filter(Boolean);if(!list.length&&!cs.length)return null;const box=el('details','sources');box.append(el('summary','','Sources et dates'));for(const x of [...list,...cs.map(c=>({label:c.name,source:c.source,checkedAt:c.checkedAt}))]){const p=el('p','',x.label+' · '),url=safeLink(x.source);if(url){const a=el('a','','source officielle');a.href=url;a.target='_blank';a.rel='noopener';p.append(a)}p.append(el('span','',x.sourceDate?' · document du '+date(x.sourceDate):' · vérifié le '+date(x.checkedAt)));box.append(p)}return box}
function populate(){for(const [id,values,label] of [['group',[...new Set(members.map(m=>m.group))],v=>v],['country',[...new Set(members.map(m=>m.country))],v=>fr[v]||v],['committee',[...new Set(members.flatMap(m=>committeesOf(m).filter(c=>c.status==='MEMBER').map(c=>c.code)))],v=>v+' — '+(committeeDefs[v]?.name||v)+(committeeDefs[v]?.type==='subcommittee'?' (sous-commission)':committeeDefs[v]?.type==='special'?' (spéciale)':'')]]){if(!$(id))continue;const selected=$(id).value;$(id).replaceChildren($(id).options[0]);for(const v of values.filter(Boolean).sort((a,b)=>id==='group'?((a==='NI')-(b==='NI')||members.filter(m=>m.group===b).length-members.filter(m=>m.group===a).length||label(a).localeCompare(label(b),'fr')):label(a).localeCompare(label(b),'fr'))){const o=el('option','',label(v));o.value=v;$(id).append(o)}$(id).value=values.includes(selected)?selected:''}$('total').textContent=members.length;$('countries').textContent=new Set(members.map(m=>m.country)).size;$('localBanner').hidden=!imported}
function protocolRank(m){if(afs(m).some(f=>f.type==='EP_PRESIDENT'))return 0;const vice=afs(m).find(f=>f.type==='EP_VICE_PRESIDENT');if(vice)return Number.isInteger(vice.protocolRank)?vice.protocolRank:99;return 100;}
function groupSizeOrder(a,b,sizes){if(a.group===b.group)return 0;if(a.group==='NI')return 1;if(b.group==='NI')return -1;return (sizes[b.group]||0)-(sizes[a.group]||0)||(a.group||'').localeCompare(b.group||'','fr')}
// Recherche tolérante : correspondance exacte d'abord, puis fautes proches uniquement.
function nameEditDistance(a,b,limit){
 if(Math.abs(a.length-b.length)>limit)return limit+1;
 let previous=Array.from({length:b.length+1},(_,i)=>i),previousPrevious=null;
 for(let i=1;i<=a.length;i++){
  const current=[i];let lowest=i;
  for(let j=1;j<=b.length;j++){
   let value=Math.min(previous[j]+1,current[j-1]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]&&previousPrevious)value=Math.min(value,previousPrevious[j-2]+1);
   current[j]=value;lowest=Math.min(lowest,value);
  }
  if(lowest>limit)return limit+1;
  previousPrevious=previous;previous=current;
 }
 return previous[b.length];
}
function fuzzyNameScore(name,query){
 const words=norm(name).split(/[\s\-'’]+/).filter(Boolean);
 const compact=norm(name).replace(/[^a-z]/g,'');
 const compactQuery=query.replace(/[^a-z]/g,'');
 const candidates=[norm(name),compact,...words,...words.flatMap((_,i)=>words.slice(i).map((__,j)=>words.slice(i,i+j+1).join(' ')))];
 const length=compactQuery.length;
 const limit=length>=9?3:length>=5?2:length>=3?1:0;
 if(!limit)return Infinity;
 let best=Infinity;
 for(const candidate of candidates){
  const trimmed=candidate.trim();
  if(!trimmed)continue;
  // Comparer aussi avec le début d'un prénom/nom plus long.
  for(const part of [trimmed,trimmed.slice(0,Math.min(trimmed.length,query.length)),trimmed.slice(0,Math.min(trimmed.length,compactQuery.length))]){
   if(!part)continue;
   const distance=nameEditDistance(compactQuery,part.replace(/[^a-z]/g,''),limit);
   if(distance<best)best=distance;
  }
 }
 return best<=limit?best:Infinity;
}
let fuzzySearchUsed=false;
function selectMembers(){
 const groupSizes=members.reduce((sizes,m)=>{sizes[m.group]=(sizes[m.group]||0)+1;return sizes},{});
 const rawSearch=field('search').trim(),q=norm(rawSearch).trim();
 const seatQuery=/^([sb])\s*[- ]?\s*(\d{1,3})$/i.exec(rawSearch);
 const f=field('function'),c=field('committee'),status=field('assignment'),kind=field('kind');
 const pool=members.filter(m=>
  (!field('group')||m.group===field('group'))&&
  (!field('gender')||m.gender===field('gender'))&&
  (!field('country')||m.country===field('country'))&&
  matchesFunction(m,f)&&
  (!(c||status||kind)||committeesOf(m).some(x=>(!c||(x.code===c&&x.status==='MEMBER'))&&(!status||x.status===status)&&(!kind||committeeDefs[x.code]?.type===kind)))
 );
 let results;
 fuzzySearchUsed=false;
 if(seatQuery){
  results=pool.filter(m=>hemicycleSeats[String(m.id)]?.[seatQuery[1].toLowerCase()==='s'?'str':'bru']===Number(seatQuery[2]));
 }else if(!q)results=pool;
 else{
  results=pool.filter(m=>norm(m.name).includes(q));
  if(!results.length&&q.replace(/[^a-z]/g,'').length>=3){
   const scored=pool.map(m=>({m,score:fuzzyNameScore(m.name,q)})).filter(x=>Number.isFinite(x.score)).sort((a,b)=>a.score-b.score);
   if(scored.length){
    const best=scored[0].score;
    results=scored.filter(x=>x.score<=best+1).slice(0,12).map(x=>x.m);
    fuzzySearchUsed=true;
   }
  }
 }
 return results.sort((a,b)=>{
  let by=0;
  if(fuzzySearchUsed){by=fuzzyNameScore(a.name,q)-fuzzyNameScore(b.name,q)}
  if(by)return by;
  if(f==='presidencype')by=protocolRank(a)-protocolRank(b);
  else if(f==='grouppresident')by=groupSizeOrder(a,b,groupSizes);
  else if(field('sort')==='role')by=rank(a)-rank(b)||(protocolRank(a)<100&&protocolRank(b)<100?protocolRank(a)-protocolRank(b):groupSizeOrder(a,b,groupSizes));
  if(field('sort')==='country')by=(fr[a.country]||a.country).localeCompare(fr[b.country]||b.country,'fr');
  if(field('sort')==='group')by=(a.group||'').localeCompare(b.group||'','fr');
  return by||surname(a).localeCompare(surname(b),'fr',{sensitivity:'base'})||a.name.localeCompare(b.name,'fr');
 });
}
const DIRECTORY_PAGE_SIZE=matchMedia('(max-width:650px)').matches?20:40;
let directoryVisible=0,directoryObserver=null;
