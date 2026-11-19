(()=>{'use strict';
const $=id=>document.getElementById(id), email='mobileprint@europarl.europa.eu';
const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches||innerWidth<=900;
$('mobilePrint').hidden=false;
let pdfFile=null, generation=0;window.vfCavalierPdf=()=>pdfFile;
const shareButton=$('mailPrint'), status=$('mobilePdfStatus'), previews=$('previews');
function ascii(s){return new TextEncoder().encode(s)}
function pdfFromJpegs(pages,filename){
 const chunks=[], offsets=[0];let size=0;
 function put(v){const b=typeof v==='string'?ascii(v):v;chunks.push(b);size+=b.length}
 function obj(n,parts){offsets[n]=size;put(n+' 0 obj\n');for(const p of parts)put(p);put('\nendobj\n')}
 put('%PDF-1.4\n');obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
 obj(2,['<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>']);
 pages.forEach((p,i)=>{const n=3+i*3;obj(n,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.276 841.89] /Resources << /XObject << /Im '+(n+1)+' 0 R >> >> /Contents '+(n+2)+' 0 R >>']);obj(n+1,['<< /Type /XObject /Subtype /Image /Width '+p.w+' /Height '+p.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.bytes.length+' >>\nstream\n',p.bytes,'\nendstream']);const draw='q\n595.276 0 0 841.89 0 0 cm\n/Im Do\nQ\n';obj(n+2,['<< /Length '+ascii(draw).length+' >>\nstream\n'+draw+'endstream'])});
 const start=size;put('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');for(let i=1;i<offsets.length;i++)put(String(offsets[i]).padStart(10,'0')+' 00000 n \n');put('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n');return new File(chunks,filename,{type:'application/pdf'});
}
async function renderPage(svg){
 const canvas=document.createElement('canvas');canvas.width=1654;canvas.height=2339;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponible');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.scale(canvas.width/595.276,canvas.height/841.89);
 for(const g of svg.querySelectorAll('g')){
  ctx.save();if(g.hasAttribute('transform')){ctx.translate(595.276,841.89);ctx.rotate(Math.PI)}
  ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const t of g.querySelectorAll('text')){ctx.font='700 '+Number(t.getAttribute('font-size'))+'px Arial, sans-serif';ctx.fillText(t.textContent,Number(t.getAttribute('x')),Number(t.getAttribute('y')))}
  ctx.restore();
 }
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image indisponible')),'image/jpeg',0.93));
 return {w:canvas.width,h:canvas.height,bytes:new Uint8Array(await blob.arrayBuffer())};
}
let timer,lastSignature='';
function schedule(){const signature=JSON.stringify([...previews.querySelectorAll('svg')].map(s=>[s.parentElement.dataset.surname,s.outerHTML]));if(signature===lastSignature&&pdfFile)return;lastSignature=signature;const gen=++generation;pdfFile=null;$('pdfName').textContent='';shareButton.disabled=true;$('downloadMobilePdf').disabled=true;clearTimeout(timer);const svgs=[...previews.querySelectorAll('svg')];if(!svgs.length){status.textContent=previews.dataset.excluded==='0'||!previews.dataset.excluded?'Importez la liste avant de préparer le PDF.':'Aucun cavalier valide : corrigez les lignes encadrées en orange.';return}$('retryPdf').hidden=true;status.textContent='Préparation du PDF…';timer=setTimeout(async()=>{try{const filename='Cavaliers - '+svgs.length+' exemplaires.pdf';const result=await assembleOriginals(svgs,filename,gen);if(!result||gen!==generation)return;pdfFile=result.file;$('pdfName').textContent=filename;shareButton.disabled=false;$('downloadMobilePdf').disabled=false;status.textContent=result.originals+' cavalier(s) original(aux) intégré(s).';}catch(e){if(gen===generation){lastSignature='';status.textContent='Impossible de préparer le PDF : '+e.message; $('retryPdf').hidden=false}}},200)}
document.addEventListener('vf-cavaliers-ready',schedule);$('retryPdf').onclick=()=>{lastSignature='';schedule()};schedule();
$('downloadMobilePdf').onclick=()=>{if(!pdfFile)return;const a=document.createElement('a');a.href=URL.createObjectURL(pdfFile);a.download=pdfFile.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000)};
shareButton.onclick=async()=>{if(!pdfFile)return;try{if(navigator.canShare&&navigator.canShare({files:[pdfFile]})){try{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(email).catch(()=>{});}}catch(e){} await navigator.share({files:[pdfFile],title:pdfFile.name});status.textContent='Dans votre messagerie, utilisez '+email+' comme destinataire.'}else{$('downloadMobilePdf').click();status.textContent='Joignez le PDF téléchargé au message. Destinataire : '+email;const link=document.createElement('a');link.href='mailto:'+email+'?subject='+encodeURIComponent(pdfFile.name);link.textContent='Ouvrir un e-mail Mobile Print';status.append(document.createTextNode(' · '),link)}}catch(e){if(e.name!=='AbortError')status.textContent='Partage impossible : téléchargez le PDF et joignez-le au mail.'}};
$('copyPrint').onclick=async()=>{try{await navigator.clipboard.writeText(email);$('copyPrintLabel').textContent='Copié';$('copyPrint').setAttribute('aria-label','Destinataire copié');setTimeout(()=>{$('copyPrintLabel').textContent='Copier';$('copyPrint').setAttribute('aria-label','Copier le destinataire d’impression')},2500)}catch(e){prompt('Copiez cette adresse',email)}};

const viewer=$('printViewer'), sheet=$('viewerSheet'), sidebar=$('viewerNames');
let page=0,zoom=1,viewPages=[];
function drawPage(){if(!viewPages.length)return;page=Math.max(0,Math.min(page,viewPages.length-1));sheet.replaceChildren(viewPages[page].cloneNode(true));sheet.style.width=(zoom*100)+'%';$('pageNumber').textContent=(page+1)+' / '+viewPages.length;$('prevPage').disabled=page===0;$('nextPage').disabled=page===viewPages.length-1;[...sidebar.children].forEach((b,i)=>b.setAttribute('aria-current',i===page?'true':'false'));}
window.vfOpenPreview=()=>{viewPages=[...previews.querySelectorAll('svg')];if(!viewPages.length)return;page=0;zoom=1;sidebar.replaceChildren();viewPages.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=(i+1)+'. '+s.getAttribute('aria-label');b.onclick=()=>{page=i;drawPage()};sidebar.append(b)});$('viewerTotal').textContent=viewPages.length+' pages';drawPage();viewer.showModal();$('closeViewer').focus()};
$('closeViewer').onclick=()=>viewer.close();$('prevPage').onclick=()=>{page--;drawPage()};$('nextPage').onclick=()=>{page++;drawPage()};$('zoomOut').onclick=()=>{zoom=Math.max(.7,zoom-.1);drawPage()};$('zoomIn').onclick=()=>{zoom=Math.min(2,zoom+.1);drawPage()};
shareButton.hidden=false;$('copyPrint').hidden=false;$('viewerInstructions').hidden=false;$('classicPrint').hidden=mobile;
$('classicPrint').onclick=()=>{if(!pdfFile){status.textContent='Attendez la préparation du PDF complet.';return}const url=URL.createObjectURL(pdfFile);window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),120000)};
let touchStart=0;sheet.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].clientX},{passive:true});sheet.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>55){page+=dx<0?1:-1;drawPage()}},{passive:true});
const core=window.CavalierCore;
const panel=$('rejected'), list=$('rejectedList');
function counts(){const n=list.children.length;$('rejectedCount').textContent=n;$('rejectedLabel').textContent='Lignes écartées ('+n+')';panel.hidden=!n;$('importSummary').hidden=!n&&!Number($('readyCount').textContent)&&!Number($('fixCount').textContent)}
let preparedRows=null,preparedText='';
$('import').onclick=()=>{let result;if(preparedRows&&$('paste').value===preparedText){result={accepted:preparedRows.map(r=>r.slice()),rejected:[]}}else{const accepted=[],rejected=[];for(const line of $('paste').value.split(/\r?\n/)){if(!line.trim())continue;const q=core.quantityPrefix(line);if(q.explicit||q.quantity>1){const row=core.institutionalRow(q.value);const n=q.explicit||confirm('Créer '+q.quantity+' exemplaires de '+core.display(row)+' ?')?q.quantity:1;for(let i=0;i<n;i++)accepted.push(row.slice())}else{const x=core.analyze(line);accepted.push(...x.accepted);rejected.push(...x.rejected)}}result={accepted,rejected}}if(result.accepted.length>500){$('status').textContent='Plus de 500 exemplaires : divisez la demande.';return}list.replaceChildren();panel.open=false;for(const item of result.rejected){const row=document.createElement('div');row.className='rejected-row';const label=document.createElement('div');label.className='rejected-identity';const t=document.createElement('span');t.textContent=item.reason==='En-tête'?'En-tête Excel':item.raw.replace(/\t/g,' · ');const reason=document.createElement('small');reason.textContent=item.reason;label.append(t,reason);row.append(label);if(item.recover){const b=document.createElement('button');b.type='button';b.className='recover-row';b.textContent='+';b.setAttribute('aria-label','Récupérer '+item.raw);b.onclick=()=>{window.vfRecoverCavalier(item.row);row.remove();counts()};row.append(b)}list.append(row)}counts();window.vfSetCavalierRows(result.accepted);counts()};
$('clear').addEventListener('click',()=>{list.replaceChildren();counts()});

