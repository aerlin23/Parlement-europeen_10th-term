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
function schedule(){const signature=JSON.stringify([...previews.querySelectorAll('svg')].map(s=>[s.parentElement.dataset.surname,s.outerHTML]));if(signature===lastSignature&&pdfFile)return;lastSignature=signature;const gen=++generation;pdfFile=null;$('pdfName').textContent='';shareButton.disabled=true;$('downloadMobilePdf').disabled=true;clearTimeout(timer);const svgs=[...previews.querySelectorAll('svg')];if(!svgs.length){status.textContent=previews.dataset.excluded==='0'||!previews.dataset.excluded?'Importez la liste avant de préparer le PDF.':'Aucun cavalier valide : corrigez les lignes encadrées en orange.';return}$('retryPdf').hidden=true;status.textContent='Préparation du PDF…';timer=setTimeout(async()=>{try{const pages=[];for(const s of svgs){if(gen!==generation)return;pages.push(await renderPage(s))}if(gen!==generation)return;const surname=(svgs[0].parentElement.dataset.surname||'').replace(/[\\/:*?"<>|]/g,'-').trim()||'Participants';const filename=pages.length===1?'Cavalier - '+surname+'.pdf':'Cavaliers - '+surname+' et autres ('+pages.length+').pdf';pdfFile=pdfFromJpegs(pages,filename);$('pdfName').textContent=filename;shareButton.disabled=false;$('downloadMobilePdf').disabled=false;status.textContent=Number(previews.dataset.excluded)?previews.dataset.excluded+' ligne(s) à corriger, non imprimée(s).':''}catch(e){if(gen===generation){lastSignature='';status.textContent='Impossible de préparer le PDF. Réessayez ou utilisez l’impression classique sur ordinateur.'; $('retryPdf').hidden=false}}},200)}
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
$('classicPrint').onclick=()=>{const area=$('printSheets');area.replaceChildren();for(const s of viewPages){const div=document.createElement('div');div.className='print-sheet';div.append(s.cloneNode(true));area.append(div)}viewer.close();document.body.classList.add('printing-cavaliers');try{window.print()}finally{document.body.classList.remove('printing-cavaliers');area.replaceChildren();viewer.showModal()}};
let touchStart=0;sheet.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].clientX},{passive:true});sheet.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>55){page+=dx<0?1:-1;drawPage()}},{passive:true});
const core=window.CavalierCore;
const panel=$('rejected'), list=$('rejectedList');
function counts(){const n=list.children.length;$('rejectedCount').textContent=n;$('rejectedLabel').textContent='Lignes écartées ('+n+')';panel.hidden=!n;$('importSummary').hidden=!n&&!Number($('readyCount').textContent)&&!Number($('fixCount').textContent)}
$('import').onclick=()=>{const quantities=new Map();const input=$('paste').value.split(/\r?\n/).map(line=>{const q=core.quantityPrefix(line);if(q.quantity>1){const row=core.parse(q.value),key=JSON.stringify(row);if(confirm('Créer '+q.quantity+' exemplaires de '+core.display(row)+' ?'))quantities.set(key,q.quantity)}return q.value}).join('\n');const result=core.analyze(input);result.accepted=result.accepted.flatMap(row=>Array.from({length:quantities.get(JSON.stringify(row))||1},()=>row.slice()));list.replaceChildren();panel.open=false;for(const item of result.rejected){const row=document.createElement('div');row.className='rejected-row';const label=document.createElement('div');label.className='rejected-identity';const t=document.createElement('span');t.textContent=item.reason==='En-tête'?'En-tête Excel':item.raw.replace(/\t/g,' · ');const reason=document.createElement('small');reason.textContent=item.reason;label.append(t,reason);row.append(label);if(item.recover){const b=document.createElement('button');b.type='button';b.className='recover-row';b.textContent='+';b.setAttribute('aria-label','Récupérer '+item.raw);b.onclick=()=>{window.vfRecoverCavalier(item.row);row.remove();counts()};row.append(b)}list.append(row)}counts();window.vfSetCavalierRows(result.accepted);counts()};
$('clear').addEventListener('click',()=>{list.replaceChildren();counts()});

// All workbook processing happens in the browser. No workbook is uploaded.
let importMembers=null,loadToken=0;
const excelPanel=document.createElement('section');excelPanel.hidden=true;excelPanel.className='excel-inspection';excelPanel.style.cssText='margin:10px 0;padding:12px;border:1px solid #cbdce5;border-radius:8px';$('dropZone').after(excelPanel);
function element(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}
async function getImportMembers(){if(!importMembers)importMembers=fetch('./members.json').then(r=>{if(!r.ok)throw Error('Annuaire indisponible');return r.json()}).then(x=>Array.isArray(x)?x:[]).catch(()=>{importMembers=null;return []});return importMembers}

