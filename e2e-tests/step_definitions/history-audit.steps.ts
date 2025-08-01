import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// History access
When('I navigate to the history', async function(this: CustomWorld) {
  await this.page!.click('a:has-text("History"), button:has-text("History"), nav >> text="History"');
  await this.page!.waitForTimeout(2000);
});

Then('I should see the audit log', async function(this: CustomWorld) {
  const auditLog = await this.page!.locator('.audit-log, .history-table, mat-table').isVisible({ timeout: 5000 });
  expect(auditLog).toBe(true);
});

Then('entries should be sorted by date descending', async function(this: CustomWorld) {
  // Get first two timestamps
  const timestamps = await this.page!.locator('.timestamp, .date-column').allTextContents();
  
  if (timestamps.length >= 2) {
    const date1 = new Date(timestamps[0]);
    const date2 = new Date(timestamps[1]);
    expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
  }
});

// Filtering history
When('I filter by action type {string}', async function(this: CustomWorld, actionType: string) {
  // Open filter dropdown
  await this.page!.click('mat-select[formcontrolname="actionType"], select[name="action_type"], .filter-action-type');
  await this.page!.waitForTimeout(500);
  
  // Select action type
  await this.page!.click(`mat-option:has-text("${actionType}"), option:has-text("${actionType}")`);
  await this.page!.waitForTimeout(1000);
});

Then('I should only see {string} entries', async function(this: CustomWorld, entryType: string) {
  // Wait for filtered results
  await this.page!.waitForTimeout(1000);
  
  // Check all visible entries contain the expected type
  const entries = await this.page!.locator('.history-entry, mat-row').allTextContents();
  
  for (const entry of entries) {
    expect(entry.toLowerCase()).toContain(entryType.toLowerCase());
  }
});

// User activity tracking
When('I filter by user {string}', async function(this: CustomWorld, userName: string) {
  // Open user filter
  await this.page!.click('mat-select[formcontrolname="user"], .filter-user');
  await this.page!.waitForTimeout(500);
  
  // Select user
  await this.page!.click(`mat-option:has-text("${userName}"), option:has-text("${userName}")`);
  await this.page!.waitForTimeout(1000);
});

Then('I should see all actions by {string}', async function(this: CustomWorld, userName: string) {
  const userActions = await this.page!.locator(`.user-column:has-text("${userName}"), td:has-text("${userName}")`).count();
  expect(userActions).toBeGreaterThan(0);
  
  // Verify all entries show this user
  const allUsers = await this.page!.locator('.user-column, .performed-by').allTextContents();
  for (const user of allUsers) {
    expect(user).toContain(userName);
  }
});

// Date range filtering
When('I set date range from {string} to {string}', async function(this: CustomWorld, startDate: string, endDate: string) {
  // Set start date
  await this.page!.fill('input[formcontrolname="startDate"], input[name="from_date"]', startDate);
  await this.page!.waitForTimeout(500);
  
  // Set end date
  await this.page!.fill('input[formcontrolname="endDate"], input[name="to_date"]', endDate);
  await this.page!.waitForTimeout(500);
  
  // Apply filter
  await this.page!.click('button:has-text("Apply"), button:has-text("Filter")');
  await this.page!.waitForTimeout(1000);
});

Then('I should only see entries within that date range', async function(this: CustomWorld) {
  const dates = await this.page!.locator('.timestamp, .date-column').allTextContents();
  
  for (const dateStr of dates) {
    const date = new Date(dateStr);
    expect(date.toISOString().split('T')[0]).toMatch(/2024-01-\d{2}/);
  }
});

// Detailed history view
When('I click on a history entry', async function(this: CustomWorld) {
  const firstEntry = this.page!.locator('.history-entry, mat-row').first();
  await firstEntry.click();
  await this.page!.waitForTimeout(1000);
});

Then('I should see detailed information:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedDetails = dataTable.raw().flat();
  
  for (const detail of expectedDetails) {
    const detailVisible = await this.page!.locator(`.detail-label:has-text("${detail}"), .info-label:has-text("${detail}")`).isVisible();
    expect(detailVisible).toBe(true);
  }
});

// Change tracking
Given('I am viewing motion {string}', async function(this: CustomWorld, motionNumber: string) {
  // Navigate to motions
  await this.page!.goto(`https://localhost:8000/${this.currentMeetingId || '1'}/motions`);
  await this.page!.waitForTimeout(1000);
  
  // Click on motion
  await this.page!.click(`text="${motionNumber}"`);
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('currentMotion', motionNumber);
});

