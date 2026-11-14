(()=>{'use strict';
const $=id=>document.getElementById(id), selects=['c1','c2','c3'].map($), collator=new Intl.Collator('fr',{sensitivity:'base'});
let members=[],defs={},current=[];
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const selected=()=>selects.map(s=>s.value).filter(Boolean);
function sync(){for(const s of selects){for(const o of s.options)o.disabled=!!o.value&&selects.some(t=>t!==s&&t.value===o.value)}$('generate').disabled=selected().length<2||new Set(selected()).size!==selected().length;$('result').hidden=true}
function name(m){const last=m.lastName||m.name;const tail=m.name.slice(-last.length);return collator.compare(tail,last)===0?last.toUpperCase()+' '+m.name.slice(0,-last.length).trim():m.name}
function render(){const codes=selected();if(codes.length<2||new Set(codes).size!==codes.length)return;current=members.map(m=>({m,codes:codes.filter(code=>(m.committees||[]).some(c=>c.code===code&&c.status==='MEMBER'))})).filter(x=>x.codes.length);current=[...new Map(current.map(x=>[String(x.m.id),x])).values()].sort((a,b)=>collator.compare(a.m.lastName||a.m.name,b.m.lastName||b.m.name)||collator.compare(a.m.name,b.m.name)||String(a.m.id).localeCompare(String(b.m.id)));$('heading').textContent='Réunion conjointe — '+codes.join(' / ');$('count').textContent=current.length+' membres titulaires · sans doublons · A → Z';$('printDate').textContent='Édité le '+new Date().toLocaleDateString('fr-FR')+' · Vademecum PE (non officiel)';$('cards').replaceChildren();const table=make('table'),thead=make('thead'),tr=make('tr');for(const x of ['N°','Nom et prénom','Pays','Commission(s)'])tr.append(make('th',x));thead.append(tr);table.append(thead);const tbody=make('tbody');
current.forEach(({m,codes},i)=>{const card=make('article',undefined,'person'),id=String(m.id),img=make('img');img.alt='';if(/^\d+$/.test(id))img.src='./thumbs/'+id+'.webp';img.onerror=()=>{img.onerror=null;img.src='./photos/'+id+'.jpg'};const info=make('div'),link=make('a');link.href='./?person='+encodeURIComponent(id);link.append(make('strong',name(m)));info.append(link,make('small',m.country+' · '+m.group));for(const c of codes)info.append(make('span',c,'tag'));card.append(img,info);$('cards').append(card);const r=make('tr');for(const x of [String(i+1),name(m),m.country,codes.join(' / ')])r.append(make('td',x));tbody.append(r)});table.append(tbody);$('printList').replaceChildren(table);$('result').hidden=false}
function print(mode){
 if(!current.length)return;
 const w=window.open('','_blank');
 if(!w){$('status').textContent='Autorisez les fenêtres contextuelles pour ouvrir le document imprimable.';return}
 const d=w.document;
 d.open();d.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Réunion conjointe — document imprimable</title><style>@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#111;margin:20px auto;max-width:190mm;padding:0 8px}h1{font-size:19px;margin:0 0 6px}p{margin:0 0 12px}table{width:100%;border-collapse:collapse}th,td{padding:5px 6px;text-align:left;border-bottom:1px solid #bbb}thead{display:table-header-group}tr{break-inside:avoid}th{background:#eee}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.person{display:flex;gap:7px;align-items:center;border:1px solid #bbb;padding:6px;break-inside:avoid;min-height:83px}.person img{width:50px;height:67px;object-fit:cover}.person strong,.person small{display:block}.person small,.tag{font-size:10px}.tag{display:inline-block;margin:4px 5px 0 0}a{color:inherit;text-decoration:none}.controls{margin:0 0 15px;padding:10px;background:#eef3f6;border:1px solid #ccc}button{font:inherit;padding:8px 14px;cursor:pointer}@media print{body{margin:0;max-width:none;padding:0}.controls{display:none!important}}</style></head><body></body></html>');d.close();
 const add=(tag,txt,parent=d.body)=>{const n=d.createElement(tag);n.textContent=txt;parent.append(n);return n};
 const actions=add('div','');actions.className='controls';
 const btn=add('button','Imprimer / Enregistrer en PDF',actions);btn.type='button';btn.disabled=mode==='photos';
 const status=add('span',mode==='photos'?' — Chargement des photos…':' — Choisir « Enregistrer au format PDF » dans la fenêtre d’impression.',actions);
 add('h1',$('heading').textContent);add('p',$('count').textContent);add('p',$('printDate').textContent);
 const source=mode==='list'?$('printList').querySelector('table'):$('cards');
 const clone=d.importNode(source,true);clone.removeAttribute('id');clone.removeAttribute('hidden');
 const originals=[...source.querySelectorAll('img')];const images=[...clone.querySelectorAll('img')];images.forEach((img,i)=>{img.src=originals[i].src;img.removeAttribute('loading');img.onerror=()=>{img.onerror=null;img.src=new URL('./photos/'+String(current[i].m.id)+'.jpg',location.href).href}});
 clone.querySelectorAll('a').forEach(a=>a.replaceWith(...a.childNodes));
 d.body.append(clone);
 btn.onclick=()=>{w.focus();w.print()};
 if(mode==='photos'){Promise.allSettled(images.map(img=>img.decode())).then(()=>{btn.disabled=false;status.textContent=' — Document prêt. Vérifiez les portraits avant d’imprimer.'});}
}

$('generate').onclick=render;$('reset').onclick=()=>{for(const s of selects)s.value='';sync()};$('list').onclick=()=>print('list');$('photos').onclick=()=>print('photos');
Promise.all(['members.json','committees.json'].map(p=>fetch('./'+p).then(r=>{if(!r.ok)throw Error(p);return r.json()}))).then(([m,d])=>{members=m;defs=d;for(const s of selects){s.append(new Option(s.id==='c3'?'Aucune':'Choisir une commission',''));for(const code of Object.keys(defs).sort())s.append(new Option(code+' — '+defs[code].name,code));s.onchange=sync}sync()}).catch(()=>{$('status').textContent='Impossible de charger les données des commissions.'});
})();