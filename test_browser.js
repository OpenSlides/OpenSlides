const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--ignore-certificate-errors']
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  await page.goto('https://localhost:8000');
  
  // Wait for user to interact
  await page.waitForTimeout(300000); // 5 minutes
  
  await browser.close();
})();