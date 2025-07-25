const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    ignoreHTTPSErrors: true,
    args: ['--ignore-certificate-errors', '--ignore-ssl-errors']
  });
  const page = await browser.newPage();

  try {
    console.log('Navigating to OpenSlides...');
    await page.goto('https://localhost:8000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Login
    console.log('Logging in...');
    await page.fill('input[formControlName="username"]', 'admin');
    await page.fill('input[formControlName="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go to first meeting
    console.log('Entering meeting...');
    await page.click('text=OpenSlides Demo');
    await page.waitForTimeout(3000);

    // Go to Settings
    console.log('Opening Settings...');
    await page.click('text=Settings');
    await page.waitForTimeout(2000);

    // === EXPLORE EACH SETTINGS SECTION ===
    const settingsSections = [
      'General',
      'Agenda', 
      'List of speakers',
      'Motions',
      'Elections',
      'Participants',
      'Livestream',
      'Export',
      'Custom translations'
    ];

    for (const section of settingsSections) {
      console.log(`=== EXPLORING ${section.toUpperCase()} SETTINGS ===`);
      try {
        // Click on the section
        await page.click(`text=${section}`);
        await page.waitForTimeout(2000);
        
        // Take screenshot
        const filename = section.toLowerCase().replace(/\s+/g, '-');
        await page.screenshot({ path: `/tmp/settings-${filename}.png` });
        
        console.log(`Captured ${section} settings`);
      } catch (error) {
        console.log(`Could not access ${section} settings:`, error.message);
      }
    }

    // === EXPLORE INDIVIDUAL SETTING DIALOGS ===
    console.log('=== EXPLORING SETTING CONFIGURATION DIALOGS ===');
    
    // Go to General settings and try to find configurable options
    await page.click('text=General');
    await page.waitForTimeout(2000);
    
    // Look for any editable settings or configuration buttons
    const configButtons = await page.$$('button:has-text("Edit"), button:has-text("Configure"), .setting-edit, [matTooltip*="edit"]');
    if (configButtons.length > 0) {
      console.log('Found configurable settings, opening first one');
      await configButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/setting-edit-dialog.png' });
      
      // Close dialog
      const closeButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), [aria-label="Close"]');
      if (closeButtons.length > 0) {
        await closeButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE LIVESTREAM SETTINGS ===
    console.log('=== EXPLORING LIVESTREAM CONFIGURATION ===');
    await page.click('text=Livestream');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/livestream-detailed.png' });

    // === EXPLORE EXPORT SETTINGS ===
    console.log('=== EXPLORING EXPORT CONFIGURATION ===');
    await page.click('text=Export');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/export-detailed.png' });

    console.log('Settings exploration completed!');

  } catch (error) {
    console.error('Error during settings exploration:', error);
  } finally {
    await browser.close();
  }
})();