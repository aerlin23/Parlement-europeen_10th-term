'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/directory-night-contrast.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const expected=['.hemicycle-row[data-city="bru"]','.hemicycle-row[data-city="str"]','.committee-tag','.country','.group-label','.committee-heading','#vfNightToggle'];
for(const name of expected)assert.ok(css.includes(name),'Night accessibility rule absent: '+name);
assert.ok(!/\bhtml:not\(\.vf-night\)/.test(css),'Night-specific CSS modifies light mode');
assert.ok(css.includes('html.vf-night body'),'Missing theme scoping');
assert.ok(html.includes('css/directory-night-contrast.css?v=374'),'Night theme not loaded');
assert.ok(sw.includes('css/directory-night-contrast.css?v=374'),'Night theme not available in offline cache');
function luminance(hex){
 const normalized=hex.length===4?'#'+[...hex.slice(1)].map(c=>c+c).join(''):hex;
 const values=normalized.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
 return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722;
}
function contrast(a,b){const l=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (l[0]+0.05)/(l[1]+0.05)}
for(const [fg,bg,desc] of [
 ['#f6f9ff','#24364c','Member name'],
 ['#e2edff','#24364c','Country and seat labels'],
 ['#f5f9ff','#354e6b','Committee chip'],
 ['#513c0a','#f5e8bf','Brussels number'],
 ['#153968','#e7effe','Strasbourg number'],
 ['#fff','#244364','Night mode toggle']
])assert.ok(contrast(fg,bg)>=4.5,desc+' contrast below WCAG AA');
console.log('PASS: CSS is night-scoped, precached and palette passes WCAG AA text contrast');

// Régression de thème sur la page Contacts utiles.
const contacts=fs.readFileSync(path.join(root,'contacts-personnels.html'),'utf8');
assert.ok(contacts.includes('<html lang="fr">'),'Contacts starts in light mode');
assert.ok(!contacts.includes('<html lang="fr" class="vf-night">'),'Contacts forces dark theme');
assert.ok(contacts.includes("key='vf-night-theme'"),'Shared theme storage missing');
assert.ok(contacts.includes("classList.toggle('vf-night',dark)"),'Toggle missing');
assert.ok(contacts.includes("b.id='vfNightToggle'"),'Floating theme button missing');
assert.ok(!contacts.includes('prefers-color-scheme: dark'),'Auto dark theme must not be used');
assert.ok(contacts.includes('Choisir un fichier'),'File selection label missing');
assert.ok(!contacts.includes('appareil partagé'),'Shared device wording must be absent');
assert.ok(contacts.includes('<details id="setup" open>'),'Collapsible import missing');
assert.ok(contacts.includes("padding-bottom:100px"),'Bottom button clearance missing');
assert.ok(contacts.includes('css/shared-theme-toggle.css'),'Shared theme CSS missing');

for(const [foreground,background,label] of [
 ['#e5edf8','#111c2c','Contacts body'],
 ['#e5edf8','#1c2b40','Contacts cards'],
 ['#acd0f7','#1c2b40','Contacts links'],
 ['#ffffff','#25446b','Contacts file picker'],
 ['#a0b3c7','#1c2b40','Contacts muted labels']
])assert.ok(contrast(foreground,background)>=4.5,label+' contrast below WCAG AA');
console.log('PASS: Contacts theme structure and dark palette WCAG AA checks');

// L'import doit rester visible sans annuaire et migrer sous l'engrenage dès le chargement.
assert.ok(contacts.includes("$('settingsPanel').prepend($('setup'))"),'Loaded contacts import should be accessible only via settings');
assert.ok(contacts.includes("grid-template-columns:78px minmax(0,1fr)"),'Aligned BRU/STR columns missing');
const activePwaVersion=sw.match(/const VERSION='pe-pwa-v(\d+)'/);
assert.ok(activePwaVersion && Number(activePwaVersion[1])>=380,'Contacts UI update should refresh offline cache');

