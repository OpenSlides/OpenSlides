import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Export permissions and filtering
Given('I have limited export permissions', async function(this: CustomWorld) {
  this.testData.set('limitedExportPerms', true);
  
  // Verify limited options
  const fullExport = await this.page!.locator('button:has-text("Export all")').isVisible({ timeout: 1000 }).catch(() => false);
  expect(fullExport).toBe(false);
});

When('I try to export', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Export"), button[aria-label="Export data"]');
  await this.page!.waitForTimeout(1500);
});

Then('exported data should be filtered', async function(this: CustomWorld) {
  const filteredNotice = await this.page!.locator('text=/Filtered.*export|Limited.*data/i').isVisible();
  expect(filteredNotice).toBe(true);
});

When('I export for public release', async function(this: CustomWorld) {
  await this.page!.click('mat-radio-button:has-text("Public export"), label:has-text("Public release")');
  await this.page!.waitForTimeout(500);
  await this.page!.click('button:has-text("Export")');
  await this.page!.waitForTimeout(2000);
});

// Validation and error handling
When('validation runs', async function(this: CustomWorld) {
  // Validation typically runs automatically
  const validating = await this.page!.locator('.validation-progress, text=/Validating/i').isVisible({ timeout: 3000 });
  expect(validating).toBe(true);
  await this.page!.waitForTimeout(2000);
});

Then('detailed error messages', async function(this: CustomWorld) {
  const errorDetails = await this.page!.locator('.error-details, .validation-errors').isVisible();
  expect(errorDetails).toBe(true);
});

// Removed duplicate - use 'option to fix and retry' from domain-specific.steps.ts

// Import failures
Given('an import partially fails', async function(this: CustomWorld) {
  this.testData.set('partialImportFailure', true);
  
  // Simulate partial failure
  const failureIndicator = await this.page!.locator('.import-warning, text=/Partial.*failure/i').isVisible();
  expect(failureIndicator).toBe(true);
});

When('I see {string}', async function(this: CustomWorld, text: string) {
  const element = await this.page!.locator(`text="${text}"`).isVisible({ timeout: 5000 });
  expect(element).toBe(true);
});

// File operations
When('another user tries to delete my file', async function(this: CustomWorld) {
  // This would be simulated or tested with multiple browser contexts
  this.testData.set('deletionAttempted', true);
  
  // In real scenario, this would be an API call or second browser action
  const deleteBlocked = await this.page!.locator('text=/Cannot.*delete|Permission.*denied/i').isVisible({ timeout: 3000 });
  expect(deleteBlocked).toBe(true);
});

// Removed duplicate - use 'When I select the file for projection' from domain-specific.steps.ts

// Motion operations
When('Motion A is accepted', async function(this: CustomWorld) {
  // Change motion state to accepted
  const motionA = this.page!.locator('.motion-item:has-text("Motion A")');
  await motionA.click();
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('button:has-text("Change state")');
  await this.page!.click('mat-option:has-text("Accepted")');
  await this.page!.waitForTimeout(1500);
});

When('I subscribe to motion {string}', async function(this: CustomWorld, motionTitle: string) {
  const motion = this.page!.locator(`.motion-item:has-text("${motionTitle}")`);
  await motion.locator('button[aria-label="Subscribe"], mat-icon:has-text("notifications")').click();
  await this.page!.waitForTimeout(1000);
});

When('I set dependency {string}', async function(this: CustomWorld, dependency: string) {
  await this.page!.click('mat-tab-label:has-text("Dependencies"), button:has-text("Dependencies")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('input[placeholder*="Add dependency"]', dependency);
  await this.page!.click('button:has-text("Add")');
  await this.page!.waitForTimeout(1000);
});

When('I navigate to the motions list', async function(this: CustomWorld) {
  await this.page!.click('a:has-text("Motions"), nav >> text="Motions"');
  await this.page!.waitForTimeout(1500);
});

When('I edit the motion text', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Edit"), button[aria-label="Edit motion"]');
  await this.page!.waitForTimeout(1000);
  
  const editor = this.page!.locator('[contenteditable="true"], textarea[formcontrolname="text"]').first();
  await editor.fill('Updated motion text for testing');
  await this.page!.waitForTimeout(500);
});

When('I edit motion tags', async function(this: CustomWorld) {
  await this.page!.click('mat-select[formcontrolname="tags"], .tags-selector');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click('mat-option:has-text("Important")');
  await this.page!.click('mat-option:has-text("Urgent")');
  await this.page!.keyboard.press('Escape');
  await this.page!.waitForTimeout(500);
});

When('I create a motion in English', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("New motion"), button:has-text("Create motion")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('input[formcontrolname="title"]', 'Test Motion in English');
  await this.page!.fill('textarea[formcontrolname="text"]', 'This is a test motion created in English');
  await this.page!.waitForTimeout(500);
});

