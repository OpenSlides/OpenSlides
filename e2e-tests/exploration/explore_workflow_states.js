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

    // === EXPLORE MOTION WORKFLOW STATES ===
    console.log('=== EXPLORING MOTION WORKFLOW STATES ===');
    await page.click('text=Motions');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/motions-overview.png' });

    // Try to click on a specific motion to see details
    const motionItems = await page.$$('.motion-card, .motion-item, [data-cy="motion"], .tile');
    if (motionItems.length > 0) {
      console.log('Opening first motion details');
      await motionItems[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/motion-detail-workflow.png' });

      // Look for workflow action buttons
      const workflowButtons = await page.$$('button:has-text("Submit"), button:has-text("Accept"), button:has-text("Reject"), button:has-text("Recommend"), .workflow-button');
      if (workflowButtons.length > 0) {
        console.log(`Found ${workflowButtons.length} workflow buttons`);
        await page.screenshot({ path: '/tmp/motion-workflow-buttons.png' });
      }

      // Look for amendment buttons
      const amendmentButtons = await page.$$('button:has-text("Amendment"), button[matTooltip*="amendment"]');
      if (amendmentButtons.length > 0) {
        console.log('Found amendment options');
        await amendmentButtons[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/amendment-creation.png' });
        
        // Close dialog
        const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel")');
        if (cancelButtons.length > 0) {
          await cancelButtons[0].click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // === EXPLORE PARTICIPANT DETAILED MANAGEMENT ===
    console.log('=== EXPLORING PARTICIPANT DETAILED MANAGEMENT ===');
    await page.click('text=Participants');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/participants-overview.png' });

    // Try to click on a participant to see details
    const participantItems = await page.$$('.participant-card, .user-card, .participant-row, .tile');
    if (participantItems.length > 0) {
      console.log('Opening participant details');
      await participantItems[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/participant-detail-view.png' });
    }

    // Look for participant management tabs/sections
    const participantTabs = await page.$$('mat-tab-label, .tab-label, :text("Users"), :text("Groups"), :text("Permissions")');
    for (let i = 0; i < Math.min(participantTabs.length, 3); i++) {
      console.log(`Exploring participant section ${i + 1}`);
      await participantTabs[i].click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `/tmp/participants-section-${i + 1}.png` });
    }

    // === EXPLORE AGENDA ITEM DETAILED MANAGEMENT ===
    console.log('=== EXPLORING AGENDA DETAILED MANAGEMENT ===');
    await page.click('text=Agenda');
    await page.waitForTimeout(2000);

    // Try to click on an agenda item
    const agendaItems = await page.$$('.agenda-item, .agenda-row, [data-cy="agenda-item"], .tile');
    if (agendaItems.length > 0) {
      console.log('Opening agenda item details');
      await agendaItems[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/agenda-item-detailed.png' });

      // Look for agenda item controls
      const agendaControls = await page.$$('button:has-text("Open"), button:has-text("Close"), button:has-text("Hidden"), .agenda-control');
      if (agendaControls.length > 0) {
        console.log('Found agenda item controls');
        await page.screenshot({ path: '/tmp/agenda-item-controls.png' });
      }
    }

    // === EXPLORE ORGANIZATION SETTINGS ===
    console.log('=== EXPLORING ORGANIZATION SETTINGS ===');
    await page.click('text=Dashboard');
    await page.waitForTimeout(2000);

    // Go to organization settings (if available)
    const settingsLinks = await page.$$(':text("Settings"), .settings-link, [href*="settings"]');
    if (settingsLinks.length > 0) {
      console.log('Opening organization settings');
      await settingsLinks[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/organization-settings-overview.png' });
    }

    // === EXPLORE COMMITTEE MANAGEMENT DETAILS ===
    console.log('=== EXPLORING COMMITTEE DETAILS ===');
    const committeeLinks = await page.$$(':text("Committees"), .committee-link');
    if (committeeLinks.length > 0) {
      console.log('Opening committees management');
      await committeeLinks[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/committees-detailed.png' });
    }

    console.log('Detailed workflow and management exploration completed!');

  } catch (error) {
    console.error('Error during exploration:', error);
  } finally {
    await browser.close();
  }
})();