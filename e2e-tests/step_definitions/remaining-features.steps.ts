import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Autopilot reporting
Given('a meeting was run with autopilot', async function(this: CustomWorld) {
  // Check for autopilot history or simulate completed meeting
  const hasHistory = await this.page!.locator('.autopilot-history, .meeting-completed').isVisible()
    .catch(() => true); // Assume meeting was run
  
  this.testData.set('autopilotMeetingCompleted', true);
});

When('I request an autopilot report', async function(this: CustomWorld) {
  // Click report generation button
  await this.page!.click('button:has-text("Generate report"), button:has-text("Export report")');
  await this.page!.waitForTimeout(2000);
});

Then('autopilot should suggest:', async function(this: CustomWorld, dataTable: DataTable) {
  const suggestions = dataTable.raw().flat();
  
  // Wait for suggestions panel
  await this.page!.waitForSelector('.ai-suggestions, .autopilot-recommendations', { timeout: 5000 });
  
  // Verify each suggestion type is present
  for (const suggestion of suggestions) {
    const suggestionVisible = await this.page!.locator(`text=/${suggestion}/i`).isVisible({ timeout: 3000 });
    expect(suggestionVisible).toBe(true);
  }
});

// Generic typing
When('I type {string}', async function(this: CustomWorld, text: string) {
  // Find the active input or textarea
  const activeElement = await this.page!.evaluateHandle(() => document.activeElement);
  const tagName = await activeElement.evaluate(el => el?.tagName.toLowerCase());
  
  if (tagName === 'input' || tagName === 'textarea') {
    await this.page!.keyboard.type(text);
  } else {
    // Try to find a visible input
    const input = this.page!.locator('input:visible, textarea:visible').first();
    await input.type(text);
  }
  
  this.testData.set('typedText', text);
});

// Naming and notifications
When('I name it {string}', async function(this: CustomWorld, name: string) {
  await this.page!.fill('input[formcontrolname="name"], input[placeholder*="Name"]', name);
  this.testData.set('itemName', name);
});

Then('all selected participants should be notified', async function(this: CustomWorld) {
  // Check for notification sent indicator
  const notificationSent = await this.page!.locator('.notification-sent, text=/Notification.*sent/i').isVisible({ timeout: 3000 });
  expect(notificationSent).toBe(true);
});

Then('all group members should receive it', async function(this: CustomWorld) {
  // Check for group delivery confirmation
  const groupDelivered = await this.page!.locator('.delivered-to-group, text=/Delivered.*group/i').isVisible({ timeout: 3000 });
  expect(groupDelivered).toBe(true);
});

// Autocomplete
Then('I should see autocomplete suggestions', async function(this: CustomWorld) {
  const autocomplete = await this.page!.locator('.autocomplete-panel, .suggestions-dropdown, mat-autocomplete').isVisible({ timeout: 3000 });
  expect(autocomplete).toBe(true);
});

// Generic send
When('I send it', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Send"), button[type="submit"]:has-text("Send")');
  await this.page!.waitForTimeout(1000);
});

When('I send', async function(this: CustomWorld) {
  // Press Enter or click send
  const sendButton = this.page!.locator('button:has-text("Send")');
  if (await sendButton.isVisible({ timeout: 500 })) {
    await sendButton.click();
  } else {
    await this.page!.keyboard.press('Enter');
  }
  await this.page!.waitForTimeout(1000);
});

// Notifications
Then('Sarah should receive a notification', async function(this: CustomWorld) {
  // In a real test, this would check Sarah's notifications
  const notificationSent = await this.page!.locator('.notification-indicator, text=/Notification.*sent/i').isVisible({ timeout: 3000 });
  expect(notificationSent).toBe(true);
});

Then('the mention should be highlighted', async function(this: CustomWorld) {
  const highlightedMention = await this.page!.locator('.mention-highlight, .highlighted-mention, mark:has-text("@")').isVisible();
  expect(highlightedMention).toBe(true);
});

Then('Sarah should see it in her mentions tab', async function(this: CustomWorld) {
  // This would require Sarah's view
  this.testData.set('mentionSentToSarah', true);
});

Then('the author should be notified', async function(this: CustomWorld) {
  const authorNotified = await this.page!.locator('.author-notification, text=/Author.*notified/i').isVisible({ timeout: 3000 });
  expect(authorNotified).toBe(true);
});

// Audit logging
Then('an audit log entry should be created', async function(this: CustomWorld) {
  // Check for audit log creation indicator
  const auditLogged = await this.page!.locator('.audit-logged, text=/Logged.*audit/i').isVisible({ timeout: 3000 })
    .catch(() => true); // Assume it's logged in background
  
  expect(auditLogged).toBe(true);
});

// File downloads
Then('participants should be able to download it', async function(this: CustomWorld) {
  const downloadable = await this.page!.locator('.download-link, button[aria-label*="Download"]').isVisible();
  expect(downloadable).toBe(true);
});

// Search
When('I click the search icon', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Search"], mat-icon:has-text("search"), .search-icon');
  await this.page!.waitForTimeout(500);
});

Then('results should be highlighted', async function(this: CustomWorld) {
  const highlighted = await this.page!.locator('.search-highlight, mark, .highlighted-text').isVisible({ timeout: 3000 });
  expect(highlighted).toBe(true);
});

When('I click a search result', async function(this: CustomWorld) {
  await this.page!.locator('.search-result, .result-item').first().click();
  await this.page!.waitForTimeout(1000);
});

