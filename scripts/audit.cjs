'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const members=json('members.json');
const committees=json('committees.json');
const coordinators=json('coordinators.json').entries;
const seats=json('hemicycle-seats.json').seats;
const html=read('index.html');
const worker=read('sw.js');
const errors=[];
const warnings=[];
const check=(condition,message)=>{if(!condition)errors.push(message)};
const unique=arr=>new Set(arr).size===arr.length;
check(Array.isArray(members)&&members.length===720,'La liste doit comporter 720 députés');
const ids=members.map(m=>String(m.id));
check(unique(ids),'Identifiants de députés dupliqués');
const byId=new Map(members.map(m=>[String(m.id),m]));
const groups=new Set(['PPE','S&D','PfE','ECR','Renew','Verts/ALE','The Left','ESN','NI']);
for(const m of members){
 check(typeof m.name==='string'&&m.name.trim()&&groups.has(m.group),'Identité ou groupe invalide : '+m.id);
 const list=m.committees||[];
 check(unique(list.map(c=>c.code)),'Commission dupliquée : '+m.id);
 for(const c of list){
  check(!!committees[c.code],'Commission inconnue : '+m.id+'/'+c.code);
  check(['MEMBER','SUBSTITUTE'].includes(c.status),'Statut de commission invalide : '+m.id+'/'+c.code);
 }
 for(const f of m.parliamentaryFunctions||[]){
  if(f.type==='COMMITTEE_CHAIR'||f.type==='COMMITTEE_VICE_CHAIR'){
   check(list.some(c=>c.code===f.committee&&c.status==='MEMBER'),'Responsable sans titularisation : '+m.id+'/'+f.committee);
   if(f.type==='COMMITTEE_VICE_CHAIR')check(Number.isInteger(f.protocolRank),'Rang protocolaire absent : '+m.id+'/'+f.committee);
  }
 }
}
check(Object.keys(seats).length===members.length,'Numéros de siège incomplets ou supplémentaires');
for(const city of ['str','bru']){
 const values=[];
 for(const [id,seat] of Object.entries(seats)){
  check(byId.has(id),'Siège attribué à un député inconnu : '+id);
  if(seat[city]!=null)values.push(seat[city]);
 }
 check(unique(values),'Sièges dupliqués : '+city);
}
const seen=new Set();
for(const c of coordinators){
 const key=[c.id,c.committee,c.role].join('|');
 check(!seen.has(key),'Coordinateur dupliqué : '+key);
 seen.add(key);
 const m=byId.get(c.id);
 check(!!m,'Coordinateur inconnu : '+key);
 if(!m)continue;
 check(m.group===c.group,'Groupe coordinateur incorrect : '+key);
 check(!!committees[c.committee],'Commission du coordinateur inconnue : '+key);
 if(!(m.committees||[]).some(x=>x.code===c.committee)){
  if(c.sourceStatus==='historical-nomination')warnings.push('Nomination historique sans rattachement actuel : '+m.name+' / '+c.committee);
  else errors.push('Coordinateur non historique sans rattachement : '+m.name+' / '+c.committee);
 }
}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
check(scripts.length>0,'Scripts JavaScript absents');
for(const [i,match] of scripts.entries()){
 try{new vm.Script(match[1],{filename:'index.html#script'+i})}catch(error){errors.push('Syntaxe HTML/JS : '+error.message)}
}
try{new vm.Script(worker,{filename:'sw.js'})}catch(error){errors.push('Syntaxe service worker : '+error.message)}
check(worker.includes('coordinators|photo-assets'),'Coordinateurs absents de la stratégie de rafraîchissement du cache');
check(/register\('\.\/sw\.js\?v=\d+'/.test(html),'Enregistrement PWA versionné absent');
check(html.includes('value="commissionbureau"'),'Filtre groupé présidences de commission absent');
check(html.includes('syncCommissionFunctionMenu()'),'Filtre contextuel des commissions absent');
console.log('Audit : '+members.length+' députés, '+Object.keys(committees).length+' commissions, '+coordinators.length+' attributions, '+Object.keys(seats).length+' plans de sièges.');
for(const warning of warnings)console.warn('AVERTISSEMENT : '+warning);
if(errors.length){for(const error of errors)console.error('ERREUR : '+error);process.exitCode=1}
else console.log('AUDIT OK ('+warnings.length+' avertissements non bloquants).');
