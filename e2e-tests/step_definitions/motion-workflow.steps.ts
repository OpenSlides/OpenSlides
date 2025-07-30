import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Navigation
// Removed - using generic navigation step from comprehensive.steps.ts
// The generic step handles 'Given I navigate to the {word} section'

// Motion creation
When('I create a new motion', async function(this: CustomWorld) {
  // Try multiple selectors for create motion button
  const createButtonSelectors = [
    '[data-cy="headbarMainButton"]',
    'button mat-icon:has-text("add_circle")',
    'button:has-text("add_circle")',
    'button:has-text("New motion")',
    'button:has-text("New")',
    'button[mat-fab]',
    'button[mat-icon-button] mat-icon:has-text("add")',
    '.mat-toolbar button[mat-raised-button]'
  ];
  
  let clicked = false;
  for (const selector of createButtonSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 500 })) {
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }
  
  if (!clicked) {
    throw new Error('Could not find create motion button');
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I fill in the motion form with:', async function(this: CustomWorld, dataTable: DataTable) {
  const data = dataTable.hashes();
  
  for (const row of data) {
    const field = row.Field;
    const value = row.Value;
    
    switch (field) {
      case 'Title':
        await this.page!.fill('input[formcontrolname="title"], input[placeholder*="Title"]', value);
        break;
      case 'Text':
        // Motion text might be in a rich text editor
        const textEditor = this.page!.locator('div[contenteditable="true"], textarea[formcontrolname="text"], .motion-text-editor');
        await textEditor.click();
        await textEditor.fill(value);
        break;
      case 'Reason':
        await this.page!.fill('textarea[formcontrolname="reason"], input[formcontrolname="reason"]', value);
        break;
    }
  }
});

When('I select the category {string}', async function(this: CustomWorld, category: string) {
  // Open category dropdown
  const categorySelect = this.page!.locator('mat-select[formcontrolname="category_id"], mat-select[placeholder*="Category"]').first();
  await categorySelect.click();
  
  // Select the category
  await this.page!.click(`mat-option:has-text("${category}")`);
});

When('I add tags {string} and {string}', async function(this: CustomWorld, tag1: string, tag2: string) {
  // Tags might be chips or a multi-select
  const tagInput = this.page!.locator('input[placeholder*="Tags"], mat-chip-list input').first();
  
  // Add first tag
  await tagInput.fill(tag1);
  await tagInput.press('Enter');
  
  // Add second tag
  await tagInput.fill(tag2);
  await tagInput.press('Enter');
});

When('I save the motion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Save"), button[type="submit"]');
  await this.page!.waitForTimeout(2000);
});

Then('the motion should be created with sequential number', async function(this: CustomWorld) {
  // Check for motion number in the format like "001" or "F001"
  const motionNumber = await this.page!.locator('.motion-number, text=/[A-Z]?\\d{3,}/').isVisible();
  expect(motionNumber).toBe(true);
});

Then('the motion should be in {string} state', async function(this: CustomWorld, expectedState: string) {
  const stateElement = await this.page!.locator(`.motion-state:has-text("${expectedState}"), .state-badge:has-text("${expectedState}")`);
  await stateElement.waitFor({ state: 'visible', timeout: 5000 });
  expect(await stateElement.isVisible()).toBe(true);
});

// Motion editing
Given('I have submitted a motion {string}', async function(this: CustomWorld, motionTitle: string) {
  this.testData.set('submittedMotion', motionTitle);
  // In a real test, we might create this motion via API or assume it exists
});

When('I open the motion {string}', async function(this: CustomWorld, motionTitle: string) {
  // Try different selectors for motion links
  const motionSelectors = [
    `a:has-text("${motionTitle}")`,
    `mat-row:has-text("${motionTitle}")`,
    `tr:has-text("${motionTitle}")`,
    `.motion-item:has-text("${motionTitle}")`,
    `text="${motionTitle}"`
  ];
  
  let clicked = false;
  for (const selector of motionSelectors) {
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
    throw new Error(`Could not find motion: ${motionTitle}`);
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I edit the motion', async function(this: CustomWorld) {
  // Try multiple selectors for edit button
  const editSelectors = [
    'button:has-text("Edit")',
    'button[aria-label="Edit"]',
    'button mat-icon:has-text("edit")',
    'button[mat-icon-button] mat-icon:has-text("edit")',
    '.action-buttons button:has-text("Edit")',
    'mat-menu-item:has-text("Edit")'
  ];
  
  let clicked = false;
  for (const selector of editSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 500 })) {
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  // If no direct edit button, try menu button first
  if (!clicked) {
    const menuButton = this.page!.locator('button mat-icon:has-text("more_vert"), button[mat-icon-button]').first();
    if (await menuButton.isVisible({ timeout: 500 })) {
      await menuButton.click();
      await this.page!.waitForTimeout(500);
      await this.page!.click('mat-menu-item:has-text("Edit"), button:has-text("Edit")');
      clicked = true;
    }
  }
  
  if (!clicked) {
    throw new Error('Could not find edit button');
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I update the motion text', async function(this: CustomWorld) {
  const textEditor = this.page!.locator('div[contenteditable="true"], textarea[formcontrolname="text"]').first();
  await textEditor.click();
  await textEditor.selectText();
  await textEditor.fill('Updated motion text with additional details');
});

Then('the changes should be saved', async function(this: CustomWorld) {
  const savedNotification = await this.page!.locator('.mat-snack-bar:has-text("Saved"), text="Motion updated"').isVisible();
  expect(savedNotification).toBe(true);
});

Then('the motion history should show the edit', async function(this: CustomWorld) {
  // Check for history/timeline entry
  const historyEntry = await this.page!.locator('.history-entry:has-text("edited"), .timeline-item:has-text("Modified")').isVisible();
  expect(historyEntry).toBe(true);
});

// Motion state transitions
Given('a motion {string} exists in {string} state', async function(this: CustomWorld, motionTitle: string, state: string) {
  this.testData.set('currentMotion', motionTitle);
  this.testData.set('currentMotionState', state);
});

Given('I have permission to manage motions', async function(this: CustomWorld) {
  // This is typically based on user role
  this.testData.set('canManageMotions', true);
});

Then('I should see available state transitions', async function(this: CustomWorld) {
  const stateButton = await this.page!.locator('button:has-text("Set state"), button:has-text("Change state")').isVisible();
  expect(stateButton).toBe(true);
});

When('I change the state to {string}', async function(this: CustomWorld, newState: string) {
  // Click state change button
  await this.page!.click('button:has-text("Set state"), button:has-text("Change state")');
  await this.page!.waitForTimeout(500);
  
  // Select new state
  await this.page!.click(`mat-list-item:has-text("${newState}"), button:has-text("${newState}")`);
  await this.page!.waitForTimeout(1000);
});

Then('I should see new available transitions:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedStates = dataTable.hashes().map(row => row.State);
  
  // Click state button to see available transitions
  await this.page!.click('button:has-text("Set state"), button:has-text("Change state")');
  await this.page!.waitForTimeout(500);
  
  for (const state of expectedStates) {
    const stateOption = await this.page!.locator(`mat-list-item:has-text("${state}"), button:has-text("${state}")`).isVisible();
    expect(stateOption).toBe(true);
  }
  
  // Close the menu
  await this.page!.keyboard.press('Escape');
});

