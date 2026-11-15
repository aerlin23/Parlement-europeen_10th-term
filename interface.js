function directoryCard(m,priority=false){
 const card=el('article','card'),info=el('div','info'),name=el('a','name',m.name);
 name.href=`https://www.europarl.europa.eu/meps/fr/${m.id}/_/home`;
 name.target='_blank';name.rel='noopener';
 const countryGroup=el('div','country-group-line');
 countryGroup.append(countryLabel(m),el('div','group-label',m.group||''));
 const functions=fnEntries(m);
 const institutional=functions.filter(f=>f.type.startsWith('EP_')),other=functions.filter(f=>!f.type.startsWith('EP_'));
 if(institutional.length)info.append(badges(m,institutional));
 info.append(name,countryGroup);
 const seats=hemicycleBlock(m);if(seats)info.append(seats);
 if(other.length)info.append(badges(m,other));
 const commissions=committeeBox(m);if(commissions)info.append(commissions);
 const share=window.vademecumCardShare?.(m);if(share)info.append(share);
 
 const photoLink=el('a','portrait-link');photoLink.href=name.href;photoLink.target='_blank';photoLink.rel='noopener';
 photoLink.setAttribute('aria-label',`Ouvrir la fiche officielle de ${m.name} sur le site du Parlement européen`);
 photoLink.title='Ouvrir la fiche officielle sur le site du Parlement européen';
 photoLink.append(imageBox(m,false,priority));card.append(photoLink,info);
 name.addEventListener('click',()=>rememberMep(m));photoLink.addEventListener('click',()=>rememberMep(m));
 return card;
}
function appendDirectoryPage(){
 if(training)return;
 const end=Math.min(directoryVisible+DIRECTORY_PAGE_SIZE,filtered.length);
 const fragment=document.createDocumentFragment();
 for(const [index,m] of filtered.slice(directoryVisible,end).entries())fragment.append(directoryCard(m,directoryVisible===0&&index<4));
 $('grid').append(fragment);directoryVisible=end;
 const hasMore=directoryVisible<filtered.length;
 $('loadMoreWrap').hidden=!hasMore;
 if(hasMore)$('loadMore').textContent=`Afficher davantage de députés (${directoryVisible}/${filtered.length})`;
 if(directoryObserver){directoryObserver.disconnect();if(hasMore)directoryObserver.observe($('loadMoreWrap'))}
}
let substituteMembers=[],substitutesVisible=0,substitutesExpanded=false;
$('substitutesToggle').onclick=()=>{
 substitutesExpanded=!substitutesExpanded;
 $('substitutesToggle').setAttribute('aria-expanded',String(substitutesExpanded));
 $('substitutesToggle').textContent=(substitutesExpanded?'Masquer':'Afficher')+' les suppléants · '+substituteMembers.length;
 $('substitutesSection').hidden=!substitutesExpanded;
 if(substitutesExpanded&&!substitutesVisible)appendSubstitutesPage();
 window.updateAlphaFloating?.();
};
function appendSubstitutesPage(){
 if(training||!field('committee'))return;
 const end=substituteMembers.length;
 const fragment=document.createDocumentFragment();
 for(const m of substituteMembers.slice(substitutesVisible,end))fragment.append(directoryCard(m));
 $('substitutesGrid').append(fragment);substitutesVisible=end;
}
function renderSubstitutes(){
 const code=field('committee'),q=norm(field('search').trim());
 substituteMembers=[];substitutesVisible=0;
 $('substitutesGrid').replaceChildren();
 $('substitutesSection').hidden=true;
 $('substitutesToggleWrap').hidden=true;
 substitutesExpanded=false;
 $('substitutesToggle').setAttribute('aria-expanded','false');
 if(!code)return;
 const f=field('function'),status=field('assignment'),kind=field('kind');
 if(kind&&committeeDefs[code]?.type!==kind)return;
 substituteMembers=members.filter(m=>
  (!field('group')||m.group===field('group'))&&
  (!field('gender')||m.gender===field('gender'))&&
  (!field('country')||m.country===field('country'))&&
  matchesFunction(m,f)&&
  (!status||status==='SUBSTITUTE')&&
  (!q||norm(m.name).includes(q))&&
  committeesOf(m).some(c=>c.code===code&&c.status==='SUBSTITUTE')&&
  !committeesOf(m).some(c=>c.code===code&&c.status==='MEMBER')
 ).sort((a,b)=>surname(a).localeCompare(surname(b),'fr',{sensitivity:'base'})||a.name.localeCompare(b.name,'fr'));
 if(!substituteMembers.length)return;
 $('substitutesTitle').textContent=`Suppléants · ${substituteMembers.length}`;
 $('substitutesToggleWrap').hidden=false;
 $('substitutesToggle').textContent=`Afficher les suppléants · ${substituteMembers.length}`;
}
if('IntersectionObserver' in window){
 directoryObserver=new IntersectionObserver(entries=>{
  if(entries.some(e=>e.isIntersecting)&&!training&&directoryVisible<filtered.length)appendDirectoryPage();
 },{rootMargin:'350px 0px'});
}
$('loadMore').onclick=appendDirectoryPage;
function renderCommitteeLeadership(){
 const panel=$('committeeLeadership'),committee=field('committee');
 panel.replaceChildren();panel.hidden=!committee||training;
 if(panel.hidden)return;
 const chosen=field('group'),groups=['PPE','S&D','PfE','ECR','Renew','Verts/ALE','The Left','ESN','NI'];
 const make=(heading,cls)=>{const section=el('div','leader-row '+cls),body=el('div','leader-entries');section.append(el('span','leader-heading',heading),body);return {section,body}};
 const institution=make('Présidence et vice-présidences de commission','institutional-leaders');
 const institutional=members.flatMap(m=>afs(m).filter(f=>f.committee===committee&&['COMMITTEE_CHAIR','COMMITTEE_VICE_CHAIR'].includes(f.type)&&(!chosen||m.group===chosen)).map(f=>({m,f}))).sort((a,b)=>(a.f.type==='COMMITTEE_CHAIR'?0:1)-(b.f.type==='COMMITTEE_CHAIR'?0:1)||(a.f.protocolRank||99)-(b.f.protocolRank||99)||a.m.name.localeCompare(b.m.name,'fr'));
 for(const {m,f} of institutional){const span=el('span','leader-entry'),link=el('a','',m.name);link.href='https://www.europarl.europa.eu/meps/fr/'+m.id+'/_/home';link.target='_blank';link.rel='noopener';const ordinal=f.type==='COMMITTEE_CHAIR'?'Président':Number.isInteger(f.protocolRank)?(f.protocolRank===1?'1re':' '+f.protocolRank+'e')+' vice-présidence':'Vice-présidence (rang à vérifier)';span.append(el('small','',ordinal+' · '+m.group+' · '),link);institution.body.append(span)}
 if(institutional.length)panel.append(institution.section);
 const listing=make('Coordinateurs des groupes politiques','group-coordinators');
 const relevant=coordinatorAssignments.filter(x=>x.committee===committee&&x.role!=='deputy-coordinator'&&(!chosen||x.group===chosen)).map(a=>({a,m:members.find(m=>String(m.id)===a.id)})).filter(({a,m})=>m&&m.group===a.group&&committeesOf(m).some(c=>c.code===a.committee)).sort((x,y)=>groups.indexOf(x.a.group)-groups.indexOf(y.a.group)||x.m.name.localeCompare(y.m.name,'fr'));
 let historical=false;
 for(const {a,m} of relevant){const span=el('span','leader-entry'),link=el('a','',m.name);link.href='https://www.europarl.europa.eu/meps/fr/'+m.id+'/_/home';link.target='_blank';link.rel='noopener';link.title='Source : '+a.source+' · '+a.sourceDate;span.append(el('small','',a.group+(a.role==='deputy-coordinator'?' · adjoint':a.role==='co-coordinator'?' · co-coordinateur':'')+' · '),link);if(a.sourceStatus==='historical-nomination'){span.append(el('small','',' (2024*)'));historical=true}listing.body.append(span)}
 if(relevant.length){panel.append(listing.section);if(historical)listing.section.append(el('p','leader-note','* Nominations de 2024 : maintien en fonction à confirmer.'))}
}
function render(){
 syncCommissionFunctionMenu();window.vademecumRefreshCommitteeShare?.();filtered=selectMembers();directoryVisible=0;
 window.updateAlphaFloating?.();
 if(directoryObserver)directoryObserver.disconnect();
 $('grid').replaceChildren();
 appendDirectoryPage();
 renderSubstitutes();
 renderCommitteeLeadership();
 const currentCommittee=field('committee');
 const count=$('count');
 count.replaceChildren();
 if(fuzzySearchUsed)count.append(document.createTextNode('Résultats approchés · '));
 if(currentCommittee){
  count.append(document.createTextNode(filtered.length+' titulaire'+(filtered.length===1?'':'s')+' · '));
  const subCount=el('span','committee-sub-count',substituteMembers.length+' suppléant'+(substituteMembers.length===1?'':'s'));
  count.append(subCount);
 }else count.append(document.createTextNode(filtered.length+' député'+(filtered.length===1?'':'s')+' sur '+members.length));$('empty').hidden=!!filtered.length;const coverageMembers=field('group')?members.filter(m=>m.group===field('group')):members;
 const n=t=>coverageMembers.filter(m=>afs(m).some(f=>f.type===t)).length;
 const coverage=$('coverage');
 const coverageLine=(label,items)=>{
  const available=items.filter(([count])=>count>0);
  if(!available.length)return null;
  const line=document.createElement('span');line.className='coverage-line';
  line.append(el('span','coverage-label',label+' : '));
  available.forEach(([count,singular,plural,filter],index)=>{
   if(index)line.append(document.createTextNode(' · '));
   const button=el('button','coverage-link',count+' '+(count===1?singular:plural));
   button.type='button';
   button.title='Afficher les députés concernés';
   button.setAttribute('aria-controls','grid');
   button.setAttribute('aria-label','Afficher '+count+' '+(count===1?singular:plural)+(field('group')?' du groupe '+field('group'):''));
   if(field('function')===filter)button.setAttribute('aria-current','true');
   button.onclick=event=>{
    event.preventDefault();
    const chosen=field('function')===filter?'':filter;
    // Les chiffres portent sur tout le groupe choisi : retirer les autres filtres
    // pour que le résultat corresponde bien au décompte indiqué.
    for(const id of ['search','gender','country','committee','assignment','kind'])if($(id))$(id).value='';
    const option=[...$('function').options].find(o=>o.value===chosen);if(option)option.disabled=false;
    $('function').value=chosen;
    $('sort').value=chosen?'role':(field('group')?'role':'name');
    changeFilters();
    document.getElementById('count')?.setAttribute('role','status');
    document.getElementById('count')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
   };
   line.append(button);
  });
  return line;
 };
 const lines=[
  coverageLine('Parlement',[[n('EP_PRESIDENT'),'présidence','présidences','president'],[n('EP_VICE_PRESIDENT'),'vice-présidence','vice-présidences','vice'],[n('EP_QUAESTOR'),'questeur','questeurs','quaestor']]),
  coverageLine('Commissions',[[n('COMMITTEE_CHAIR'),'présidence','présidences','chair'],[n('COMMITTEE_VICE_CHAIR'),'vice-présidence','vice-présidences','vicechair']])
 ].filter(Boolean);
 coverage.replaceChildren(...lines);const eligible=filtered.filter(canQuiz);$('startStudy').disabled=!eligible.length;$('startStudy').textContent=`Commencer · ${eligible.length} photo${eligible.length>1?'s':''}`;$('quizAvailability').textContent='Session de 20 questions maximum. Les erreurs reviennent plus souvent, les bonnes réponses sont espacées.';}


