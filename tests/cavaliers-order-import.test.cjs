const assert=require('node:assert/strict');const core=require('../cavaliers-core-preview.js');
// Liste type du secrétariat : quantité vide pour les cavaliers nominatifs, titres « Point n » dans la colonne des noms.
const sheet=[['LOCATION: JAN 6Q2'],['Quantity','NAME or INSTITUTION','FUNCTION'],['','',''],['','Point 6 ',''],['','H. JALLOUL MURO','MEP (AFET)'],['','R. Tildesley','gender researcher'],['42','Committee of Regions',''],['20','RESERVE','invitees'],['','All points',''],['','Sonja Wollny','Director IUST'],['abc','N. DATTA','']];
const r=core.inspectSheet(sheet,[]);
assert.deepEqual(r.accepted.map(x=>[x.quantity,core.display(x.row)]),[[1,'H. JALLOUL MURO'],[1,'R. TILDESLEY'],[42,'COMMITTEE OF REGIONS'],[20,'RESERVE'],[1,'SONJA WOLLNY']]);
assert.deepEqual(r.ignored.map(x=>x.reason),['Titre de section','Titre de section']);
assert.deepEqual(r.review.map(x=>x.reason),['Quantité à vérifier']);
console.log('Secretariat order import checked');
