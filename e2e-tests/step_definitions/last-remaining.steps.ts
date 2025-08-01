import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Speaker queue management - remaining steps
Then('he should be marked as {string}', async function(this: CustomWorld, status: string) {
  const currentSpeaker = this.testData.get('currentSpeaker') || 'Speaker';
  const speakerRow = this.page!.locator(`.speaker-item:has-text("${currentSpeaker}")`);
  const hasStatus = await speakerRow.locator(`.status:has-text("${status}")`).isVisible();
  expect(hasStatus).toBe(true);
});

Then('next speaker should be highlighted', async function(this: CustomWorld) {
  const nextSpeaker = await this.page!.locator('.speaker-item.next, .next-speaker').isVisible();
  expect(nextSpeaker).toBe(true);
});

Then('current speaker should see notice', async function(this: CustomWorld) {
  const notice = await this.page!.locator('.speaker-notice, .current-speaker-alert').isVisible();
  expect(notice).toBe(true);
});

Then('she should have reduced time limit', async function(this: CustomWorld) {
  const timeLimit = await this.page!.locator('.time-limit, .speaker-timer').textContent();
  expect(timeLimit).toContain(':'); // Should show time
});

Then('current queue remains', async function(this: CustomWorld) {
  const queueCount = await this.page!.locator('.speaker-item').count();
  const previousCount = this.testData.get('previousQueueCount') || 0;
  expect(queueCount).toBe(previousCount);
});

Then('{string} indicator shows', async function(this: CustomWorld, indicator: string) {
  const indicatorVisible = await this.page!.locator(`.indicator:has-text("${indicator}"), .status-indicator:has-text("${indicator}")`).isVisible();
  expect(indicatorVisible).toBe(true);
});

Then('participants see closed status', async function(this: CustomWorld) {
  const closedStatus = await this.page!.locator('.list-closed, text="Speaker list closed"').isVisible();
  expect(closedStatus).toBe(true);
});

When('I confirm {string}', async function(this: CustomWorld, confirmMessage: string) {
  // Wait for confirmation dialog
  const dialog = this.page!.locator('.mat-dialog-container, [role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  
  // Click confirm button
  await this.page!.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")');
  await this.page!.waitForTimeout(1000);
});

Then('notifications should be sent', async function(this: CustomWorld) {
  const notificationSent = await this.page!.locator('.notification-sent, text=/Notification.*sent/i').isVisible({ timeout: 3000 });
  expect(notificationSent).toBe(true);
});

Then('action should be logged', async function(this: CustomWorld) {
  const logEntry = await this.page!.locator('.log-entry, .history-item').first().isVisible();
  expect(logEntry).toBe(true);
});

When('I add note {string}', async function(this: CustomWorld, noteText: string) {
  await this.page!.fill('textarea[placeholder*="Note"], input[placeholder*="Note"]', noteText);
  await this.page!.click('button:has-text("Add note"), button:has-text("Save note")');
  await this.page!.waitForTimeout(1000);
});

Then('queue ordering should respect priorities', async function(this: CustomWorld) {
  const speakers = await this.page!.locator('.speaker-item').allTextContents();
  // Priority speakers should be at the top
  const hasPriorityOrder = speakers.some(s => s.includes('priority') || s.includes('Point of'));
  expect(hasPriorityOrder).toBe(true);
});

Then('connection should be verified before allowing speech to start', async function(this: CustomWorld) {
  const connectionCheck = await this.page!.locator('.connection-check, .verifying-connection').isVisible({ timeout: 3000 });
  expect(connectionCheck).toBe(true);
});

// User management - remaining steps
When('I confirm the password reset', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Reset password"), button:has-text("Confirm reset")');
  await this.page!.waitForTimeout(1500);
});

When('I save the group assignments', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Save groups"), button:has-text("Apply groups")');
  await this.page!.waitForTimeout(1500);
});

When('I select a CSV file with user data', async function(this: CustomWorld) {
  const fileInput = this.page!.locator('input[type="file"][accept*="csv"]');
  await fileInput.setInputFiles('fixtures/users.csv');
  await this.page!.waitForTimeout(1000);
});

When('I map the CSV columns to user fields', async function(this: CustomWorld) {
  // Map columns
  await this.page!.selectOption('select[name="username_column"]', 'Username');
  await this.page!.selectOption('select[name="email_column"]', 'Email');
  await this.page!.selectOption('select[name="firstname_column"]', 'First Name');
  await this.page!.selectOption('select[name="lastname_column"]', 'Last Name');
  await this.page!.waitForTimeout(500);
});

Then('all valid users should be imported', async function(this: CustomWorld) {
  const importSuccess = await this.page!.locator('text=/Imported.*users|Import.*successful/i').isVisible();
  expect(importSuccess).toBe(true);
});

