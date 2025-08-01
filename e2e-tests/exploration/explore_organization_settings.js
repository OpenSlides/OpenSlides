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

    // === EXPLORE ORGANIZATION LEVEL SETTINGS ===
    console.log('=== EXPLORING ORGANIZATION LEVEL SETTINGS ===');
    
    // Try to go to organization settings/accounts
    const orgLinks = await page.$$(':text("Accounts"), :text("Organization"), .organization-link, [href*="accounts"]');
    if (orgLinks.length > 0) {
      console.log('Opening organization/accounts page');
      await orgLinks[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/organization-accounts.png' });
      
      // Look for different organization sections
      const orgSections = await page.$$(':text("Meetings"), :text("Committees"), :text("Users"), :text("Tags"), :text("Designs")');
      for (let i = 0; i < Math.min(orgSections.length, 5); i++) {
        console.log(`Exploring organization section ${i + 1}`);
        await orgSections[i].click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `/tmp/organization-section-${i + 1}.png` });
      }
    }

    // === EXPLORE GLOBAL SETTINGS AND CONFIGURATIONS ===
    console.log('=== EXPLORING GLOBAL CONFIGURATIONS ===');
    
    // Look for system/global settings
    const settingsLinks = await page.$$(':text("Settings"), .settings-link, [href*="settings"]');
    if (settingsLinks.length > 0) {
      console.log('Opening global settings');
      await settingsLinks[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/global-settings-overview.png' });
    }

    // === EXPLORE COMMITTEE AND ORGANIZATIONAL STRUCTURE ===
    console.log('=== EXPLORING COMMITTEE MANAGEMENT ===');
    
    const committeeLinks = await page.$$(':text("Committees"), .committee-link, [data-cy="committees"]');
    if (committeeLinks.length > 0) {
      console.log('Opening committees section');
      await committeeLinks[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/committees-management.png' });
      
      // Try to create/manage committee
      const createButtons = await page.$$('button:has-text("Create"), button[matTooltip*="Create"], .add-button');
      if (createButtons.length > 0) {
        console.log('Opening committee creation dialog');
        await createButtons[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/committee-creation-dialog.png' });
        
        // Close dialog
        const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel")');
        if (cancelButtons.length > 0) {
          await cancelButtons[0].click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // === EXPLORE USER MANAGEMENT AT ORGANIZATION LEVEL ===
    console.log('=== EXPLORING ORGANIZATION USER MANAGEMENT ===');
    
    const userLinks = await page.$$(':text("Users"), .user-link, [href*="users"]');
    if (userLinks.length > 0) {
      console.log('Opening organization users');
      await userLinks[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/organization-users.png' });
    }

    // === EXPLORE SYSTEM ADMINISTRATION ===
    console.log('=== EXPLORING SYSTEM ADMINISTRATION ===');
    
    const adminLinks = await page.$$(':text("Administration"), :text("System"), .admin-link');
    if (adminLinks.length > 0) {
      console.log('Opening system administration');
      await adminLinks[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/system-administration.png' });
    }

    console.log('Organization-level exploration completed!');

  } catch (error) {
    console.error('Error during exploration:', error);
  } finally {
    await browser.close();
  }
})();