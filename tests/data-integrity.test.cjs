'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const members = read('members.json'), committees = read('committees.json'), seats = read('hemicycle-seats.json'), coordinators = read('coordinators.json'), commission = read('commission-members.json');
const ids = new Set(members.map(m=>String(m.id)));
assert.equal(ids.size,members.length,'Duplicate MEP identifiers');
assert.ok(members.length<=720 && members.length>0,'Unexpected number of MEPs');
for(const m of members){
 assert.ok(m.id && m.name && m.country && m.group,'Incomplete MEP record');
 for(const c of m.committees||[]) assert.ok(committees[c.code], 'Unknown committee '+c.code+' for '+m.id);
}
assert.equal(new Set(members.map(m=>m.country)).size,27,'Member state coverage');
for(const id of Object.keys(seats.seats)) assert.ok(ids.has(id),'Unknown seat owner '+id);
for(const city of ['str','bru']){
 const assigned = members.map(m=>seats.seats[m.id]?.[city]).filter(n=>n!==null&&n!==undefined);
 assert.ok(assigned.every(n=>Number.isInteger(n)&&n>0&&n<=863),'Invalid '+city+' seat');
 assert.equal(new Set(assigned).size,assigned.length,'Duplicate '+city+' seats');
 if(assigned.length!==members.length) console.warn('WARNING: '+city+' missing seats: '+(members.length-assigned.length));
 assert.match(seats.plans[city].date,/^\d{4}-\d{2}-\d{2}$/);
}
const byId=new Map(members.map(m=>[String(m.id),m]));
for(const e of coordinators.entries){
 const m=byId.get(String(e.id));
 assert.ok(m,'Unknown coordinator '+e.id);
 assert.ok(committees[e.committee],'Unknown coordinator committee '+e.committee);
 assert.equal(m.group,e.group,'Coordinator group mismatch '+e.id);
 if(!m.committees?.some(c=>c.code===e.committee)) console.warn('WARNING: coordinator membership requires review: '+m.name+' / '+e.committee);
}
assert.equal(new Set(commission.map(m=>String(m.id))).size,commission.length,'Duplicate commissioner identifiers');
assert.equal(commission.length,27,'Commission size');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const p of ['index.html','creation-cavaliers.html','creation-cavaliers-preview.html','contacts-personnels.html','institutions-agences.html','commission-europeenne.html','outils.html']){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 for(const [,url] of html.matchAll(/<script[^>]+src=["'](\.\/[^"']+)["']/g)){
  assert.ok(fs.existsSync(path.join(root,url.split('?')[0])),'Missing script '+url);
  assert.ok(sw.includes("'"+url+"'"),'Script absent from offline cache '+url);
 }
 assert.ok(html.includes('GET_VERSION'),'Missing version synchronization '+p);
}
console.log('PASS: '+members.length+' MEPs, '+commission.length+' commissioners, seats, committees, coordinators and PWA references.');
