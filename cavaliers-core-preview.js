(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CavalierCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const norm=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim().replace(/\s+/g,' ');
const aliases=[['prenom','prenoms','prenom(s)','first name','first names','firstname','given name','given names','forename'],['nom','nom de famille','surname','last name','lastname','family name'],['titre','title','salutation'],['organisation','organization','institution','company','affiliation'],['fonction','function','position','role','job title']];
function header(cells){const map=aliases.map(a=>cells.findIndex(c=>a.includes(norm(c))));return map[0]>=0&&map[1]>=0?map:null}
function strip(s){let depth=0,out='';for(const c of String(s??'')){if(c==='('||c==='（'){depth++;if(depth===1)out+=' ';continue}if(c===')'||c==='）'){if(depth)depth--;else out+=c;continue}if(!depth)out+=c}return out.normalize('NFC').trim().replace(/\s+/gu,' ')}
function cleanName(s){return strip(s).replace(/[\/\\]+/gu,' ').replace(/(^|\s)[\p{Pd}]+/gu,'$1').replace(/[\p{Pd}]+(?=\s|$)/gu,'').replace(/\s+/gu,' ').trim()}
const name=/^\p{L}[\p{L}\p{M}’'.\p{Pd}]*(?:\s+\p{L}[\p{L}\p{M}’'.\p{Pd}]*)*$/u;
function initials(s){return cleanName(s).split(/\s+/u).filter(Boolean).map(w=>w.split(/\p{Pd}+/u).map(x=>{const c=x.match(/\p{L}/u)?.[0];return c?c.toLocaleUpperCase('fr')+'.':''}).filter(Boolean).join('-')).filter(Boolean).join(' ')}
function display(r){if(!r[0]&&r[1])return strip(r[1]).toLocaleUpperCase('fr');return [initials(r[0]),cleanName(r[1]).toLocaleUpperCase('fr')].filter(Boolean).join(' ')}
const TITLES=/^(?:(?:dr|docteur|prof|professeur|mme|madame|m|monsieur|mr|mrs|ms|hon|honorable)\.?\s+)+/iu;
function splitFull(value){
 const src=cleanName(value),comma=src.indexOf(',');
 if(comma>=0)return [src.slice(comma+1).trim(),src.slice(0,comma).trim()];
 const parts=src.split(/\s+/u).filter(Boolean);
 const upper=w=>/\p{Lu}/u.test(w)&&w===w.toLocaleUpperCase('fr')&&w.length>1;
 if(parts.length===2&&upper(parts[0])&&!upper(parts[1]))return [parts[1],parts[0]];
 let cut=parts.findIndex((w,i)=>i>0&&upper(w));
 if(cut>0&&parts.slice(cut).every(upper)&&!upper(parts[0]))return [parts.slice(0,cut).join(' '),parts.slice(cut).join(' ')];
 if(parts.length===2)return [parts[0],parts[1]];
 // Suggest common multipart surname prefixes; final result still requires review.
 const particle=/^(?:van|von|de|du|des|del|della|der|den|di|da|dos|das|la|le)$/iu;
 const surnameStart=parts.findIndex((w,i)=>i>0&&particle.test(w));
 if(surnameStart>0)return [parts.slice(0,surnameStart).join(' '),parts.slice(surnameStart).join(' ')];
 return [parts.shift()||'',parts.join(' ')];
}
function parse(line){
 const cells=line.split(line.includes('\t')?'\t':'|');
 if(cells.length>1)return [cleanName(cells[0]),cleanName(cells[1]),...cells.slice(2,5).map(strip)].concat(['','','']).slice(0,5);
 const raw=strip(line),m=raw.match(TITLES),title=m?m[0].trim():'';
 const withoutTitle=title?raw.slice(m[0].length):raw;
 const [first,last]=splitFull(withoutTitle);
 return [first,last,title,'',''];
}
function analyze(text){const accepted=[],rejected=[],seen=new Set();for(const raw of String(text).split(/\r?\n/u)){if(!raw.trim())continue;const cells=raw.split(raw.includes('\t')?'\t':'|');const n=norm(strip(raw)),r=parse(raw);const delimited=raw.includes('|')||raw.includes('\t');const unseparatedWords=strip(raw).split(/\s+/u).filter(Boolean).length;let reason='',recover=false;const par=/^\s*[(（].*[)）]\s*$/u.test(raw);const candidate=r;
if(header(cells)||/^(prenom|first name)\s+(nom|surname|last name)/u.test(n)){reason='En-tête'}
else if(/^(?:pause|dejeuner|lunch|agenda|participants?|delegation|total|a confirmer|tbc|absent|excuse|coffee break|meeting|reunion|fin de reunion)(?:\s|$)/u.test(n)||/\d{1,2}[:h]\d{2}/u.test(strip(raw))||!/[\p{L}]/u.test(raw)){reason='Commentaire / horaire'}
else if(par||!strip(raw)){reason='Commentaire entre parenthèses';recover=false}
else if(/\b(?:a confirmer|tbc|tentative|absent|excuse)\b/u.test(n)){reason='À vérifier';recover=true}
else if(!delimited&&unseparatedWords>2){reason='À vérifier : découpage du nom';recover=true}
else if(cells.length>5||!name.test(r[0])||!name.test(r[1])){reason='À vérifier';recover=true}
else {const key=[...r.slice(0,2)].map(v=>v.normalize('NFC').toLocaleLowerCase('fr')).join('\0');if(seen.has(key)){reason='Doublon';recover=true}else seen.add(key)}
if(reason)rejected.push({raw,reason,recover,row:candidate});else accepted.push(r)}return {accepted,rejected}}
function excelRows(matrix){let map=null;return matrix.map(row=>{const cells=row.map(c=>String(c??'').replace(/[\r\n\t]/gu,' '));const found=header(cells);if(found){map=found;return 'Prénom\tNom de famille\tTitre\tOrganisation\tFonction'}if(!map)return cells.join('\t').replace(/\t+$/u,'');const mapped=map.map(i=>i<0?'':cells[i]||'');if(!mapped.some(Boolean))return cells.filter(Boolean).join(' ');return mapped.join('\t')}).join('\n')}

