const assert=require('node:assert/strict');const core=require('../cavaliers-core-preview.js');
// Liste type du secrétariat : quantité vide pour les cavaliers nominatifs, titres « Point n » dans la colonne des noms.
const sheet=[['LOCATION: JAN 6Q2'],['Quantity','NAME or INSTITUTION','FUNCTION'],['','',''],['','Point 6 ',''],['','H. JALLOUL MURO','MEP (AFET)'],['','R. Tildesley','gender researcher'],['42','Committee of Regions',''],['20','RESERVE','invitees'],['','All points',''],['','Sonja Wollny','Director IUST'],['abc','N. DATTA','']];
const r=core.inspectSheet(sheet,[]);
assert.deepEqual(r.accepted.map(x=>[x.quantity,core.display(x.row)]),[[1,'H. JALLOUL MURO'],[1,'R. TILDESLEY'],[42,'COMMITTEE OF REGIONS'],[20,'RESERVE'],[1,'SONJA WOLLNY']]);
assert.deepEqual(r.ignored.map(x=>x.reason),['Titre de section','Titre de section']);
assert.deepEqual(r.review.map(x=>x.reason),['Quantité à vérifier']);
console.log('Secretariat order import checked');
// Libellés de la bibliothèque, groupes politiques, consignes et noms complets.
const lib=core.inspectSheet([['Quantity','NAME or INSTITUTION','FUNCTION'],['15','assistants of MEPs'],['5','journalists '],['1','SAFE'],['1','ITEC'],['1','PERS'],['1','LINC'],['1','CoR'],['','Political groups'],['2','per each political group'],['','Delphine COLARD','HoU'],['','please have cavaliers for all EP MEPs on stand-by']],[]);
assert.deepEqual(lib.accepted.map(x=>x.quantity+' '+core.display(x.row)),['15 APA','5 PRESSE','1 DG SAFE','1 DG ITEC','1 DG PERS','1 DG LINC','1 COMITÉ DES RÉGIONS','2 EPP','2 S&D','2 PFE','2 ECR','2 RENEW','2 VERTS/ALE','2 THE LEFT','2 ESN','1 D. COLARD']);
assert.deepEqual(lib.ignored.map(x=>x.reason),['Titre de section','Consigne']);
console.log('Library labels checked');
