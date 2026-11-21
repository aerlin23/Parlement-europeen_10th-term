'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),contacts=fs.readFileSync(path.join(root,'contacts-personnels.html'),'utf8');
assert.ok(contacts.includes("let groups={}"),'Contacts must start empty and be imported locally');
assert.ok(contacts.includes("localStorage.getItem(key)"),'Contacts must load from local storage');
assert.ok(contacts.includes("localStorage.setItem(key"),'Contacts must be saved locally');
const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
// Audit every tracked path, including public preview folders and versioned ZIP/PDF names.
const confidentialName=/(?:^|[\/\\._-])(?:privee?s?|private|confidentiel(?:le)?s?|secrets?|interne?s?)(?=$|[\/\\._-])/i;
const privateContactName=/(?:contacts?[-_](?:prives?|personnels?|internes?))(?=$|[\/\\._-])/i;
const publishedDocument=/\.(?:zip|json|pdf|xlsx?|csv)$/i;
const prohibited=files.filter(p=>
  /(?:^|[\/\\])\.env(?:\.|$)/i.test(p) ||
  (publishedDocument.test(p) && (confidentialName.test(p) || privateContactName.test(p)))
);
assert.deepEqual(prohibited,[],'Private file names committed to public repository');
for(const p of ['index.html','creation-cavaliers.html','creation-cavaliers-preview.html','contacts-personnels.html','institutions-agences.html','commission-europeenne.html','outils.html']){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 assert.ok(html.includes('name="referrer" content="no-referrer"'),'Missing referrer policy: '+p);
}
console.log('PASS: locally imported contacts, restricted file names and referrer policy');
