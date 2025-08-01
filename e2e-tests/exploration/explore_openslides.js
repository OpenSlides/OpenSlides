const { chromium } = require('playwright');

async function exploreOpenSlides() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--ignore-certificate-errors', '--ignore-ssl-errors', '--disable-web-security']
  });
  
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  try {
    console.log('1. Navigating to OpenSlides...');
    await page.goto('https://localhost:8000', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    console.log('2. Filling login form...');
    await page.fill('input[formControlName="username"]', 'admin');
    await page.fill('input[formControlName="password"]', 'admin');
    
    console.log('3. Clicking login...');
    await page.click('button[type="submit"]');
    
    console.log('4. Waiting for dashboard...');
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    console.log('Current Title:', await page.title());
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/after-login.png' });
    
    // Find all clickable navigation elements
    const navElements = await page.locator('a[href], button[routerLink], [routerLink]').all();
    console.log(`Found ${navElements.length} navigation elements`);
    
    // Extract navigation information
    for (let i = 0; i < Math.min(navElements.length, 20); i++) {
      try {
        const element = navElements[i];
        const text = await element.textContent();
        const href = await element.getAttribute('href') || await element.getAttribute('routerLink');
        if (text && text.trim() && href) {
          console.log(`Nav ${i+1}: "${text.trim()}" -> ${href}`);
        }
      } catch (e) {
        // Skip problematic elements
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

exploreOpenSlides();