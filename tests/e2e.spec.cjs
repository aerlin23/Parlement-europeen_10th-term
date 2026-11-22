const {test,expect}=require('@playwright/test');
test('accueil et recherche : données parlementaires',async({page})=>{
 await page.goto('/index.html');
 await expect(page.locator('#search')).toBeVisible();
 await expect.poll(()=>page.locator('#grid > *').count()).toBeGreaterThan(0);
 await page.locator('#search').fill('AALTOLA');
 await expect(page.locator('#grid')).toContainText(/AALTOLA/i);
});
test('quiz de reconnaissance : une session démarre',async({page})=>{
 await page.goto('/index.html');
 await expect.poll(()=>page.locator('#grid > *').count()).toBeGreaterThan(0);
 await page.locator('#trainingTab').click();
 await expect(page.locator('#startStudy')).toBeEnabled();
 await page.locator('#startStudy').click();
 await expect(page.locator('#studySession')).toBeVisible();
 await expect(page.locator('#quizChoices').locator('button').first()).toBeVisible();
});
test('hémicycles : ouverture et bascule Bruxelles / Strasbourg',async({page})=>{
 await page.goto('/index.html');
 await expect.poll(()=>page.locator('#grid > *').count()).toBeGreaterThan(0);
 await page.locator('#openHemicycle').click();
 const dialog=page.locator('.seat-map-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('.seat-map-canvas')).toBeVisible();
 await dialog.locator('.seat-city-button[data-city="bru"]').click();
 await expect(dialog).toHaveAttribute('data-city','bru');
 await page.screenshot({path:'test-results/hemicycle-bruxelles-'+test.info().project.name+'.png'});
 await dialog.locator('.seat-city-button[data-city="str"]').click();
 await expect(dialog).toHaveAttribute('data-city','str');
 // Captures produites pour une revue humaine des deux plans, pas une validation visuelle automatique.
 await page.screenshot({path:'test-results/hemicycle-strasbourg-'+test.info().project.name+'.png'});
});
test('contacts : import local non transmis au serveur',async({page})=>{
 await page.goto('/contacts-personnels.html');
 await expect(page.locator('#file')).toBeVisible();
 const payload=JSON.stringify({Unité:[['Contact de test','1234','']],Services:[['Service de test','5678','']]});
 await page.locator('#file').setInputFiles({name:'contacts-test.json',mimeType:'application/json',buffer:Buffer.from(payload)});
 await expect(page.locator('#review')).toBeVisible();
 await page.getByRole('button',{name:/Remplacer les catégories par les données JSON/i}).click();
 await expect(page.locator('#directory')).toBeVisible();
 await expect(page.locator('#results')).toContainText(/Contact de test|Service de test/);
});
test('PWA : accueil et annuaire accessibles hors ligne après installation',async({page,context,browserName})=>{
 await page.goto('/index.html');
 await expect.poll(()=>page.locator('#grid > *').count()).toBeGreaterThan(0);
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;if(!registration.active)throw Error('Service worker absent');});
 await expect.poll(async()=>page.evaluate(async()=>{const keys=await caches.keys();return keys.some(k=>/pe-pwa-v\d+-core/.test(k))})).toBe(true);
 await context.setOffline(true);
 try{
  if(browserName==='webkit'){
   // Playwright WebKit crashes on an offline hard reload; verify the installed
   // cache and its content without misrepresenting this as a navigation test.
   const cached=await page.evaluate(async()=>{
    const response=await caches.match('./index.html',{ignoreSearch:true});
    return response?.ok && (await response.text()).includes('id="search"');
   });
   expect(cached).toBe(true);
  }else{
   await page.reload({waitUntil:'domcontentloaded'});
   await expect(page.locator('#search')).toBeVisible();
   await expect.poll(()=>page.locator('#grid > *').count()).toBeGreaterThan(0);
  }
 }finally{await context.setOffline(false)}
});

