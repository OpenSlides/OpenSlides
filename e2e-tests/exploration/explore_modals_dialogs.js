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

    // === EXPLORE AGENDA ITEM CREATION DIALOG ===
    console.log('=== EXPLORING AGENDA ITEM CREATION ===');
    await page.click('text=Agenda');
    await page.waitForTimeout(2000);
    
    // Try to find create button
    const createButtons = await page.$$('button[matTooltip*="Create"], button[matTooltip*="New"], button:has-text("Create"), .create-button, button[aria-label*="Create"]');
    if (createButtons.length > 0) {
      console.log('Opening create agenda item dialog');
      await createButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/create-agenda-item-dialog.png' });
      
      // Close dialog
      const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), button:has-text("Close")');
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE MOTION CREATION DIALOG ===
    console.log('=== EXPLORING MOTION CREATION ===');
    await page.click('text=Motions');
    await page.waitForTimeout(2000);
    
    // Try to create new motion
    const motionCreateButtons = await page.$$('button[matTooltip*="Create"], button[matTooltip*="New"], button:has-text("Create"), .create-button');
    if (motionCreateButtons.length > 0) {
      console.log('Opening create motion dialog');
      await motionCreateButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/create-motion-dialog.png' });
      
      // Close dialog
      const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), button:has-text("Close")');
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE PARTICIPANT CREATION DIALOG ===
    console.log('=== EXPLORING PARTICIPANT CREATION ===');
    await page.click('text=Participants');
    await page.waitForTimeout(2000);
    
    // Try to create new participant
    const participantCreateButtons = await page.$$('button[matTooltip*="Create"], button[matTooltip*="New"], button:has-text("Create"), .create-button');
    if (participantCreateButtons.length > 0) {
      console.log('Opening create participant dialog');
      await participantCreateButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/create-participant-dialog.png' });
      
      // Close dialog
      const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), button:has-text("Close")');
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE ELECTION CREATION DIALOG ===
    console.log('=== EXPLORING ELECTION CREATION ===');
    await page.click('text=Elections');
    await page.waitForTimeout(2000);
    
    // Try to create new election
    const electionCreateButtons = await page.$$('button[matTooltip*="Create"], button[matTooltip*="New"], button:has-text("Create"), .create-button');
    if (electionCreateButtons.length > 0) {
      console.log('Opening create election dialog');
      await electionCreateButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/create-election-dialog.png' });
      
      // Close dialog
      const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), button:has-text("Close")');
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE FILE UPLOAD DIALOG ===
    console.log('=== EXPLORING FILE UPLOAD ===');
    await page.click('text=Files');
    await page.waitForTimeout(2000);
    
    // Try to upload file
    const fileUploadButtons = await page.$$('button[matTooltip*="Upload"], button:has-text("Upload"), input[type="file"], .upload-button');
    if (fileUploadButtons.length > 0) {
      console.log('Opening file upload dialog');
      await fileUploadButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/file-upload-dialog.png' });
      
      // Close dialog if it opened one
      const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), button:has-text("Close")');
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE PROJECTOR CONTROLS ===
    console.log('=== EXPLORING PROJECTOR CONTROLS ===');
    await page.click('text=Projector');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/projector-interface.png' });

    // Look for projection dialogs or controls
    const projectorButtons = await page.$$('button[matTooltip*="Project"], button:has-text("Project"), .project-button, .projector-control');
    if (projectorButtons.length > 0) {
      console.log('Opening projector control dialog');
      await projectorButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/projector-control-dialog.png' });
    }

    // === EXPLORE CHAT GROUP MANAGEMENT ===
    console.log('=== EXPLORING CHAT GROUP MANAGEMENT ===');
    await page.click('text=Chat');
    await page.waitForTimeout(2000);
    
    // Try to create chat group
    const chatGroupButtons = await page.$$('button[matTooltip*="group"], button:has-text("New group"), .create-group');
    if (chatGroupButtons.length > 0) {
      console.log('Opening create chat group dialog');
      await chatGroupButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/create-chat-group-dialog.png' });
      
      // Close dialog
      const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), button:has-text("Close")');
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE IMPORT/EXPORT DIALOGS ===
    console.log('=== EXPLORING IMPORT/EXPORT DIALOGS ===');
    
    // Go back to participants for import
    await page.click('text=Participants');
    await page.waitForTimeout(2000);
    
    // Look for import/export buttons
    const importButtons = await page.$$('button[matTooltip*="Import"], button:has-text("Import"), .import-button');
    if (importButtons.length > 0) {
      console.log('Opening import dialog');
      await importButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/import-dialog.png' });
      
      // Close dialog
      const cancelButtons = await page.$$('button[mat-dialog-close], button:has-text("Cancel"), button:has-text("Close")');
      if (cancelButtons.length > 0) {
        await cancelButtons[0].click();
        await page.waitForTimeout(1000);
      }
    }

    // === EXPLORE USER PROFILE/ACCOUNT MENU ===
    console.log('=== EXPLORING USER PROFILE MENU ===');
    
    // Click on user profile in header
    const userMenuButtons = await page.$$('button[aria-label*="User"], .user-menu, button:has-text("Administrator")');
    if (userMenuButtons.length > 0) {
      console.log('Opening user profile menu');
      await userMenuButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/user-profile-menu.png' });
    }

    console.log('Modal and dialog exploration completed!');

  } catch (error) {
    console.error('Error during exploration:', error);
  } finally {
    await browser.close();
  }
})();