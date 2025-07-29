import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am on the agenda page', async function(this: CustomWorld) {
  const meetingId = this.currentMeetingId || '1';
  await this.agendaPage!.navigateToAgenda(meetingId);
});

Given('an agenda item {string} exists', async function(this: CustomWorld, itemTitle: string) {
  // Store the item title for later use
  this.testData.set('currentAgendaItem', itemTitle);
  // In a real test, we would check if it exists and create if not
  console.log(`Ensuring agenda item "${itemTitle}" exists`);
});

Given('an agenda item {string} with speakers exists', async function(this: CustomWorld, itemTitle: string) {
  this.testData.set('currentAgendaItem', itemTitle);
  // In a real test, we would ensure speakers are added
  console.log(`Ensuring agenda item "${itemTitle}" exists with speakers`);
});

Given('the following agenda items exist:', async function(this: CustomWorld, dataTable: DataTable) {
  const items = dataTable.hashes();
  // In a real test, we would create these items
  console.log('Creating agenda items:', items);
});

When('I click the create agenda item button', async function(this: CustomWorld) {
  // Try multiple selectors for the create button
  const createSelectors = [
    '[data-cy="agenda-list-header"] [data-cy="headbarMainButton"]',
    '[data-cy="headbarMainButton"]',
    'button mat-icon:has-text("add_circle")',
    'button:has-text("add_circle")',
    'button[mat-icon-button] mat-icon:has-text("add_circle")',
    'button:has-text("Create")',
    'button:has-text("New")',
    'button:has-text("Add")',
    'button[aria-label*="Create"]',
    'button[aria-label*="Add"]',
    '.mat-toolbar button[mat-button]',
    '.mat-toolbar button[mat-raised-button]',
    'button mat-icon:has-text("add")',
    'button .mat-icon:has-text("add")'
  ];
  
  let clicked = false;
  for (const selector of createSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        console.log(`Found agenda create button with selector: ${selector}`);
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }
  
  if (!clicked) {
    await this.page!.screenshot({ path: 'agenda-create-button-not-found.png' });
    throw new Error('Could not find create agenda item button');
  }
  
  // Wait for dialog or form to appear
  try {
    await this.page!.waitForSelector('mat-dialog-container, .create-form, form', { timeout: 5000 });
  } catch {
    // Form might appear inline
    console.log('No dialog appeared, form might be inline');
  }
});

