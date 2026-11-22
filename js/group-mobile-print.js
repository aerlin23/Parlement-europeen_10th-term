/* Impression de toutes les fiches d'un groupe en PDF, compatible Mobile Print. */
(function(){
 const ADDRESS='mobileprint@europarl.europa.eu';
 const PDF_LIB_URL='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
 let loader;
 function loadPdfLib(){
  if(window.PDFLib)return Promise.resolve(window.PDFLib);
  if(loader)return loader;
  loader=new Promise((resolve,reject)=>{
   const s=document.createElement('script');
   s.src=PDF_LIB_URL;s.async=true;
   s.onload=()=>window.PDFLib?resolve(window.PDFLib):reject(Error('Bibliothèque PDF indisponible'));
   s.onerror=()=>reject(Error('Chargement PDF impossible'));
   document.head.appendChild(s);
  }).catch(e=>{loader=null;throw e});
  return loader;
 }
 function wrap(ctx,text,x,y,maxWidth,maxLines=5,lineHeight=22){
  const words=String(text||'').replace(/\s+/g,' ').trim().split(' ');
  let line='',count=0;
  for(const word of words){
   const test=line?line+' '+word:word;
   if(ctx.measureText(test).width>maxWidth&&line){
    ctx.fillText(line,x,y+count*lineHeight);count++;line=word;
    if(count>=maxLines)return;
   }else line=test;
  }
  if(line&&count<maxLines)ctx.fillText(line,x,y+count*lineHeight);
 }
 async function photoFor(m){
  const id=String(m.id||'');
  if(!/^\d+$/.test(id))return null;
  const candidates=['./thumbs/'+id+'.webp','./photos/'+id+'.jpg'];
  for(const url of candidates){
   try{
    const response=await fetch(url);
    if(!response.ok)continue;
    const blob=await response.blob();
    if(!blob.type.startsWith('image/'))continue;
    return await createImageBitmap(blob);
   }catch(e){}
  }
  return null;
 }
 async function generateGroupPdf(list,heading,status){
  const pdfLib=await loadPdfLib();
  const pdf=await pdfLib.PDFDocument.create();
  const canvas=document.createElement('canvas');
  canvas.width=1240;canvas.height=1754;
  const ctx=canvas.getContext('2d');
  const cols=2,perPage=8,margin=52,spacing=20;
  const cardW=(canvas.width-2*margin-spacing)/cols,cardH=365;
  for(let start=0;start<list.length;start+=perPage){
   status.textContent='Création du PDF : '+Math.min(start+perPage,list.length)+'/'+list.length+' fiches…';
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#003399';ctx.fillRect(0,0,canvas.width,12);
   ctx.fillStyle='#19334f';ctx.font='bold 33px Arial';
   wrap(ctx,heading,margin,65,canvas.width-2*margin,2,35);
   ctx.font='19px Arial';ctx.fillText(list.length+' députés · Vademecum PE',margin,108);
   const batch=list.slice(start,start+perPage);
   for(let j=0;j<batch.length;j++){
    const m=batch[j],x=margin+(j%2)*(cardW+spacing),y=142+Math.floor(j/2)*(cardH+14);
    ctx.fillStyle='#fff';ctx.fillRect(x,y,cardW,cardH);
    ctx.strokeStyle='#b9c9da';ctx.lineWidth=2;ctx.strokeRect(x,y,cardW,cardH);
    ctx.fillStyle='#003399';ctx.fillRect(x,y,7,cardH);
    const photo=await photoFor(m);
    if(photo){
     const w=115,h=137,scale=Math.max(w/photo.width,h/photo.height);
     ctx.save();ctx.beginPath();ctx.rect(x+18,y+18,w,h);ctx.clip();
     ctx.drawImage(photo,x+18+(w-photo.width*scale)/2,y+18+(h-photo.height*scale)/2,photo.width*scale,photo.height*scale);
     ctx.restore();photo.close?.();
    }
    ctx.fillStyle='#172c42';ctx.font='bold 23px Arial';
    wrap(ctx,m.name,x+(photo?146:22),y+48,cardW-(photo?170:44),3,27);
    ctx.font='19px Arial';ctx.fillStyle='#38516a';
    wrap(ctx,(m.country||'')+' · '+(m.group||''),x+(photo?146:22),y+118,cardW-(photo?170:44),2,24);
    const info=directoryCard(m).querySelector('.info');
    const details=info?.innerText?.replace(m.name,'').trim()||'';
    ctx.font='18px Arial';ctx.fillStyle='#223746';
    wrap(ctx,details,x+22,y+192,cardW-44,7,23);
   }
   const image=await pdf.embedPng(canvas.toDataURL('image/png'));
   const page=pdf.addPage([595.28,841.89]);
   page.drawImage(image,{x:0,y:0,width:595.28,height:841.89});
  }
  return new Blob([await pdf.save()],{type:'application/pdf'});
 }
 window.vfGroupMobilePrint=function({list,heading,page}){
  const button=page.document.getElementById('vfGroupMobilePrint');
  const status=page.document.getElementById('vfGroupPrintStatus');
  if(!button||!status)return;
  button.disabled=true;status.textContent='Préparation du PDF pour Mobile Print…';
  let file=null,blobUrl=null;
  generateGroupPdf(list,heading,status).then(blob=>{
   const filename='Vademecum - '+heading.replace(/[\\/:*?"<>|]/g,'-')+'.pdf';
   file=new File([blob],filename,{type:'application/pdf'});
   blobUrl=URL.createObjectURL(blob);
   button.disabled=false;
   status.textContent='PDF prêt. Appuie sur Mobile Print et choisis ta messagerie.';
  }).catch(e=>{status.textContent='PDF Mobile Print indisponible : '+e.message});
  button.addEventListener('click',()=>{
   if(!file)return;
   // navigator.share doit être lancé directement lors du clic, pas après une génération asynchrone.
   if(page.navigator.canShare?.({files:[file]})){
    const sharing=page.navigator.share({files:[file],title:file.name});
    navigator.clipboard?.writeText(ADDRESS).catch(()=>{});
    status.textContent='Envoie le PDF à '+ADDRESS+'.';
    sharing.catch(e=>{if(e.name!=='AbortError')status.textContent='Partage indisponible : utilise le téléchargement du PDF.'});
    return;
   }
   const link=document.createElement('a');link.href=blobUrl;link.download=file.name;page.document.body.appendChild(link);link.click();link.remove();
   status.textContent='PDF téléchargé. Joins-le à un message adressé à '+ADDRESS+'.';
  });
  page.addEventListener('pagehide',()=>{if(blobUrl)URL.revokeObjectURL(blobUrl)},{once:true});
 };
})();