// Exact full-name matches only; ambiguous and abbreviated names require manual review.
let officialIndex=null;
async function getOfficialIndex(){if(!officialIndex)officialIndex=fetch('./cavaliers/index.json').then(r=>{if(!r.ok)throw Error('Index indisponible');return r.json()}).then(j=>j.entries||{}).catch(()=>{officialIndex=null;return {}});return officialIndex}
const officialKey=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
async function showOfficialCavaliers(){
 const token=++officialToken;
 const entries=await getOfficialIndex();if(token!==officialToken)return;
 const names=new Map();for(const [id,item] of Object.entries(entries)){const k=officialKey(item.name);if(!names.has(k))names.set(k,[]);names.get(k).push({id,item})}
 for(const card of $('entries').querySelectorAll('.compact-entry')){
  const title=card.querySelector('.entry-identity strong');if(!title)continue;
  const hits=names.get(officialKey(title.textContent))||[];
  if(hits.length!==1)continue;
  const {id}=hits[0];const link=element('a','Cavalier PE existant ↗');link.href='./cavaliers/'+encodeURIComponent(id)+'.pdf';link.target='_blank';link.rel='noopener';link.className='official-cavalier-link';link.style.cssText='display:inline-block;font-size:11px;margin-top:4px';card.querySelector('.entry-identity').append(link);
 }
}
let officialToken=0;
document.addEventListener('vf-cavaliers-ready',()=>{for(const a of document.querySelectorAll('.official-cavalier-link'))a.remove();showOfficialCavaliers()});
function inspectWorkbook(sheets,members){
 excelPanel.replaceChildren();excelPanel.hidden=false;
 const outcomes=sheets.map(s=>({...s,result:core.inspectSheet(s.matrix,members)}));
 const eligible=outcomes.filter(s=>s.result.headers&&s.result.accepted.length+s.result.review.length);
 const primary=eligible.slice().sort((a,b)=>b.result.score-a.result.score)[0];
 excelPanel.append(element('strong','Lecture du fichier Excel'));
 const label=element('label','Feuille à importer : '),select=element('select');select.style.cssText='max-width:100%;margin:6px 0';label.append(select);excelPanel.append(label);
 outcomes.forEach((s,i)=>{const o=element('option',s.name+' — '+(s.result.headers?(s.result.accepted.length+s.result.review.length)+' participant(s) détecté(s)':'colonnes non reconnues'));o.value=String(i);select.append(o)});
 if(primary)select.value=String(outcomes.indexOf(primary));
 const detail=element('div');excelPanel.append(detail);
 function show(){
  detail.replaceChildren();const current=outcomes[Number(select.value)];if(!current)return;const result=current.result;
  detail.append(element('p',result.accepted.length+' validé(s) · '+result.review.length+' à vérifier · '+result.ignored.length+' ligne(s) ignorée(s)'));
  const chosen=new Set(),replacements=new Map();
  if(result.review.length){const list=element('details');list.open=true;list.append(element('summary','Vérifier les identités et la présence'));
   result.review.forEach((item,i)=>{const div=element('div');div.style.cssText='padding:7px 0;border-bottom:1px solid #d8e3e8';const check=element('input');check.type='checkbox';check.setAttribute('aria-label','Inclure cette ligne');const rowLabel=element('label');rowLabel.append(check,document.createTextNode(' Ligne '+item.line+' : '+item.raw));div.append(rowLabel,element('small',item.reason));const edits=element('div');edits.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin:5px 0';
   const fields=['Prénom','Nom'].map((title,n)=>{const input=element('input');input.type='text';input.value=item.row[n]||'';input.placeholder=title;input.setAttribute('aria-label',title+' ligne '+item.line);input.style.cssText='min-width:90px;flex:1';edits.append(input);return input});
   const update=()=>replacements.set(i,[fields[0].value,fields[1].value,...item.row.slice(2)]);
   fields.forEach(f=>f.addEventListener('input',update));check.onchange=()=>{if(check.checked){chosen.add(i);update()}else chosen.delete(i)};
   if(item.suggestion){const suggest=element('button','Proposition : '+item.suggestion.slice(0,2).join(' '));suggest.type='button';suggest.onclick=()=>{fields.forEach((f,n)=>f.value=item.suggestion[n]);check.checked=true;chosen.add(i);update()};edits.append(suggest)}
   div.append(edits);list.append(div)});detail.append(list)}
  const apply=element('button','Utiliser cette feuille');apply.type='button';apply.className='primary';apply.disabled=!result.headers;apply.onclick=()=>{const rows=[...result.accepted,...result.review.map((item,i)=>chosen.has(i)?{...item,row:replacements.get(i)||item.row}:null).filter(Boolean)].sort((a,b)=>a.line-b.line);$('paste').value=rows.map(x=>x.row.join('\t')).join('\n');$('status').textContent=rows.length+' ligne(s) préparée(s). Cliquez sur « Générer les cavaliers ».';excelPanel.hidden=true};detail.append(apply);
  if(!result.headers){const fallback=element('button','Utiliser le copier-coller brut');fallback.type='button';fallback.onclick=()=>{$('paste').value=core.excelRows(current.matrix);excelPanel.hidden=true;$('status').textContent='Colonnes non reconnues : vérifiez manuellement la liste avant génération.'};detail.append(fallback)}
 }
 select.onchange=show;show();
}
async function load(file){if(!file)return;const token=++loadToken;try{
 if(file.size>10*1024*1024)throw Error('Fichier trop volumineux');
 if(!window.XLSX)throw Error('Lecteur Excel indisponible : utilisez le copier-coller');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
 const sheets=wb.SheetNames.map(name=>({name,matrix:XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:'',blankrows:true})}));
 if(sheets.reduce((n,s)=>n+s.matrix.length,0)>20000)throw Error('Classeur trop volumineux : limitez le nombre de lignes');
 const members=await getImportMembers();if(token!==loadToken)return;
 inspectWorkbook(sheets,members);$('status').textContent='Sélectionnez et vérifiez la feuille à importer.';
 }catch(e){if(token===loadToken)$('status').textContent=e.message}}
$('clear').addEventListener('click',()=>{loadToken++;excelPanel.hidden=true;excelPanel.replaceChildren()});
$('excelFile').onchange=e=>load(e.target.files[0]);const zone=$('dropZone');zone.ondragover=e=>e.preventDefault();zone.ondrop=e=>{e.preventDefault();load(e.dataTransfer.files[0])};
})();