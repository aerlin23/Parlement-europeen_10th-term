const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f,'utf8'),json=f=>JSON.parse(read(f));
const m=json('members.json'),ids=new Set(m.map(x=>String(x.id))),comm=json('committees.json'),co=json('coordinators.json').entries,seats=json('hemicycle-seats.json').seats;
assert.equal(ids.size,m.length,'Duplicate member ID');assert(m.every(x=>x.id&&x.name&&x.country&&x.group),'Missing member fields');
assert(m.every(x=>(x.committees||[]).every(y=>comm[y.code])),'Invalid committee reference');
assert(co.every(x=>ids.has(String(x.id))&&comm[x.committee]),'Invalid coordinator reference');
assert.equal(new Set(co.map(x=>[x.id,x.committee,x.group,x.role].join('|'))).size,co.length,'Duplicate coordinator');
assert(Object.keys(seats).every(x=>ids.has(x)),'Unknown seat holder');
for(const city of ['bru','str']){const assigned=Object.values(seats).map(x=>x[city]).filter(Boolean);assert.equal(new Set(assigned).size,assigned.length,'Duplicate seat '+city)}
for(const f of ['directory.js','interface.js','quiz.js','offline.js','hemicycle.js','smart-search.js','features.js','sw.js','outils.js'])new vm.Script(read(f),{filename:f});
for(const f of ['index.html','contacts-personnels.html','creation-cavaliers.html','commission-europeenne.html','institutions-agences.html','outils.html']){
const s=read(f),ids=[...s.matchAll(/<[\w-]+\b[^>]*?\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs '+f);
for(const x of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!x[1].includes('src=')&&!/type=["']application\/json/.test(x[1]))new vm.Script(x[2],{filename:f});
}
const html=read('contacts-personnels.html');assert(!/const (?:secretariatNames|bruRooms|strRooms|extraServices)\s*=/.test(html),'Hardcoded directory tables');
const start=html.indexOf('function mergeSecretariat('),end=html.indexOf('function organize(',start);
const phoneStart=html.indexOf('function phoneEntries('),phoneEnd=html.indexOf('const favoriteKey',phoneStart);
assert(start>=0&&end>start&&phoneStart>=0&&phoneEnd>phoneStart,'Contact functions found');
const code=html.slice(phoneStart,phoneEnd)+'\n'+html.slice(start,end);
const context={norm:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s/g,''),favorites:new Set(),contactId:(g,r)=>g+'|'+r[0]};
vm.createContext(context);vm.runInContext(code,context);
// Use a structurally valid fictional Brussels extension for the actual alias test.
const alias=context.mergeSecretariat([['Alice','+3222830000',''],['Alice EXEMPLE','+3222830000','']]);assert.equal(alias.length,1);assert.equal(alias[0][0],'Alice EXEMPLE');
assert.equal(context.mergeSecretariat([['Bob EXEMPLE','+33388170000',''],['Claire EXEMPLE','+33388170000','']]).length,2);
assert.equal(context.phoneEntries('30000','+32 2 28 30000').length,1);
assert.equal(context.phoneEntries('70000','')[0].dial,'+33388170000');
assert.equal(context.phoneEntries('80000','')[0].dial,'80000');
assert.equal(context.phoneEntries('30000','')[0].dial,'+3222830000');
const sw=read('sw.js'),version=sw.match(/pe-pwa-v(\d+)/)?.[1];assert(version,'Cache version missing');
const assets=[...read('index.html').matchAll(/<script\b[^>]*src="(\.\/[^"]+)"/g)].map(x=>x[1]);for(const asset of assets)assert(sw.includes("'"+asset+"'"),'Uncached main script '+asset);
console.log('Static checks, directory invariants and fictional contact deduplication passed.');
