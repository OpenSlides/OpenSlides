const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--ignore-certificate-errors', '--ignore-ssl-errors', '--allow-running-insecure-content']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('https://localhost:8000', { waitUntil: 'domcontentloaded' });
    console.log('Successfully navigated to OpenSlides');
    console.log('Page title:', await page.title());
    
    // Keep browser open for exploration
    await page.waitForTimeout(300000); // 5 minutes
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();