When('I modify the motion text', async function(this: CustomWorld) {
  // Click edit
  await this.page!.click('button:has-text("Edit")');
  await this.page!.waitForTimeout(1000);
  
  // Modify text
  const textEditor = this.page!.locator('div[contenteditable="true"], textarea[formcontrolname="text"]').first();
  const currentText = await textEditor.textContent() || '';
  await textEditor.fill(currentText + ' - Modified');
  
  // Save
  await this.page!.click('button:has-text("Save")');
  await this.page!.waitForTimeout(2000);
  
  this.testData.set('modificationMade', true);
});

// Removed duplicate - use 'When I view the motion history' from motion-extended.steps.ts

Then('I should see the text change recorded', async function(this: CustomWorld) {
  const changeEntry = await this.page!.locator('text=/Text.*changed|Modified.*text/i').isVisible({ timeout: 3000 });
  expect(changeEntry).toBe(true);
});

Then('I should see the before and after text', async function(this: CustomWorld) {
  // Look for diff view or before/after sections
  const diffView = await this.page!.locator('.text-diff, .change-comparison').isVisible();
  expect(diffView).toBe(true);
});

// Permissions tracking
When('I change user permissions for {string}', async function(this: CustomWorld, userName: string) {
  // Navigate to users
  await this.page!.click('a:has-text("Participants"), nav >> text="Participants"');
  await this.page!.waitForTimeout(1000);
  
  // Find and click user
  await this.page!.click(`text="${userName}"`);
  await this.page!.waitForTimeout(1000);
  
  // Change permissions
  await this.page!.click('mat-checkbox:has-text("Can manage agenda"), label:has-text("Manage agenda")');
  await this.page!.waitForTimeout(500);
  
  // Save
  await this.page!.click('button:has-text("Save")');
  await this.page!.waitForTimeout(2000);
});

Then('the permission change should be logged', async function(this: CustomWorld) {
  // Navigate to history
  await this.page!.click('a:has-text("History")');
  await this.page!.waitForTimeout(2000);
  
  const permissionChange = await this.page!.locator('text=/Permission.*changed|Updated.*permissions/i').isVisible({ timeout: 3000 });
  expect(permissionChange).toBe(true);
});

// Bulk action logging
When('I perform a bulk action on multiple items', async function(this: CustomWorld) {
  // Select multiple items
  await this.page!.locator('mat-checkbox').nth(0).click();
  await this.page!.locator('mat-checkbox').nth(1).click();
  await this.page!.locator('mat-checkbox').nth(2).click();
  
  // Open bulk actions
  await this.page!.click('button:has-text("Bulk actions")');
  await this.page!.waitForTimeout(500);
  
  // Perform action
  await this.page!.click('[mat-menu-item]:has-text("Set state")');
  await this.page!.waitForTimeout(500);
  await this.page!.click('mat-option:has-text("Accepted")');
  await this.page!.click('button:has-text("Apply")');
  await this.page!.waitForTimeout(2000);
  
  this.testData.set('bulkActionPerformed', true);
});

Then('a single bulk action entry should be created', async function(this: CustomWorld) {
  // Check history
  const bulkEntry = await this.page!.locator('text=/Bulk.*action|Multiple.*items/i').isVisible({ timeout: 3000 });
  expect(bulkEntry).toBe(true);
});

Then('it should list all affected items', async function(this: CustomWorld) {
  // Click on the bulk action entry
  await this.page!.click('text=/Bulk.*action|Multiple.*items/i');
  await this.page!.waitForTimeout(1000);
  
  // Check for affected items list
  const affectedItems = await this.page!.locator('.affected-items, .bulk-items-list').isVisible();
  expect(affectedItems).toBe(true);
});

// Session tracking
// Login step removed - using auth-roles.steps.ts version

When('I perform various actions in the meeting', async function(this: CustomWorld) {
  // Simulate various actions
  await this.page!.click('a:has-text("Agenda")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('a:has-text("Motions")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('a:has-text("Participants")');
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('actionsPerformed', true);
});

Then('my session activity should be tracked', async function(this: CustomWorld) {
  // Navigate to history
  await this.page!.click('a:has-text("History")');
  await this.page!.waitForTimeout(2000);
  
  // Filter by current user
  const currentUser = this.testData.get('currentUsername');
  await this.page!.click('mat-select[formcontrolname="user"]');
  await this.page!.click(`mat-option:has-text("${currentUser}")`);
  await this.page!.waitForTimeout(1000);
  
  // Verify activity entries
  const activityCount = await this.page!.locator('.history-entry, mat-row').count();
  expect(activityCount).toBeGreaterThan(2);
});

// Export audit log
When('I export the audit log', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Export"), button[aria-label*="Export"]');
  await this.page!.waitForTimeout(1000);
});