test('assistant cavaliers : génération et téléchargement PDF',async({page})=>{
 await page.goto('/creation-cavaliers.html');
 await page.locator('#paste').fill('Xénia|Horsliste-Testunique');
 await page.locator('#import').click();
 await expect(page.locator('.preview svg').first()).toBeVisible();
 await expect.poll(async()=>{
  const disabled=await page.locator('#downloadMobilePdf').isDisabled();
  const status=await page.locator('#mobilePdfStatus').textContent();
  if(status?.includes('Impossible de préparer'))throw Error('PDF error: '+status);
  return disabled;
 },{timeout:15000}).toBe(false);
 // Le bouton du panneau Mobile Print est masqué avant l'ouverture de l'aperçu.
 // Vérifier le PDF réellement créé, indépendamment de cette présentation.
 const pdf=await page.evaluate(async()=>{
  const file=window.vfCavalierPdf?.();
  if(!file)return null;
  const head=String.fromCharCode(...new Uint8Array(await file.slice(0,5).arrayBuffer()));
  return {name:file.name,size:file.size,type:file.type,head};
 });
 expect(pdf?.name).toMatch(/\.pdf$/i);
 expect(pdf?.type).toBe('application/pdf');
 expect(pdf?.head).toBe('%PDF-');
 expect(pdf?.size).toBeGreaterThan(200);
});

test('mode nuit : contraste des fiches de députés et retour au mode clair',async({page})=>{
 await page.goto('/index.html');
 await expect.poll(()=>page.locator('#grid > .card').count()).toBeGreaterThan(0);
 const cssLink=page.locator('link[href*="directory-night-contrast.css"]');
 await expect(cssLink).toHaveCount(1);
 const lightColor=await page.locator('#directory .card .country').first().evaluate(el=>getComputedStyle(el).color);
 await page.evaluate(()=>document.documentElement.classList.add('vf-night'));
 const readStyle=async selector=>page.locator(selector).first().evaluate(el=>{
  const style=getComputedStyle(el);return {color:style.color,background:style.backgroundColor};
 });
 const country=await readStyle('#directory .card .country');
 const committee=await readStyle('#directory .card .committee-tag');
 const seat=await readStyle('#directory .card .hemicycle-row[data-city="bru"]');
 expect(country.color).toBe('rgb(226, 237, 255)');
 expect(committee.color).toBe('rgb(245, 249, 255)');
 expect(committee.background).toBe('rgb(53, 78, 107)');
 expect(seat.color).toBe('rgb(226, 237, 255)');
 const cards=page.locator('#directory .card');
 await expect(cards.first()).toHaveCSS('background-color','rgb(36, 54, 76)');
 await page.screenshot({path:'test-results/night-directory-'+test.info().project.name+'.png'});
 await page.evaluate(()=>document.documentElement.classList.remove('vf-night'));
 await expect(page.locator('#directory .card .country').first()).toHaveCSS('color',lightColor);
});

const isolationCases = {
  official: { path: '/', version: '379', contrast: './css/directory-night-contrast.css?v=374' },
  older: { path: '/preview-v362/', version: '362', contrast: null },
  tester: { path: '/preview-v364/', version: '364', contrast: './css/directory-night-contrast.css?v=364' }
};

