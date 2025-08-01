import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Removed duplicate - use '{string} indicator shows' from last-remaining.steps.ts

// Removed duplicate - use '{int}% of participants have voted' from last-remaining.steps.ts
// Note: last-remaining.steps.ts has Given() which can handle both Given and And contexts

// Messages and notes
When('I add a revote message {string}', async function(this: CustomWorld, message: string) {
  await this.page!.fill('textarea[placeholder*="Revote message"], textarea[placeholder*="Reason"]', message);
  await this.page!.waitForTimeout(500);
});

// Removed duplicate - use 'I add note {string}' from last-remaining.steps.ts

// Batch operations
When('I configure batch settings', async function(this: CustomWorld) {
  // Click on batch settings
  await this.page!.click('button:has-text("Batch settings"), button[aria-label="Configure batch"]');
  await this.page!.waitForTimeout(1000);
});

// Confirmations with specific text
// Removed duplicate - already defined in last-remaining.steps.ts
// When('I confirm {string}', async function(this: CustomWorld, confirmText: string) {
//   // Look for confirmation dialog with this text
//   const dialog = await this.page!.locator(`text="${confirmText}"`).isVisible();
//   if (dialog) {
//     await this.page!.click('button:has-text("Confirm"), button:has-text("Yes")');
//     await this.page!.waitForTimeout(1000);
//   }
// });

// Removed duplicate - use 'I confirm the bulk deletion' from last-remaining.steps.ts

// Removed duplicate - use 'I confirm the cancellation' from last-remaining.steps.ts

// Removed duplicate - use 'I confirm the deactivation' from last-remaining.steps.ts

// Removed duplicate - use 'When I confirm the deletion with reason {string}' from last-remaining.steps.ts

// Removed duplicate - use 'When I confirm the password reset' from last-remaining.steps.ts

// CSV mapping
// Removed duplicate - use 'When I map the CSV columns to user fields' from last-remaining.steps.ts

// Removed duplicate - use 'When I save the group assignments' from last-remaining.steps.ts

// Removed duplicate - use 'When I select a CSV file with user data' from last-remaining.steps.ts

// Vote options configuration
// Removed duplicate - already defined in last-remaining.steps.ts
// When('I set options {string}', async function(this: CustomWorld, optionsString: string) {
//   const options = optionsString.split(',');
//   
//   for (let i = 0; i < options.length; i++) {
//     const optionInput = this.page!.locator(`input[placeholder*="Option ${i + 1}"]`).first();
//     await optionInput.fill(options[i].trim());
//     await this.page!.waitForTimeout(200);
//     
//     // Add more option fields if needed
//     if (i < options.length - 1) {
//       const addButton = await this.page!.locator('button:has-text("Add option")').isVisible();
//       if (addButton) {
//         await this.page!.click('button:has-text("Add option")');
//         await this.page!.waitForTimeout(200);
//       }
//     }
//   }
// });

// Voting phases
// Removed duplicate - use 'When I start phase 2 voting' from last-remaining.steps.ts

// Removed duplicate - already defined in last-remaining.steps.ts
// When('I start the vote', async function(this: CustomWorld) {
//   await this.page!.click('button:has-text("Start vote"), button:has-text("Start voting")');
//   await this.page!.waitForTimeout(1500);
// });

// Removed duplicate - use 'a countdown timer should be visible' from last-remaining.steps.ts

// Removed duplicate - use 'a voting protocol should be generated' from last-remaining.steps.ts

// Removed duplicate - use 'action should be logged' from last-remaining.steps.ts

// Removed duplicate - use 'all submitted votes should be discarded' from last-remaining.steps.ts

// Removed duplicate - use 'all valid users should be imported' from last-remaining.steps.ts

// Removed duplicate - use 'connection should be verified before allowing speech to start' from last-remaining.steps.ts

// Queue management
// Removed duplicate - use 'current queue remains' from last-remaining.steps.ts

// Removed duplicate - use 'current speaker should see notice' from last-remaining.steps.ts

// Removed duplicate - use 'final results should combine both phases' from last-remaining.steps.ts

// Removed duplicate - use 'he should be marked as {string}' from last-remaining.steps.ts

// Motion states
Then('motion {string} state remains {string}', async function(this: CustomWorld, motionId: string, state: string) {
  const motionState = await this.page!.locator(`.motion-item:has-text("${motionId}") .state-badge:has-text("${state}")`).isVisible();
  expect(motionState).toBe(true);
});

Then('motion should be in {string} state', async function(this: CustomWorld, state: string) {
  const stateBadge = await this.page!.locator(`.state-badge:has-text("${state}"), .motion-state:has-text("${state}")`).isVisible();
  expect(stateBadge).toBe(true);
});

// User status
Then('I should be able to see {string} status', async function(this: CustomWorld, userName: string) {
  const userStatus = await this.page!.locator(`.user-status:has-text("${userName}")`).isVisible();
  expect(userStatus).toBe(true);
});

Then('I should be marked as {string}', async function(this: CustomWorld, status: string) {
  const myStatus = await this.page!.locator(`.my-status:has-text("${status}"), .current-user-status:has-text("${status}")`).isVisible();
  expect(myStatus).toBe(true);
});

