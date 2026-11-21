const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const fixture={
 '1':{name:'Roberta METSOLA'},
 '2':{name:'Raquel DE VICENTE'},
 '3':{name:'Pierre DUCCI'},
 '4':{name:'Rosa MESTOLA'}
};
for(const source of ['cavaliers-assistant-preview.js','preview-v364/cavaliers-assistant-preview.js']){
 const code=fs.readFileSync(path.join(__dirname,'..',source),'utf8');
 const start=code.indexOf('function possibleMEPTranspositions(entries,label){');
 const end=code.indexOf('function resolveMEP(entries,names,label){',start);
 assert.ok(start>=0&&end>start,'Missing candidate helper: '+source);
 const context={officialKey:s=>String(s||'').normalize('NFD').replace(/\\p{M}/gu,'').toLowerCase().replace(/[^\\p{L}\\p{N}]/gu,'')};
 vm.createContext(context);
 vm.runInContext(code.slice(start,end),context,{filename:source});
 const candidates=(name)=>Array.from(context.possibleMEPTranspositions(fixture,name),([id])=>id);
 assert.deepEqual(candidates('R. MESTOLA'),['1'],'Adjacent swap must suggest Roberta METSOLA');
 assert.deepEqual(candidates('R. METSOLA'),['4'],'Exact spelling is handled earlier; alternate typo remains a candidate');
 assert.deepEqual(candidates('P. MESTOLA'),[],'Different initials must not match');
 assert.deepEqual(candidates('R. MEZTOLA'),[],'Non-swap typo must not match');
 assert.deepEqual(candidates('R. MAESTOLL'),[],'Unrelated surnames must not match');
 assert.deepEqual(candidates('R. DE VINCENTE'),[],'Other typo types handled separately');
}
console.log('Official cavalier transposition suggestion checks passed');