for (const order of [['official', 'older', 'tester'], ['tester', 'older', 'official']]) {
  test('Coexistence PWA : ' + order.join(' → '), async ({ page, context, browserName, request }) => {
    test.setTimeout(180000);
    const cacheNames = new Map();
    for (const name of order) {
      const { path, version, contrast } = isolationCases[name];
      const route = path + 'index.html';
      const expected = await request.get(route);
      expect(expected.ok()).toBe(true);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Comparer le document effectivement servi, avant tout rechargement.
      expect(await response.text()).toBe(await expected.text());
      expect(await page.evaluate(() => document.querySelector('link[href*="directory-night-contrast"]')?.getAttribute('href') ?? null)).toBe(contrast);
      await page.waitForFunction(path => navigator.serviceWorker.controller?.scriptURL === new URL(path + 'sw.js', location.origin).href, path);
      const cacheName = await page.evaluate(async ({ path, version }) => {
        const prefix = path === '/' ? 'pe-pwa-v' + version + '-' : 'pe-preview-v' + version + '-';
        return (await caches.keys()).find(key => key.startsWith(prefix) && key.endsWith('-core'));
      }, { path, version });
      expect(cacheName).toBeTruthy();
      cacheNames.set(path, cacheName);
    }

    await page.goto('/home.html?person=256810#fiche', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/index\.html\?person=256810#fiche$/);
    await page.goto('/preview-v364/home.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/VERSION DE TEST v364 — reconnaissance/)).toBeVisible();
    await expect(page.getByText(/VERSION DE TEST v362/)).toHaveCount(0);
    await context.setOffline(true);
    try {
      for (const [path, name] of cacheNames) {
        const saved = await page.evaluate(async ({ path, name }) => {
          if (!(await caches.has(name))) return false;
          const cache = await caches.open(name);
          return (await cache.match(path + 'index.html'))?.ok && (await cache.match(path + 'members.json'))?.ok;
        }, { path, name });
        expect(saved).toBe(true);
        // Le rechargement hors ligne de WebKit plante sur le runner Playwright.
        if (browserName === 'chromium') {
          await page.goto(path + 'index.html', { waitUntil: 'domcontentloaded' });
          await expect(page.locator('#grid .card').first()).toBeVisible();
        }
      }
      if (browserName === 'chromium') {
        await page.goto('/preview-v364/home.html', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(/VERSION DE TEST v364 — reconnaissance/)).toBeVisible();
      }
    } finally {
      await context.setOffline(false);
    }
  });
}

test('Civilité et nom : PDF local, homonymes et original parlementaire',async({page})=>{
 await page.goto('/preview-v364/creation-cavaliers-preview.html');
 const archive=await page.evaluate(async()=>{
  const zip=new JSZip();
  const pdf=await PDFLib.PDFDocument.create();pdf.addPage();const bytes=await pdf.save();
  const entries=['A. TESTNOM','Louise EXEMPLE','Paul EXEMPLE'].map((title,i)=>{
   const id=String(i+1),file='pdf/'+id+'.pdf';
   zip.file(file,bytes);return {id,file,title,aliases:[title]};
  });
  zip.file('manifest.json',JSON.stringify({version:1,entries}));
  return zip.generateAsync({type:'base64'});
 });
 await page.getByLabel('Importer le ZIP indexé privé').setInputFiles({name:'test.zip',mimeType:'application/zip',buffer:Buffer.from(archive,'base64')});
 const generate=async value=>{await page.locator('#paste').fill(value);await page.locator('#import').click()};
 await generate('M. Testnom');
 await expect(page.locator('#readyCount')).toHaveText('1');
 await expect(page.locator('.official-cavalier-link')).toContainText('bibliothèque privée');
 await generate('Mme Exemple');
 await expect(page.locator('#readyCount')).toHaveText('0');
 await page.getByRole('button',{name:'Paul EXEMPLE',exact:true}).click();
 await expect(page.locator('.preview svg')).toHaveAttribute('data-private-id','3');
 await generate('M. Metsola');
 await expect(page.locator('.official-cavalier-link a')).toHaveAttribute('href',/cavaliers\/\d+\.pdf$/);
 await expect(page.locator('.entry-identity')).toContainText('Roberta METSOLA');
 await generate('M. Inconnaissable');
 await expect(page.locator('#readyCount')).toHaveText('0');
 await expect(page.locator('#print')).toBeDisabled();
});


test('contacts : thème manuel, zones tactiles et mise en page mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/contacts-personnels.html');
 const theme=page.locator('#vfNightToggle');
 await expect(theme).toBeVisible();
 await expect(page.locator('html')).not.toHaveClass(/vf-night/);
 await expect(page.locator('#setup')).toHaveAttribute('open','');
 await expect(page.getByText('Choisir un fichier')).toBeVisible();
 await page.screenshot({path:'test-results/contacts-390-light-'+test.info().project.name+'.png',fullPage:true});
 await theme.click();
 await expect(page.locator('html')).toHaveClass(/vf-night/);
 await page.screenshot({path:'test-results/contacts-390-dark-'+test.info().project.name+'.png',fullPage:true});
 await page.reload();
 await expect(page.locator('html')).toHaveClass(/vf-night/);
 await page.locator('#vfNightToggle').click();
 await expect(page.locator('html')).not.toHaveClass(/vf-night/);
 const payload=JSON.stringify({Unité:[['Contact exemple','1234','']],Services:[['Service exemple','5678','']]});
 await page.locator('#file').setInputFiles({name:'contacts.json',mimeType:'application/json',buffer:Buffer.from(payload)});
 await page.getByRole('button',{name:/Remplacer les catégories par les données JSON/i}).click();
 await expect(page.locator('#setup')).not.toHaveAttribute('open','');
 for(const width of [360,390,1280]){
  await page.setViewportSize({width,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});
 const last=page.locator('#results article').last();
 await last.scrollIntoViewIfNeeded();
 const hit=await page.evaluate(()=>{
  const last=[...document.querySelectorAll('#results article')].at(-1);
  const toggle=document.getElementById('vfNightToggle');
  if(!last||!toggle)return false;
  const a=last.getBoundingClientRect(),b=toggle.getBoundingClientRect();
  return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 });
 expect(hit).toBe(false);
});


test('contacts : BRU/STR alignés et import dans les paramètres',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/contacts-personnels.html');
 await expect(page.locator('#setup')).toBeVisible();
 const payload=JSON.stringify({Unité:[['Secrétariat de l’unité','41023','74650'],['Autre personne','41234','76543']]});
 await page.locator('#file').setInputFiles({name:'contacts.json',mimeType:'application/json',buffer:Buffer.from(payload)});
 await page.getByRole('button',{name:/Remplacer les catégories par les données JSON/i}).click();
 await expect(page.locator('#directory')).toBeVisible();
 await expect(page.locator('#setup')).toBeHidden();
 await page.locator('#settingsToggle').click();
 await expect(page.locator('#setup')).toBeVisible();
 await expect(page.locator('#setup')).not.toHaveAttribute('open','');
 await page.locator('#setup > summary').click();
 await expect(page.locator('#file')).toBeVisible();
 await page.locator('#settingsToggle').click();
 await page.locator('#results .contact-expand-toggle').first().click();
 const rows=page.locator('#results .person-row.contact-open .phone-entry:has(.phone-kind)');
 await expect(rows).toHaveCount(2);
 const bounds=await rows.evaluateAll(list=>list.map(el=>{const title=el.querySelector('.phone-kind').getBoundingClientRect(),phone=el.querySelector('a').getBoundingClientRect();return {labelX:title.x,phoneX:phone.x}}));
 expect(Math.abs(bounds[0].labelX-bounds[1].labelX)).toBeLessThan(2);
 expect(Math.abs(bounds[0].phoneX-bounds[1].phoneX)).toBeLessThan(2);
});


