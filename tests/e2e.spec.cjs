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
  official: { path: '/', version: '363', contrast: './css/directory-night-contrast.css?v=363' },
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
