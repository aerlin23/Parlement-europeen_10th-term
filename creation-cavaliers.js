(()=>{'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',labels=['Prénom','Nom de famille','Titre','Organisation','Fonction'],collator=new Intl.Collator('fr',{sensitivity:'base'});let rows=[];
function stripParentheses(s){let depth=0,out='';for(const c of String(s||'')){if(c==='('||c==='（'){depth++;if(depth===1)out+=' ';continue}if(c===')'||c==='）'){if(depth)depth--;continue}if(!depth)out+=c}return out}
const clean=s=>stripParentheses(s).normalize('NFC').trim().replace(/\s+/gu,' ');
function initials(s){return clean(s).split(/\s+/u).filter(Boolean).map(w=>w.split(/[-‐‑]/u).filter(Boolean).map(x=>{const chars=Array.from(x);return chars[0]?chars[0].toLocaleUpperCase('fr')+'.':''}).join('-')).join(' ')}
function full(r){return [initials(r[0]),clean(r[1]).toLocaleUpperCase('fr')].filter(Boolean).join(' ')}
const ctx=document.createElement('canvas').getContext('2d');
function width(s,n){ctx.font='700 '+n+'px Arial, sans-serif';return ctx.measureText(s).width}
function fit(s,cap,max=530){let n=cap;while(n>12&&width(s,n)>max)n-=.5;return n}
function wrap(s,n,max=530){const lines=[];let line='';for(const w of s.split(/\s+/u)){const next=line?line+' '+w:w;if(line&&width(next,n)>max){lines.push(line);line=w}else line=next}if(line)lines.push(line);return lines}
// Partitionner les noms sur les espaces, sans couper les noms composés.
function nameLayout(n,cap){
 const words=n.split(/\s+/u).filter(Boolean),max=530;
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
 const warning=sizes.some((s,i)=>s<(i<name.lines.length?28:20))||!clean(r[1])||texts.some((s,i)=>width(s,sizes[i])>530);
 return {texts,positions,sizes,count,warning,nameLines:name.lines.length}
}
function svg(r){const m=model(r),s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 595.276 841.89');s.setAttribute('xmlns',NS);s.setAttribute('role','img');s.setAttribute('aria-label',full(r));for(let side=0;side<2;side++){const g=document.createElementNS(NS,'g');if(side)g.setAttribute('transform','translate(595.276 841.89) rotate(180)');m.texts.forEach((str,i)=>{const t=document.createElementNS(NS,'text');t.setAttribute('x','297.638');t.setAttribute('y',m.positions[i]);t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','central');t.setAttribute('font-family','Arial, sans-serif');t.setAttribute('font-weight','700');t.setAttribute('font-size',m.sizes[i]);t.setAttribute('fill','#000');t.textContent=str;g.append(t)});s.append(g)}return s}
function refresh(){const list=$('previews');list.replaceChildren();const valid=rows.filter(r=>clean(r[1]));for(const r of valid){const box=document.createElement('div');box.className='preview';const p=document.createElement('p');const m=model(r);p.textContent=m.count+' ligne(s) · '+full(r)+(m.warning?' · vérifier la taille':'');if(m.warning)p.className='warning';box.append(svg(r),p);list.append(box)}$('previewPanel').hidden=!valid.length;$('print').disabled=!valid.length||rows.some(r=>!clean(r[1])||model(r).warning);$('status').textContent=rows.length+' participant(s)'+(rows.some(r=>!clean(r[1])||model(r).warning)?' — Vérifiez les champs manquants ou les textes trop longs.':'')}
function editor(){const div=$('entries');div.replaceChildren();rows.forEach((r,i)=>{const e=document.createElement('div');e.className='entry';labels.forEach((label,j)=>{const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.value=r[j]||'';input.addEventListener('input',()=>{r[j]=input.value;refresh()});l.append(input);e.append(l)});const b=document.createElement('button');b.textContent='Supprimer';b.onclick=()=>{rows.splice(i,1);editor()};e.append(b);div.append(e)});$('editor').hidden=!rows.length;refresh()}
$('import').onclick=()=>{const parsed=$('paste').value.split(/\r?\n/u).map(stripParentheses).filter(x=>x.trim()).map(line=>{if(line.includes('\t')||line.includes('|')){let cols=line.split(line.includes('\t')?'\t':'|').map(clean);return [cols[0]||'',cols[1]||'',cols[2]||'',cols[3]||'',cols.slice(4).join(' | ')]}const words=clean(line).split(' ');return words.length===1?['',words[0],'','','']:[words.shift(),words.join(' '),'','','']});rows=parsed;editor()};
$('add').onclick=()=>{rows.push(['','','','','']);editor();$('entries').lastElementChild?.querySelector('input').focus()};$('clear').onclick=()=>{rows=[];$('paste').value='';editor()};$('sort').onclick=()=>{rows.sort((a,b)=>collator.compare(clean(a[1]),clean(b[1]))||collator.compare(clean(a[0]),clean(b[0])));editor()};
$('print').onclick=()=>{if($('print').disabled)return;const w=window.open('','_blank');if(!w){$('status').textContent='Autorisez les fenêtres contextuelles.';return}const d=w.document;d.open();d.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cavaliers A4</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9eef2;font:14px Arial,sans-serif}.controls{position:sticky;top:0;padding:12px;background:white;text-align:center;border-bottom:1px solid #ccc}button{padding:8px 16px;font:inherit}.sheet{width:210mm;height:297mm;background:white;margin:12px auto;overflow:hidden}.sheet svg{display:block;width:100%;height:100%}@media print{body{background:white}.controls{display:none!important}.sheet{margin:0;break-after:page;page-break-after:always}.sheet:last-child{break-after:auto;page-break-after:auto}}</style></head><body></body></html>');d.close();const bar=d.createElement('div');bar.className='controls';const b=d.createElement('button');b.textContent='Imprimer / Enregistrer en PDF';b.onclick=()=>w.print();bar.append(b,d.createTextNode(' — A4 portrait · échelle 100 % · sans en-têtes ni pieds de page'));d.body.append(bar);for(const r of rows){const sheet=d.createElement('section');sheet.className='sheet';sheet.append(d.importNode(svg(r),true));d.body.append(sheet)}};
})();