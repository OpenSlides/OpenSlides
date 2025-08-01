const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    ignoreHTTPSErrors: true,
    args: ['--ignore-certificate-errors', '--ignore-ssl-errors']
  });
  const page = await browser.newPage();

  try {
    console.log('=== MEETING PAGES EXPLORATION ===');
    
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

    // Navigate to meetings
    console.log('Going to meetings page...');
    await page.goto('https://localhost:8000/meetings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/meetings-page-for-entry.png' });

    // Try to click on the meeting tile directly
    console.log('Looking for meeting to enter...');
    const meetingTile = await page.$('.tile, [data-cy="meetingListSingleMenuTrigger"]');
    if (meetingTile) {
      // Click on the meeting name/title area, not the menu
      const meetingLink = await page.$('text=OpenSlides Demo');
      if (meetingLink) {
        console.log('Clicking on meeting title...');
        await meetingLink.click();
        await page.waitForTimeout(3000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`Current URL after click: ${currentUrl}`);
        
        if (currentUrl.includes('/1/')) {
          console.log('Successfully entered meeting!');
          
          // Now explore meeting pages
          const meetingBaseUrl = currentUrl.split('/1/')[0] + '/1';
          console.log(`Meeting base URL: ${meetingBaseUrl}`);
          
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
              await page.goto(`${meetingBaseUrl}${pageDef.path}`, { 
                waitUntil: 'domcontentloaded',
                timeout: 15000 
              });
              await page.waitForTimeout(2000);
              await page.screenshot({ path: `/tmp/meeting-${pageDef.name}.png` });
              
              // Get page content info
              const title = await page.title();
              const url = page.url();
              console.log(`✓ ${pageDef.name}: ${title} (${url})`);
              
            } catch (error) {
              console.error(`Error exploring ${pageDef.name}:`, error.message);
            }
          }
          
        } else {
          console.log('Did not enter meeting, still on meetings page');
        }
        
      } else {
        console.log('Could not find meeting title link');
      }
    } else {
      console.log('Could not find meeting tile');
    }

  } catch (error) {
    console.error('Error during meeting exploration:', error);
  } finally {
    await browser.close();
  }
})();