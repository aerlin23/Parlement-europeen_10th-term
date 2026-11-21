/* PDF texte vectoriel A4, avec repli raster uniquement pour les glyphes non pris en charge. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VFCavalierVectorPDF=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const W=595.276,H=841.89;
 function placement(text,width,size,y,rotated){
  const halfWidth=width/2;
  return rotated
   ?{x:W/2+halfWidth,y:y+size*.35,rotate:180}
   :{x:W/2-halfWidth,y:H-y-size*.35,rotate:0};
 }
 async function append(doc,svg,rasterize,lib){
  const groups=[...svg.querySelectorAll('g')];
  const texts=groups.flatMap(g=>[...g.querySelectorAll('text')].map(t=>({
   value:t.textContent||'',size:Number(t.getAttribute('font-size'))||30,y:Number(t.getAttribute('y'))||0,
   rotated:!!g.getAttribute('transform')
  })));
  if(!texts.length)throw Error('Cavalier vide');
  const font=await doc.embedFont(lib.StandardFonts.HelveticaBold);
  let supported=true;
  for(const t of texts)try{font.encodeText(t.value)}catch{supported=false;break}
  if(!supported){
   if(!rasterize)throw Error('Police indisponible pour certains caractères');
   const raster=await rasterize(svg),image=await doc.embedJpg(raster.bytes),page=doc.addPage([W,H]);
   page.drawImage(image,{x:0,y:0,width:W,height:H});
   return 'raster';
  }
  const page=doc.addPage([W,H]);
  for(const t of texts){
   const width=font.widthOfTextAtSize(t.value,t.size);
   const p=placement(t.value,width,t.size,t.y,t.rotated);
   page.drawText(t.value,{x:p.x,y:p.y,size:t.size,font,rotate:lib.degrees(p.rotate),color:lib.rgb(0,0,0)});
  }
  return 'vector';
 }
 return {append,placement};
});