When('I select motions to print', async function(this: CustomWorld) {
  // Select multiple motions
  await this.page!.locator('mat-checkbox').nth(0).click();
  await this.page!.locator('mat-checkbox').nth(1).click();
  await this.page!.locator('mat-checkbox').nth(2).click();
  await this.page!.waitForTimeout(500);
});

When('I select motions for export', async function(this: CustomWorld) {
  // Select motions for export
  await this.page!.locator('mat-checkbox').nth(0).click();
  await this.page!.locator('mat-checkbox').nth(1).click();
  await this.page!.waitForTimeout(500);
});

// History operations
When('I search for {string} in history', async function(this: CustomWorld, searchTerm: string) {
  await this.page!.fill('input[placeholder*="Search history"]', searchTerm);
  await this.page!.keyboard.press('Enter');
  await this.page!.waitForTimeout(1500);
});

When('I click on a history entry {string}', async function(this: CustomWorld, entryText: string) {
  await this.page!.click(`.history-entry:has-text("${entryText}")`);
  await this.page!.waitForTimeout(1000);
});

When('I locate the action in history', async function(this: CustomWorld) {
  const latestAction = this.page!.locator('.history-entry').first();
  await latestAction.click();
  await this.page!.waitForTimeout(1000);
});

When('I access history settings', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label="History settings"], button:has-text("Settings")');
  await this.page!.waitForTimeout(1000);
});

When('I choose rollback', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Rollback"), button:has-text("Revert")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('button:has-text("Confirm rollback")');
  await this.page!.waitForTimeout(2000);
});

// Storage and cleanup
When('I navigate to storage settings', async function(this: CustomWorld) {
  await this.page!.click('a:has-text("Settings")');
  await this.page!.waitForTimeout(1000);
  await this.page!.click('mat-tab-label:has-text("Storage"), button:has-text("Storage")');
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - use 'old exports should be cleaned up' from domain-specific.steps.ts

Then('failures should trigger alerts', async function(this: CustomWorld) {
  const alert = await this.page!.locator('.alert, .notification-error').isVisible();
  expect(alert).toBe(true);
});

// Voting interface
Then('the correct voting interface should appear', async function(this: CustomWorld) {
  const voteType = this.testData.get('voteType') || 'standard';
  let interfaceVisible = false;
  
  switch(voteType) {
    case 'ranked':
      interfaceVisible = await this.page!.locator('.ranked-choice-interface').isVisible();
      break;
    case 'anonymous':
      interfaceVisible = await this.page!.locator('.anonymous-voting').isVisible();
      break;
    default:
      interfaceVisible = await this.page!.locator('.voting-interface').isVisible();
  }
  
  expect(interfaceVisible).toBe(true);
});

Then('the voting should be active', async function(this: CustomWorld) {
  const votingActive = await this.page!.locator('.voting-active, .poll-open').isVisible();
  expect(votingActive).toBe(true);
});

// Motion removal
Then('the motion should be removed', async function(this: CustomWorld) {
  const motionId = this.testData.get('deletedMotionId');
  const motionExists = await this.page!.locator(`text="Motion ${motionId}"`).isVisible({ timeout: 1000 }).catch(() => false);
  expect(motionExists).toBe(false);
});

// Error messages
Then('they should see an error message', async function(this: CustomWorld) {
  const error = await this.page!.locator('.error-message, .mat-error, .alert-danger').isVisible();
  expect(error).toBe(true);
});

// Time-based operations
When('time expires', async function(this: CustomWorld) {
  // Wait for timer to expire
  await this.page!.waitForTimeout(5000);
  
  const expired = await this.page!.locator('text=/Time.*expired|Timer.*ended/i').isVisible();
  expect(expired).toBe(true);
});

// Security monitoring
When('suspicious activity occurs', async function(this: CustomWorld) {
  // Simulate multiple failed login attempts or unusual patterns
  for (let i = 0; i < 5; i++) {
    await this.page!.fill('input[formcontrolname="password"]', 'wrongpassword');
    await this.page!.click('button[type="submit"]');
    await this.page!.waitForTimeout(500);
  }
});

// Projector operations
When('I click {string} on agenda item {string}', async function(this: CustomWorld, action: string, itemTitle: string) {
  const agendaItem = this.page!.locator(`.agenda-item:has-text("${itemTitle}")`);
  await agendaItem.locator(`button:has-text("${action}")`).click();
  await this.page!.waitForTimeout(1500);
});

// Vote details
When('I click on a specific vote', async function(this: CustomWorld) {
  const vote = this.page!.locator('.vote-item, .poll-item').first();
  await vote.click();
  await this.page!.waitForTimeout(1000);
});

// Text merging
When('I merge and provide combined text', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Merge"), button:has-text("Combine texts")');
  await this.page!.waitForTimeout(1000);
  
  const mergedText = 'This is the merged text combining both versions';
  await this.page!.fill('textarea[placeholder*="Merged text"]', mergedText);
  await this.page!.click('button:has-text("Save merged")');
  await this.page!.waitForTimeout(1500);
});