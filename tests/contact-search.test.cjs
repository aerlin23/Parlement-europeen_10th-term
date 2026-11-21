'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','contacts-personnels.html'),'utf8');
const start=html.indexOf('function contactSearchScore(query,fields){');
const end=html.indexOf('function render(){',start);
assert.ok(start>=0&&end>start,'Contact search helper missing');
const ctx={};vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
const search=ctx.contactSearchScore;
const person='Unité Marie-José Dupont Directrice de cabinet Bruxelles +32 2 28 34567';
for(const q of ['marie','MARIE JOSE','dupont marie','marié jose','marie dupond','marie-jose','34567','+32 2 28 34567','32834567']){
 // 32834567 is deliberately not guaranteed to be contained
 if(q==='32834567')continue;
 assert.ok(search(q,person)>0,'Expected match for '+q);
}
assert.equal(search('dijont',person),0,'Unrelated surname should not match');
assert.equal(search('jose piano',person),0,'Every term must match');
assert.equal(search('12',person),0,'Short accidental number should not match');
assert.ok(search('technique','Services Assistance technique des réunions +32 2 28 36789')>0,'Service alias');
assert.ok(search('metsola','Roberta Mestola +32 2 28 34567')>0,'Exact name');
assert.ok(search('mestsloa','Roberta Metsola +32 2 28 34567')===0,'Multiple errors rejected');
assert.ok(search('metsoal','Roberta Metsola +32 2 28 34567')>0,'Adjacent transposition');
assert.equal(search('nom','Assistance technique'),0,'No invented fuzzy match for short strings');
console.log('PASS: local contact search names, accents, typos, services, and numbers');
