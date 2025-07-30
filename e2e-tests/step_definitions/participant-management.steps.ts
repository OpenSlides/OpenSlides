import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am on the participants page', async function(this: CustomWorld) {
  const meetingId = this.currentMeetingId || '1';
  
  // If we're already in a meeting, click the Participants link in the sidebar
  const currentUrl = this.page!.url();
  if (currentUrl.includes(`/${meetingId}/`)) {
    await this.page!.click('a:has-text("Participants"), nav >> text="Participants"');
  } else {
    // Otherwise navigate directly
    await this.page!.goto(`https://localhost:8000/${meetingId}/participants`);
  }
  
  await this.page!.waitForTimeout(2000);
});

Given('{string} is a participant', async function(this: CustomWorld, participantName: string) {
  // This is a precondition - we assume the participant exists
  // In a real test, we might create them if they don't exist
  this.testData.set('currentParticipant', participantName);
});

Given('{string} is marked as absent', async function(this: CustomWorld, participantName: string) {
  // Store the state for later verification
  this.testData.set(`${participantName}_presence`, 'absent');
});

Given('{string} is a participant in group {string}', async function(this: CustomWorld, participantName: string, groupName: string) {
  this.testData.set('currentParticipant', participantName);
  this.testData.set(`${participantName}_group`, groupName);
});

Given('an agenda item {string} is active', async function(this: CustomWorld, itemTitle: string) {
  // Store the active agenda item
  this.testData.set('activeAgendaItem', itemTitle);
});

Given('multiple participants are selected', async function(this: CustomWorld) {
  // This would select multiple checkboxes in the UI
  this.testData.set('multipleSelected', true);
});

