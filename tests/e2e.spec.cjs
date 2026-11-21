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
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#downloadMobilePdf').click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
});