// All workbook processing happens in the browser. No workbook is uploaded.
let importMembers=null,loadToken=0;
const excelPanel=document.createElement('section');excelPanel.hidden=true;excelPanel.className='excel-inspection';excelPanel.style.cssText='margin:10px 0;padding:12px;border:1px solid #cbdce5;border-radius:8px';$('dropZone').after(excelPanel);
function element(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}

async function getImportMembers(){
 if(!importMembers)importMembers=(async()=>{
 const load=async(p,json=true)=>{try{const r=await fetch(p);if(!r.ok)throw Error(p);return json?await r.json():await r.text()}catch{return null}};
 const [pe,ec,sg,inst]=await Promise.all([load('./members.json'),load('./commission-members.json'),load('./interface.js',false),load('./institutions-agences.html',false)]);
 const records=[];
 for(const m of Array.isArray(pe)?pe:[])records.push({...m,source:'Parlement européen'});
 for(const m of Array.isArray(ec)?ec:[])records.push({...m,source:'Commission européenne',role:[m.roleLabel,m.portfolio].filter(Boolean).join(' · ')});
 // Read the literal arrays already used by the institutional directories; never execute fetched code.
 const extract=(s,key)=>{try{const start=s.indexOf('const '+key+'=');if(start<0)return null;const line=s.slice(start+('const '+key+'=').length).split('\n')[0];return JSON.parse(line.slice(0,line.lastIndexOf(';')))}catch{return null}};
 const dg=extract(sg||'','SG_PE_DATA')||[],org=extract(sg||'','SG_PE_ORG')||{};
 const add=(name,role,source,code)=>{const words=name.trim().split(/\s+/);if(words.length<2)return;records.push({name,firstName:words.shift(),lastName:words.join(' '),role,source,code})};
 for(const [code,name,role] of dg)add(name,role,'Secrétariat général',code);
 for(const [code,dirs] of Object.entries(org))for(const [direction,name] of dirs)if(name&&name.trim().includes(' '))add(name,'Direction '+direction,'Secrétariat général',code);
 for(const m of extract(inst||'','PEOPLE')||[])if(m.name)add(m.name,m.role,m.institution||'Institutions',null);
 return records;
 })().catch(()=>{importMembers=null;return []});return importMembers
}

