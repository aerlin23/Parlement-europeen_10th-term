'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const offline=fs.readFileSync(path.join(root,'offline.js'),'utf8');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
const version=sw.match(/const VERSION='pe-pwa-v(\d+)'/);
assert.ok(version && Number(version[1])>=357,'Missing or outdated PWA version');
assert.ok(sw.includes('const ESSENTIAL='),'No critical offline precache');
assert.ok(sw.includes('await cache.addAll([...new Set(ESSENTIAL)]'),'Critical resources not precached');
assert.ok(sw.includes('Promise.allSettled'),'Secondary resource failures must not prevent the install');
for(const f of ['index.html','members.json','committees.json','coordinators.json','changes.json']){
 assert.ok(sw.includes("'./"+f+"'"),'Missing core cache resource '+f);
 assert.ok(fs.existsSync(path.join(root,f)),'Missing local core file '+f);
}
assert.ok(sw.includes('vf-document-libraries-v2') && offline.includes('vf-document-libraries-v2'),'Document cache names differ');
for(const uri of ['xlsx-0.20.3','pdf-lib@1.17.1','jszip@3.10.1','pdfjs-dist@3.11.174','pdfjs-dist@4.10.38']){
 assert.ok(sw.includes(uri)&&offline.includes(uri),'Document library mismatch '+uri);
}
assert.ok(sw.includes("if(saved)return saved"),'Cached document libraries not prioritized');
assert.ok(offline.includes('if(applying)reloadOnce();else displayUpdate()'),'Unsolicited SW activation can interrupt user work');
assert.ok(sw.includes('INSTITUTION_PHOTO_HOSTS')&&sw.includes("request.destination==='image'"),'Institution photos are not cached by the service worker');
assert.ok(offline.includes("fetch('./institutions-agences.html'")&&offline.includes('urls.push(...portraits)'),'Institution portraits are not included in offline media download');
assert.ok(page.includes('downloadOffline'),'Offline download action missing');
console.log('PASS: offline core, cache resources, libraries and non-disruptive updates');
