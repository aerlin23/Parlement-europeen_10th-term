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

test('testeur cavaliers : nom ambigu visible en rouge, non imprimable avant confirmation',async({page})=>{
 await page.goto('/creation-cavaliers-preview.html');
 await page.locator('#paste').fill('Jean robert van damme');
 await page.locator('#import').click();
 const card=page.locator('#entries .compact-entry.vf-pending');
 await expect(card).toHaveCount(1);
 await expect(card.locator('.pending-preview')).toContainText('À VÉRIFIER');
 await expect(card.locator('.pending-preview svg')).toBeVisible();
 await expect(card).toHaveCSS('border-top-color','rgb(180, 35, 50)');
 await expect(page.locator('#readyCount')).toHaveText('0');
 await expect(page.locator('#fixCount')).toHaveText('1');
 await expect(page.locator('#rejectedCount')).toHaveText('0');
 await expect(page.locator('#print')).toBeDisabled();
 await card.getByRole('button',{name:'Modifier'}).click();
 const fields=card.locator('.entry-fields input');
 await expect(fields.nth(0)).toHaveValue('Jean robert');
 await expect(fields.nth(1)).toHaveValue('van damme');
 await card.getByRole('button',{name:'Confirmer le cavalier'}).click();
 await expect(page.locator('#entries .vf-pending')).toHaveCount(0);
 await expect(page.locator('#readyCount')).toHaveText('1');
 await expect(page.locator('#print')).toBeEnabled();
 await expect(page.locator('#entries .preview svg')).toBeVisible();
});