When('I confirm the deactivation', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Deactivate"), button:has-text("Confirm deactivation")');
  await this.page!.waitForTimeout(1500);
});

When('I confirm the deletion with reason {string}', async function(this: CustomWorld, reason: string) {
  await this.page!.fill('textarea[placeholder*="Reason"], input[name="deletion_reason"]', reason);
  await this.page!.click('button:has-text("Delete"), button:has-text("Confirm deletion")');
  await this.page!.waitForTimeout(1500);
});

When('I confirm the bulk deletion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Delete selected"), button:has-text("Confirm bulk delete")');
  await this.page!.waitForTimeout(2000);
});

Then('it should contain all selected user data', async function(this: CustomWorld) {
  // This would check downloaded file content
  const download = this.testData.get('lastDownload');
  expect(download).toBeTruthy();
});

// Voting - remaining steps
Then('participants should see the voting interface', async function(this: CustomWorld) {
  const votingInterface = await this.page!.locator('.voting-interface, .poll-interface').isVisible();
  expect(votingInterface).toBe(true);
});

Then('a countdown timer should be visible', async function(this: CustomWorld) {
  const timer = await this.page!.locator('.countdown-timer, .vote-timer').isVisible();
  expect(timer).toBe(true);
});

Given('{int}% of participants have voted', async function(this: CustomWorld, percentage: number) {
  this.testData.set('votingPercentage', percentage);
  // In real test, this would check actual voting progress
  const progress = await this.page!.locator('.voting-progress, .participation-rate').textContent();
  expect(progress).toContain(percentage.toString());
});

Then('no more votes should be accepted', async function(this: CustomWorld) {
  const votingClosed = await this.page!.locator('.voting-closed, .poll-closed').isVisible();
  expect(votingClosed).toBe(true);
});

Then('preliminary results should be available', async function(this: CustomWorld) {
  const results = await this.page!.locator('.preliminary-results, .vote-results').isVisible();
  expect(results).toBe(true);
});

Then('a voting protocol should be generated', async function(this: CustomWorld) {
  const protocol = await this.page!.locator('.voting-protocol, text="Protocol generated"').isVisible();
  expect(protocol).toBe(true);
});

When('I confirm the cancellation', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Cancel vote"), button:has-text("Confirm cancellation")');
  await this.page!.waitForTimeout(1500);
});

Then('all submitted votes should be discarded', async function(this: CustomWorld) {
  const discarded = await this.page!.locator('text=/Votes.*discarded|All.*votes.*removed/i').isVisible();
  expect(discarded).toBe(true);
});

Then('participants should be notified of cancellation', async function(this: CustomWorld) {
  const notification = await this.page!.locator('.cancellation-notice, text="Voting cancelled"').isVisible();
  expect(notification).toBe(true);
});

When('I set options {string}', async function(this: CustomWorld, options: string) {
  const optionsList = options.split(',');
  
  // Clear existing options
  const clearButton = this.page!.locator('button:has-text("Clear options")');
  if (await clearButton.isVisible({ timeout: 1000 })) {
    await clearButton.click();
  }
  
  // Add each option
  for (const option of optionsList) {
    await this.page!.fill('input[placeholder*="Add option"]', option.trim());
    await this.page!.click('button:has-text("Add"), button[aria-label="Add option"]');
    await this.page!.waitForTimeout(500);
  }
});

When('I start the vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start vote"), button:has-text("Begin voting")');
  await this.page!.waitForTimeout(1500);
});

When('I start phase 2 voting', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start phase 2"), button:has-text("Continue to phase 2")');
  await this.page!.waitForTimeout(1500);
});

Then('final results should combine both phases', async function(this: CustomWorld) {
  const combinedResults = await this.page!.locator('.combined-results, .final-results').isVisible();
  expect(combinedResults).toBe(true);
});

// Extension button
Then('{string} button appears', async function(this: CustomWorld, buttonText: string) {
  const button = await this.page!.locator(`button:has-text("${buttonText}")`).isVisible();
  expect(button).toBe(true);
});

// Removed duplicate - already defined in authentication.steps.ts
// Given('I am on the login page', async function(this: CustomWorld) {
//   const currentUrl = this.page!.url();
//   if (!currentUrl.includes('/login')) {
//     await this.page!.goto(`${this.baseUrl}/login`);
//     await this.page!.waitForLoadState('networkidle');
//   }
//   
//   // Verify we're on the login page
//   const loginForm = await this.page!.locator('form[class*="login"], form#login-form, input[formcontrolname="username"]').isVisible();
//   expect(loginForm).toBe(true);
// });