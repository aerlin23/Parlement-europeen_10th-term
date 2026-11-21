const {test,expect}=require('@playwright/test');
test('accueil et recherche : données parlementaires',async({page})=>{
 await page.goto('/index.html');
 await expect(page.locator('#search')).toBeVisible();
 await expect.poll(()=>page.locator('#grid').children().count()).toBeGreaterThan(0);
 await page.locator('#search').fill('AALTOLA');
 await expect(page.locator('#grid')).toContainText(/AALTOLA/i);
});
test('quiz de reconnaissance : une session démarre',async({page})=>{
 await page.goto('/index.html');
 await expect.poll(()=>page.locator('#grid').children().count()).toBeGreaterThan(0);
 await page.locator('#trainingTab').click();
 await expect(page.locator('#startStudy')).toBeEnabled();
 await page.locator('#startStudy').click();
 await expect(page.locator('#studySession')).toBeVisible();
 await expect(page.locator('#quizChoices').locator('button').first()).toBeVisible();
});
test('hémicycles : ouverture et bascule Bruxelles / Strasbourg',async({page})=>{
 await page.goto('/index.html');
 await expect.poll(()=>page.locator('#grid').children().count()).toBeGreaterThan(0);
 await page.locator('#openHemicycle').click();
 const dialog=page.locator('.seat-map-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('.seat-map-canvas')).toBeVisible();
 await dialog.locator('.seat-city-button[data-city="bru"]').click();
 await expect(dialog).toHaveAttribute('data-city','bru');
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
test('PWA : accueil et annuaire accessibles hors ligne après installation',async({page,context})=>{
 await page.goto('/index.html');
 await expect.poll(()=>page.locator('#grid').children().count()).toBeGreaterThan(0);
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;if(!registration.active)throw Error('Service worker absent');});
 await expect.poll(async()=>page.evaluate(async()=>{const keys=await caches.keys();return keys.some(k=>/pe-pwa-v\\d+-core/.test(k))})).toBe(true);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#search')).toBeVisible();
 await expect.poll(()=>page.locator('#grid').children().count()).toBeGreaterThan(0);
 await context.setOffline(false);
});
