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
assert.ok(html.includes('css/directory-night-contrast.css?v=363'),'Night theme not loaded');
assert.ok(sw.includes('css/directory-night-contrast.css?v=363'),'Night theme not available in offline cache');
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
assert.ok(sw.includes("const VERSION='pe-pwa-v373'"),'Contacts UI update should refresh offline cache');
