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

    // === EXPLORE SETTINGS SUB-PAGES ===
    console.log('=== EXPLORING SETTINGS SUB-PAGES ===');
    await page.click('text=Settings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/settings-main.png' });

    // Look for settings navigation or tabs
    const settingsTabs = await page.$$('mat-tab-label, .settings-nav, [role="tab"]');
    console.log(`Found ${settingsTabs.length} settings sections`);

    // Click on different settings sections
    const settingsNavigation = await page.$$('text="General", text="Agenda", text="Motions", text="Elections", text="Participants"');
    if (settingsNavigation.length > 0) {
      for (let i = 0; i < Math.min(settingsNavigation.length, 5); i++) {
        console.log(`Clicking settings section ${i + 1}`);
        await settingsNavigation[i].click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `/tmp/settings-section-${i + 1}.png` });
      }
    }

    // === EXPLORE AGENDA ITEM DETAILED VIEW ===
    console.log('=== EXPLORING AGENDA DETAILED VIEWS ===');
    await page.click('text=Agenda');
    await page.waitForTimeout(2000);

    // Try to find and click on an agenda item
    const agendaItems = await page.$$('.agenda-item, [data-cy="agenda-item"]');
    if (agendaItems.length > 0) {
      console.log('Opening first agenda item details');
      await agendaItems[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/agenda-item-detail.png' });

      // Look for edit button or detailed view
      const editButtons = await page.$$('button[matTooltip*="Edit"], button:has-text("Edit"), .edit-button');
      if (editButtons.length > 0) {
        console.log('Opening agenda item edit dialog');
        await editButtons[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/agenda-item-edit-dialog.png' });
        
        // Close dialog
        const closeButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), [aria-label="Close"]');
        if (closeButtons.length > 0) {
          await closeButtons[0].click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // === EXPLORE MOTIONS DETAILED VIEWS ===
    console.log('=== EXPLORING MOTIONS DETAILED VIEWS ===');
    await page.click('text=Motions');
    await page.waitForTimeout(2000);

    // Try to find and click on a motion
    const motions = await page.$$('.motion-card, .motion-item, [data-cy="motion"]');
    if (motions.length > 0) {
      console.log('Opening first motion details');
      await motions[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/motion-detail-view.png' });

      // Look for amendment or workflow buttons
      const workflowButtons = await page.$$('button:has-text("Submit"), button:has-text("Accept"), button:has-text("Reject")');
      if (workflowButtons.length > 0) {
        console.log('Found workflow buttons');
        await page.screenshot({ path: '/tmp/motion-workflow-controls.png' });
      }

      // Look for amendment creation
      const amendmentButtons = await page.$$('button:has-text("Amendment"), button[matTooltip*="amendment"]');
      if (amendmentButtons.length > 0) {
        console.log('Opening amendment dialog');
        await amendmentButtons[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/motion-amendment-dialog.png' });
        
        // Close dialog
        const closeButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel")');
        if (closeButtons.length > 0) {
          await closeButtons[0].click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // === EXPLORE PARTICIPANTS DETAILED MANAGEMENT ===
    console.log('=== EXPLORING PARTICIPANTS DETAILED VIEWS ===');
    await page.click('text=Participants');
    await page.waitForTimeout(2000);

    // Try to find participant details
    const participants = await page.$$('.participant-card, .user-card, [data-cy="participant"]');
    if (participants.length > 0) {
      console.log('Opening participant details');
      await participants[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/participant-detail-view.png' });
    }

    // Look for group management
    const groupButtons = await page.$$('text="Groups", button:has-text("Groups"), .groups-tab');
    if (groupButtons.length > 0) {
      console.log('Opening groups management');
      await groupButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/participants-groups.png' });

      // Try to create a new group
      const createGroupButtons = await page.$$('button[matTooltip*="group"], button:has-text("New group"), .create-group');
      if (createGroupButtons.length > 0) {
        console.log('Opening create group dialog');
        await createGroupButtons[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/create-group-dialog.png' });
        
        // Close dialog
        const closeButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel")');
        if (closeButtons.length > 0) {
          await closeButtons[0].click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // === EXPLORE FILES DETAILED MANAGEMENT ===
    console.log('=== EXPLORING FILES DETAILED VIEWS ===');
    await page.click('text=Files');
    await page.waitForTimeout(2000);

    // Try file upload
    const uploadButtons = await page.$$('button:has-text("Upload"), input[type="file"], .upload-button');
    if (uploadButtons.length > 0) {
      console.log('Found file upload interface');
      await page.screenshot({ path: '/tmp/files-upload-interface.png' });
    }

    // Look for file organization (folders, etc.)
    const folderButtons = await page.$$('button:has-text("Folder"), .folder-button, .create-folder');
    if (folderButtons.length > 0) {
      console.log('Opening folder creation');
      await folderButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/create-folder-dialog.png' });
      
      // Close dialog
      const closeButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel")');
      if (closeButtons.length > 0) {
        await closeButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE PROJECTOR DETAILED VIEWS ===
    console.log('=== EXPLORING PROJECTOR DETAILED VIEWS ===');
    await page.click('text=Projector');
    await page.waitForTimeout(2000);

    // Try to find projector controls
    const projectorControls = await page.$$('.projector-control, button:has-text("Project"), .projection-button');
    if (projectorControls.length > 0) {
      console.log('Found projector controls');
      await page.screenshot({ path: '/tmp/projector-controls.png' });
    }

    // Look for projection preview
    const projectionPreview = await page.$$('.projection-preview, .projector-preview, iframe');
    if (projectionPreview.length > 0) {
      console.log('Found projection preview');
      await page.screenshot({ path: '/tmp/projector-preview.png' });
    }

    // === EXPLORE ORGANIZATION SETTINGS ===
    console.log('=== EXPLORING ORGANIZATION SETTINGS ===');
    await page.click('text=Dashboard');
    await page.waitForTimeout(2000);
    
    // Go to organization settings
    const orgSettingsButtons = await page.$$('text="Settings", .settings-button');
    if (orgSettingsButtons.length > 0) {
      console.log('Opening organization settings');
      await orgSettingsButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/organization-settings.png' });
    }

    console.log('Detailed UI exploration completed!');

  } catch (error) {
    console.error('Error during exploration:', error);
  } finally {
    await browser.close();
  }
})();