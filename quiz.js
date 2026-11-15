function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function nameSimilarity(a,b){
 const x=norm(surname(a)),y=norm(surname(b));
 const bigrams=t=>{const out=new Map();for(let i=0;i<t.length-1;i++){const pair=t.slice(i,i+2);out.set(pair,(out.get(pair)||0)+1)}return out};
 const aa=bigrams(x),bb=bigrams(y);let common=0;for(const [k,n] of aa)common+=Math.min(n,bb.get(k)||0);
 const dice=(x.length+y.length>2)?2*common/Math.max(1,x.length+y.length-2):0;
 let prefix=0;while(prefix<Math.min(x.length,y.length)&&x[prefix]===y[prefix])prefix++;
 return dice*0.7+Math.min(1,prefix/4)*0.2+(x[0]===y[0]?0.1:0);
}
function quizGender(m){return String(m.id)==='256960'?'FEMALE':m.gender}
function quizPool(target,pool){
 return pool.filter(m=>m.id!==target.id&&quizGender(m)===quizGender(target)&&m.country===target.country);
}
function optionsFor(target,pool,count){
 if(!['MALE','FEMALE'].includes(quizGender(target)))return [];
 const needed=Math.min(Math.max(3,count),4)-1;
 const sameCountry=quizPool(target,pool);
 const alternatives=[...sameCountry].sort((a,b)=>nameSimilarity(target,b)-nameSimilarity(target,a));
 const picked=[];
 // Privilégier les noms ressemblants sans proposer toujours exactement les mêmes.
 while(picked.length<needed&&alternatives.length){
   const n=Math.min(6,alternatives.length);
   picked.push(alternatives.splice(Math.floor(Math.random()*n),1)[0]);
 }
 // Un petit pays peut ne pas compter assez de députés du même genre.
 if(picked.length<needed){
   const fallback=pool.filter(m=>m.id!==target.id&&quizGender(m)===quizGender(target)&&!picked.some(p=>p.id===m.id));
   fallback.sort((a,b)=>nameSimilarity(target,b)-nameSimilarity(target,a));
   picked.push(...fallback.slice(0,needed-picked.length));
 }
 return shuffle([target,...picked]);
}
function canQuiz(m){return ['MALE','FEMALE'].includes(quizGender(m))&&members.filter(x=>x.id!==m.id&&quizGender(x)===quizGender(m)).length>=3}
const QUIZ_ERRORS_KEY='trombinoscope-quiz-errors-v1-'+CONFIG.repo;
function readQuizErrors(){try{const data=JSON.parse(localStorage.getItem(QUIZ_ERRORS_KEY)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}}
let quizErrors=readQuizErrors();
$('quizHistoryTotal').textContent=String(quizErrorTotal());
function storeQuizError(m){const key=String(m.id);const old=quizErrors[key];quizErrors[key]={name:m.name,count:(Number(old?.count)||0)+1};try{localStorage.setItem(QUIZ_ERRORS_KEY,JSON.stringify(quizErrors))}catch{}}
function quizErrorTotal(){return Object.values(quizErrors).reduce((n,x)=>n+(Number(x.count)||0),0)}
function quizErrorSummary(){return Object.values(quizErrors).filter(x=>x&&x.name).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'fr')).map(x=>x.name+' ('+x.count+')').join(' · ')}
function quizProgressLabel(done){return `Question ${session.index+1} / ${session.deck.length} · Réussites : ${session.correct}/${done} · Erreurs : ${session.missed.length}`}
const QUIZ_PROGRESS_KEY='trombinoscope-quiz-progress-v2-'+CONFIG.repo;
function readQuizProgress(){
 try{
  const value=JSON.parse(localStorage.getItem(QUIZ_PROGRESS_KEY)||'{}');
  return value&&typeof value==='object'&&!Array.isArray(value)?{round:Number(value.round)||0,people:value.people&&typeof value.people==='object'?value.people:{}}:{round:0,people:{}}
 }catch{return {round:0,people:{}}}
}
let quizProgress=readQuizProgress();
function saveQuizProgress(){try{localStorage.setItem(QUIZ_PROGRESS_KEY,JSON.stringify(quizProgress))}catch{}}
function spacedDeck(list){
 const size=Math.min(20,list.length),round=quizProgress.round;
 // Le tirage favorise les erreurs déjà commises, puis les portraits jamais vus.
 // Une bonne série repousse progressivement la prochaine révision (2/4/8/16 séances).
 const candidates=shuffle([...list]).map(m=>{
  const record=quizProgress.people[String(m.id)]||{};
  const misses=Number(record.misses)||Number(quizErrors[String(m.id)]?.count)||0;
  const due=Number(record.due)||0;
  const neverSeen=!Number(record.seen);
  const overdue=due<=round;
  let weight=neverSeen?3:overdue?2:0.08;
  if(misses&&overdue)weight+=Math.min(12,3+misses*1.6);
  if(misses&&!overdue)weight=Math.max(weight,0.2);
  return {m,weight};
 });
 const selected=[];
 while(selected.length<size&&candidates.length){
  const total=candidates.reduce((n,x)=>n+x.weight,0);
  let ticket=Math.random()*total,idx=0;
  for(;idx<candidates.length-1;idx++){ticket-=candidates[idx].weight;if(ticket<=0)break}
  selected.push(candidates.splice(idx,1)[0].m);
 }
 return selected;
}
function updateQuizProgress(m,correct){
 const key=String(m.id),previous=quizProgress.people[key]||{};
 const streak=correct?(Number(previous.streak)||0)+1:0;
 const delay=correct?Math.min(16,2**Math.min(streak,4)):1;
 quizProgress.people[key]={seen:(Number(previous.seen)||0)+1,misses:(Number(previous.misses)||0)+(correct?0:1),streak,due:quizProgress.round+delay};
 saveQuizProgress();
}
function startSession(list=filtered){
 const eligible=list.filter(canQuiz);if(!eligible.length)return;
 quizProgress.round++;saveQuizProgress();
 session={deck:spacedDeck(eligible),index:0,correct:0,missed:[],answered:false,mode:$('quizMode').value};
 $('studyIntro').hidden=true;$('studyEnd').hidden=true;$('studySession').hidden=false;$('filters').hidden=true;$('count').hidden=true;
 showStudy();$('training').scrollIntoView({block:'start'});
}
// Les fichiers de prononciation des noms sont référencés par identifiant MEP.
let namePronunciationAudio=null;
function stopNamePronunciation(){
 if(namePronunciationAudio){namePronunciationAudio.pause();namePronunciationAudio.removeAttribute('src');namePronunciationAudio.load();namePronunciationAudio=null}
 if('speechSynthesis' in window)window.speechSynthesis.cancel();
}
function enableNamePronunciation(m){
 const button=$('listenName');
 button.hidden=false;button.disabled=false;button.textContent='🔊 Écouter le nom';
 button.onclick=()=>{
  stopNamePronunciation();
  const audio=new Audio();
  namePronunciationAudio=audio;
  let failedOver=false;
  button.title='Lecture du nom : enregistrement officiel si disponible, sinon synthèse vocale';
  // L'enregistrement officiel est prioritaire. Si son décodage ou sa lecture échoue,
  // la voix du téléphone est une solution de secours, clairement identifiée.
  const fallback=()=>{
   if(namePronunciationAudio!==audio||failedOver)return;
   failedOver=true;
   if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
    button.disabled=true;button.textContent='Audio et voix du téléphone indisponibles';return;
   }
   const localeByCountry={Belgium:'fr-BE',France:'fr-FR',Germany:'de-DE',Austria:'de-AT',Italy:'it-IT',Spain:'es-ES',Portugal:'pt-PT',Netherlands:'nl-NL',Poland:'pl-PL',Greece:'el-GR',Hungary:'hu-HU',Romania:'ro-RO',Czechia:'cs-CZ',Slovakia:'sk-SK',Croatia:'hr-HR',Slovenia:'sl-SI',Denmark:'da-DK',Sweden:'sv-SE',Finland:'fi-FI',Estonia:'et-EE',Latvia:'lv-LV',Lithuania:'lt-LT',Bulgaria:'bg-BG',Ireland:'en-IE',Malta:'mt-MT',Cyprus:'el-GR',Luxembourg:'fr-LU'};
   const speech=new SpeechSynthesisUtterance(m.name);
   speech.lang=localeByCountry[m.country]||document.documentElement.lang||'fr-FR';
   speech.rate=0.9;
   const voices=window.speechSynthesis.getVoices();
   const match=voices.find(v=>v.lang.toLowerCase()===speech.lang.toLowerCase())||voices.find(v=>v.lang.split('-')[0]===speech.lang.split('-')[0]);
   if(match)speech.voice=match;
   speech.onstart=()=>{button.title='Voix de synthèse';button.disabled=false;button.textContent='🔊 Réécouter le nom'};
   speech.onend=()=>{button.disabled=false;button.textContent='🔊 Réécouter le nom'};
   speech.onerror=()=>{button.disabled=true;button.textContent='Voix du téléphone indisponible'};
   try{window.speechSynthesis.speak(speech);button.disabled=false;button.textContent='🔊 Réécouter le nom'}
   catch{button.disabled=true;button.textContent='Voix du téléphone indisponible'}
  };
  audio.preload='auto';
  audio.src='https://www.europarl.europa.eu/mepaudio/'+encodeURIComponent(m.id)+'.mp3';
  button.disabled=true;button.textContent='🔊 Chargement…';
  audio.onplaying=()=>{if(namePronunciationAudio===audio){button.title='Enregistrement officiel du Parlement européen';button.disabled=false;button.textContent='🔊 Réécouter le nom'}};
  audio.onended=()=>{if(namePronunciationAudio===audio){button.disabled=false;button.textContent='🔊 Réécouter le nom'}};
  audio.onerror=fallback;
  try{
   const playback=audio.play();
   if(playback&&typeof playback.catch==='function')playback.catch(fallback);
  }catch{fallback()}
 };
}
function showStudy(){
 stopNamePronunciation();$('listenName').hidden=true;
 const m=session.deck[session.index];session.answered=false;
 $('studyProgress').textContent=quizProgressLabel(session.index);
 $('studyPhoto').replaceChildren();$('studyAnswer').replaceChildren();
 $('quizFeedback').textContent='';$('quizFeedback').className='quiz-feedback';
 $('quizChoices').replaceChildren();$('nextStudy').hidden=true;
 const photoChoices=session.mode==='name-photo';
 if(photoChoices){
  $('studyAnswer').append(el('p','prompt','Retrouve son visage :'),el('div','name-prompt',m.name));
 }else{
  $('studyPhoto').append(imageBox(m,true));
  $('studyAnswer').append(el('p','prompt','Quel est son nom ?'));
 }
 const choices=optionsFor(m,members,4);
 if(choices.length!==4){
  $('quizFeedback').textContent='Impossible de proposer quatre réponses pour ce député.';
  $('quizFeedback').className='quiz-feedback error';
  $('nextStudy').textContent='Question suivante →';$('nextStudy').hidden=false;
  session.answered=true;return;
 }
 for(const option of choices){
  const button=el('button','quiz-option'+(photoChoices?' photo-choice':''));
  button.type='button';button.dataset.answerId=String(option.id);
  button.onclick=()=>answerQuiz(String(option.id));
  if(photoChoices){
   const portrait=imageBox(option,true);
   portrait.classList.add('choice-portrait');
   portrait.querySelector('img').alt='Portrait proposé';
   button.append(portrait);
  }else button.textContent=option.name;
  $('quizChoices').append(button);
 }
}
function quizIdentity(m){
 const line=el('div','quiz-identity'),country=countryLabel(m),theme=GROUP_THEMES[m.group];
 line.append(country);
 if(m.group){
  const group=el('span','quiz-identity-group');
  line.append(el('span','quiz-identity-separator','·'));
  if(theme?.file){
   const logo=el('img','quiz-group-logo');logo.alt='';logo.decoding='async';
   logo.src='https://aerlin23.github.io/'+theme.repo+'/assets/'+theme.file;
   logo.onerror=()=>logo.remove();group.append(logo);
  }
  group.append(document.createTextNode(m.group));line.append(group);
 }
 return line;
}
function answerQuiz(id){
 if(!session||session.answered)return;
 const m=session.deck[session.index],buttons=[...$('quizChoices').querySelectorAll('button')];
 if(!buttons.some(b=>b.dataset.answerId===id))return;
 session.answered=true;
 const correct=String(id)===String(m.id);
 if(correct)session.correct++;else{session.missed.push(m);storeQuizError(m)}
 updateQuizProgress(m,correct);
 for(const button of buttons){
  button.disabled=true;
  if(session.mode==='name-photo'){
   const option=members.find(x=>String(x.id)===button.dataset.answerId);
   if(option)button.append(el('span','answer-mark',option.name));
  }
  if(button.dataset.answerId===String(m.id)){button.classList.add('correct');button.append(el('span','answer-mark','✓ Bonne réponse'))}
  else if(button.dataset.answerId===id){button.classList.add('incorrect');button.append(el('span','answer-mark','✕ Ton choix'))}
 }
 if(session.mode==='photo-name')$('studyAnswer').replaceChildren(el('h2','',m.name),quizIdentity(m),badges(m));
 else $('studyAnswer').append(quizIdentity(m));
 $('quizFeedback').textContent=correct?'Bonne réponse !':`La bonne réponse était ${m.name}.`;
 $('quizFeedback').className='quiz-feedback '+(correct?'success':'error');
 enableNamePronunciation(m);
 $('studyProgress').textContent=quizProgressLabel(session.index+1);
 $('nextStudy').textContent=session.index+1===session.deck.length?'Voir mon score':'Question suivante →';
 $('nextStudy').hidden=false;
}
let lastMissed=[];
function nextQuestion(){if(!session||!session.answered)return;session.index++;if(session.index===session.deck.length)endSession(false);else showStudy()}
function endSession(cancelled){
 stopNamePronunciation();$('listenName').hidden=true;
 if(!session)return;
 $('filters').hidden=false;$('count').hidden=false;$('studySession').hidden=true;
 if(cancelled){$('studyIntro').hidden=false;$('studyEnd').hidden=true}
 else{
  lastMissed=[...new Map(session.missed.map(m=>[String(m.id),m])).values()];
  const done=session.correct+session.missed.length,errors=session.missed.length,pct=done?Math.round(session.correct/done*100):0;
  $('studyResult').replaceChildren();
  const score=el('div','quiz-session-score');
  score.append(el('strong','',pct+' %'),el('span','','Taux de réussite de ce quiz'));
  $('studyResult').append(score);
  const summary=el('div','quiz-summary');
  for(const [label,value] of [['Questions répondues',done],['Bonnes réponses',session.correct],['Erreurs',errors]]){
    const item=el('div','quiz-stat');item.append(el('strong','',String(value)),el('span','',label));summary.append(item);
  }
  $('studyResult').append(summary);
  if(lastMissed.length)$('studyResult').append(el('p','quiz-review','À revoir : '+lastMissed.map(m=>m.name).join(', ')+'.'));
  $('quizHistoryTotal').textContent=String(quizErrorTotal());
  $('retryStudy').disabled=!lastMissed.length;$('studyEnd').hidden=false;
 }
 session=null;$('training').scrollIntoView({block:'start'});
}
$('nextStudy').onclick=nextQuestion;$('startStudy').onclick=()=>startSession();
$('restartStudy').onclick=()=>{$('studyEnd').hidden=true;$('studyIntro').hidden=false;$('training').scrollIntoView({block:'start'})};
$('retryStudy').onclick=()=>startSession(lastMissed);

