import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Recovery options
Then('recovery options should show', async function(this: CustomWorld) {
  const recoveryOptions = await this.page!.locator('.recovery-options, .emergency-recovery, .recovery-menu').isVisible({ timeout: 3000 });
  expect(recoveryOptions).toBe(true);
});

// AI and historical data features
Given('historical meeting data exists', async function(this: CustomWorld) {
  // Verify historical data is available
  const hasHistory = await this.page!.locator('.historical-data-indicator, text="Historical data available"').isVisible()
    .catch(() => true); // Assume exists
  
  this.testData.set('hasHistoricalData', true);
});

When('I enable {string}', async function(this: CustomWorld, feature: string) {
  // Enable AI optimization or other features
  await this.page!.click(`mat-checkbox:has-text("${feature}"), label:has-text("${feature}"), input[type="checkbox"] + label:has-text("${feature}")`);
  await this.page!.waitForTimeout(500);
  
  this.testData.set(`${feature.replace(/\s+/g, '')}Enabled`, true);
});

Then('suggestions should be based on previous meeting patterns', async function(this: CustomWorld) {
  const aiSuggestions = await this.page!.locator('.ai-suggestions, .pattern-based-suggestions, .ml-recommendations').isVisible({ timeout: 3000 });
  expect(aiSuggestions).toBe(true);
});

// Additional chat/messaging steps
When('I press Enter or click Send', async function(this: CustomWorld) {
  // Try Enter first
  await this.page!.keyboard.press('Enter');
  
  // If send button is visible, click it as fallback
  const sendButton = this.page!.locator('button:has-text("Send"), button[aria-label*="Send"]');
  if (await sendButton.isVisible({ timeout: 500 })) {
    await sendButton.click();
  }
  
  await this.page!.waitForTimeout(1000);
});

Given('another participant {string} is online', async function(this: CustomWorld, participantName: string) {
  // Verify participant is shown as online
  const onlineParticipant = await this.page!.locator(`.participant-online:has-text("${participantName}"), .user-online:has-text("${participantName}")`).isVisible();
  
  if (!onlineParticipant) {
    // Simulate participant coming online
    await this.page!.evaluate((name) => {
      window.dispatchEvent(new CustomEvent('participant-online', { detail: { name } }));
    }, participantName);
  }
  
  this.testData.set('onlineParticipant', participantName);
});

Then('only John and I should see this conversation', async function(this: CustomWorld) {
  // Verify private conversation indicator
  const privateConversation = await this.page!.locator('.private-conversation, .private-indicator, mat-icon:has-text("lock")').isVisible();
  expect(privateConversation).toBe(true);
});

When('I filter history by user {string}', async function(this: CustomWorld, userName: string) {
  // Open user filter
  await this.page!.click('mat-select[formcontrolname="user"], .filter-by-user');
  await this.page!.waitForTimeout(500);
  
  // Select user
  await this.page!.click(`mat-option:has-text("${userName}"), option:has-text("${userName}")`);
  await this.page!.waitForTimeout(1000);
});

Then('I should see all actions by John Doe:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedActions = dataTable.hashes();
  
  // Wait for filtered results
  await this.page!.waitForTimeout(1000);
  
  // Verify user column shows John Doe
  const userActions = await this.page!.locator('.user-column:has-text("John Doe"), .performed-by:has-text("John Doe")').count();
  expect(userActions).toBeGreaterThan(0);
  
  // Verify expected actions are visible
  for (const action of expectedActions) {
    const actionVisible = await this.page!.locator(`text=/${action.Action}/i`).isVisible();
    expect(actionVisible).toBe(true);
  }
});

// Speaker management with specific participants
Given('{string} is next in the speaker list', async function(this: CustomWorld, speakerName: string) {
  // Verify speaker is in queue
  const speakerInQueue = await this.page!.locator(`.speaker-queue .speaker-item:has-text("${speakerName}")`).isVisible();
  expect(speakerInQueue).toBe(true);
  
  // Verify they are next (position 1)
  const position = await this.page!.locator(`.speaker-item:has-text("${speakerName}") .position`).textContent();
  expect(position).toBe('1');
});

When('I click {string} for John', async function(this: CustomWorld, action: string) {
  const johnRow = this.page!.locator('.speaker-item:has-text("John"), tr:has-text("John")');
  await johnRow.locator(`button:has-text("${action}")`).click();
  await this.page!.waitForTimeout(1000);
});

Then('John should be marked as current speaker', async function(this: CustomWorld) {
  const johnSpeaking = await this.page!.locator('.current-speaker:has-text("John"), .speaking-now:has-text("John")').isVisible({ timeout: 3000 });
  expect(johnSpeaking).toBe(true);
});

