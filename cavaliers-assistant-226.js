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
function schedule(){const signature=JSON.stringify([...previews.querySelectorAll('svg')].map(s=>[s.parentElement.dataset.surname,s.outerHTML]));if(signature===lastSignature)return;lastSignature=signature;const gen=++generation;pdfFile=null;$('pdfName').textContent='';shareButton.disabled=true;$('downloadMobilePdf').disabled=true;clearTimeout(timer);const svgs=[...previews.querySelectorAll('svg')];if(!svgs.length){status.textContent=previews.dataset.excluded==='0'||!previews.dataset.excluded?'Importez la liste avant de préparer le PDF.':'Aucun cavalier valide : corrigez les lignes encadrées en orange.';return}status.textContent='Préparation du PDF…';timer=setTimeout(async()=>{try{const pages=[];for(const s of svgs){if(gen!==generation)return;pages.push(await renderPage(s))}if(gen!==generation)return;const surname=(svgs[0].parentElement.dataset.surname||'').replace(/[\\/:*?"<>|]/g,'-').trim()||'Participants';const filename=pages.length===1?'Cavalier - '+surname+'.pdf':'Cavaliers - '+surname+' et autres ('+pages.length+').pdf';pdfFile=pdfFromJpegs(pages,filename);$('pdfName').textContent=filename;shareButton.disabled=false;$('downloadMobilePdf').disabled=false;status.textContent=pages.length+' cavalier(s) dans le PDF.'+(Number(previews.dataset.excluded)?' '+previews.dataset.excluded+' ligne(s) à corriger, non imprimée(s).':'')}catch(e){if(gen===generation)status.textContent='Impossible de préparer le PDF. Utilisez l’impression classique.'}},200)}
document.addEventListener('vf-cavaliers-ready',schedule);schedule();
$('downloadMobilePdf').onclick=()=>{if(!pdfFile)return;const a=document.createElement('a');a.href=URL.createObjectURL(pdfFile);a.download=pdfFile.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000)};
shareButton.onclick=async()=>{if(!pdfFile)return;try{if(navigator.canShare&&navigator.canShare({files:[pdfFile]})){try{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(email).catch(()=>{});}}catch(e){} await navigator.share({files:[pdfFile],title:pdfFile.name});status.textContent='Dans votre messagerie, utilisez '+email+' comme destinataire.'}else{status.textContent='Partage de fichiers indisponible : téléchargez le PDF et joignez-le au mail.';$('downloadMobilePdf').click()}}catch(e){if(e.name!=='AbortError')status.textContent='Partage impossible : téléchargez le PDF et joignez-le au mail.'}};
$('copyPrint').onclick=async()=>{try{await navigator.clipboard.writeText(email);$('copyPrint').textContent='Adresse copiée'}catch(e){prompt('Copiez cette adresse',email)}};

const viewer=$('printViewer'), sheet=$('viewerSheet'), sidebar=$('viewerNames');
let page=0,zoom=1,viewPages=[];
function drawPage(){if(!viewPages.length)return;page=Math.max(0,Math.min(page,viewPages.length-1));sheet.replaceChildren(viewPages[page].cloneNode(true));sheet.style.width=(zoom*100)+'%';$('pageNumber').textContent=(page+1)+' / '+viewPages.length;$('prevPage').disabled=page===0;$('nextPage').disabled=page===viewPages.length-1;[...sidebar.children].forEach((b,i)=>b.setAttribute('aria-current',i===page?'true':'false'));}
window.vfOpenPreview=()=>{viewPages=[...previews.querySelectorAll('svg')];if(!viewPages.length)return;page=0;zoom=1;sidebar.replaceChildren();viewPages.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=(i+1)+'. '+s.getAttribute('aria-label');b.onclick=()=>{page=i;drawPage()};sidebar.append(b)});$('viewerTotal').textContent=viewPages.length+' pages';drawPage();viewer.showModal();$('closeViewer').focus()};
$('closeViewer').onclick=()=>viewer.close();$('prevPage').onclick=()=>{page--;drawPage()};$('nextPage').onclick=()=>{page++;drawPage()};$('zoomOut').onclick=()=>{zoom=Math.max(.7,zoom-.1);drawPage()};$('zoomIn').onclick=()=>{zoom=Math.min(2,zoom+.1);drawPage()};
shareButton.hidden=!mobile;$('copyPrint').hidden=!mobile;$('viewerInstructions').hidden=!mobile;$('classicPrint').hidden=mobile;
$('classicPrint').onclick=()=>{const area=$('printSheets');area.replaceChildren();for(const s of viewPages){const div=document.createElement('div');div.className='print-sheet';div.append(s.cloneNode(true));area.append(div)}viewer.close();document.body.classList.add('printing-cavaliers');try{window.print()}finally{document.body.classList.remove('printing-cavaliers');area.replaceChildren();viewer.showModal()}};
let touchStart=0;sheet.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].clientX},{passive:true});sheet.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>55){page+=dx<0?1:-1;drawPage()}},{passive:true});
const name=/^(?:\p{L}[\p{L}\p{M}’'\-‐‑.]*)(?:\s+\p{L}[\p{L}\p{M}’'\-‐‑.]*)*$/u;
const noise=/\b(?:participants?|delegation|délégation|pause|déjeuner|lunch|agenda|horaire|absent|excuse|excusé|confirmation|confirmer|présence|total|prénom|surname|firstname|lastname|nom de famille|organisation|fonction)\b/iu;
function classify(line){const s=line.trim();if(!s||/^\s*\(.*\)\s*$/u.test(s)||!/\p{L}/u.test(s))return 'ignore';if(/\b(?:à confirmer|tbc|tentative|absent|excusé)\b/iu.test(s))return 'check';const clean=s.replace(/\([^()]*\)/gu,' ').trim();const cols=clean.split(/[\t|]/u).map(x=>x.trim());const n=cols.length>1?cols.slice(0,2).join(' '):clean;if(noise.test(n))return 'ignore';if(!name.test(n)||n.split(/\s+/u).length<2||cols.length>5||/[()/]/u.test(clean))return 'check';return 'ok'}
$('import').addEventListener('click',e=>{const accepted=[],rejected=[],seen=new Set();for(const raw of $('paste').value.split(/\r?\n/u)){const line=raw.split(/[\t|]/u).map((v,i)=>i<2?v.replace(/[\/\\]+/gu,' ').replace(/(^|\s)[\p{Pd}]+/gu,'$1').replace(/[\p{Pd}]+(?=\s|$)/gu,''):v).join(raw.includes('\t')?'\t':raw.includes('|')?'|':'');if(!line.trim())continue;let type=classify(line);let key=line.replace(/\([^()]*\)/gu,'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/\s+/gu,' ').trim();if(type==='ok'&&seen.has(key))type='duplicate';if(type==='ok'){seen.add(key);accepted.push(line)}else rejected.push([line,type])}const old=$('paste').value;$('paste').value=accepted.join('\n');queueMicrotask(()=>{$('paste').value=old});const panel=$('rejected'), list=$('rejectedList');list.replaceChildren();panel.open=false;
function counts(){const n=list.children.length;$('rejectedCount').textContent=n;$('rejectedLabel').textContent='Lignes écartées ('+n+')';panel.hidden=!n;$('importSummary').hidden=!n&&!Number($('readyCount').textContent)&&!Number($('fixCount').textContent)}
for(const [line,type] of rejected){
 const raw=line.trim(), normalized=raw.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
 const par=/^\s*\((.*)\)\s*$/u.exec(raw);
 const parts=(par?par[1]:raw).split(/[\t|]/u).map(v=>v.trim());
 const candidate=parts.length>1?parts.slice(0,2).join(' ').trim():parts[0];
 const header=/^(?:prenom|first\s*name|given name|nom de famille|surname)(?:\s|$)/u.test(normalized);
 const comment=/^(?:pause|dejeuner|lunch|agenda|participants?|delegation|total|a confirmer|tbc|absent|excuse)(?:\s|$)/u.test(normalized);
 const time=/\d{1,2}[:h]\d{2}/u.test(raw);
 const plausible=!header&&!comment&&!time&&name.test(candidate)&&candidate.split(/\s+/u).length>=2&&(type==='duplicate'||type==='check'||!!par);
 const row=document.createElement('div');row.className='rejected-row';
 const label=document.createElement('div');label.className='rejected-identity';
 const text=document.createElement('span');text.textContent=header?'En-tête Excel':raw.replace(/\t/g,' · ');
 const reason=document.createElement('small');reason.textContent=header?'En-tête':time?'Horaire':par?'Parenthèses':type==='duplicate'?'Doublon':comment?'Commentaire / non confirmé':type==='check'?'À vérifier':'Ignorée';
 label.append(text,reason);row.append(label);
 if(plausible){const b=document.createElement('button');b.type='button';b.className='recover-row';b.textContent='+';b.title='Récupérer ce participant';b.setAttribute('aria-label','Récupérer '+candidate);b.onclick=()=>{$('add').click();const fields=$('entries').lastElementChild.querySelectorAll('input');const vals=parts.length>1?parts:(()=>{const w=candidate.split(/\s+/u);return [w.shift(),w.join(' ')]})();for(let i=0;i<Math.min(vals.length,fields.length);i++){fields[i].value=vals[i];fields[i].dispatchEvent(new Event('input'))}row.remove();counts()};row.append(b)}
 list.append(row)
}counts()},true);
 $('clear').addEventListener('click',()=>{$('rejectedList').replaceChildren();$('rejected').hidden=true;$('rejectedCount').textContent='0';$('importSummary').hidden=true});
async function load(file){if(!file)return;try{if(file.size>10*1024*1024)throw Error('Fichier trop volumineux');if(!window.XLSX)throw Error('Lecteur Excel indisponible : utilisez le copier-coller');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});const lines=wb.SheetNames.flatMap(n=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:''}).map(row=>row.map(v=>String(v).replace(/[\r\n\t]/gu,' ')).join('\t')));$('paste').value=lines.join('\n');$('status').textContent='Fichier chargé. Cliquez sur Importer la liste après avoir vérifié les colonnes.'}catch(e){$('status').textContent=e.message}}
$('excelFile').onchange=e=>load(e.target.files[0]);const zone=$('dropZone');zone.ondragover=e=>e.preventDefault();zone.ondrop=e=>{e.preventDefault();load(e.dataTransfer.files[0])};
})();