// Exact full-name matches only; ambiguous and abbreviated names require manual review.
let officialIndex=null;
async function getOfficialIndex(){if(!officialIndex)officialIndex=fetch('./cavaliers/index.json').then(r=>{if(!r.ok)throw Error('Index indisponible');return r.json()}).then(j=>j.entries||{}).catch(()=>{officialIndex=null;return {}});return officialIndex}
const officialKey=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[.\s\-’']/g,'');
function buildOfficialNames(entries){const names=new Map();for(const [id,item] of Object.entries(entries)){const words=item.name.trim().split(/\s+/);const cut=words.findIndex((w,i)=>i>0&&w===w.toLocaleUpperCase('fr')&&/\p{Lu}/u.test(w));const keys=[item.name];if(cut>0){const f=words.slice(0,cut).join(' '),l=words.slice(cut).join(' ');keys.push(core.initials(f)+' '+l,l+' '+f);if(words.slice(0,cut).length>1)keys.push(words.slice(0,cut).map(w=>w[0]).join('')+' '+l)}for(const k of new Set(keys.map(officialKey))){if(!names.has(k))names.set(k,[]);names.get(k).push(id)}}return names}
function officialMatch(names,value){const ids=names.get(officialKey(value))||[];return ids.length===1?ids[0]:null}

const decisions=new Map();
function possibleMEPs(entries,value){
 const words=String(value||'').trim().split(/\s+/);
 if(words.length<2||!/^(?:\p{L}[.\-]*){1,5}$/u.test(words[0])||!words[0].includes('.'))return [];
 const surname=officialKey(words.slice(1).join(' '));
 return Object.entries(entries).filter(([id,m])=>{const parts=m.name.trim().split(/\s+/);const cut=parts.findIndex((w,i)=>i>0&&w===w.toLocaleUpperCase('fr')&&/\p{Lu}/u.test(w));if(cut<=0)return false;const family=parts.slice(cut);if(officialKey(family.join(' '))===surname)return true;return family.length>1&&family.some((_,i)=>i<family.length-1&&officialKey(family.slice(0,i+1).join(' '))===surname)&&officialKey(parts[0][0])===officialKey(words[0][0])});
}
function resolveMEP(entries,names,label){
 const exact=officialMatch(names,label);if(exact)return {id:exact};
 const k=officialKey(label);if(decisions.has(k))return {id:decisions.get(k)};
 const candidates=possibleMEPs(entries,label);return candidates.length?{candidates}:{id:null};
}
async function showOfficialCavaliers(){
 const token=++officialToken,entries=await getOfficialIndex(),names=buildOfficialNames(entries);if(token!==officialToken)return;
 const cards=[...$('entries').querySelectorAll('.compact-entry')],tiles=[...previews.querySelectorAll('.preview')];
 for(const tile of tiles){const s=tile.querySelector('svg');if(!s)continue;const label=s.getAttribute('aria-label'),result=resolveSource(entries,names,s);
 tile.style.borderColor=(result.id||result.private)?'#4a9669':(result.candidates||result.privateCandidates)?'#c58a32':'#b9cbd8';tile.style.background=(result.id||result.private)?'#edf7ef':(result.candidates||result.privateCandidates)?'#fff6e5':'';
 tile.querySelector('.official-cavalier-link')?.remove();
 const note=element('div',result.id?'PDF original du député':result.private?'PDF original · bibliothèque privée':result.privateCandidates?'Plusieurs PDF privés · à confirmer':result.candidates?'Député possible · à confirmer':'Cavalier généré');note.className='official-cavalier-link';note.style.cssText='font-size:12px;font-weight:600;color:'+((result.id||result.private)?'#24623a':(result.candidates||result.privateCandidates)?'#925900':'#526575');tile.append(note);
 if(result.candidates){for(const [id,m] of result.candidates){const b=element('button','Confirmer : '+m.name);b.type='button';b.style.cssText='display:block;margin:4px 0;font-size:12px';b.onclick=()=>{decisions.set(officialKey(label),id);lastSignature='';showOfficialCavaliers();schedule()};note.append(b)}const no=element('button','Non, créer un cavalier');no.type='button';no.onclick=()=>{decisions.set(officialKey(label),null);lastSignature='';showOfficialCavaliers();schedule()};note.append(no)}
 if(result.privateCandidates){for(const e of result.privateCandidates){const b=element('button',e.title);b.type='button';b.onclick=()=>{decisions.set(result.pk,e.id);lastSignature='';showOfficialCavaliers();schedule()};note.append(b)}const no=element('button','Créer un cavalier');no.type='button';no.onclick=()=>{decisions.set(result.pk,null);lastSignature='';showOfficialCavaliers();schedule()};note.append(no)}
 if(result.private){const b=element('button','Voir le PDF original');b.type='button';b.onclick=async()=>{const url=URL.createObjectURL(new Blob([await privateZip.file(result.private.file).async('uint8array')],{type:'application/pdf'}));window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),120000)};note.append(b)}
 if(result.id){const link=element('a','Voir le PDF original');link.href='./cavaliers/'+encodeURIComponent(result.id)+'.pdf';link.target='_blank';link.rel='noopener';note.append(document.createElement('br'),link)}
 }
}
async function assembleOriginals(svgs,filename,gen){
 const entries=await getOfficialIndex();if(!Object.keys(entries).length)throw Error('Index des cavaliers indisponible');
 const names=buildOfficialNames(entries),lib=window.PDFLib;if(!lib)throw Error('Moteur PDF indisponible');
 const output=await lib.PDFDocument.create(),cache=new Map();let originals=0;
 for(const s of svgs){if(gen!==generation)return null;const label=s.getAttribute('aria-label'),resolution=resolveSource(entries,names,s),id=resolution.id;
 if(resolution.privateCandidates)throw Error('Confirmez le PDF de la bibliothèque : '+label);
 if(resolution.candidates)throw Error('Confirmez le député possible : '+label+' dans les aperçus.');
 if(resolution.private){const e=resolution.private,k='local:'+e.id;if(!cache.has(k))cache.set(k,await lib.PDFDocument.load(await privateZip.file(e.file).async('uint8array')));const src=cache.get(k);for(const page of await output.copyPages(src,src.getPageIndices()))output.addPage(page);originals++}
 else if(id){if(!cache.has(id)){const response=await fetch('./cavaliers/'+encodeURIComponent(id)+'.pdf');if(!response.ok)throw Error('PDF original indisponible : '+label);cache.set(id,await lib.PDFDocument.load(await response.arrayBuffer()))}const src=cache.get(id);for(const page of await output.copyPages(src,src.getPageIndices()))output.addPage(page);originals++}
 else {const p=await renderPage(s),image=await output.embedJpg(p.bytes),page=output.addPage([595.276,841.89]);page.drawImage(image,{x:0,y:0,width:595.276,height:841.89})}
 }
 return {file:new File([await output.save()],filename,{type:'application/pdf'}),originals};
}
let officialToken=0;

