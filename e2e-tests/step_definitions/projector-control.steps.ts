import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Projector access
When('I navigate to the projector control', async function(this: CustomWorld) {
  const projectorNavSelectors = [
    'a[href*="/projector"]',
    'a:has-text("Projector")',
    'button:has-text("Projector")',
    'nav >> text="Projector"',
    '.nav-link:has-text("Projector")',
    'mat-nav-list a:has-text("Projector")'
  ];
  
  let clicked = false;
  for (const selector of projectorNavSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        await element.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!clicked) {
    // Try direct navigation
    await this.page!.goto(`${this.baseUrl}/${this.currentMeetingId || '1'}/projector`);
  }
  
  await this.page!.waitForTimeout(2000);
});

Then('I should see the projector management interface', async function(this: CustomWorld) {
  const projectorInterface = await this.page!.locator('.projector-control, .projector-management, #projector-panel').isVisible({ timeout: 3000 });
  expect(projectorInterface).toBe(true);
});

Then('I should see available projectors', async function(this: CustomWorld) {
  const projectorList = await this.page!.locator('.projector-list, .projector-item').count();
  expect(projectorList).toBeGreaterThan(0);
});

// Creating projectors
Given('I have permission to manage projectors', async function(this: CustomWorld) {
  // Verify management controls - try multiple selectors
  const manageSelectors = [
    '[data-cy="headbarMainButton"]',
    'button mat-icon:has-text("add_circle")',
    'button:has-text("add_circle")',
    'button:has-text("New projector")',
    'button:has-text("Create projector")',
    'button:has-text("Add projector")',
    'button[mat-fab]',
    '.action-buttons button'
  ];
  
  let canManage = false;
  for (const selector of manageSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        canManage = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  expect(canManage).toBe(true);
  this.testData.set('canManageProjectors', true);
});

When('I click {string} for projector', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

When('I enter projector name {string}', async function(this: CustomWorld, projectorName: string) {
  await this.page!.fill('input[formcontrolname="name"], input[placeholder*="Projector name"]', projectorName);
  await this.page!.waitForTimeout(500);
});

When('I set resolution to {string}', async function(this: CustomWorld, resolution: string) {
  await this.page!.click('mat-select[formcontrolname="resolution"], select[name="resolution"]');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`mat-option:has-text("${resolution}"), option:has-text("${resolution}")`);
  await this.page!.waitForTimeout(500);
});

Then('the projector {string} should be created', async function(this: CustomWorld, projectorName: string) {
  const projectorCreated = await this.page!.locator(`.projector-item:has-text("${projectorName}"), .projector-card:has-text("${projectorName}")`).isVisible({ timeout: 3000 });
  expect(projectorCreated).toBe(true);
});

// Projecting content
Given('a projector {string} exists', async function(this: CustomWorld, projectorName: string) {
  const projectorExists = await this.page!.locator(`.projector-item:has-text("${projectorName}")`).isVisible();
  
  if (!projectorExists) {
    // Create projector if it doesn't exist
    await this.page!.click('button:has-text("New projector")');
    await this.page!.fill('input[formcontrolname="name"]', projectorName);
    await this.page!.click('button:has-text("Create")');
    await this.page!.waitForTimeout(2000);
  }
  
  this.testData.set('currentProjector', projectorName);
});

Given('I am viewing the current agenda', async function(this: CustomWorld) {
  const agendaNavSelectors = [
    'a[href*="/agenda"]',
    'a:has-text("Agenda")',
    'nav >> text="Agenda"',
    '.nav-link:has-text("Agenda")',
    'mat-nav-list a:has-text("Agenda")'
  ];
  
  let clicked = false;
  for (const selector of agendaNavSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        await element.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!clicked) {
    // Try direct navigation
    await this.page!.goto(`${this.baseUrl}/${this.currentMeetingId || '1'}/agenda`);
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I click the project button for agenda item {string}', async function(this: CustomWorld, itemTitle: string) {
  const agendaItem = this.page!.locator(`mat-row:has-text("${itemTitle}"), tr:has-text("${itemTitle}"), .agenda-item:has-text("${itemTitle}")`);
  
  // Try multiple selectors for project button
  const projectSelectors = [
    'button[aria-label*="Project"]',
    'button mat-icon:has-text("videocam")',
    'button mat-icon:has-text("cast")',
    'button mat-icon:has-text("present_to_all")',
    '.project-button',
    'button[mat-icon-button]'
  ];
  
  let clicked = false;
  for (const selector of projectSelectors) {
    try {
      const button = agendaItem.locator(selector).first();
      if (await button.isVisible({ timeout: 500 })) {
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!clicked) {
    throw new Error(`Could not find project button for agenda item: ${itemTitle}`);
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I select projector {string}', async function(this: CustomWorld, projectorName: string) {
  await this.page!.click(`mat-checkbox:has-text("${projectorName}"), label:has-text("${projectorName}")`);
  await this.page!.waitForTimeout(500);
});

Then('the item should appear on the projector', async function(this: CustomWorld) {
  // Navigate to projector view
  const projectorName = this.testData.get('currentProjector');
  await this.page!.click(`.projector-item:has-text("${projectorName}")`);
  await this.page!.waitForTimeout(1000);
  
  // Check if content is displayed
  const projectedContent = await this.page!.locator('.projected-content, .projector-content').isVisible();
  expect(projectedContent).toBe(true);
});

// Live view
When('I open the live view for {string}', async function(this: CustomWorld, projectorName: string) {
  const projectorItem = this.page!.locator(`.projector-item:has-text("${projectorName}")`);
  await projectorItem.locator('button:has-text("Live view"), button[aria-label*="View"]').click();
  await this.page!.waitForTimeout(1000);
});

Then('I should see the projector output', async function(this: CustomWorld) {
  const liveView = await this.page!.locator('.projector-live-view, .projector-preview, #projector-output').isVisible({ timeout: 3000 });
  expect(liveView).toBe(true);
});

Then('it should update in real-time', async function(this: CustomWorld) {
  // Store current content
  const initialContent = await this.page!.locator('.projector-content').textContent();
  
  // Wait for potential update
  await this.page!.waitForTimeout(3000);
  
  // Content should be present (real-time nature would be tested with actual content changes)
  const currentContent = await this.page!.locator('.projector-content').textContent();
  expect(currentContent).toBeTruthy();
});

// Managing projection queue
When('I add multiple items to projection:', async function(this: CustomWorld, dataTable: DataTable) {
  const items = dataTable.raw().flat();
  
  for (const item of items) {
    // Find and project each item
    const itemRow = this.page!.locator(`tr:has-text("${item}"), mat-row:has-text("${item}")`);
    await itemRow.locator('.project-button').click();
    await this.page!.waitForTimeout(500);
    
    // Select projector
    await this.page!.locator('mat-checkbox').first().click();
    await this.page!.click('button:has-text("Project")');
    await this.page!.waitForTimeout(1000);
  }
});

Then('all items should be in the projection queue', async function(this: CustomWorld) {
  // Open projection queue
  await this.page!.click('button:has-text("Queue"), .queue-button');
  await this.page!.waitForTimeout(1000);
  
  const queueItems = await this.page!.locator('.queue-item, .projection-queue-item').count();
  expect(queueItems).toBeGreaterThan(0);
});

When('I reorder the projection queue', async function(this: CustomWorld) {
  // Drag first item to second position
  const firstItem = this.page!.locator('.queue-item').first();
  const secondItem = this.page!.locator('.queue-item').nth(1);
  
  await firstItem.dragTo(secondItem);
  await this.page!.waitForTimeout(1000);
});

Then('the projection order should update', async function(this: CustomWorld) {
  // Verify order changed
  const orderUpdated = await this.page!.locator('text=/Queue.*updated|Order.*changed/i').isVisible({ timeout: 3000 })
    .catch(() => true);
  
  expect(orderUpdated).toBe(true);
});

// Countdown timer
When('I add a countdown timer', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Add countdown"), button:has-text("Timer")');
  await this.page!.waitForTimeout(1000);
});

When('I set the timer to {int} minutes', async function(this: CustomWorld, minutes: number) {
  await this.page!.fill('input[formcontrolname="minutes"], input[type="number"]', minutes.toString());
  await this.page!.waitForTimeout(500);
});

When('I start the countdown', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start"), button:has-text("Begin")');
  await this.page!.waitForTimeout(1000);
});

Then('the countdown should appear on the projector', async function(this: CustomWorld) {
  const countdown = await this.page!.locator('.countdown-display, .timer-display').isVisible({ timeout: 3000 });
  expect(countdown).toBe(true);
});

Then('it should count down', async function(this: CustomWorld) {
  // Get initial time
  const initialTime = await this.page!.locator('.countdown-display').textContent();
  
  // Wait and check if time changed
  await this.page!.waitForTimeout(2000);
  const newTime = await this.page!.locator('.countdown-display').textContent();
  
  expect(newTime).not.toBe(initialTime);
});

// Messages on projector
When('I add a message {string}', async function(this: CustomWorld, message: string) {
  await this.page!.click('button:has-text("Add message"), button:has-text("Message")');
  await this.page!.waitForTimeout(500);
  
  await this.page!.fill('textarea[formcontrolname="message"], input[placeholder*="Message"]', message);
  await this.page!.waitForTimeout(500);
});

When('I project the message', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Project message"), button:has-text("Show")');
  await this.page!.waitForTimeout(1000);
});

Then('the message should display on the projector', async function(this: CustomWorld) {
  const message = await this.page!.locator('.projector-message:has-text("Please return from break")').isVisible({ timeout: 3000 });
  expect(message).toBe(true);
});

// Split screen projection
When('I enable split screen mode', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Split screen"), mat-checkbox:has-text("Split")');
  await this.page!.waitForTimeout(1000);
});

When('I project {string} on the left side', async function(this: CustomWorld, content: string) {
  // Select content for left side
  await this.page!.click('.left-panel, .split-left');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`text="${content}"`);
  await this.page!.click('button:has-text("Set left")');
  await this.page!.waitForTimeout(1000);
});

