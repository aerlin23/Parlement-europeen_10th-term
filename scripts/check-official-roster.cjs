'use strict';
/* Veille officielle non destructive : ne met jamais members.json à jour sans revue. */
const fs=require('node:fs');
const URL_OFFICIELLE='https://data.europarl.europa.eu/api/v2/meps/show-current';
function numericId(raw){
 const s=typeof raw==='object'&&raw?(raw['@id']||raw.id||raw.identifier||''):String(raw??'');
 const match=String(s).match(/(?:^|[/#:])(?:person[/#:])?(\d{3,8})$/i);
 return match?match[1]:null;
}
function rosterEntries(json){
 const data=json?.data;
 const candidates=Array.isArray(data)?data:Array.isArray(data?.items)?data.items:Array.isArray(data?.members)?data.members:Array.isArray(data?.results)?data.results:Array.isArray(json?.items)?json.items:[];
 const byId=new Map();
 for(const item of candidates){
  if(!item||typeof item!=='object')continue;
  const id=numericId(item['@id']||item.id||item.identifier||item.personId||item.person?.['@id']);
  if(!id)continue;
  const name=String(item.label||item.name||item.prefLabel||'').trim();
  byId.set(id,{id,name});
 }
 return [...byId.values()];
}
function compare(local,remote){
 const a=new Set(local.map(x=>String(x.id))),b=new Set(remote.map(x=>String(x.id)));
 return {added:remote.filter(x=>!a.has(x.id)),removed:local.filter(x=>!b.has(String(x.id))).map(x=>({id:String(x.id),name:x.name})),localCount:a.size,officialCount:b.size};
}
async function fetchOfficial(){
 const response=await fetch(URL_OFFICIELLE,{headers:{Accept:'application/ld+json, application/json;q=0.9','User-Agent':'Vademecum-PE-Data-Check/1.0'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const text=await response.text();if(text.length>15000000)throw Error('Official API response too large');
 const payload=JSON.parse(text);
 const entries=rosterEntries(payload);
 if(entries.length<600||entries.length>750)throw Error('Unexpected official schema or count: '+entries.length+'; no changes proposed');
 return entries;
}
async function main(){
 const local=JSON.parse(fs.readFileSync('members.json','utf8'));
 const result={source:URL_OFFICIELLE,checkedAt:new Date().toISOString(),status:'unavailable',diff:null,error:null};
 try{
  const official=await fetchOfficial(),diff=compare(local,official);
  result.diff=diff;result.status=diff.added.length||diff.removed.length?'changes':'up-to-date';
 }catch(e){result.error=String(e?.message||e).slice(0,500)}
 fs.mkdirSync('reports-local',{recursive:true});
 fs.writeFileSync('reports-local/meps-review.json',JSON.stringify(result,null,2)+'\n');
 const summary=[
  '### Vérification des députés — source officielle',
  'Source : '+URL_OFFICIELLE,
  'Date : '+result.checkedAt,
  'Statut : '+result.status,
  result.diff?'Base : '+result.diff.localCount+' · Liste officielle : '+result.diff.officialCount:'',
  result.diff?'Entrants : '+result.diff.added.map(x=>x.name||x.id).join(', '):'',
  result.diff?'Sortants : '+result.diff.removed.map(x=>x.name||x.id).join(', '):'',
  result.error?'Erreur : '+result.error:''
 ].filter(Boolean).join('\n')+'\n';
 console.log(summary);
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={numericId,rosterEntries,compare};