const GROUP_THEMES={
 'PPE':{name:'PPE',title:'Parti populaire européen',repo:'PPE_10th-term',file:'group-logo.png',primary:'#0155a0',accent:'#fbb034',soft:'#c9e0f7'},
 'S&D':{name:'S&D',title:'Socialistes et démocrates',repo:'S-D_10th-term',file:'group-logo.svg',primary:'#923e4b',accent:'#c27882',soft:'#f1cbd4'},
 'PfE':{name:'Patriotes',title:'Patriotes pour l’Europe',repo:'Patriots_10th-term',file:'group-logo.svg',primary:'#05174b',accent:'#00e4ff',soft:'#cbd9f4'},
 'ECR':{name:'ECR',title:'Conservateurs et réformistes européens',repo:'ECR_10th-term',file:'group-logo.svg',primary:'#1066a8',accent:'#86c6f2',soft:'#cce7fa'},
 'Renew':{name:'Renew',title:'Renew Europe',repo:'Renew_10th-term',file:'group-logo.svg',primary:'#0039bf',accent:'#00aeef',soft:'#bfeafa'},
 'Verts/ALE':{name:'Verts/ALE',title:'Verts / Alliance libre européenne',repo:'Greens_10th-term',file:'group-logo.svg',primary:'#428207',accent:'#f7bd33',soft:'#d3eac5'},
 'The Left':{name:'The Left',title:'La Gauche',repo:'The-Left_10-term',file:'group-logo.png',primary:'#b51d20',accent:'#2ba187',soft:'#f5cacc'},
 'ESN':{name:'ESN',title:'Europe des nations souveraines',repo:'ESN_10th-term',file:'group-logo.png',primary:'#19345a',accent:'#5293a7',soft:'#cddfea'},
 'NI':{name:'NI',title:'Non-inscrits',primary:'#4b5563',accent:'#aeb8c5',soft:'#d8dce4'}
};
document.addEventListener('click',event=>{const details=document.getElementById('mobileInstitutions');if(details?.open&&!details.contains(event.target))details.open=false});
// Le sous-menu des groupes reflète la sélection sans prendre de place sur mobile.
document.addEventListener('click',event=>{const details=$('mobileGroups');if(details?.open&&!details.contains(event.target))details.open=false});
function applyGroupTheme(){
 const selected=field('group'),theme=GROUP_THEMES[selected],root=document.documentElement;
 $('offlineManager').hidden=false;
 document.body.classList.toggle('group-view',!!theme);
 for(const [key,val] of Object.entries({'--group-primary':theme?.primary||'#003399','--group-accent':theme?.accent||'#ffcc00','--group-soft':theme?.soft||'#f3f6f8'}))root.style.setProperty(key,val);
 const logo=$('identityLogo'),mark=$('identityText'),link=document.querySelector('.ep-logo');
 $('identityTitle').textContent=theme?.title||'Vademecum des députés européens';
 $('identityBrand').textContent='';$('identityBrand').hidden=true;
 $('identitySubtitle').textContent='';$('identitySubtitle').hidden=true;
 $('headerStats').hidden=false;
 // Les compteurs reflètent le groupe entier, indépendamment des autres filtres.
 const headerMembers=theme?members.filter(m=>m.group===selected):members;
 $('total').textContent=headerMembers.length;
 $('countries').textContent=new Set(headerMembers.map(m=>m.country).filter(Boolean)).size;
 logo.hidden=!!theme&&!theme.file;mark.hidden=!(theme&&!theme.file);mark.textContent=theme?.name||'';
 logo.src=selected==='Verts/ALE'?'./assets/greens-logo.svg':theme?.file?'https://aerlin23.github.io/'+theme.repo+'/assets/'+theme.file:'./assets/parlement-logo.png';
 logo.alt=theme?'Logo '+theme.name:'Parlement européen';
 logo.onerror=()=>{if(field('group')!==selected)return;if(theme&&theme.file){logo.hidden=true;mark.hidden=false;mark.textContent=theme.name}else{logo.onerror=null}};
 if(theme&&theme.file){logo.hidden=false;mark.hidden=true}
 link.href=theme?'?group='+encodeURIComponent(selected):'https://www.europarl.europa.eu/portal/fr';
 link.target=theme?'':'_blank';
 for(const a of document.querySelectorAll('.directories a')){const url=new URL(a.href),isGroup=!!theme&&url.searchParams.get('group')===selected,isHome=!theme&&a.textContent.trim()==='Tous les députés';if(isGroup||isHome)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
 const mi=$('mobileInstitutions'),ms=$('mobileInstitutionsSummary');if(mi&&ms){mi.open=false;ms.classList.remove('selected');mi.querySelectorAll('[aria-current]').forEach(a=>a.removeAttribute('aria-current'))}
 const mobileGroups=$('mobileGroups'),mobileSummary=$('mobileGroupsSummary');if(mobileGroups&&mobileSummary){mobileGroups.classList.toggle('active',!!theme);mobileSummary.textContent=theme?'Groupes · '+selected:'Groupes politiques';mobileGroups.open=false}
}
function syncCommissionFunctionMenu(){
 const committee=!!field('committee'),group=!!field('group'),select=$('function');
 const allowed=committee?['commissionbureau','coord']:group?['groupleadership','chair','coord']:['presidencype','quaestor','chair','grouppresident','coord'];
 const current=select.value;
 for(const option of select.options){
  if(!option.value)continue;
  const visible=allowed.includes(option.value);
  option.hidden=!visible;
  // Garder les fonctions détaillées accessibles via les décomptes cliquables.
  option.disabled=!visible&&option.value!==current;
 }
 for(const key of allowed){const option=select.querySelector('option[value="'+key+'"]');if(option)select.append(option)}
 const opt=select.querySelector('option[value="coord"]');if(opt)opt.textContent=committee?'Coordinateurs de la commission':'Coordinateurs de groupe';
 const leadership=select.querySelector('option[value="groupleadership"]');if(leadership)leadership.textContent='Présidence et vice-présidences du groupe';
}
function changeFilters(){syncCommissionFunctionMenu();if(session)endSession(true);$('studyIntro').hidden=false;$('studyEnd').hidden=true;applyGroupTheme();render()}
for(const id of ['search','gender','country','function','assignment','kind','sort'])if($(id))$(id).addEventListener(id==='search'?'input':'change',changeFilters);
$('committee').addEventListener('change',()=>{$('function').value='';$('sort').value=$('committee').value||$('group').value?'role':'name';changeFilters()});
$('group').addEventListener('change',()=>{$('function').value='';$('sort').value=$('group').value||$('committee').value?'role':'name';changeFilters()});
$('reset').onclick=()=>{for(const id of ['search','gender','group','country','function','committee','assignment','kind'])if($(id))$(id).value='';$('sort').value='name';changeFilters()};
// Conserver les filtres visibles sur ordinateur et repliés au chargement sur mobile.
const advancedBreakpoint=matchMedia('(max-width:650px)');
function syncMobileFilterLabels(){const mobile=advancedBreakpoint.matches;for(const [id,desktop,mobileText] of [['group','Tous les groupes','Groupes politiques'],['committee','Toutes','Commissions'],['gender','Tous','Genre'],['function','Toutes les fonctions','Fonctions'],['country','Tous les pays','Pays'],['sort','Nom de famille · A → Z','Nom A–Z']]){const select=$(id),option=select?.options[0];if(option)option.textContent=mobile?mobileText:desktop}}
function syncAdvancedBreakpoint(){const panel=$('advanced');if(panel)panel.open=!advancedBreakpoint.matches;syncMobileFilterLabels()}
syncAdvancedBreakpoint();
advancedBreakpoint.addEventListener?.('change',syncAdvancedBreakpoint);
function setReadingMode(value){
 if(!['compact','normal','large'].includes(value))value='normal';
 document.body.classList.toggle('compact',value==='compact');
 document.body.classList.toggle('reading-large',value==='large');
 for(const button of document.querySelectorAll('[data-reading]'))button.setAttribute('aria-pressed',String(button.dataset.reading===value));
 try{localStorage.setItem('pe-reading-mode',value);localStorage.setItem('directory-compact',value==='compact'?'1':'0')}catch{}
 document.dispatchEvent(new Event('pe-reading-change'));
}
let pref='normal';try{pref=localStorage.getItem('pe-reading-mode')||(localStorage.getItem('directory-compact')==='1'?'compact':'normal')}catch{}
setReadingMode(pref);
for(const button of document.querySelectorAll('[data-reading]'))button.onclick=()=>setReadingMode(button.dataset.reading);
function mode(study){if(new URLSearchParams(location.search).get('section')==='secretariat')history.pushState({},'',location.pathname);$('secretariatPanel').hidden=true;$('filters').hidden=false;$('count').hidden=false;$('secretariatNav').removeAttribute('aria-current');applyGroupTheme();training=study;if(directoryObserver){directoryObserver.disconnect();if(!study&&directoryVisible<filtered.length)directoryObserver.observe($('loadMoreWrap'))}for(const [id,on] of [['directoryTab',!study],['trainingTab',study]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on))}$('directory').hidden=study;$('training').hidden=!study;if(!study&&session)endSession(true)}$('directoryTab').onclick=()=>mode(false);$('trainingTab').onclick=()=>mode(true);document.getElementById('directoryTab').addEventListener('click',()=>window.updateAlphaFloating?.());document.getElementById('trainingTab').addEventListener('click',()=>window.updateAlphaFloating?.());
const SG_PE_DATA=[["SG","Alessandro Chiocchetti","Secrétaire général","https://the-secretary-general.europarl.europa.eu/en","main"],["SG adjoint","Markus Winkler","Secrétaire général adjoint · DG PRES","https://the-secretary-general.europarl.europa.eu/home/organisation/deputy-secretaries-general/deputy-secretary-general-markus-winkler.html","deputy"],["SG adjoint","Anders Rasmussen","Secrétaire général adjoint · DG EPRS","https://the-secretary-general.europarl.europa.eu/home/organisation/deputy-secretaries-general/deputy-secretary-general-anders-rasmussen-1.html","deputy"],["PRES","Markus Winkler","Direction générale de la Présidence · également SG adjoint","https://the-secretary-general.europarl.europa.eu/en/directorates-general/presidency",""],["ECTI","Michael Alexander Speiser","Économie, transformation et industrie","https://the-secretary-general.europarl.europa.eu/en/directorates-general/ecti",""],["IUST","Leticia Zuleta de Reales Ansaldo","Droits des citoyens, justice et affaires institutionnelles","https://the-secretary-general.europarl.europa.eu/en/directorates-general/iust",""],["CASP","Agnieszka Walter-Drop","Cohésion, agriculture et politiques sociales","https://the-secretary-general.europarl.europa.eu/en/directorates-general/casp",""],["BUDG","Monika Strasser","Affaires budgétaires","https://the-secretary-general.europarl.europa.eu/en/directorates-general/budg",""],["EXPO","Pietro Ducci","Politiques externes de l’Union","https://the-secretary-general.europarl.europa.eu/en/directorates-general/expo",""],["EPRS","Anders Rasmussen","Services de recherche parlementaire · également SG adjoint","https://the-secretary-general.europarl.europa.eu/en/directorates-general/eprs",""],["COMM","Christian Mangold","Communication","https://the-secretary-general.europarl.europa.eu/en/directorates-general/comm",""],["PART","Sanna Lepola","Partenariats pour la démocratie parlementaire","https://the-secretary-general.europarl.europa.eu/home/organisation/directorates-general/dg-for-parliamentary-democracy-partnerships.html",""],["PERS","Ellen Robson","Personnel","https://the-secretary-general.europarl.europa.eu/en/directorates-general/pers",""],["INLO","Anna Grzybowska","Infrastructures et logistique","https://the-secretary-general.europarl.europa.eu/en/directorates-general/inlo",""],["TRAD","Valter Mavrič","Traduction et langage clair","https://the-secretary-general.europarl.europa.eu/en/directorates-general/trad",""],["LINC","Juan Carlos Jiménez Marín","Logistique et interprétation pour les conférences","https://the-secretary-general.europarl.europa.eu/en/directorates-general/linc",""],["FINS","Didier Klethi","Finances","https://the-secretary-general.europarl.europa.eu/en/directorates-general/fins",""],["ITEC","Lorenzo Mannelli","Technologies de l’information et cybersécurité","https://the-secretary-general.europarl.europa.eu/en/directorates-general/itec",""],["SAFE","Guy Mols","Sécurité et sûreté · indiqué « Director » sur la page officielle","https://the-secretary-general.europarl.europa.eu/en/directorates-general/safe",""],["SJ","Freddy Drexler","Jurisconsulte · Service juridique","https://the-secretary-general.europarl.europa.eu/en/organisation/legal-service",""]];
const SG_PE_PHOTOS={"Alessandro Chiocchetti":"./assets/sg-alessandro-chiocchetti-user.webp","Markus Winkler":"./assets/sg-markus-winkler-official.webp","Anders Rasmussen":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/deputy-secretaries-general/rasmussen-anders.jpg","Michael Alexander Speiser":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/michael-alexander-speiser.jpg","Leticia Zuleta de Reales Ansaldo":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/leticia-zuleta-de-reales-ansaldo.jpg","Agnieszka Walter-Drop":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/agnieszka-walter-drop.jpg","Monika Strasser":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/monika-strasser-150x193.jpg","Pietro Ducci":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20expo/ducci-pietro.jpg","Christian Mangold":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20ipol/mangold-christian.jpg","Sanna Lepola":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20part/lepola-honig-sannaleena.jpg","Ellen Robson":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20pers/ellen-robson.jpg","Anna Grzybowska":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20inlo/anna-grzybowska.jpg","Valter Mavrič":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20trad/mavric-valter.jpg","Juan Carlos Jiménez Marín":"./assets/sg-juan-carlos-jimenez-marin.webp","Didier Klethi":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20fins/klethi-didier.jpg","Lorenzo Mannelli":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20itec/lorenzo-manneli.jpg","Guy Mols":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20safe/mols-guy.jpg","Freddy Drexler":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/legal%20service/drexler-freddy.jpg"};
const SG_PE_ORG={"PRES":[["Séance plénière","Maria Gandolfo","Procès-verbaux et comptes rendus;Activités des députés;Suivi des séances;Dépôt et réception des documents"],["Actes législatifs","Alina Monica Medeleanu","Qualité législative et publications;Coordination législative;Politiques économiques, sociales et extérieures"],["Protocole","Julia Glinski","Visites institutionnelles;Cérémonies;Délégations et visas"],["Affaires interinstitutionnelles","Guillaume Edward McLaughlin","Planification législative;Relations interinstitutionnelles;Transparence"]],"ECTI":[["Économie et croissance","Claudia Lindemann","Secrétariats ECON, IMCO et FISC;Contrôle de la gouvernance économique;Analyse économique"],["Transformation, innovation et santé","Étienne Bassot","Secrétariats ITRE, ENVI et SANT;Appui aux politiques de l'industrie;Recherche et santé"]],"CASP":[["Développement régional, agriculture et pêche","Eduard Reijnders","Secrétariats REGI, AGRI et PECH;Appui thématique"],["Transports, emploi et affaires sociales","Nils Danklefsen","Secrétariats TRAN, EMPL et HOUS;Appui thématique"]],"IUST":[["Citoyens, égalité et culture","Sonia Wollny","Secrétariats PETI, FEMM et CULT;Appui aux politiques des citoyens"],["Justice, libertés civiles et affaires institutionnelles","Els Vandenbosch","Secrétariats LIBE, JURI, AFCO et EUDS;Appui thématique"]],"BUDG":[["Budget et contrôle budgétaire","Elisa Daffarra","Secrétariats BUDG et CONT"],["Analyse et appui au contrôle budgétaire","Patricia Silveira da Cunha","Appui budgétaire;Analyse des dépenses"]],"EXPO":[["Coordination des commissions","Raquel de Vicente","Secrétariats AFET, SEDE, DROI, DEVE et INTA;Analyse des politiques extérieures"],["Régions","Annalisa Gliubizzi-Fajardo","Élargissement et voisinage européen;Asie et Océanie;Moyen-Orient et Méditerranée;Amérique latine;Afrique, Caraïbes et Pacifique;Relations transatlantiques"],["Soutien à la démocratie","Armelle Douaud","Observation des élections;Appui aux parlements;Droits humains et médiation"]],"EPRS":[["Service de recherche pour les députés","Sarah Sheil","Politiques économiques et structurelles;Politiques des citoyens;Politiques externes et budgétaires;Politiques numériques"],["Analyse d'impact et évaluation","Kajus Hagelstam","Évaluations ex ante et ex post;Prospective scientifique;Valeur ajoutée européenne"],["Bibliothèque et instruments du savoir","Franck Debié","Bibliothèque;Recherche documentaire;Outils de connaissance"]],"COMM":[["Porte-parolat et médias","Jesús Carmona Núñez","Relations avec les médias;Médias décentralisés;Audiovisuel;Veille des médias"],["Bureaux de liaison","Stephen Clark","Bureaux de liaison du Parlement;Communication décentralisée"],["Visiteurs et engagement du public","Jutta Schulze-Hollmén","Parlamentarium;Visites de l'hémicycle;Maison de l'histoire européenne;Accueil des visiteurs"]],"PART":[["Relations avec les parlements nationaux","Jesús Gómez","Coopération institutionnelle;Dialogue législatif;Réseaux parlementaires"],["Bureaux de liaison extérieurs","Oumar Doumbouya","Londres et Washington;Nations unies;Partenariats internationaux;Ukraine et voisinage"]],"PERS":[["Gouvernance RH et carrières","Pasquale Ciuffreda","Recrutement;Stagiaires;Carrières et éthique;Analyse RH"],["Administration du personnel","Jurij Tomac","Droits individuels;Rémunérations;Missions;Pensions et assurances sociales"],["Services sociaux et soutien RH","Valérie Montebello-Demogeot","Égalité et inclusion;Bien-être au travail;Médecine du travail;Prévention"]],"INLO":[["Bâtiments et infrastructures — Bruxelles","Davy Mesotten","Gestion des infrastructures;Aménagement;Durabilité"],["Bâtiments et infrastructures — Luxembourg","Christine Bahr","Gestion des infrastructures;Aménagement;Durabilité"],["Bâtiments et infrastructures — Strasbourg","Armin Machmer","Gestion des infrastructures;Aménagement;Durabilité"],["Mobilité et services","","Mobilité durable;Restauration;Visiteurs"]],"TRAD":[["Traduction législative et parlementaire","Véronique Rosenkranz","Unités de traduction par langue;Textes législatifs"],["Langage clair et traduction audiovisuelle","Cathy Waibel","Traduction audiovisuelle;Langage des citoyens;Vérification rédactionnelle;Accessibilité linguistique"]],"LINC":[["Interprétation","Marijana Nikolić","Unités d'interprétation par langue;Qualité de l'interprétation"],["Planification et soutien aux interprètes","Simon Busuttil","Programmation des interprètes;Gestion des demandes;Formation;Solutions multilingues"],["Organisation des conférences","Virpi Köykkä","Techniciens de conférence;Huissiers de conférence;Services de conférence à distance"]],"FINS":[["Budget et services financiers","Kirsten Lueddecke","Budget;Comptabilité et trésorerie;Contrôle financier;Marchés publics"],["Droits financiers et sociaux des députés","Nikos Tziorkas","Rémunérations et droits sociaux;Assistance locale;Frais de déplacement;Portail des députés"],["Financement des structures politiques","Ines Morgado","Groupes politiques et non-inscrits;Financement des partis et fondations;Voyages"]],"ITEC":[["Lieu de travail numérique","Gert Van Bastelaere","Outils des députés;Support utilisateurs;Environnement numérique;Logistique informatique"],["Gouvernance informatique et cybersécurité","Pierfrancesco Sabbatucci","Architecture informatique;Cybersécurité;Portefeuilles et conformité"],["Solutions d'entreprise","Libor Bohac","Solutions législatives;Services de données;Applications métiers;Infrastructure"]],"SAFE":[["Sécurité des sites","","Sécurité à Bruxelles;Sécurité à Strasbourg;Sécurité à Luxembourg"],["Protection et accès","","Contrôle des accès et visiteurs;Prévention et premiers secours;Urgences et gestion des incidents"],["Gestion des risques","","Enquêtes;Ressources de sécurité"]],"SJ":[["Conseil et représentation juridiques","","Droit institutionnel;Droit budgétaire;Statut et droits des députés;Contentieux"],["Appui législatif","","Contrôle de légalité;Questions juridiques des politiques de l'UE"]]};
const SG_PE_DIRECTION_PHOTOS={"Maria Gandolfo":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20pres/gandolfo-maria.jpg","Alina Monica Medeleanu":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20pres/medeleanu-alina-monica.jpg","Julia Glinski":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20pres/glinski.jpg","Guillaume Edward McLaughlin":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/ge-mclaughlin.jpg","Claudia Lindemann":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/claudia-lindemann.jpg","Étienne Bassot":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/etienne-bassot.jpg","Sonia Wollny":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/sonia-wollny.jpg","Els Vandenbosch":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/els-vandenbosch.jpg","Eduard Reijnders":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/eduard-reijnders.jpg","Nils Danklefsen":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20casp/nils-danklefsen.png","Elisa Daffarra":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/directorate/Elisa-DAFFARRA-pro.jpg","Patricia Silveira da Cunha":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20ipol/silveira-da-cunha-patricia.jpg","Raquel de Vicente":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20expo/de-vincente-raquel.jpg","Annalisa Gliubizzi-Fajardo":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20expo/annalisa-gliubizzi.jpg","Armelle Douaud":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20expo/douaud-armelle.jpg","Sarah Sheil":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20eprs/Sarah_Sheil.jpg","Franck Debié":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20eprs/debie-franck.jpg","Kajus Hagelstam":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20eprs/Kajus_photo.jpeg","Jesús Carmona Núñez":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20comm/carmona-nunez-jesus.jpg","Stephen Clark":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20comm/clark-stephen.jpg","Jutta Schulze-Hollmén":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20eprs/schulze-hollmen-jutta.jpg","Jesús Gómez":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20part/Jesus-gomez.jpg","Oumar Doumbouya":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20part/oumar-doumbouya.jpg","Pasquale Ciuffreda":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20pers/pasquale_ciuffreda_170.jpg","Jurij Tomac":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20pers/jurij_tomac_170.jpg","Valérie Montebello-Demogeot":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20pers/montebello-demogeot-valerie.jpg","Davy Mesotten":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20inlo/davy-mesotten.jpg","Christine Bahr":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20inlo/bahr-christine.jpg","Armin Machmer":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20inlo/machmer-armin.jpg","Véronique Rosenkranz":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20trad/rosenkranz-veronique.jpg","Cathy Waibel":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20trad/waibel-cathy.jpg","Marijana Nikolić":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20linc/marijana-nikolic.jpg","Simon Busuttil":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20linc/simon-busuttil.jpg","Virpi Köykkä":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20linc/vkoykka-s.jpg","Kirsten Lueddecke":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20fins/lueddecke-kirsten.jpg","Nikos Tziorkas":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20fins/tziorkas-nikos.jpg","Ines Morgado":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20fins/ines-morgado.jpg","Pierfrancesco Sabbatucci":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20itec/pierfrancesco-sabbatucci.jpg","Libor Bohac":"https://the-secretary-general.europarl.europa.eu/files/live/sites/secretarygeneral/files/images/home/organisation/dg%20itec/libor-bohac.jpg"};
function sgOrgCard([code,name,role,source]){
 const node=el('details','sg-tree-dg sg-dg-card'),header=el('summary','sg-tree-dg-head');
 const photo=el('span','sg-dg-photo'),photoUrl=SG_PE_PHOTOS[name];
 if(photoUrl){
  const img=el('img');img.src=photoUrl;img.alt='Portrait de '+name;
  img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  img.onerror=()=>{img.remove();photo.append(el('span','sg-dg-photo-empty','Photo indisponible'))};
  photo.append(img);
 }else photo.append(el('span','sg-dg-photo-empty','Photo indisponible'));
 const info=el('span','sg-dg-identity');
 info.append(el('strong','sg-tree-code',code==='SJ'?'SERVICE JURIDIQUE':'DG '+code));
 info.append(el('span','sg-dg-name',name));
 info.append(el('span','sg-tree-dg-name',code==='SJ'?'Service juridique':role));
 const action=el('span','sg-dg-toggle','Directions');
 header.append(photo,info,action);node.append(header);
 const branches=el('div','sg-tree-branches');
 const official=el('a','sg-tree-official',code==='SJ'?'Page officielle du Service juridique ↗':'Page officielle DG '+code+' ↗');
 official.href=source;official.target='_blank';official.rel='noopener noreferrer';branches.append(official);
 for(const [direction,lead,unitNames] of SG_PE_ORG[code]||[]){
  const dir=el('section','sg-tree-direction');
  dir.append(el('div','sg-tree-dir-title',direction));
  if(lead){
   const director=el('div','sg-tree-dir-person'),label=el('div','sg-tree-dir-lead');
   const directorLink=el('a','sg-person-link',lead+' ↗');
   directorLink.href=source;directorLink.target='_blank';directorLink.rel='noopener noreferrer';
   directorLink.title='Ouvrir la page officielle de la DG '+code+' (pas une fiche personnelle)';
   label.append(directorLink);director.append(label);
   const portraitUrl=SG_PE_DIRECTION_PHOTOS[lead];
   if(portraitUrl){
    const img=el('img','sg-tree-direction-portrait');
    img.src=portraitUrl;img.alt='Portrait de '+lead;img.width=108;img.height=108;
    img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
    img.onerror=()=>img.remove();director.append(img);
   }
   dir.append(director);
  }
  const items=el('ul','sg-tree-units');
  for(const unit of unitNames.split(';'))items.append(el('li','',unit));
  dir.append(items);branches.append(dir);
 }
 node.append(branches);return node;
}
function sgDrawOrg(query){
 const board=$('sgOrgGrid');board.replaceChildren();
 const leaders=SG_PE_DATA.slice(0,3),entries=SG_PE_DATA.slice(3);
 const matching=entries.filter(x=>!query||norm(x.slice(0,3).join(' ')).includes(query)||norm((SG_PE_ORG[x[0]]||[]).map(y=>y.join(' ')).join(' ')).includes(query));
 const topMatch=leaders.some(x=>norm(x.slice(0,3).join(' ')).includes(query));
 $('sgOrgSection').hidden=!!query&&!matching.length&&!topMatch;
 if($('sgOrgSection').hidden)return;
 const leaderPortrait=(name)=>{
  const wrap=el('span','sg-leader-portrait'),url=SG_PE_PHOTOS[name];
  if(name==='Alessandro Chiocchetti')wrap.classList.add('sg-portrait-chiocchetti');
  if(name==='Markus Winkler')wrap.classList.add('sg-portrait-winkler');
  if(name==='Anders Rasmussen')wrap.classList.add('sg-portrait-rasmussen');
  if(url){
   const img=el('img');img.src=url;img.alt='Portrait de '+name;img.loading='lazy';img.decoding='async';
   if(url.startsWith('http'))img.referrerPolicy='no-referrer';
   img.onerror=()=>{img.remove();wrap.append(el('span','sg-leader-photo-fallback','Photo indisponible'))};
   wrap.append(img);
  }else wrap.append(el('span','sg-leader-photo-fallback','Photo indisponible'));
  return wrap;
 };
 const root=el('div','sg-tree-root');
 const sgLink=el('a','sg-tree-person-link',leaders[0][1]+' ↗');
 sgLink.href=leaders[0][3];sgLink.target='_blank';sgLink.rel='noopener noreferrer';
 root.append(leaderPortrait(leaders[0][1]),el('strong','','Secrétaire général'),sgLink);board.append(root);
 board.append(el('div','sg-tree-trunk'));
 const deputies=el('div','sg-tree-deputies');
 for(const person of leaders.slice(1,3)){
  const node=el('div','sg-tree-deputy');
  const link=el('a','sg-person-link',person[1]+' ↗');
  link.href=person[3];link.target='_blank';link.rel='noopener noreferrer';
  node.append(leaderPortrait(person[1]),el('strong','','Secrétaire général adjoint'),link);deputies.append(node);
 }
 board.append(deputies,el('div','sg-tree-trunk'),el('div','sg-tree-caption','Directions générales et Service juridique'));
 const grid=el('div','sg-tree-grid');
 for(const x of matching){
  const node=sgOrgCard(x);
  // Les détails restent fermés sauf quand une recherche cible une de leurs directions.
  if(query&&!norm(x.slice(0,3).join(' ')).includes(query))node.open=true;
  grid.append(node);
 }
 board.append(grid);
}
function sgCard([code,name,role,source]){
 const card=el('article','card'),portrait=el('div','portrait'),info=el('div','info');
 const imageUrl=SG_PE_PHOTOS[name];
 if(imageUrl){
  const img=el('img');img.src=imageUrl;img.alt='Portrait de '+name;img.loading=(code==='SG'||code==='SG adjoint')?'eager':'lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  img.onerror=()=>{if(img.isConnected)img.replaceWith(el('div','sg-photo-fallback','Photo non disponible'))};
  portrait.append(img);
 }else portrait.append(el('div','sg-photo-fallback','Photo non disponible'));
 const codeLabel=el('span','sg-code',code==='SG'||code==='SG adjoint'||code==='SJ'?code:'DG '+code),nameLabel=el('a','name sg-person-link',name);
 nameLabel.href=source;nameLabel.target='_blank';nameLabel.rel='noopener noreferrer';nameLabel.title='Ouvrir la page officielle du Parlement européen';
 const roleLabel=el('p','sg-role',role),link=el('a','official sg-official',code==='SG'||code==='SG adjoint'?'Fiche officielle ↗':'Page officielle ↗');
 link.href=source;link.target='_blank';link.rel='noopener noreferrer';
 const photoLink=el('a','portrait-link sg-portrait-link');photoLink.href=source;photoLink.target='_blank';photoLink.rel='noopener noreferrer';photoLink.title='Ouvrir la page officielle de '+name;photoLink.append(portrait);
 info.append(codeLabel,nameLabel,roleLabel,link);card.append(photoLink,info);return card;
}
function sgRender(){
 const query=norm($('sgSearch').value.trim());
 sgDrawOrg(query);
}
$('sgSearch').addEventListener('input',sgRender);sgRender();
function showSecretariat(changeUrl=true){
 if(session)endSession(true);
 if(directoryObserver)directoryObserver.disconnect();
 $('secretariatPanel').hidden=false;$('filters').hidden=true;$('count').hidden=true;
 $('directory').hidden=true;$('training').hidden=true;
 for(const id of ['directoryTab','trainingTab']){$(id).classList.remove('active');$(id).setAttribute('aria-pressed','false')}
 document.querySelectorAll('.directories a').forEach(a=>a.removeAttribute('aria-current'));
 const mobileGroups=$('mobileGroups');if(mobileGroups){mobileGroups.open=false;mobileGroups.classList.remove('active');$('mobileGroupsSummary').textContent='Groupes politiques'}
 $('secretariatNav').setAttribute('aria-current','page');
 $('mobileSecretariatNav').setAttribute('aria-current','page');$('mobileInstitutionsSummary').classList.add('selected');
 document.body.classList.remove('group-view');
 for(const [key,val] of Object.entries({'--group-primary':'#003399','--group-accent':'#ffcc00','--group-soft':'#f3f6f8'}))document.documentElement.style.setProperty(key,val);
 $('identityLogo').hidden=false;$('identityLogo').src='./assets/parlement-logo.png';
 $('identityLogo').alt='Parlement européen';$('identityText').hidden=true;
 $('identityTitle').textContent='Secrétariat général';
 $('identityBrand').textContent='ADMINISTRATION';$('identityBrand').hidden=false;
 $('identitySubtitle').textContent='Organisation et responsables administratifs.';$('identitySubtitle').hidden=false;
 $('headerStats').hidden=true;
 $('offlineManager').hidden=false;
 if(changeUrl)history.pushState({section:'secretariat'},'',new URL('?section=secretariat',location.href));
}
$('secretariatNav').addEventListener('click',event=>{event.preventDefault();showSecretariat()});
$('mobileSecretariatNav').addEventListener('click',event=>{event.preventDefault();$('mobileInstitutions').open=false;showSecretariat()});
window.addEventListener('popstate',()=>{
 if(new URLSearchParams(location.search).get('section')==='secretariat')showSecretariat(false);
 else mode(false);
});