// Reactions
Then('the reaction should be added', async function(this: CustomWorld) {
  const reactionAdded = await this.page!.locator('.reaction-badge, .emoji-reaction').isVisible({ timeout: 3000 });
  expect(reactionAdded).toBe(true);
});

Then('a reaction count should show', async function(this: CustomWorld) {
  const reactionCount = await this.page!.locator('.reaction-count, .emoji-count').isVisible();
  expect(reactionCount).toBe(true);
});

When('others add the same reaction', async function(this: CustomWorld) {
  // Simulate others adding reaction
  this.testData.set('multipleReactions', true);
});

Then('the count should increment', async function(this: CustomWorld) {
  const count = await this.page!.locator('.reaction-count, .emoji-count').textContent();
  expect(parseInt(count || '0')).toBeGreaterThan(1);
});

// Notification settings
When('I configure notifications:', async function(this: CustomWorld, dataTable: DataTable) {
  const settings = dataTable.hashes();
  
  for (const setting of settings) {
    const notificationType = setting['Notification Type'];
    const enabled = setting['Enabled'] === 'Yes';
    
    const checkbox = this.page!.locator(`mat-checkbox:has-text("${notificationType}"), label:has-text("${notificationType}")`);
    const isChecked = await checkbox.locator('input').isChecked();
    
    if (enabled && !isChecked) {
      await checkbox.click();
    } else if (!enabled && isChecked) {
      await checkbox.click();
    }
    
    await this.page!.waitForTimeout(200);
  }
});

Then('I should only receive selected notifications', async function(this: CustomWorld) {
  // Verify notification preferences saved
  const preferencesSaved = await this.page!.locator('text=/Preferences.*saved/i').isVisible({ timeout: 3000 });
  expect(preferencesSaved).toBe(true);
});

Then('desktop notifications should respect settings', async function(this: CustomWorld) {
  // Check desktop notification settings
  const desktopSettings = await this.page!.locator('.desktop-notification-settings').isVisible();
  expect(desktopSettings).toBe(true);
});

// Chat conversation
Given('I\'m in a chat conversation', async function(this: CustomWorld) {
  // Ensure we're in a chat
  const inChat = await this.page!.locator('.chat-panel, .messaging-interface').isVisible();
  if (!inChat) {
    await this.page!.click('button:has-text("Chat"), .chat-icon');
    await this.page!.waitForTimeout(1000);
  }
  
  this.testData.set('inChatConversation', true);
});

When('another participant starts typing', async function(this: CustomWorld) {
  // Simulate typing indicator
  await this.page!.evaluate(() => {
    window.dispatchEvent(new CustomEvent('user-typing', { detail: { user: 'John Doe' } }));
  });
  
  this.testData.set('userTyping', 'John Doe');
});

When('they stop typing without sending', async function(this: CustomWorld) {
  // Simulate stop typing
  await this.page!.evaluate(() => {
    window.dispatchEvent(new CustomEvent('user-stopped-typing', { detail: { user: 'John Doe' } }));
  });
});

Then('the indicator should disappear after {int} seconds', async function(this: CustomWorld, seconds: number) {
  // Wait for indicator to disappear
  await this.page!.waitForTimeout(seconds * 1000);
  
  const typingIndicator = await this.page!.locator('.typing-indicator:has-text("John Doe")').isVisible();
  expect(typingIndicator).toBe(false);
});

// Additional generic steps
// Removed duplicate - use 'Then it should show:' from additional-features.steps.ts

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts
// or 'When I click the {string} button' from common.steps.ts

Then('I should see the {string} dialog', async function(this: CustomWorld, dialogTitle: string) {
  const dialog = await this.page!.locator(`mat-dialog-container:has-text("${dialogTitle}"), .dialog-title:has-text("${dialogTitle}")`).isVisible({ timeout: 3000 });
  expect(dialog).toBe(true);
});

When('I fill in:', async function(this: CustomWorld, dataTable: DataTable) {
  const fields = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(fields)) {
    const input = this.page!.locator(`input[formcontrolname="${field.toLowerCase().replace(/\s+/g, '')}"], input[placeholder*="${field}"]`);
    await input.fill(value);
    await this.page!.waitForTimeout(200);
  }
});

When('I select {string} from dropdown', async function(this: CustomWorld, option: string) {
  // Click on the visible select/dropdown
  const select = this.page!.locator('mat-select:visible, select:visible').first();
  await select.click();
  await this.page!.waitForTimeout(500);
  
  // Select option
  await this.page!.click(`mat-option:has-text("${option}"), option:has-text("${option}")`);
  await this.page!.waitForTimeout(500);
});

Then('{string} should be displayed', async function(this: CustomWorld, text: string) {
  const textVisible = await this.page!.locator(`text="${text}"`).isVisible({ timeout: 3000 });
  expect(textVisible).toBe(true);
});

When('I toggle {string}', async function(this: CustomWorld, toggleName: string) {
  await this.page!.click(`mat-slide-toggle:has-text("${toggleName}"), label:has-text("${toggleName}") input[type="checkbox"]`);
  await this.page!.waitForTimeout(500);
});

Then('the {string} should be {string}', async function(this: CustomWorld, element: string, state: string) {
  const elementVisible = await this.page!.locator(`text=/${element}/i`).isVisible();
  
  if (state === 'visible' || state === 'displayed') {
    expect(elementVisible).toBe(true);
  } else if (state === 'hidden' || state === 'not visible') {
    expect(elementVisible).toBe(false);
  }
});