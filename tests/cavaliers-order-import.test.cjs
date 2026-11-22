const assert=require('node:assert/strict');const core=require('../cavaliers-core-preview.js');
// Liste type du secrétariat : quantité vide pour les cavaliers nominatifs, titres « Point n » dans la colonne des noms.
const sheet=[['LOCATION: JAN 6Q2'],['Quantity','NAME or INSTITUTION','FUNCTION'],['','',''],['','Point 6 ',''],['','H. JALLOUL MURO','MEP (AFET)'],['','R. Tildesley','gender researcher'],['42','Committee of Regions',''],['20','RESERVE','invitees'],['','All points',''],['','Sonja Wollny','Director IUST'],['abc','N. DATTA','']];
const r=core.inspectSheet(sheet,[]);
assert.deepEqual(r.accepted.map(x=>[x.quantity,core.display(x.row)]),[[1,'H. JALLOUL MURO'],[1,'R. TILDESLEY'],[20,'RESERVE'],[1,'S. WOLLNY']]);
assert.deepEqual(r.ignored.map(x=>x.reason),['Titre de section','Titre de section']);
assert.deepEqual(r.review.map(x=>[x.quantity,core.display(x.row),!!x.preselect]),[[42,'COMITÉ DES RÉGIONS',true],[1,'N. DATTA',false]]);
// Intitulés anglais → cavaliers de la bibliothèque, proposés à vérification (pré-cochés).
const lib=core.inspectSheet([['Quantity','NAME or INSTITUTION','FUNCTION'],['15','assistants of MEPs'],['5','journalists '],['1','SAFE'],['1','ITEC'],['1','Cabinet of the President'],['1','Cabinet SecGen'],['1','Coordleg'],['1','CoR'],['','Political groups'],['2','per each political group'],['','Delphine COLARD','HoU'],['','please have cavaliers for all EP MEPs on stand-by']],[]);
assert.deepEqual(lib.accepted.map(x=>x.quantity+' '+core.display(x.row)),['1 D. COLARD']);
assert.ok(lib.review.every(x=>x.preselect&&x.reason.startsWith('Correspondance bibliothèque')));
assert.deepEqual(lib.review.map(x=>x.quantity+' '+core.display(x.row)),['15 ASSISTANT PARLEMENTAIRE','5 PRESSE','1 DIRECTION GÉNÉRALE SÉCURITÉ ET PROTECTION',"1 DIRECTION GÉNÉRALE TECHNOLOGIES DE L'INFORMATION ET DE LA CYBERSÉCURITÉ",'1 CABINET DE LA PRÉSIDENTE','1 CABINET DU SECRÉTAIRE GÉNÉRAL','1 DIRECTION CCLA COORDINATION LÉGISLATIVE ACTIVITÉS LÉGISLATIVES','1 COMITÉ DES RÉGIONS','2 EPP','2 S&D','2 PFE','2 ECR','2 RENEW','2 VERTS/ALE','2 THE LEFT','2 ESN']);
assert.deepEqual(lib.ignored.map(x=>x.reason),['Titre de section','Consigne']);
// Titre devant le nom (« Commissioner Šuiça ») : retiré, nom proposé à vérification pour retrouver « D. ŠUICA ».
const titled=core.inspectSheet([['Quantity','NAME or INSTITUTION'],['','Commissioner Šuiça'],['','President of the Committee of the Regions'],['','Mr. José MARTÍNEZ']],[]);
assert.deepEqual(titled.review.map(x=>[core.display(x.row),!!x.preselect]),[['ŠUIÇA',true]]);
assert.deepEqual(titled.accepted.map(x=>core.display(x.row)),['PRESIDENT OF THE COMMITTEE OF THE REGIONS','J. MARTÍNEZ']);
const un=core.inspectSheet([['Quantity','NAME or INSTITUTION'],['3','UN women']],[]);
assert.equal(un.review[0].reason,'Correspondance bibliothèque : UN women → UNITED NATIONS');assert.equal(un.review[0].quantity,3);
// Toujours l'initiale du prénom, sauf pour un intitulé collectif.
const names=core.inspectSheet([['Quantity','NAME or INSTITUTION'],['','Sonja Wollny'],['','Ursula von der Leyen'],['6','Content Creators'],['5','Charlemagne winners']],[]);
assert.deepEqual(names.accepted.map(x=>core.display(x.row)),['S. WOLLNY','U. VON DER LEYEN','CONTENT CREATORS','CHARLEMAGNE WINNERS']);
// En-têtes variés, intitulés connus jamais pris pour des personnes, doublons signalés.
const v=core.inspectSheet([['Qty','Name / Institution'],['','United Nations'],['','N. DATTA'],['','N. Datta'],['2','Amnesty International']],[]);
assert.deepEqual(v.accepted.map(x=>core.display(x.row)),['UNITED NATIONS','N. DATTA','AMNESTY INTERNATIONAL']);
assert.equal(v.review.length,1);assert.match(v.review[0].reason,/^Doublon/);assert.ok(!v.review[0].preselect);
const fr=core.inspectSheet([['Nombre','Nom ou institution'],['4','Journalistes'],['','Mme Delvaux']],[]);
assert.deepEqual(fr.review.map(x=>x.quantity+' '+core.display(x.row)),['4 PRESSE','1 DELVAUX']);
// « Quantité | Prénom | Nom » : import nominatif classique (prénom et nom séparés).
const classic=core.inspectSheet([['Quantité','Prénom','Nom'],['1','Anna','Kowalska']],[]);
assert.ok(!classic.order);assert.deepEqual(classic.accepted[0].row.slice(0,2),['Anna','Kowalska']);
console.log('Secretariat order import checked');