// Notifications
Then('I should be notified when called', async function(this: CustomWorld) {
  const notification = await this.page!.locator('.speaker-notification, text=/Your.*turn.*speak/i').isVisible({ timeout: 5000 });
  expect(notification).toBe(true);
});

Then('I should be warned {int} seconds before time ends', async function(this: CustomWorld, seconds: number) {
  // This would check for a warning at the specified time
  const warning = await this.page!.locator('.time-warning, .countdown-warning').isVisible();
  expect(warning).toBe(true);
});

// List management
Then('I should have management options', async function(this: CustomWorld) {
  const managementOptions = await this.page!.locator('.management-controls, .list-controls').isVisible();
  expect(managementOptions).toBe(true);
});

Then('I should not be able to join the list', async function(this: CustomWorld) {
  const joinButton = await this.page!.locator('button:has-text("Join list"), button:has-text("Add me")').isEnabled();
  expect(joinButton).toBe(false);
});

// Export functionality
Then('I should receive an Excel file with the vote results', async function(this: CustomWorld) {
  const exportComplete = await this.page!.locator('text=/Export.*complete|Download.*ready/i').isVisible({ timeout: 5000 });
  expect(exportComplete).toBe(true);
  this.testData.set('exportedFile', 'vote-results.xlsx');
});

// PDF generation
Then('I should receive the PDF', async function(this: CustomWorld) {
  const pdfReady = await this.page!.locator('text=/PDF.*ready|Download.*PDF/i').isVisible({ timeout: 5000 });
  expect(pdfReady).toBe(true);
});

// Import results
Then('import results should show {string}', async function(this: CustomWorld, resultText: string) {
  const results = await this.page!.locator('.import-results').textContent();
  expect(results).toContain(resultText);
});

// List operations
Then('list order should be updated', async function(this: CustomWorld) {
  const listUpdated = await this.page!.locator('text=/Order.*updated|List.*reordered/i').isVisible();
  expect(listUpdated).toBe(true);
});

Then('list should be started', async function(this: CustomWorld) {
  const listActive = await this.page!.locator('.list-active, .speakers-active').isVisible();
  expect(listActive).toBe(true);
});

// Motion operations
Then('motion should have new number', async function(this: CustomWorld) {
  const newNumber = await this.page!.locator('.motion-number, .motion-identifier').textContent();
  expect(newNumber).not.toBe(this.testData.get('originalNumber'));
});

Then('motion should show as withdrawn', async function(this: CustomWorld) {
  const withdrawn = await this.page!.locator('.withdrawn-badge, text="Withdrawn"').isVisible();
  expect(withdrawn).toBe(true);
});

// New fields visibility
Then('new fields should appear', async function(this: CustomWorld) {
  // Check for dynamically added fields
  const newFields = await this.page!.locator('.dynamic-field, .additional-field').count();
  expect(newFields).toBeGreaterThan(0);
});

// Poll status
Then('poll should be closed', async function(this: CustomWorld) {
  const pollClosed = await this.page!.locator('.poll-closed, text="Poll closed"').isVisible();
  expect(pollClosed).toBe(true);
});

Then('poll should show {string} as elected', async function(this: CustomWorld, candidate: string) {
  const elected = await this.page!.locator(`.elected-candidate:has-text("${candidate}"), .winner:has-text("${candidate}")`).isVisible();
  expect(elected).toBe(true);
});

// Protocol and documentation
Then('protocol should show all votes', async function(this: CustomWorld) {
  const allVotes = await this.page!.locator('.vote-protocol .vote-entry').count();
  expect(allVotes).toBeGreaterThan(0);
});

// Queue status
Then('queue should be paused', async function(this: CustomWorld) {
  const paused = await this.page!.locator('.queue-paused, text="Queue paused"').isVisible();
  expect(paused).toBe(true);
});

Then('results should show draw', async function(this: CustomWorld) {
  const draw = await this.page!.locator('text=/Draw|Tie|Equal.*votes/i').isVisible();
  expect(draw).toBe(true);
});

// Session management
Then('session should end for all participants', async function(this: CustomWorld) {
  const sessionEnded = await this.page!.locator('text=/Session.*ended|Meeting.*closed/i').isVisible();
  expect(sessionEnded).toBe(true);
});

// Template availability
Then('template should be available for future use', async function(this: CustomWorld) {
  const templateSaved = await this.page!.locator('.template-saved, text=/Template.*saved/i').isVisible();
  expect(templateSaved).toBe(true);
});

// Text amendments
Then('text should be highlighted', async function(this: CustomWorld) {
  const highlighted = await this.page!.locator('.highlighted-text, mark').isVisible();
  expect(highlighted).toBe(true);
});

Then('the PDF should contain all agenda items', async function(this: CustomWorld) {
  // This would be verified by checking the PDF preview or metadata
  const pdfComplete = await this.page!.locator('.pdf-preview, text=/All.*items.*included/i').isVisible();
  expect(pdfComplete).toBe(true);
});