const fullAliases=['nom complet','nom et prenom','nom et prenoms','prenom et nom','prenoms et nom','full name','fullname','name and surname','first and last name','last and first name','participant name','participant'];
const statusAliases=['statut','presence','participation','attendance','status','participation status'];
const headerKey=s=>norm(s).replace(/[ :_-]+/g,' ').trim();
function detectHeader(row){
 const cells=row.map(headerKey),map=aliases.map(a=>cells.findIndex(x=>a.includes(x))),full=cells.findIndex(x=>fullAliases.includes(x)),status=cells.findIndex(x=>statusAliases.includes(x));
 if(map[0]>=0&&map[1]>=0)return {map,full:-1,status};
 if(full>=0)return {map,full,status};
 return null;
}
const identityKey=s=>norm(s).replace(/[’']/g,"'").replace(/[‐‑–—]/g,'-');
function memberIndex(members){
 const index=new Map();
 for(const m of members||[]){
  if(!m||!m.name)continue;
  const parts=String(m.name).trim().split(/\s+/),cut=parts.findIndex((w,i)=>i>0&&w===w.toLocaleUpperCase('fr')&&/\p{Lu}/u.test(w));
  const first=m.firstName||m.givenName||(cut>0?parts.slice(0,cut).join(' '):''),last=m.lastName||m.familyName||(cut>0?parts.slice(cut).join(' '):'');
  if(!first||!last)continue;
  const item={first,last,name:m.name,id:m.id};
  for(const key of new Set([identityKey(first+' '+last),identityKey(last+' '+first),identityKey(initials(first)+' '+last),identityKey(initials(first).replace(/\./g,'')+' '+last)])){
   if(!index.has(key))index.set(key,[]);index.get(key).push(item);
  }
 }
 return index;
}
function orderSchema(cells){
 const h=cells.map(norm),qty=h.findIndex(x=>/^(qt|qte|quantite|quantity|qty)$/.test(x));
 if(qty<0)return null;
 const label=h.findIndex(x=>/^(name or institution|personne ou institution|person or institution|participant \/ service)/.test(x));
 const first=h.findIndex(x=>/^prenom\s*\/\s*first name\s*\/\s*institution/.test(x)),last=h.findIndex(x=>/^nom\s*\/\s*last name/.test(x)),title=h.findIndex(x=>/^titre\s*\/\s*title/.test(x));
 return label>=0||first>=0?{qty,label,first,last,title}:null;
}
const genericAliases={'reserved':'RÉSERVÉ','legal service':'SERVICE JURIDIQUE','european commission':'COMMISSION EUROPÉENNE','commission europeenne':'COMMISSION EUROPÉENNE','council of the european union':'CONSEIL DE L’UNION EUROPÉENNE','dg com':'DIRECTION GÉNÉRALE COMMUNICATION','dg comm':'DIRECTION GÉNÉRALE COMMUNICATION','eeas':'SEAE','european court of auditors':'COUR DES COMPTES EUROPÉENNE','european economic and social committee':'COMITÉ ÉCONOMIQUE ET SOCIAL EUROPÉEN'};

function institutionalRow(value){
 const text=strip(value),k=norm(text);
 if(/^(?:presidence\s+d['’]\s*ue|presidence\s+de\s+l['’]\s*ue|presidence\s+du\s+conseil|presidence\s+en\s+exercice\s+du\s+conseil|eu presidency|council presidency|[a-z]{2} presidency)$/i.test(k))return ['', 'PRÉSIDENCE EN EXERCICE DU CONSEIL','','',''];
 const sec=k.match(/^(?:([a-z]{3,5})\s+secretariat|secretariat\s+([a-z]{3,5}))$/);
 if(sec)return ['', (sec[1]||sec[2]).toUpperCase(),'SECRETARIAT','',''];
 const extra={'general secretariat council':'CONSEIL DE L’UNION EUROPÉENNE','general secretariat of the council':'CONSEIL DE L’UNION EUROPÉENNE','general secretariat of the council of the european union':'CONSEIL DE L’UNION EUROPÉENNE','council general secretariat':'CONSEIL DE L’UNION EUROPÉENNE','gsc':'CONSEIL DE L’UNION EUROPÉENNE','secrétariat général du conseil':'CONSEIL DE L’UNION EUROPÉENNE','secretariat general du conseil':'CONSEIL DE L’UNION EUROPÉENNE','greens':'VERTS','greens/efa':'VERTS/ALE','verts':'VERTS','the left':'THE LEFT','assistant parlementaire':'ASSISTANT PARLEMENTAIRE','parliamentary assistant':'ASSISTANT PARLEMENTAIRE','pres - dla/directorate for legislative acts':'DIRECTION DES ACTES LÉGISLATIFS','dg pres':'DIRECTION GÉNÉRALE DE LA PRÉSIDENCE','dg presidency':'DIRECTION GÉNÉRALE DE LA PRÉSIDENCE'};
 return ['',extra[k]||genericAliases[k]||text.toLocaleUpperCase('fr'),'','',''];
}

function inspectOrder(matrix){
 const accepted=[],review=[],ignored=[];let schema=null,headers=0;
 for(let i=0;i<matrix.length;i++){
  const cells=matrix[i].map(v=>String(v??'').replace(/[\r\n\t]+/g,' ').trim());
  if(!cells.some(Boolean))continue;
  const found=orderSchema(cells);if(found){schema=found;headers++;continue}
  if(!schema)continue;
  const q=Number(cells[schema.qty]),label=strip(cells[schema.label>=0?schema.label:schema.first]),last=schema.last>=0?strip(cells[schema.last]):'',title=schema.title>=0?strip(cells[schema.title]):'';
  const rec={line:i+1,raw:cells.filter(Boolean).join(' · '),quantity:q};
  if(!label){ignored.push({...rec,reason:'Ligne sans intitulé'});continue}
  const add=(text,count=q,detail='',reason='')=>{const row=institutionalRow(text);if(detail)row[2]=detail;const item={...rec,row,quantity:count};if(!Number.isInteger(count)||count<1||count>100)review.push({...item,quantity:1,reason:'Quantité à vérifier'});else if(reason)review.push({...item,reason});else accepted.push(item)};
  const group=norm(label).match(/set of (\d+) nameplates per each political group/);
  if(group){const n=Number(group[1]);if(q===n*8){for(const g of ['EPP','S&D','PfE','ECR','RENEW','GREENS/EFA','THE LEFT','ESN'])add(g,n)}else add(label,q,'','Consigne de groupe à vérifier');continue}
  const generic=genericAliases[norm(label)];
  if(generic){add(generic);continue}
  if(last&&!/^(director|director general)$/i.test(last)){add(initials(label)+' '+last,q);continue}
  add(label,q);
 }
 return {accepted,review,ignored,headers,score:accepted.length*3+review.length,order:true};
}

function inspectSheet(matrix,members=[]){
 if(matrix.some(row=>orderSchema(row)))return inspectOrder(matrix);
 const clean=matrix.map(row=>row.map(v=>String(v??'').replace(/[\r\n\t]+/g,' ').trim()));
 const idx=memberIndex(members),accepted=[],review=[],ignored=[];let schema=null,headers=0;
 const skip=/^(?:pause|dejeuner|lunch|agenda|participants?|delegation|total|coffee break|meeting|reunion|fin de reunion|programme|program|schedule)(?:\s|$)/i;
 const absent=/^(?:absent(?:e)?|excuse(?:e)?|declined|cancelled|canceled|not attending|non present|no show)$/;
 const pending=/^(?:a confirmer|tbc|tentative|pending|non confirme|unconfirmed)$/;
 const seen=new Set();
 for(let i=0;i<clean.length;i++){
  const cells=clean[i];if(!cells.some(Boolean))continue;
  const found=detectHeader(cells);if(found){schema=found;headers++;continue}
  const raw=cells.filter(Boolean).join(' · '),record={line:i+1,raw};
  if(!schema){ignored.push({...record,reason:'Avant en-tête reconnu'});continue}
  const values=schema.map.map(j=>j<0?'':strip(cells[j]));values[2]='';values[4]='';
  const full=schema.full>=0?strip(cells[schema.full]):values.slice(0,2).join(' ').trim();
  const status=schema.status>=0?norm(cells[schema.status]):'';
  if(!full||skip.test(norm(full))||/^\d{1,2}[:h]\d{2}/.test(full)){ignored.push({...record,reason:'Commentaire / horaire'});continue}
  if(absent.test(status)){review.push({...record,row:values,reason:'Absence indiquée',suggestion:null,excluded:true});continue}
  const match=idx.get(identityKey(full));
  let row=values.slice(),reason='',suggestion=null;
  if(schema.full>=0){const split=splitFull(full);row[0]=split[0];row[1]=split[1];reason='Nom complet : vérifier la séparation prénom / nom'}
  if(match?.length===1){const m=match[0];const corrected=[m.first,m.last,...row.slice(2)];if(identityKey(row[0])!==identityKey(m.first)||identityKey(row[1])!==identityKey(m.last)){suggestion=corrected;reason='Identité PE proposée'}else if(schema.full>=0){reason='Identité PE correspondante : confirmer';suggestion=corrected}}
  else if(match?.length>1)reason='Plusieurs identités PE possibles';
  row[0]=cleanName(row[0]);row[1]=cleanName(row[1]);
  if(!name.test(row[0])||!name.test(row[1]))reason='Prénom ou nom à vérifier';
  if(pending.test(status))reason='Présence à confirmer';
  const key=identityKey(row[0])+'\0'+identityKey(row[1]);
  if(seen.has(key))reason='Doublon ou homonyme à vérifier';
  seen.add(key);
  if(reason)review.push({...record,row,reason,suggestion});else accepted.push({...record,row});
 }
 return {accepted,review,ignored,headers,score:headers?accepted.length*3+review.length:0};
}


function quantityPrefix(value){
 const s=strip(value);
 const m=s.match(/^(\d{1,3})\s*(?:[x×]\s*|\s+)(?=\p{L})(.+)$/iu);
 if(!m||Number(m[1])<1||Number(m[1])>100)return {value:s,quantity:1,explicit:false};
 return {value:m[2].trim(),quantity:Number(m[1]),explicit:/^\d+\s*[x×]/i.test(s)};
}

return {strip,institutionalRow,orderSchema,inspectOrder,quantityPrefix,cleanName,initials,display,parse,analyze,excelRows,header,inspectSheet,detectHeader,splitFull,memberIndex};
});