$('resetQuizStats').onclick=()=>{
 const status=$('resetQuizStatus');
 if(session){status.textContent='Termine le quiz en cours avant de réinitialiser les statistiques.';return}
 if(!confirm('Effacer définitivement la progression du quiz, les statistiques et toutes les erreurs enregistrées sur cet appareil ? Cette opération est irréversible.'))return;
 try{
  localStorage.removeItem(QUIZ_PROGRESS_KEY);
  localStorage.removeItem(QUIZ_ERRORS_KEY);
  quizProgress={round:0,people:{}};
  quizErrors={};
  $('quizHistoryTotal').textContent='0';
  lastMissed=[];
  $('retryStudy').disabled=true;
  $('studyEnd').hidden=true;
  $('studyIntro').hidden=false;
  $('studySession').hidden=true;
  status.textContent='Statistiques et erreurs réinitialisées. Le prochain quiz repart de zéro.';
  render();
 }catch(error){
  status.textContent='Réinitialisation impossible : le stockage local du navigateur est inaccessible.';
 }
};

$('stopStudy').onclick=()=>endSession(false);
function validateData(a){if(!Array.isArray(a)||!a.length||a.length>1000)throw Error('Une liste de 1 à 1000 députés est attendue.');const ids=new Set,types=['EP_PRESIDENT','EP_VICE_PRESIDENT','EP_QUAESTOR','COMMITTEE_CHAIR','COMMITTEE_VICE_CHAIR'];for(const m of a){if(!m||typeof m!=='object'||!/^[0-9]{1,9}$/.test(String(m.id))||ids.has(String(m.id)))throw Error('Identifiant manquant ou dupliqué.');m.id=String(m.id);ids.add(m.id);for(const k of ['name','country'])if(typeof m[k]!=='string'||!m[k].trim()||m[k].length>300)throw Error('Nom ou pays invalide.');for(const k of ['role','lastName','group'])if(m[k]!==undefined&&(typeof m[k]!=='string'||m[k].length>300))throw Error('Fonction ou groupe invalide.');if(m.gender!==undefined&&!['MALE','FEMALE',''].includes(m.gender))throw Error('Genre invalide.');if(m.committees!==undefined&&(!Array.isArray(m.committees)||m.committees.length>50))throw Error('Commissions invalides.');for(const c of committeesOf(m))if(!committeeDefs[c.code]||!['MEMBER','SUBSTITUTE'].includes(c.status)||!['CHAIR','VICE_CHAIR','MEMBER','SUBSTITUTE'].includes(c.position))throw Error('Affectation en commission invalide.');if(m.parliamentaryFunctions!==undefined&&(!Array.isArray(m.parliamentaryFunctions)||m.parliamentaryFunctions.length>40))throw Error('Fonctions invalides.');for(const f of afs(m))if(!types.includes(f.type)||typeof f.label!=='string'||f.label.length>300||!safeLink(f.source))throw Error('Fonction institutionnelle ou source invalide.');for(const c of coords(m))if(!/^[A-Z]{3,6}$/.test(c.committee||'')||!safeLink(c.source))throw Error('Coordinateur invalide.');for(const k of ['roleSource','headSource'])if(m[k]&&!safeLink(m[k]))throw Error('Source officielle invalide.');delete m.party}return a}
Promise.all([fetch('./members.json').then(r=>{if(!r.ok)throw Error('Membres');return r.json()}),fetch('./committees.json').then(r=>{if(!r.ok)throw Error('Commissions');return r.json()}),fetch('./photo-assets.json').then(r=>r.ok?r.json():null).catch(()=>null),fetch('./hemicycle-seats.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),fetch('./coordinators.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)]).then(([a,defs,assets,seats,coordData])=>{coordinatorAssignments=Array.isArray(coordData?.entries)?coordData.entries.filter(x=>x&&typeof x.id==='string'&&typeof x.committee==='string'&&typeof x.group==='string'):[];if(seats&&seats.seats&&typeof seats.seats==='object'&&!Array.isArray(seats.seats)){hemicycleSeats=Object.fromEntries(Object.entries(seats.seats).filter(([id,v])=>/^[0-9]{1,9}$/.test(id)&&v&&typeof v==='object'&&['str','bru'].every(k=>v[k]===undefined||(Number.isInteger(v[k])&&v[k]>0&&v[k]<=999))))};if(assets&&Array.isArray(assets.photos)&&Array.isArray(assets.thumbs))photoAssets={photos:new Set(assets.photos.map(String)),thumbs:new Set(assets.thumbs.map(String))};committeeDefs=defs;publishedCommitteeDefs=structuredClone(defs);members=validateData(a);published=structuredClone(a);
populate();const params=new URLSearchParams(location.search),personParam=params.get('person'),selectedPerson=personParam&&members.find(m=>String(m.id)===personParam);const groupParam=params.get('group'),committeeParam=params.get('committee');if(selectedPerson){$('search').value=selectedPerson.name;$('directoryTab').click()}else if(committeeParam&&[...$('committee').options].some(option=>option.value===committeeParam)){$('committee').value=committeeParam;$('sort').value='role'}else if(groupParam&&[...$('group').options].some(o=>o.value===groupParam)){$('group').value=groupParam;$('sort').value='role'}applyGroupTheme();render();if(params.get('section')==='secretariat')showSecretariat(false);if(selectedPerson)requestAnimationFrame(()=>{$('grid').scrollIntoView({behavior:'smooth',block:'start'})})}).catch(()=>{$('count').textContent='Impossible de charger les données. Actualise la page.';$('startStudy').disabled=true});