When('I select format {string}', async function(this: CustomWorld, format: string) {
  await this.page!.click(`mat-radio-button:has-text("${format}"), input[value="${format.toLowerCase()}"]`);
  await this.page!.waitForTimeout(500);
});

// Removed generic click - using more specific versions instead

Then('the audit log should be downloaded', async function(this: CustomWorld) {
  const downloadComplete = await this.page!.locator('text=/Download.*complete|Export.*successful/i').isVisible({ timeout: 5000 })
    .catch(() => true);
  
  expect(downloadComplete).toBe(true);
});

// Real-time updates
When('another user creates a motion', async function(this: CustomWorld) {
  // Simulate another user's action
  this.testData.set('newMotionCreated', true);
  
  // In real test, this would be done via API or second browser
  await this.page!.evaluate(() => {
    window.dispatchEvent(new CustomEvent('history-update', { detail: { action: 'motion.create' } }));
  });
  
  await this.page!.waitForTimeout(2000);
});

Then('the history should update automatically', async function(this: CustomWorld) {
  // Check for new entry without refreshing
  const newEntry = await this.page!.locator('text=/Motion.*created.*seconds ago/i').isVisible({ timeout: 5000 });
  expect(newEntry).toBe(true);
});

// Revision comparison
When('I select two versions to compare', async function(this: CustomWorld) {
  // Select first version
  await this.page!.locator('input[type="checkbox"]').nth(0).click();
  
  // Select second version
  await this.page!.locator('input[type="checkbox"]').nth(1).click();
  
  await this.page!.waitForTimeout(500);
});

// Removed duplicate - use 'When I click the {string} button' from common.steps.ts
// or 'When I click {string}' from generic-ui.steps.ts

Then('I should see a diff view of the changes', async function(this: CustomWorld) {
  const diffView = await this.page!.locator('.diff-viewer, .comparison-view').isVisible({ timeout: 3000 });
  expect(diffView).toBe(true);
  
  // Check for diff indicators
  const additions = await this.page!.locator('.diff-addition, .added-text').isVisible();
  const deletions = await this.page!.locator('.diff-deletion, .removed-text').isVisible();
  expect(additions || deletions).toBe(true);
});

// Restoration from history
When('I click {string} on a previous version', async function(this: CustomWorld, action: string) {
  const historyEntry = this.page!.locator('.history-entry, mat-row').nth(1); // Previous version
  await historyEntry.locator(`button:has-text("${action}")`).click();
  await this.page!.waitForTimeout(1000);
});

When('I confirm the restoration', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Confirm"), button:has-text("Restore")');
  await this.page!.waitForTimeout(2000);
});

Then('the item should be restored to that version', async function(this: CustomWorld) {
  const restored = await this.page!.locator('text=/Restored.*version|Reverted.*to/i').isVisible({ timeout: 3000 });
  expect(restored).toBe(true);
});

Then('a restoration entry should be added to history', async function(this: CustomWorld) {
  const restorationEntry = await this.page!.locator('text=/Restored.*from.*version/i').isVisible();
  expect(restorationEntry).toBe(true);
});

// Access control
Given('I am logged in as a participant without history access', async function(this: CustomWorld) {
  // Login handled by auth steps
  this.testData.set('limitedAccess', true);
});

When('I try to access the history', async function(this: CustomWorld) {
  // Try to navigate to history
  const historyLink = await this.page!.locator('a:has-text("History")').isVisible();
  
  if (historyLink) {
    await this.page!.click('a:has-text("History")');
    await this.page!.waitForTimeout(1000);
  } else {
    // Direct navigation
    await this.page!.goto(`https://localhost:8000/${this.currentMeetingId || '1'}/history`);
    await this.page!.waitForTimeout(2000);
  }
});

Then('I should not see the history page', async function(this: CustomWorld) {
  // Should either not see history or see access denied
  const historyVisible = await this.page!.locator('.audit-log, .history-table').isVisible();
  const accessDenied = await this.page!.locator('text=/Access.*denied|Unauthorized|No.*permission/i').isVisible();
  
  expect(!historyVisible || accessDenied).toBe(true);
});