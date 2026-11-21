const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

for(const source of ['cavaliers-assistant-preview.js','preview-v364/cavaliers-assistant-preview.js']){
 const code=fs.readFileSync(path.join(__dirname,'..',source),'utf8');
 const start=code.indexOf('function privateTypoCandidates(svg){');
 const end=code.indexOf('function localDB(){',start);
 assert.ok(start>=0&&end>start,'Missing fuzzy matching helper in '+source);
 const entries=[
  {id:'1',title:'R. DE VICENTE',aliases:['Raquel de Vicente','R. de Vicente']},
  {id:'2',title:'P. DUCCI',aliases:['Pietro Ducci']}
 ];
 const context={privateEntries:entries};
 vm.createContext(context);
 vm.runInContext(code.slice(start,end),context,{filename:source});
 const lookup=(first,last)=>Array.from(context.privateTypoCandidates({dataset:{firstName:first,lastName:last}}),e=>e.id);
 assert.deepEqual(lookup('R.','DE VINCENTE'),['1'],'One-letter insertion should suggest original PDF');
 assert.deepEqual(lookup('Raquel','De Vincente'),['1'],'Full given name should suggest original PDF');
 assert.deepEqual(lookup('R.','DE VICENTE'),[],'Exact matches must remain in exact matching path');
 assert.deepEqual(lookup('P.','DE VINCENTE'),[],'Wrong initial must not suggest another person');
 assert.deepEqual(lookup('R.','DE VINZENTEZZ'),[],'More than one edit must not match');
 assert.deepEqual(lookup('R.','DUCCI'),[],'Unrelated family must not match');
}
console.log('Private cavalier near-match safeguards verified');