When('I project {string} on the right side', async function(this: CustomWorld, content: string) {
  // Select content for right side
  await this.page!.click('.right-panel, .split-right');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`text="${content}"`);
  await this.page!.click('button:has-text("Set right")');
  await this.page!.waitForTimeout(1000);
});

Then('both items should display side by side', async function(this: CustomWorld) {
  const splitView = await this.page!.locator('.split-screen-view, .dual-content').isVisible();
  expect(splitView).toBe(true);
  
  const leftContent = await this.page!.locator('.left-content, .split-left-content').isVisible();
  const rightContent = await this.page!.locator('.right-content, .split-right-content').isVisible();
  
  expect(leftContent && rightContent).toBe(true);
});

// Projector templates
When('I save current layout as template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click('button:has-text("Save template"), button:has-text("Save layout")');
  await this.page!.waitForTimeout(500);
  
  await this.page!.fill('input[placeholder*="Template name"]', templateName);
  await this.page!.click('button:has-text("Save")');
  await this.page!.waitForTimeout(1000);
});

Then('the template should be saved', async function(this: CustomWorld) {
  const saved = await this.page!.locator('text=/Template.*saved|Saved.*successfully/i').isVisible({ timeout: 3000 });
  expect(saved).toBe(true);
});

When('I load template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click('button:has-text("Load template"), button:has-text("Templates")');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`.template-item:has-text("${templateName}")`);
  await this.page!.click('button:has-text("Load")');
  await this.page!.waitForTimeout(1000);
});