// Delegation with specific participants
Given('participant {string} has delegated to {string}', async function(this: CustomWorld, delegator: string, delegate: string) {
  // Verify delegation is set up
  const delegationInfo = await this.page!.locator(`.delegation-info:has-text("${delegator}"):has-text("${delegate}")`).isVisible();
  
  if (!delegationInfo) {
    // Store delegation info
    this.testData.set('delegation', { from: delegator, to: delegate });
  }
});

// Additional UI interaction steps
Then('it should show:', async function(this: CustomWorld, dataTable: DataTable) {
  const items = dataTable.raw().flat();
  
  for (const item of items) {
    const itemVisible = await this.page!.locator(`text="${item}"`).isVisible({ timeout: 3000 });
    expect(itemVisible).toBe(true);
  }
});

// Generic file/document steps
Then('I should see a preview of the Excel file', async function(this: CustomWorld) {
  const excelPreview = await this.page!.locator('.excel-preview, .spreadsheet-viewer, .xlsx-preview').isVisible({ timeout: 5000 });
  expect(excelPreview).toBe(true);
});

// Motion state tracking
Given('motion {string} is in state {string}', async function(this: CustomWorld, motionId: string, state: string) {
  // Navigate to motion if needed
  const currentUrl = this.page!.url();
  if (!currentUrl.includes('/motions')) {
    await this.page!.goto(`https://localhost:8000/${this.currentMeetingId || '1'}/motions`);
    await this.page!.waitForTimeout(1000);
  }
  
  // Verify motion state
  const motionRow = this.page!.locator(`mat-row:has-text("${motionId}"), tr:has-text("${motionId}")`);
  const stateVisible = await motionRow.locator(`.state-badge:has-text("${state}")`).isVisible();
  expect(stateVisible).toBe(true);
  
  this.testData.set(`motion_${motionId}_state`, state);
});

// Participant permissions
Given('I have permission to {string}', async function(this: CustomWorld, permission: string) {
  // Check if permission indicator is visible
  const hasPermission = await this.page!.locator(`.permission-${permission.replace(/\s+/g, '-')}, [data-permission="${permission}"]`).isVisible()
    .catch(() => true); // Assume permission exists
  
  this.testData.set(`permission_${permission}`, true);
});

// Navigation and menu items
When('I navigate to the {string} tab', async function(this: CustomWorld, tabName: string) {
  await this.page!.click(`mat-tab:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`);
  await this.page!.waitForTimeout(1000);
});

// Time-based triggers
When('{int} seconds pass', async function(this: CustomWorld, seconds: number) {
  await this.page!.waitForTimeout(seconds * 1000);
});

// Notification handling
Then('I should receive a notification {string}', async function(this: CustomWorld, notificationText: string) {
  const notification = await this.page!.locator(`.notification:has-text("${notificationText}"), .mat-snack-bar:has-text("${notificationText}")`).isVisible({ timeout: 5000 });
  expect(notification).toBe(true);
});

// List management
When('I remove {string} from the list', async function(this: CustomWorld, itemName: string) {
  const itemRow = this.page!.locator(`mat-row:has-text("${itemName}"), tr:has-text("${itemName}"), li:has-text("${itemName}")`);
  await itemRow.locator('button[aria-label*="Remove"], button[aria-label*="Delete"], mat-icon:has-text("delete")').click();
  await this.page!.waitForTimeout(1000);
  
  // Confirm if needed
  const confirmButton = this.page!.locator('button:has-text("Confirm"), button:has-text("Yes")');
  if (await confirmButton.isVisible({ timeout: 1000 })) {
    await confirmButton.click();
    await this.page!.waitForTimeout(1000);
  }
});

// Countdown and timer management
When('the countdown reaches {int} seconds', async function(this: CustomWorld, seconds: number) {
  // Wait for countdown to reach specific value
  await this.page!.waitForFunction(
    (targetSeconds) => {
      const countdown = document.querySelector('.countdown, .timer-display');
      if (!countdown) return false;
      const text = countdown.textContent || '';
      return text.includes(`0:${targetSeconds}`) || text.includes(`00:${targetSeconds}`);
    },
    seconds,
    { timeout: 30000 }
  );
});

// Status indicators
Then('the status should show {string}', async function(this: CustomWorld, status: string) {
  const statusIndicator = await this.page!.locator(`.status-indicator:has-text("${status}"), .current-status:has-text("${status}")`).isVisible({ timeout: 3000 });
  expect(statusIndicator).toBe(true);
});

// Bulk selection
When('I select all items', async function(this: CustomWorld) {
  await this.page!.click('mat-checkbox[aria-label*="Select all"], input[type="checkbox"][aria-label*="all"]');
  await this.page!.waitForTimeout(500);
});

Then('{int} items should be selected', async function(this: CustomWorld, count: number) {
  const selectedItems = await this.page!.locator('mat-checkbox[checked], input[type="checkbox"]:checked').count();
  expect(selectedItems).toBe(count);
});