let privateEntries=[],privateZip=null,privateRevision=0;
const privateKey=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}&]/gu,'');
function privateMatches(label){const k=privateKey(label);return privateEntries.filter(e=>e.aliases.some(a=>privateKey(a)===k))}
function privateLabel(svg){return [svg.getAttribute('aria-label'),[...svg.querySelector('g').querySelectorAll('text')].map(t=>t.textContent).join(' ')].filter(Boolean)}
function privateFor(svg){const labels=privateLabel(svg),hits=new Map();for(const label of labels)for(const e of privateMatches(label))hits.set(e.id,e);return [...hits.values()]}
function localDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('vf-private-cavaliers-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('library');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function libraryStore(value){const db=await localDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('library',value===undefined?'readonly':'readwrite'),store=tx.objectStore('library'),req=value===undefined?store.get('zip'):value===null?store.delete('zip'):store.put(value,'zip');tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
async function activateLibrary(blob){if(!window.JSZip)throw Error('Lecteur ZIP indisponible');const z=await JSZip.loadAsync(blob),manifest=z.file('manifest.json');if(!manifest)throw Error('Utilisez le ZIP indexé préparé pour le Vademecum');const data=JSON.parse(await manifest.async('string'));if(data.version!==1||!Array.isArray(data.entries)||data.entries.length>2000||!data.entries.every(e=>/^\d+$/.test(e.id)&&e.file==='pdf/'+e.id+'.pdf'&&Array.isArray(e.aliases)&&e.aliases.every(a=>typeof a==='string')&&z.file(e.file)))throw Error('Index privé invalide');privateZip=z;privateEntries=data.entries;privateRevision++;decisions.clear();lastSignature='';showOfficialCavaliers();schedule()}
const libraryBox=element('details');libraryBox.style.cssText='border:1px solid #cbdce5;border-radius:8px;padding:10px;margin:8px 0';libraryBox.append(element('summary','Bibliothèque privée de cavaliers'));const libraryStatus=element('p','Aucune bibliothèque locale chargée');const libraryInput=element('input');libraryInput.type='file';libraryInput.accept='.zip';libraryInput.setAttribute('aria-label','Importer le ZIP indexé privé');const libraryDelete=element('button','Retirer la bibliothèque locale');libraryDelete.type='button';libraryBox.append(libraryStatus,libraryInput,libraryDelete);$('dropZone').before(libraryBox);
libraryInput.onchange=async()=>{const file=libraryInput.files[0];if(!file)return;try{if(file.size>100*1024*1024)throw Error('Archive trop volumineuse');await activateLibrary(file);await libraryStore(file);libraryStatus.textContent=privateEntries.length+' PDF originaux disponibles sur cet appareil.'}catch(e){libraryStatus.textContent=e.message}finally{libraryInput.value=''}};
libraryDelete.onclick=async()=>{if(!confirm('Retirer la bibliothèque privée de cet appareil ?'))return;try{await libraryStore(null);privateEntries=[];privateZip=null;privateRevision++;decisions.clear();lastSignature='';libraryStatus.textContent='Aucune bibliothèque locale chargée';showOfficialCavaliers();schedule()}catch(e){libraryStatus.textContent=e.message}};
libraryStore().then(async blob=>{if(blob){await activateLibrary(blob);libraryStatus.textContent=privateEntries.length+' PDF originaux disponibles sur cet appareil.'}}).catch(e=>{libraryStatus.textContent='Bibliothèque locale indisponible : '+e.message});
function resolveSource(entries,names,svg){const label=svg.getAttribute('aria-label'),m=resolveMEP(entries,names,label);if(m.id||m.candidates)return m;const pk='private:'+officialKey(privateLabel(svg).join('|'));if(decisions.has(pk)){const id=decisions.get(pk);return {private:id?privateEntries.find(e=>e.id===id):null}}const hits=privateFor(svg);return hits.length===1?{private:hits[0]}:hits.length>1?{privateCandidates:hits,pk}:m}

document.addEventListener('vf-cavaliers-ready',()=>{for(const a of document.querySelectorAll('.official-cavalier-link'))a.remove();showOfficialCavaliers()});
function inspectWorkbook(sheets,members){
 excelPanel.replaceChildren();excelPanel.hidden=false;
 const outcomes=sheets.map(s=>({...s,result:core.inspectSheet(s.matrix,members)}));
 const eligible=outcomes.filter(s=>s.result.headers&&s.result.accepted.length+s.result.review.length);
 const primary=eligible.slice().sort((a,b)=>b.result.score-a.result.score)[0];
 excelPanel.append(element('strong','Lecture du fichier Excel'));
 excelPanel.append(element('br'));const label=element('label','Feuille à importer : '),select=element('select');select.style.cssText='max-width:100%;margin:6px 0';label.append(select);excelPanel.append(label);
 outcomes.forEach((s,i)=>{const o=element('option',s.name+' — '+(s.result.headers?(s.result.accepted.length+s.result.review.length)+' participant(s) détecté(s)':'colonnes non reconnues'));o.value=String(i);select.append(o)});
 if(primary)select.value=String(outcomes.indexOf(primary));
 const detail=element('div');excelPanel.append(detail);
 function show(){
  detail.replaceChildren();const current=outcomes[Number(select.value)];if(!current)return;const result=current.result;
  detail.append(element('p',result.accepted.length+' intitulé(s) validé(s) · '+result.accepted.reduce((n,x)=>n+(x.quantity||1),0)+' exemplaire(s) · '+result.review.length+' à vérifier · '+result.ignored.length+' ligne(s) ignorée(s)'));
  const chosen=new Set(),replacements=new Map();
  if(result.review.length){const list=element('details');list.open=true;list.append(element('summary','Vérifier les identités et la présence'));
   result.review.forEach((item,i)=>{const div=element('div');div.style.cssText='padding:7px 0;border-bottom:1px solid #d8e3e8';const check=element('input');check.type='checkbox';check.setAttribute('aria-label','Inclure cette ligne');const rowLabel=element('label');rowLabel.append(check,document.createTextNode(' Ligne '+item.line+' : '+item.raw));div.append(rowLabel,element('small',item.reason));const edits=element('div');edits.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin:5px 0';
   const fields=['Prénom','Nom'].map((title,n)=>{const input=element('input');input.type='text';input.value=item.row[n]||'';input.placeholder=title;input.setAttribute('aria-label',title+' ligne '+item.line);input.style.cssText='min-width:90px;flex:1';edits.append(input);return input});
   const update=()=>replacements.set(i,[fields[0].value,fields[1].value,...item.row.slice(2)]);
   fields.forEach(f=>f.addEventListener('input',update));check.onchange=()=>{if(check.checked){chosen.add(i);update()}else chosen.delete(i)};
   if(item.suggestion){const suggest=element('button','Proposition : '+item.suggestion.slice(0,2).join(' '));suggest.type='button';suggest.onclick=()=>{fields.forEach((f,n)=>f.value=item.suggestion[n]);check.checked=true;chosen.add(i);update()};edits.append(suggest)}
   div.append(edits);list.append(div)});detail.append(list)}
  const apply=element('button','Utiliser cette feuille');apply.type='button';apply.className='primary';apply.disabled=!result.headers;apply.onclick=()=>{const rows=[...result.accepted,...result.review.map((item,i)=>chosen.has(i)?{...item,row:replacements.get(i)||item.row}:null).filter(Boolean)].sort((a,b)=>a.line-b.line);const expanded=rows.flatMap(x=>Array.from({length:x.quantity||1},()=>x.row.slice()));if(expanded.length>500){$('status').textContent='Plus de 500 exemplaires : divisez la demande.';return}$('paste').value=rows.map(x=>(x.quantity||1)+' × '+core.display(x.row)).join('\n');preparedText=$('paste').value;preparedRows=expanded.map(r=>r.slice());list.replaceChildren();window.vfSetCavalierRows(expanded);counts();$('status').textContent=expanded.length+' cavaliers générés.';excelPanel.hidden=true};detail.append(apply);
  if(!result.headers){const fallback=element('button','Utiliser le copier-coller brut');fallback.type='button';fallback.onclick=()=>{$('paste').value=core.excelRows(current.matrix);excelPanel.hidden=true;$('status').textContent='Colonnes non reconnues : vérifiez manuellement la liste avant génération.'};detail.append(fallback)}
 }
 select.onchange=show;show();
}
async function load(file){if(!file)return;decisions.clear();const token=++loadToken;try{
 if(file.size>10*1024*1024)throw Error('Fichier trop volumineux');
 if(!window.XLSX)throw Error('Lecteur Excel indisponible : utilisez le copier-coller');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
 const sheets=wb.SheetNames.map(name=>({name,matrix:XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:'',blankrows:true})}));
 if(sheets.reduce((n,s)=>n+s.matrix.length,0)>20000)throw Error('Classeur trop volumineux : limitez le nombre de lignes');
 const members=await getImportMembers();if(token!==loadToken)return;
 inspectWorkbook(sheets,members);$('status').textContent='Sélectionnez et vérifiez la feuille à importer.';
 }catch(e){if(token===loadToken)$('status').textContent=e.message}}
$('clear').addEventListener('click',()=>{loadToken++;decisions.clear();preparedRows=null;preparedText='';excelPanel.hidden=true;excelPanel.replaceChildren()});
$('excelFile').onchange=e=>load(e.target.files[0]);const zone=$('dropZone');zone.ondragover=e=>e.preventDefault();zone.ondrop=e=>{e.preventDefault();load(e.dataTransfer.files[0])};
})();