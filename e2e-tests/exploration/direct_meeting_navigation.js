const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    ignoreHTTPSErrors: true,
    args: ['--ignore-certificate-errors', '--ignore-ssl-errors']
  });
  const page = await browser.newPage();

  try {
    console.log('=== DIRECT MEETING NAVIGATION ===');
    
    // Login
    console.log('Logging in...');
    await page.goto('https://localhost:8000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.fill('input[formControlName="username"]', 'admin');
    await page.fill('input[formControlName="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Try direct navigation to meeting
    console.log('Navigating directly to meeting...');
    await page.goto('https://localhost:8000/1', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/1')) {
      console.log('Successfully in meeting!');
      
      const meetingPages = [
        { name: 'home', path: '/home' },
        { name: 'autopilot', path: '/autopilot' }, 
        { name: 'agenda', path: '/agenda' },
        { name: 'motions', path: '/motions' },
        { name: 'elections', path: '/elections' },
        { name: 'participants', path: '/participants' },
        { name: 'files', path: '/files' },
        { name: 'projector', path: '/projector' },
        { name: 'history', path: '/history' },
        { name: 'settings', path: '/settings' },
        { name: 'chat', path: '/chat' }
      ];
      
      for (const pageDef of meetingPages) {
        try {
          console.log(`Exploring meeting ${pageDef.name} page...`);
          await page.goto(`https://localhost:8000/1${pageDef.path}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });
          await page.waitForTimeout(2000);
          
          // Take screenshot
          await page.screenshot({ path: `/tmp/meeting-${pageDef.name}.png` });
          
          // Get basic page info
          const title = await page.title();
          const pageText = await page.textContent('body');
          const hasContent = pageText && pageText.length > 100;
          
          console.log(`✓ ${pageDef.name}: ${title} - Content: ${hasContent ? 'Yes' : 'No'}`);
          
        } catch (error) {
          console.error(`Error exploring ${pageDef.name}:`, error.message);
        }
      }
      
    } else {
      console.log('Could not access meeting');
    }

  } catch (error) {
    console.error('Error during meeting exploration:', error);
  } finally {
    await browser.close();
  }
})();