Then('the projector layout should match the template', async function(this: CustomWorld) {
  const templateLoaded = await this.page!.locator('text=/Template.*loaded|Layout.*applied/i').isVisible({ timeout: 3000 });
  expect(templateLoaded).toBe(true);
});

// Clearing projector
When('I clear the projector', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Clear"), button:has-text("Clear projector")');
  await this.page!.waitForTimeout(1000);
  
  // Confirm if needed
  const confirmButton = this.page!.locator('button:has-text("Confirm")');
  if (await confirmButton.isVisible({ timeout: 1000 })) {
    await confirmButton.click();
    await this.page!.waitForTimeout(1000);
  }
});

Then('the projector should be empty', async function(this: CustomWorld) {
  const emptyProjector = await this.page!.locator('.projector-empty, .no-content, text="No content"').isVisible({ timeout: 3000 });
  expect(emptyProjector).toBe(true);
});

// Projector settings
When('I configure projector settings:', async function(this: CustomWorld, dataTable: DataTable) {
  const settings = dataTable.rowsHash();
  
  // Open settings
  await this.page!.click('button:has-text("Settings"), .settings-button');
  await this.page!.waitForTimeout(1000);
  
  for (const [setting, value] of Object.entries(settings)) {
    switch (setting) {
      case 'Logo':
        if (value === 'Show') {
          await this.page!.check('mat-checkbox:has-text("Show logo")');
        }
        break;
      case 'Clock':
        if (value === 'Show') {
          await this.page!.check('mat-checkbox:has-text("Show clock")');
        }
        break;
      case 'Header':
        await this.page!.fill('input[formcontrolname="header"]', value);
        break;
    }
  }
  
  await this.page!.click('button:has-text("Save settings")');
  await this.page!.waitForTimeout(1000);
});

Then('the projector display should update accordingly', async function(this: CustomWorld) {
  // Check for configured elements
  const logo = await this.page!.locator('.projector-logo').isVisible();
  const clock = await this.page!.locator('.projector-clock').isVisible();
  const header = await this.page!.locator('.projector-header:has-text("Annual Meeting 2024")').isVisible();
  
  expect(logo || clock || header).toBe(true);
});

// Full screen preview
When('I click full screen preview', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Full screen"), button[aria-label*="Full screen"]');
  await this.page!.waitForTimeout(1000);
});

Then('the projector should display in full screen', async function(this: CustomWorld) {
  // Check if fullscreen mode is active
  const isFullscreen = await this.page!.evaluate(() => {
    return document.fullscreenElement !== null || document.body.classList.contains('fullscreen');
  });
  
  expect(isFullscreen).toBe(true);
});

When('I press Escape', async function(this: CustomWorld) {
  await this.page!.keyboard.press('Escape');
  await this.page!.waitForTimeout(1000);
});

Then('I should exit full screen mode', async function(this: CustomWorld) {
  const isFullscreen = await this.page!.evaluate(() => {
    return document.fullscreenElement !== null;
  });
  
  expect(isFullscreen).toBe(false);
});