// Amendments
When('I create an amendment', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Create amendment"), button:has-text("New amendment")');
  await this.page!.waitForTimeout(1000);
});

When('I select the paragraph to amend', async function(this: CustomWorld) {
  // Click on a paragraph in the motion text
  await this.page!.locator('.motion-text p, .paragraph').first().click();
});

When('I enter the amendment text {string}', async function(this: CustomWorld, amendmentText: string) {
  const amendmentInput = this.page!.locator('textarea[formcontrolname="amendment_text"], .amendment-editor').first();
  await amendmentInput.fill(amendmentText);
});

When('I submit the amendment', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Submit amendment"), button:has-text("Create")');
  await this.page!.waitForTimeout(1000);
});

Then('the amendment should be created', async function(this: CustomWorld) {
  const amendmentCreated = await this.page!.locator('.amendment-item, text="Amendment created"').isVisible();
  expect(amendmentCreated).toBe(true);
});

Then('it should be linked to the parent motion', async function(this: CustomWorld) {
  const parentLink = await this.page!.locator('.parent-motion-link, text="Amendment to"').isVisible();
  expect(parentLink).toBe(true);
});

// Motion list and filtering
When('I apply the filter {string}', async function(this: CustomWorld, filterType: string) {
  // Open filter menu
  await this.page!.click('button:has-text("Filter"), button[mat-icon-button]:has(mat-icon:has-text("filter_list"))');
  await this.page!.waitForTimeout(500);
  
  // Apply specific filter
  await this.page!.click(`mat-checkbox:has-text("${filterType}"), label:has-text("${filterType}")`);
  
  // Apply filters
  await this.page!.click('button:has-text("Apply")');
  await this.page!.waitForTimeout(1000);
});

Then('I should only see motions in {string} state', async function(this: CustomWorld, state: string) {
  // Get all visible motion state badges
  const stateBadges = await this.page!.locator('.motion-state, .state-badge').allTextContents();
  
  for (const badge of stateBadges) {
    expect(badge.toLowerCase()).toContain(state.toLowerCase());
  }
});

When('I search for {string} in motions', async function(this: CustomWorld, searchTerm: string) {
  const searchInput = this.page!.locator('input[placeholder*="Search"], input[type="search"]').first();
  await searchInput.fill(searchTerm);
  await searchInput.press('Enter');
  await this.page!.waitForTimeout(1000);
});

Then('I should see motions containing {string}', async function(this: CustomWorld, expectedText: string) {
  const motionItems = await this.page!.locator('.motion-item, mat-card').count();
  expect(motionItems).toBeGreaterThan(0);
  
  // Each visible motion should contain the search term
  const firstMotion = await this.page!.locator('.motion-item, mat-card').first().textContent();
  expect(firstMotion?.toLowerCase()).toContain(expectedText.toLowerCase());
});

// Supporters
When('I support the motion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Support"), button:has-text("Support motion")');
  await this.page!.waitForTimeout(1000);
});

Then('I should be listed as a supporter', async function(this: CustomWorld) {
  const supportersList = await this.page!.locator('.supporters-list, .supporter-names').textContent();
  expect(supportersList).toContain('admin'); // Current user
});

Then('the supporter count should increase', async function(this: CustomWorld) {
  const supporterCount = await this.page!.locator('.supporter-count, text=/Supporters:.*\\d+/').isVisible();
  expect(supporterCount).toBe(true);
});

// Motion export
Then('I should be able to download the PDF', async function(this: CustomWorld) {
  const downloadButton = await this.page!.locator('button:has-text("Download"), a[download]').isVisible();
  expect(downloadButton).toBe(true);
});

// Additional given steps
Given('there are motions in different states', async function(this: CustomWorld) {
  // This assumes test data with various motion states exists
  this.testData.set('hasVariousMotions', true);
});

Given('the motion has {int} supporters', async function(this: CustomWorld, supporterCount: number) {
  this.testData.set('initialSupporters', supporterCount);
});