// Contrôles statiques : l'identité des groupes et les commissions ne changent qu'en mode nuit.
for(const group of ['PPE','S%26D','PfE','ECR','Renew','Verts%2FALE','The%20Left','ESN','NI'])assert.ok(css.includes('group='+group),'Night group color missing: '+group);
for(const selector of ['.committee-leadership .leader-row','.committee-leadership .leader-entry a','.committee-leadership .leader-note'])assert.ok(css.includes(selector),'Night committee panel contrast missing: '+selector);
assert.ok(css.includes('html.vf-night body main .directories > a.group-nav-item'),'Night group rule not theme scoped');

assert.ok(contacts.includes('class="contact-settings-cog"'),'Contacts slim cog icon missing');
assert.ok(contacts.includes('aria-label="Paramètres de l’annuaire"'),'Contacts settings accessible name missing');
assert.ok(contacts.includes("b.id='vfNightToggle'"),'Contacts floating theme toggle removed');

// v376 : le correctif clair ne doit pas toucher au rendu du mode nuit.
const stylesV376=fs.readFileSync('styles.css','utf8');
const featuresV376=fs.readFileSync('features.js','utf8');
assert.ok(stylesV376.includes('html:not(.vf-night) body dialog.vf-cavalier-dialog'),'Light-only Mobile Print modal override missing');
assert.ok(stylesV376.includes('color-scheme:light!important'),'Native dark dialog not overridden in light mode');
assert.ok(stylesV376.includes('button.vf-mobile-print-send'),'Primary print button override missing');
assert.ok(featuresV376.includes("send.className='vf-mobile-print-send'"),'Print button selector missing');
assert.ok(sw.includes('./styles.css?v=376')&&sw.includes('./features.js?v=376'),'Updated styles and scripts not cached');

// Le thème de l'annuaire officiel ne dépend plus des anciennes clés preview.
assert.ok(!html.includes("if(!personal&&!root.matches('.vf-tools-preview,.vf-tools-mobile-preview'))return"),'Night toggle is still restricted to preview installations');
assert.ok(html.includes("b.id='vfNightToggle'"),'Official Vademecum theme control absent');

const interfaceSource=fs.readFileSync(path.join(root,'interface.js'),'utf8');
assert.ok(interfaceSource.includes("link.href='./index.html'"),'Dynamic logo must always return to Vademecum home');
assert.ok(!interfaceSource.includes("link.target=theme?'':'_blank'"),'External logo target still restored by interface');
assert.ok(html.includes('class="ep-logo" href="./index.html"'),'Official logo still links to external site');
const currentInterfaceVersion=html.match(/<script src="\.\/interface\.js\?v=(\d+)" defer><\/script>/);
assert.ok(currentInterfaceVersion && sw.includes("'./interface.js?v="+currentInterfaceVersion[1]+"'"),'Navigation script version differs between page and offline cache');

const editorSource=fs.readFileSync(path.join(root,'creation-cavaliers-editor-preview.js'),'utf8');
const previewHTML=fs.readFileSync(path.join(root,'creation-cavaliers-preview.html'),'utf8');
assert.ok(editorSource.includes('function groupDuplicateCavaliers()'),'Identical cavalier grouping missing');
assert.ok(editorSource.includes('entries[i].hidden=!open'),'Duplicate cards must collapse visually');
assert.ok(editorSource.includes("groupDuplicateCavaliers();document.dispatchEvent(new Event('vf-cavaliers-ready'))"),'PDF regeneration event missing after grouping');
assert.ok(previewHTML.includes('creation-cavaliers-editor-preview.js?v=380'),'Editor grouping cache version not updated');
assert.ok(sw.includes('creation-cavaliers-editor-preview.js?v=380'),'Offline grouping script not cached');

const assistantV380=fs.readFileSync(path.join(root,'cavaliers-assistant-preview.js'),'utf8');
assert.ok(assistantV380.includes('window.vfDownloadCavalierGroup=async'),'Group PDF export API missing');
assert.ok(editorSource.includes("exportPDF.className='duplicate-export'"),'Group export button missing');
assert.ok(previewHTML.includes('cavaliers-assistant-preview.js?v=395'),'Group exporter not refreshed');
assert.ok(sw.includes('./cavaliers-assistant-preview.js?v=395'),'Group exporter not precached');
