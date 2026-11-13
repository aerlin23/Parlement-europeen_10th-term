/* Suggestions locales, sans serveur ni modification du filtre Commissions. */
(()=>{
'use strict';
const input=document.getElementById('search'),panel=document.getElementById('smartSearchResults');
if(!input||!panel)return;
let choices=[],selected=-1;
const groups={'PPE':'Parti populaire européen','S&D':'Socialistes et démocrates','PfE':'Patriotes pour l’Europe','ECR':'Conservateurs et réformistes européens','Renew':'Renew Europe','Verts/ALE':'Verts / Alliance libre européenne','The Left':'La Gauche','ESN':'Europe des nations souveraines','NI':'Non-inscrits'};
const functions=[
 ['presidencype','Présidence et vice-présidences du Parlement','president parlement'],
 ['quaestor','Questeurs du Parlement','questeur'],
 ['commissionbureau','Présidence et vice-présidences de commission','president commission'],
 ['grouppresident','Présidence de groupe','president groupe'],
 ['coord','Coordinateurs de commission','coordinateur']
];
function close(){choices=[];selected=-1;panel.replaceChildren();panel.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}
function score(value,q){const v=norm(value);if(v===q)return 0;if(v.startsWith(q))return 1;if(v.split(/[\s\-–/]+/).some(w=>w.startsWith(q)))return 2;return v.includes(q)?3:Infinity}
function search(value){
 const q=norm(value.trim());if(!q||!members.length)return [];
 const out=[],add=(kind,title,desc,weight,action)=>{if(Number.isFinite(weight))out.push({kind,title,desc,weight,action})};
 for(const [code,def] of Object.entries(committeeDefs)){
  add('Commission',code+' — '+def.name,'Membres et responsables',Math.min(score(code,q),score(def.name,q)+1),{committee:code});
 }
 for(const [code,name] of Object.entries(groups)){
  add('Groupe',name+' ('+code+')','Députés du groupe',Math.min(score(code,q),score(name,q)+1),{group:code});
 }
 const seat=/^([sb])\s*[- ]?\s*(\d{1,3})$/i.exec(value.trim());
 if(seat){
  const city=seat[1].toLowerCase()==='s'?'str':'bru',number=Number(seat[2]);
  const member=members.find(m=>hemicycleSeats[String(m.id)]?.[city]===number);
  if(member)add('Siège',member.name,(city==='str'?'Strasbourg':'Bruxelles')+' '+number,-1,{seat:seat[1].toUpperCase()+number});
 }
 const leadership=/^(?:pr[eé]sident(?:e)?|vice[- ]?pr[eé]sident(?:e)?)\s+([a-z]{3,6})$/i.exec(value.trim());
 if(leadership){
  const code=leadership[1].toUpperCase();
  if(committeeDefs[code])add('Fonction','Présidence et vice-présidences '+code,committeeDefs[code].name,-1,{committee:code,func:'commissionbureau'});
 }
 for(const [func,title,alias] of functions){
  add('Fonction',title,'Afficher les titulaires',Math.min(score(title,q),score(alias,q)+1),{func});
 }
 let memberMatches=0;
 if(q.length>=2){
  for(const m of members){const sc=score(m.name,q);if(Number.isFinite(sc)){memberMatches++;add('Député',m.name,m.group+' · '+(fr[m.country]||m.country),sc,{person:m.name})}}
  if(!memberMatches&&q.replace(/[^a-z]/g,'').length>=3){
   for(const m of members){const fuzzy=fuzzyNameScore(m.name,q);if(fuzzy<=1)add('Député',m.name,m.group+' · '+(fr[m.country]||m.country),5+fuzzy,{person:m.name})}
  }
 }
 const order={'Siège':0,'Commission':1,'Groupe':2,'Fonction':3,'Député':4};
 return out.sort((a,b)=>a.weight-b.weight||order[a.kind]-order[b.kind]||a.title.localeCompare(b.title,'fr')).slice(0,5);
}
function choose(choice){
 close();
 for(const id of ['search','group','committee','function','country','gender','assignment','kind']){
  const el=document.getElementById(id);if(el)el.value='';
 }
 if(choice.action.person)input.value=choice.action.person;
 if(choice.action.seat)input.value=choice.action.seat;
 if(choice.action.group)document.getElementById('group').value=choice.action.group;
 if(choice.action.committee)document.getElementById('committee').value=choice.action.committee;
 if(choice.action.func)document.getElementById('function').value=choice.action.func;
 document.getElementById('sort').value=choice.action.committee||choice.action.group||choice.action.func?'role':'name';
 changeFilters();input.blur();
}
function highlight(index){
 selected=index;for(const [i,node] of [...panel.children].entries())node.setAttribute('aria-selected',String(i===index));
 if(index>=0)input.setAttribute('aria-activedescendant','smart-result-'+index);
 else input.removeAttribute('aria-activedescendant');
}
function show(){
 choices=search(input.value);selected=-1;panel.replaceChildren();
 for(const [i,choice] of choices.entries()){
  const button=document.createElement('button');button.type='button';button.className='smart-search-option';
  button.id='smart-result-'+i;button.setAttribute('role','option');button.setAttribute('aria-selected','false');
  const kind=document.createElement('span');kind.className='smart-search-kind';kind.textContent=choice.kind;
  const label=document.createElement('span');label.className='smart-search-label';label.textContent=choice.title;
  button.append(kind,label);button.title=choice.desc;button.addEventListener('click',()=>choose(choice));panel.append(button);
 }
 panel.hidden=!choices.length;input.setAttribute('aria-expanded',String(choices.length>0));
}
input.addEventListener('input',show);
input.addEventListener('focus',show);
input.addEventListener('keydown',event=>{
 if(event.key==='Escape'){close();return}
 if(!choices.length)return;
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
  event.preventDefault();highlight((selected+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length);
 }else if(event.key==='Enter'){event.preventDefault();choose(choices[selected<0?0:selected])}
});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.smart-search-wrap'))close()});
const reset=document.getElementById('reset');if(reset)reset.addEventListener('click',close);
})();