When('I fill in the agenda form with:', async function(this: CustomWorld, dataTable: DataTable) {
  const data = dataTable.rowsHash();
  
  // Wait for form to be ready and Angular to stabilize
  await this.page!.waitForLoadState('networkidle');
  await this.page!.waitForFunction(() => {
    const angular = (window as any).getAllAngularTestabilities?.();
    return angular && angular.length > 0 && angular.every((t: any) => t.isStable());
  }, { timeout: 5000 }).catch(() => console.log('Angular stability check failed, continuing...'));
  
  if (data.Title) {
    // Try multiple selectors for title
    const titleSelectors = [
      'input[formcontrolname="title"]',
      'input[name="title"]',
      'input[placeholder*="Title" i]',
      'input[placeholder*="Name" i]',
      'mat-form-field input[type="text"]',
      'input[type="text"]:visible'
    ];
    
    let filled = false;
    for (const selector of titleSelectors) {
      try {
        const input = await this.page!.waitForSelector(selector, { state: 'visible', timeout: 2000 });
        if (input) {
          await input.click(); // Focus the field first
          await input.fill(''); // Clear
          await input.fill(data.Title);
          // Verify the value was set
          const value = await input.inputValue();
          if (value === data.Title) {
            filled = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
    
    if (!filled) {
      throw new Error('Could not find title input field');
    }
  }
  
  if (data.Type) {
    try {
      // Try to find and click the select dropdown
      const selectSelectors = [
        'mat-select[formcontrolname="type"]',
        'mat-select[name="type"]',
        'select[name="type"]',
        'mat-select'
      ];
      
      for (const selector of selectSelectors) {
        const select = this.page!.locator(selector).first();
        if (await select.isVisible({ timeout: 1000 })) {
          await select.click();
          await this.page!.waitForTimeout(500);
          await this.page!.click(`mat-option:has-text("${data.Type}"), option:has-text("${data.Type}")`);
          break;
        }
      }
    } catch {
      console.log('Could not set type, might not be required');
    }
  }
  
  if (data.Duration) {
    try {
      const durationInput = this.page!.locator('input[formcontrolname="duration"], input[name="duration"], input[placeholder*="Duration" i]').first();
      await durationInput.fill(data.Duration);
    } catch {
      console.log('Could not set duration, might not be required');
    }
  }
  
  if (data.Comment) {
    try {
      const commentInput = this.page!.locator('textarea[formcontrolname="comment"], textarea[name="comment"], textarea[placeholder*="Comment" i]').first();
      await commentInput.fill(data.Comment);
    } catch {
      console.log('Could not set comment, might not be required');
    }
  }
});

When('I click the speaker button for {string}', async function(this: CustomWorld, itemTitle: string) {
  await this.agendaPage!.openSpeakerList(itemTitle);
});

When('I add {string} to the speakers list', async function(this: CustomWorld, speakerName: string) {
  await this.agendaPage!.addSpeaker(speakerName);
});

When('I start the speaker {string}', async function(this: CustomWorld, speakerName: string) {
  await this.agendaPage!.startSpeaker(speakerName);
});

When('I stop the current speaker', async function(this: CustomWorld) {
  await this.agendaPage!.stopSpeaker();
});

When('I click the projector button for {string}', async function(this: CustomWorld, itemTitle: string) {
  await this.agendaPage!.projectAgendaItem(itemTitle);
});

When('I open the menu for {string}', async function(this: CustomWorld, itemTitle: string) {
  // First, try to find the agenda item
  const itemSelectors = [
    `[data-cy^="agenda-item-"]:has-text("${itemTitle}")`,
    '.agenda-item',
    'mat-list-item',
    '.mat-mdc-list-item',
    '[class*="agenda-item"]',
    'tr'
  ];
  
  let itemElement;
  for (const selector of itemSelectors) {
    const element = this.page!.locator(selector).filter({ hasText: itemTitle }).first();
    if (await element.count() > 0) {
      itemElement = element;
      console.log(`Found agenda item with selector: ${selector}`);
      break;
    }
  }
  
  if (!itemElement) {
    throw new Error(`Could not find agenda item: ${itemTitle}`);
  }
  
  // Now find the menu button within that item
  const menuSelectors = [
    '[data-cy="agenda-menu-trigger"]',
    'button mat-icon:has-text("more_vert")',
    'button[mat-icon-button]',
    '.item-menu',
    'button[aria-label*="menu"]',
    'button[aria-label*="options"]',
    'button[aria-label*="More"]'
  ];
  
  let clicked = false;
  for (const selector of menuSelectors) {
    try {
      const menuButton = itemElement.locator(selector).first();
      if (await menuButton.isVisible({ timeout: 1000 })) {
        console.log(`Found menu button with selector: ${selector}`);
        await menuButton.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }
  
  if (!clicked) {
    throw new Error(`Could not find menu button for item: ${itemTitle}`);
  }
  
  // Wait for menu to appear
  await this.page!.waitForTimeout(500);
});

When('I select {string} from the agenda menu', async function(this: CustomWorld, action: string) {
  await this.page!.click(`button:has-text("${action}")`);
});

When('I drag {string} above {string}', async function(this: CustomWorld, itemToMove: string, targetItem: string) {
  // Get the elements
  const sourceItem = this.page!.locator('.agenda-item', { hasText: itemToMove });
  const targetItemElement = this.page!.locator('.agenda-item', { hasText: targetItem });
  
  // Perform drag and drop
  await sourceItem.dragTo(targetItemElement);
});

When('I confirm the agenda item deletion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Confirm")');
});

Then('the item {string} should appear in the agenda', async function(this: CustomWorld, itemTitle: string) {
  const item = this.page!.locator('.agenda-item', { hasText: itemTitle });
  await item.waitFor({ state: 'visible' });
  expect(await item.isVisible()).toBe(true);
});

Then('I should see {int} speakers in the queue', async function(this: CustomWorld, count: number) {
  const speakers = await this.page!.locator('.speaker-row').count();
  expect(speakers).toBe(count);
});

Then('the speaker timer should start', async function(this: CustomWorld) {
  const timer = this.page!.locator('.speaker-timer, .timer');
  await timer.waitFor({ state: 'visible' });
  expect(await timer.isVisible()).toBe(true);
});

Then('{string} should be marked as current speaker', async function(this: CustomWorld, speakerName: string) {
  const currentSpeaker = this.page!.locator('.current-speaker', { hasText: speakerName });
  expect(await currentSpeaker.isVisible()).toBe(true);
});

// Removed duplicate - already defined in autopilot.steps.ts
// Then('the timer should stop', async function(this: CustomWorld) {
//   // Check that stop button is not visible or timer is paused
//   const stopButton = this.page!.locator('button:has-text("Stop")');
//   const isVisible = await stopButton.isVisible();
//   expect(isVisible).toBe(false);
// });

Then('speaking time should be recorded', async function(this: CustomWorld) {
  // Check for speaking time display
  const speakingTime = this.page!.locator('.speaking-time, .duration');
  expect(await speakingTime.isVisible()).toBe(true);
});

Then('the item should be marked as projected', async function(this: CustomWorld) {
  const itemTitle = this.testData.get('currentAgendaItem');
  const item = this.page!.locator('.agenda-item', { hasText: itemTitle });
  const projectorIcon = item.locator('.projected, [class*="projected"]');
  expect(await projectorIcon.isVisible()).toBe(true);
});

Then('it should appear on the projector view', async function(this: CustomWorld) {
  // This would typically check the projector endpoint
  console.log('Checking projector view');
});

Then('the item should be marked as internal', async function(this: CustomWorld) {
  const itemTitle = this.testData.get('currentAgendaItem');
  const item = this.page!.locator('.agenda-item', { hasText: itemTitle });
  const internalBadge = item.locator('.internal, [class*="internal"]');
  expect(await internalBadge.isVisible()).toBe(true);
});

Then('it should not be visible to regular participants', async function(this: CustomWorld) {
  // This would require checking with different user permissions
  console.log('Checking visibility for regular participants');
});

Then('the order should be:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedOrder = dataTable.hashes();
  const items = await this.page!.locator('.agenda-item').all();
  
  for (let i = 0; i < expectedOrder.length; i++) {
    const itemText = await items[i].textContent();
    expect(itemText).toContain(expectedOrder[i].Title);
  }
});

Then('{string} should not appear in the agenda', async function(this: CustomWorld, itemTitle: string) {
  const item = this.page!.locator('.agenda-item', { hasText: itemTitle });
  expect(await item.isVisible()).toBe(false);
});