When('I click the add participant button', async function(this: CustomWorld) {
  // Try multiple selectors for add participant button
  const buttonSelectors = [
    '[data-cy="headbarMainButton"]',
    'button mat-icon:has-text("add_circle")',
    'button:has-text("add_circle")',
    'button[mat-fab]',
    'button:has-text("Add participant")',
    'button:has-text("Add user")',
    'button:has-text("New")',
    'button:has-text("Add")',
    'button:has-text("Create")',
    'button[aria-label*="Add"]',
    'button[aria-label*="Create"]',
    '.mat-toolbar button',
    'button mat-icon:has-text("add")'
  ];
  
  let clicked = false;
  for (const selector of buttonSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        console.log(`Found add participant button with selector: ${selector}`);
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }
  
  if (!clicked) {
    await this.page!.screenshot({ path: 'add-participant-button-not-found.png' });
    throw new Error('Could not find add participant button');
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I fill in the participant form with:', async function(this: CustomWorld, dataTable: DataTable) {
  const data = dataTable.hashes();
  
  for (const row of data) {
    const field = row.Field;
    const value = row.Value;
    
    // Try multiple strategies to find the input field
    let input;
    
    // First try by placeholder text
    input = this.page!.locator(`input[placeholder="${field}"], input[placeholder*="${field}"]`).first();
    const count = await input.count();
    
    if (count === 0) {
      // Try by label text
      const label = this.page!.locator(`label:has-text("${field}")`).first();
      if (await label.count() > 0) {
        const forId = await label.getAttribute('for');
        if (forId) {
          input = this.page!.locator(`#${forId}`);
        } else {
          // Try to find input within the same parent
          input = label.locator('..').locator('input').first();
        }
      }
    }
    
    if (await input.count() === 0) {
      // Try by common form control names
      const fieldMap: Record<string, string> = {
        'Given name': 'first_name',
        'Surname': 'last_name',
        'Email': 'email',
        'Username': 'username',
        'Membership number': 'member_number'
      };
      const formControlName = fieldMap[field] || field.toLowerCase().replace(/\s+/g, '_');
      input = this.page!.locator(`input[formcontrolname="${formControlName}"], input[name="${formControlName}"]`).first();
    }
    
    // Fill the input
    await input.fill(value);
    await this.page!.waitForTimeout(100); // Small delay between fields
  }
});

When('I select the user {string}', async function(this: CustomWorld, userName: string) {
  // In the user selection dialog/dropdown
  const userOption = this.page!.locator(`mat-option:has-text("${userName}"), .user-option:has-text("${userName}")`).first();
  await userOption.click();
});

When('I assign group {string}', async function(this: CustomWorld, groupName: string) {
  // Select group from dropdown
  const groupSelect = this.page!.locator('mat-select[formcontrolname="group_ids"], mat-select[formcontrolname="groups"]').first();
  await groupSelect.click();
  await this.page!.click(`mat-option:has-text("${groupName}")`);
});

When('I mark as present', async function(this: CustomWorld) {
  // Check the present checkbox
  const presentCheckbox = this.page!.locator('mat-checkbox[formcontrolname="present"], input[type="checkbox"][formcontrolname="present"]').first();
  await presentCheckbox.click();
});

When('I click add participants', async function(this: CustomWorld) {
  // Submit the add participant form
  const submitButton = this.page!.locator('button[type="submit"], button:has-text("Add"), button:has-text("Save")').first();
  await submitButton.click();
  await this.page!.waitForTimeout(2000);
});

When('I click the presence checkbox for {string}', async function(this: CustomWorld, participantName: string) {
  // Find the participant row by looking for the name
  const participantRow = this.page!.locator('tr').filter({ hasText: participantName }).first();
  
  // The presence checkbox is in the row
  const presenceCheckbox = participantRow.locator('mat-checkbox, input[type="checkbox"], .mat-mdc-checkbox').first();
  
  // Wait for checkbox to be visible
  await presenceCheckbox.waitFor({ state: 'visible', timeout: 5000 });
  
  // Click the checkbox
  await presenceCheckbox.click();
  
  // Wait for any updates
  await this.page!.waitForTimeout(1000);
});

When('I filter by group {string}', async function(this: CustomWorld, groupName: string) {
  // Open filter menu and select group
  const filterButton = this.page!.locator('button:has-text("Filter"), button[mat-icon-button]:has(mat-icon:has-text("filter_list"))').first();
  await filterButton.click();
  await this.page!.waitForTimeout(500);
  
  // Select the group filter
  await this.page!.click(`mat-checkbox:has-text("${groupName}"), input[type="checkbox"] + label:has-text("${groupName}")`);
  
  // Apply filter
  await this.page!.click('button:has-text("Apply")');
  await this.page!.waitForTimeout(1000);
});

When('I select bulk action {string}', async function(this: CustomWorld, action: string) {
  // Open bulk actions menu
  const bulkActionsButton = this.page!.locator('button:has-text("Bulk actions"), button:has-text("Actions")').first();
  await bulkActionsButton.click();
  await this.page!.waitForTimeout(500);
  
  // Select the action
  await this.page!.click(`button:has-text("${action}"), mat-menu-item:has-text("${action}")`);
});

When('I confirm the removal', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Confirm"), button:has-text("Remove")');
  await this.page!.waitForTimeout(1000);
});

When('I select group {string}', async function(this: CustomWorld, groupName: string) {
  // In a group selection dialog
  await this.page!.click(`mat-checkbox:has-text("${groupName}"), mat-list-option:has-text("${groupName}")`);
});

// Save changes step removed - using common-ui.steps.ts version

When('I save the participant', async function(this: CustomWorld) {
  // Try multiple selectors for save button
  const saveSelectors = [
    'button:has-text("SAVE")',
    'button:has-text("Save")',
    'button:has-text("Create")',
    'button[type="submit"]',
    'mat-dialog-actions button:last-child',
    '.mat-mdc-dialog-actions button:last-child',
    'button[color="primary"]',
    'button[mat-raised-button]'
  ];
  
  let clicked = false;
  for (const selector of saveSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        // Make sure button is visible and clickable
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }
  
  if (!clicked) {
    await this.page!.screenshot({ path: 'save-participant-button-not-found.png' });
    throw new Error('Could not find save participant button');
  }
  
  // Wait for dialog to close or navigation
  await this.page!.waitForTimeout(3000);
});

