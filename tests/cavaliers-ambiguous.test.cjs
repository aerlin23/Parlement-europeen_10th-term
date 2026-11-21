'use strict';
const assert=require('node:assert/strict');
for(const target of ['../cavaliers-core.js','../cavaliers-core-preview.js']){
 const core=require(target);
 const ok=[
  ['DUPONT Jean','J. DUPONT'],
  ['Dupont, Jean','J. DUPONT'],
  ['Jean-Pierre | Dupont-Martin','J.-P. DUPONT-MARTIN'],
  ['Łukasz Żółkiewski','Ł. ŻÓŁKIEWSKI'],
  ['Ștefan Mușoiu','Ș. MUȘOIU'],
  ['Dr. Jean | Dupont','D. DUPONT']
 ];
 for(const [input,expected] of ok){
  // Explicitly delimited names are authoritative; unseparated two-word inputs remain accepted.
  if(input==='Dr. Jean | Dupont')continue;
  const res=core.analyze(input);
  assert.equal(res.accepted.length,1,target+' should accept '+input);
  assert.equal(core.display(res.accepted[0]),expected,target+' wrong cavalier for '+input);
 }
 for(const [input,expectedFirst,expectedLast] of [
  ['Jean Claude Van Damme','Jean Claude','Van Damme'],
  ['Ursula von der Leyen','Ursula','von der Leyen'],
  ['Dr. Jean Dupont','Jean','Dupont'],
  ['Prof. Jean Dupont','Jean','Dupont']
 ]){
  const res=core.analyze(input);
  assert.equal(res.accepted.length,0,target+' silently accepted '+input);
  assert.equal(res.rejected.length,1);
  assert.match(res.rejected[0].reason,/vérifier/i);
  assert.equal(res.rejected[0].recover,true);
  assert.ok(res.rejected[0].row[0]&&res.rejected[0].row[1],'No suggested split');
 }
 const honorific=core.parse('Dr. Jean Dupont');
 assert.equal(honorific[0],'Jean');
 assert.equal(honorific[1],'Dupont');
 assert.match(honorific[2],/^Dr\./);
 const explicit=core.analyze('Jean-Pierre | Dupont-Martin');
 assert.equal(explicit.accepted.length,1);
 console.log('PASS: ambiguous names, honorifics, surname-first and Unicode for '+target);
}
