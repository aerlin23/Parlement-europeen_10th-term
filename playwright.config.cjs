const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests',testMatch:'e2e.spec.cjs',timeout:60000,expect:{timeout:20000},
 retries:process.env.CI?1:0,workers:process.env.CI?2:undefined,
 reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',serviceWorkers:'allow'},
 projects:[
  {name:'chromium-desktop',use:{...devices['Desktop Chrome']}},
  {name:'chromium-mobile',use:{...devices['Pixel 7']}},
  {name:'webkit-mobile',use:{...devices['iPhone 13']}}
 ],
 webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1',url:'http://127.0.0.1:4173/index.html',timeout:30000,reuseExistingServer:!process.env.CI}
});
