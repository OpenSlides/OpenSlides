import { chromium } from '@playwright/test';

/**
 * Global setup for e2e tests
 * Ensures system is ready before tests start
 */
async function globalSetup() {
  console.log('Starting global setup...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  try {
    // Wait for system to be ready
    console.log('Checking if OpenSlides is ready...');
    
    let retries = 30; // 30 seconds total
    let systemReady = false;
    
    while (retries > 0 && !systemReady) {
      try {
        const response = await page.goto('https://localhost:8000/login', {
          waitUntil: 'domcontentloaded',
          timeout: 5000
        });
        
        if (response && response.ok()) {
          // Check if Angular is loaded
          await page.waitForFunction(
            () => !!(window as any).getAllAngularTestabilities,
            { timeout: 5000 }
          );
          
          systemReady = true;
          console.log('OpenSlides is ready!');
        }
      } catch (error) {
        console.log(`Waiting for system... (${retries} retries left)`);
        await page.waitForTimeout(1000);
        retries--;
      }
    }
    
    if (!systemReady) {
      throw new Error('OpenSlides system is not ready. Please ensure the development environment is running.');
    }
    
    // Pre-warm the system with a login
    console.log('Pre-warming system with login...');
    await page.goto('https://localhost:8000/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('System pre-warmed successfully');
    
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('Global setup completed');
}

export default globalSetup;