test('contacts : engrenage épuré et thème flottant distinct',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/contacts-personnels.html');
 const gear=page.getByRole('button',{name:'Paramètres de l’annuaire'});
 const theme=page.locator('#vfNightToggle');
 await expect(gear).toBeVisible();
 await expect(gear.locator('svg.contact-settings-cog')).toBeVisible();
 await expect(theme).toBeVisible();
 const positions=await page.evaluate(()=>{
  const gear=document.getElementById('settingsToggle').getBoundingClientRect();
  const theme=document.getElementById('vfNightToggle').getBoundingClientRect();
  return {gearY:gear.y,themeY:theme.y,overlap:gear.left<theme.right&&gear.right>theme.left&&gear.top<theme.bottom&&gear.bottom>theme.top};
 });
 expect(positions.overlap).toBe(false);
 expect(positions.gearY).toBeLessThan(positions.themeY);
 await theme.click();
 await expect(page.locator('html')).toHaveClass(/vf-night/);
 await page.reload();
 await expect(page.locator('html')).toHaveClass(/vf-night/);
 await page.locator('#vfNightToggle').click();
 await expect(page.locator('html')).not.toHaveClass(/vf-night/);
 await expect(gear).toHaveAttribute('aria-expanded','false');
});


test('cavalier Mobile Print : fenêtre claire en mode jour et nuit préservée',async({page})=>{
 await page.goto('/index.html');
 await page.evaluate(()=>{localStorage.setItem('vf-night-theme','light');document.documentElement.classList.remove('vf-night')});
 await page.evaluate(()=>{
  const d=document.createElement('dialog');d.className='vf-cavalier-dialog';d.innerHTML='<div class="vf-cavalier-bar"><strong>Cavalier — TEST</strong><button>×</button></div><div><button class="vf-mobile-print-send">Imprimer via Mobile Print</button><a href="#">Voir le cavalier (PDF)</a><small>Choisissez votre messagerie</small></div>';
  document.body.append(d);d.showModal();
 });
 const styles=()=>page.locator('dialog.vf-cavalier-dialog').evaluate(d=>{
   const bg=getComputedStyle(d),title=getComputedStyle(d.querySelector('strong')),send=getComputedStyle(d.querySelector('.vf-mobile-print-send')),a=getComputedStyle(d.querySelector('a'));
   return {background:bg.backgroundColor,scheme:bg.colorScheme,title:title.color,sendBackground:send.backgroundColor,sendText:send.color,link:a.color};
 });
 const light=await styles();
 expect(light.background).toBe('rgb(255, 255, 255)');
 expect(light.scheme).toBe('light');
 expect(light.title).toBe('rgb(34, 55, 70)');
 expect(light.sendBackground).toBe('rgb(37, 75, 120)');
 expect(light.sendText).toBe('rgb(255, 255, 255)');
 expect(light.link).toBe('rgb(37, 75, 120)');
 await page.evaluate(()=>document.documentElement.classList.add('vf-night'));
 const dark=await styles();
 // Le mode nuit avait déjà son fond sombre ; le correctif ne doit pas le blanchir.
 expect(dark.background).toBe('rgb(28, 43, 64)');
 await page.locator('dialog.vf-cavalier-dialog').evaluate(d=>d.close());
});


