(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CavalierCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const norm=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim().replace(/\s+/g,' ');
const aliases=[['prenom','prenoms','prenom(s)','first name','first names','firstname','given name','given names','forename'],['nom','nom de famille','surname','last name','lastname','family name'],['titre','title','salutation'],['organisation','organization','institution','company','affiliation'],['fonction','function','position','role','job title']];
function header(cells){const map=aliases.map(a=>cells.findIndex(c=>a.includes(norm(c))));return map[0]>=0&&map[1]>=0?map:null}
function strip(s){let depth=0,out='';for(const c of String(s??'')){if(c==='('||c==='（'){depth++;if(depth===1)out+=' ';continue}if(c===')'||c==='）'){if(depth)depth--;else out+=c;continue}if(!depth)out+=c}return out.normalize('NFC').trim().replace(/\s+/gu,' ')}
function cleanName(s){return strip(s).replace(/[\/\\]+/gu,' ').replace(/(^|\s)[\p{Pd}]+/gu,'$1').replace(/[\p{Pd}]+(?=\s|$)/gu,'').replace(/\s+/gu,' ').trim()}
const name=/^\p{L}[\p{L}\p{M}’'.\p{Pd}]*(?:\s+\p{L}[\p{L}\p{M}’'.\p{Pd}]*)*$/u;
function initials(s){return cleanName(s).split(/\s+/u).filter(Boolean).map(w=>w.split(/\p{Pd}+/u).map(x=>{const c=x.match(/\p{L}/u)?.[0];return c?c.toLocaleUpperCase('fr')+'.':''}).filter(Boolean).join('-')).filter(Boolean).join(' ')}
function display(r){return [initials(r[0]),cleanName(r[1]).toLocaleUpperCase('fr')].filter(Boolean).join(' ')}
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
function analyze(text){const accepted=[],rejected=[],seen=new Set();for(const raw of String(text).split(/\r?\n/u)){if(!raw.trim())continue;const cells=raw.split(raw.includes('\t')?'\t':'|');const n=norm(raw),r=parse(raw);const delimited=raw.includes('|')||raw.includes('\t');const unseparatedWords=strip(raw).split(/\s+/u).filter(Boolean).length;let reason='',recover=false;const par=/^\s*[(（].*[)）]\s*$/u.test(raw);const candidate=par?parse(raw.trim().slice(1,-1)):r;
if(header(cells)||/^(prenom|first name)\s+(nom|surname|last name)/u.test(n)){reason='En-tête'}
else if(/^(?:pause|dejeuner|lunch|agenda|participants?|delegation|total|a confirmer|tbc|absent|excuse|coffee break|meeting|reunion|fin de reunion)(?:\s|$)/u.test(n)||/\d{1,2}[:h]\d{2}/u.test(raw)||!/[\p{L}]/u.test(raw)){reason='Commentaire / horaire'}
else if(par){reason='Parenthèses';recover=name.test(candidate[0])&&name.test(candidate[1])}
else if(/\b(?:a confirmer|tbc|tentative|absent|excuse)\b/u.test(n)){reason='À vérifier';recover=true}
else if(!delimited&&unseparatedWords>2){reason='À vérifier : découpage du nom';recover=true}
else if(cells.length>5||!name.test(r[0])||!name.test(r[1])){reason='À vérifier';recover=true}
else {const key=[...r.slice(0,2)].map(v=>v.normalize('NFC').toLocaleLowerCase('fr')).join('\0');if(seen.has(key)){reason='Doublon';recover=true}else seen.add(key)}
if(reason)rejected.push({raw,reason,recover,row:candidate});else accepted.push(r)}return {accepted,rejected}}
function excelRows(matrix){let map=null;return matrix.map(row=>{const cells=row.map(c=>String(c??'').replace(/[\r\n\t]/gu,' '));const found=header(cells);if(found){map=found;return 'Prénom\tNom de famille\tTitre\tOrganisation\tFonction'}if(!map)return cells.join('\t').replace(/\t+$/u,'');const mapped=map.map(i=>i<0?'':cells[i]||'');if(!mapped.some(Boolean))return cells.filter(Boolean).join(' ');return mapped.join('\t')}).join('\n')}
return {cleanName,initials,display,parse,analyze,excelRows,header};
});