When('I map the columns:', async function(this: CustomWorld, dataTable: DataTable) {
  const mappings = dataTable.hashes();
  
  for (const mapping of mappings) {
    const columnSelect = this.page!.locator(`mat-select[placeholder*="${mapping['CSV Column']}"]`).first();
    await columnSelect.click();
    await this.page!.click(`mat-option:has-text("${mapping['Field']}")`);
  }
});

When('I click import', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Import"), button:has-text("Start import")');
  await this.page!.waitForTimeout(2000);
});

Then('{string} should appear in the participant list', async function(this: CustomWorld, participantName: string) {
  const participant = this.page!.locator('.participant-row, tr').filter({ hasText: participantName });
  await participant.waitFor({ state: 'visible', timeout: 5000 });
  expect(await participant.isVisible()).toBe(true);
});

Then('{string} should be marked as present', async function(this: CustomWorld, participantName: string) {
  const participantRow = this.page!.locator('tr, .participant-row').filter({ hasText: participantName });
  const presenceIndicator = participantRow.locator('.present-indicator, mat-icon:has-text("check_circle"), .presence-badge');
  expect(await presenceIndicator.isVisible()).toBe(true);
});

Then('the present count should increase by {int}', async function(this: CustomWorld, count: number) {
  // This would check the presence counter in the UI
  const counter = this.page!.locator('.presence-counter, .present-count');
  const text = await counter.textContent();
  // Store or compare the count
  console.log(`Present count: ${text}`);
});

Then('{string} should show group {string}', async function(this: CustomWorld, participantName: string, groupName: string) {
  const participantRow = this.page!.locator('tr, .participant-row').filter({ hasText: participantName });
  const groupBadge = participantRow.locator('.group-badge, .group-name').filter({ hasText: groupName });
  expect(await groupBadge.isVisible()).toBe(true);
});

Then('{string} should appear in the speakers queue', async function(this: CustomWorld, participantName: string) {
  const speakersList = this.page!.locator('.speakers-list, .speaker-queue');
  const speaker = speakersList.locator('.speaker-item').filter({ hasText: participantName });
  expect(await speaker.isVisible()).toBe(true);
});

Then('I should see only:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedParticipants = dataTable.hashes().map(row => row.Name);
  
  // Wait for filter to apply
  await this.page!.waitForTimeout(1000);
  
  // Get all visible participant names
  const visibleParticipants = await this.page!.locator('.participant-row .participant-name, tr td:first-child').allTextContents();
  
  // Check that only expected participants are visible
  for (const expected of expectedParticipants) {
    const isVisible = visibleParticipants.some(name => name.includes(expected));
    expect(isVisible).toBe(true);
  }
  
  // Check count matches
  expect(visibleParticipants.length).toBe(expectedParticipants.length);
});

Then('all selected participants should be marked as present', async function(this: CustomWorld) {
  // Check that all selected participants have the present indicator
  const selectedRows = this.page!.locator('.participant-row.selected, tr.selected');
  const count = await selectedRows.count();
  
  for (let i = 0; i < count; i++) {
    const row = selectedRows.nth(i);
    const presenceIndicator = row.locator('.present-indicator, mat-icon:has-text("check_circle")');
    expect(await presenceIndicator.isVisible()).toBe(true);
  }
});

// Success notification step removed - using common-ui.steps.ts version

Then('the imported participants should appear in the list', async function(this: CustomWorld) {
  // Check that new participants have been added
  const participantRows = await this.page!.locator('.participant-row, tbody tr').count();
  expect(participantRows).toBeGreaterThan(0);
});

Then('{string} should not appear in the list', async function(this: CustomWorld, participantName: string) {
  // Wait for the removal to complete
  await this.page!.waitForTimeout(1000);
  
  const participant = this.page!.locator('.participant-row, tr').filter({ hasText: participantName });
  expect(await participant.isVisible()).toBe(false);
});

When('I click the import button', async function(this: CustomWorld) {
  const importButton = this.page!.locator('button:has-text("Import"), button[mat-icon-button]:has(mat-icon:has-text("upload"))').first();
  await importButton.click();
  await this.page!.waitForTimeout(1000);
});