test('thème officiel : iPhone/WebKit et Android peuvent choisir mode jour ou nuit',async({page})=>{
  // Sans ancienne préférence : le bouton doit être présent même sur un nouvel iPhone.
  await page.goto('/index.html');
  await page.evaluate(()=>{localStorage.removeItem('vf-night-theme');localStorage.removeItem('vf-tools-preview-2026');localStorage.removeItem('vf-tools-mobile-preview-2026')});
  await page.reload();
  const toggle=page.locator('#vfNightToggle');
  await expect(toggle).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/vf-night/);
  await expect(toggle).toHaveAttribute('aria-label','Mode nuit');
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/vf-night/);
  await expect(toggle).toHaveAttribute('aria-label','Mode clair');
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/vf-night/);
  await toggle.click();
  await expect(page.locator('html')).not.toHaveClass(/vf-night/);
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/vf-night/);
  await expect(toggle).toHaveAttribute('aria-label','Mode nuit');
});


test('logo du Parlement : retour interne au Vademecum sans site externe',async({page})=>{
 await page.goto('/index.html');
 const logo=page.locator('header .ep-logo');
 await expect(logo).toHaveAttribute('href','./index.html');
 await expect(logo).not.toHaveAttribute('target','_blank');
 await page.locator('#group').selectOption('S&D');
 await expect(logo).toHaveAttribute('href','./index.html');
 await logo.click();
 await expect(page).toHaveURL(/\/index\.html$/);
 await expect(logo).toHaveAttribute('href','./index.html');
 await expect(page.locator('#group')).toHaveValue('');
});


test('cavaliers identiques : cartes regroupées, quantités et PDF préservés',async({page})=>{
 await page.goto('/creation-cavaliers.html');
 await page.locator('#paste').fill(['Commission|Européenne','Commission|Européenne','Commission|Européenne','Autre|Exemple'].join(String.fromCharCode(10)));
 await page.locator('#import').click();
 await expect(page.locator('#readyCount')).toHaveText('4');
 await expect(page.locator('#entries .compact-entry')).toHaveCount(4);
 await expect(page.locator('#entries .compact-entry:visible')).toHaveCount(2);
 await expect(page.locator('#entries .duplicate-count')).toHaveText('× 3 exemplaires');
 await expect(page.locator('#entries .preview > svg')).toHaveCount(4);
 await page.getByRole('button',{name:'Ajouter un exemplaire de Commission EUROPÉENNE'}).click();
 await expect(page.locator('#readyCount')).toHaveText('5');
 await expect(page.locator('#entries .compact-entry:visible')).toHaveCount(2);
 await expect(page.locator('#entries .duplicate-count')).toHaveText('× 4 exemplaires');
 await expect(page.locator('#entries .preview > svg')).toHaveCount(5);
 await page.getByRole('button',{name:'Voir les exemplaires'}).click();
 await expect(page.locator('#entries .compact-entry:visible')).toHaveCount(5);
 await page.getByRole('button',{name:'Masquer les exemplaires'}).click();
 await expect(page.locator('#entries .compact-entry:visible')).toHaveCount(2);
 await page.getByRole('button',{name:'Retirer un exemplaire de Commission EUROPÉENNE'}).click();
 await expect(page.locator('#readyCount')).toHaveText('4');
 await expect(page.locator('#entries .duplicate-count')).toHaveText('× 3 exemplaires');
 await expect(page.locator('#entries .preview > svg')).toHaveCount(4);
});
