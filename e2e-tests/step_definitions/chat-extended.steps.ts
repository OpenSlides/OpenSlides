import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts

Then('I should be able to download chat history', async function(this: CustomWorld) {
  const exportReady = await this.page!.locator('text=/Chat.*export.*ready|Download.*chat.*history/i').isVisible({ timeout: 5000 });
  expect(exportReady).toBe(true);
});

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts

// Removed duplicate - use 'a thread should be created' from chat-advanced.steps.ts

When('I type {string} in the thread', async function(this: CustomWorld, message: string) {
  const threadInput = this.page!.locator('.thread-input, textarea[placeholder*="Reply in thread"]').first();
  await threadInput.fill(message);
  await threadInput.press('Enter');
  await this.page!.waitForTimeout(1000);
});

Then('the thread should show {int} replies', async function(this: CustomWorld, count: number) {
  const replies = await this.page!.locator('.thread-reply, .thread-message').count();
  expect(replies).toBe(count);
});

// Chat notifications
When('I mute notifications for this chat', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label="Chat settings"], button:has-text("Settings")');
  await this.page!.waitForTimeout(500);
  await this.page!.click('mat-checkbox:has-text("Mute notifications"), label:has-text("Mute")');
  await this.page!.waitForTimeout(500);
});

Then('I should not receive notifications from this chat', async function(this: CustomWorld) {
  const muted = await this.page!.locator('.muted-indicator, mat-icon:has-text("notifications_off")').isVisible();
  expect(muted).toBe(true);
});

// Chat moderation
Given('I am a chat moderator', async function(this: CustomWorld) {
  this.testData.set('isChatModerator', true);
  
  // Verify moderator controls are visible
  const modControls = await this.page!.locator('.moderator-controls, button[aria-label="Moderate"]').isVisible();
  expect(modControls).toBe(true);
});

When('I delete the inappropriate message', async function(this: CustomWorld) {
  // Find message with inappropriate content
  const message = this.page!.locator('.chat-message').last();
  await message.hover();
  await this.page!.click('button[aria-label="Delete message"], button:has-text("Delete")');
  await this.page!.waitForTimeout(500);
  
  // Confirm deletion
  await this.page!.click('button:has-text("Confirm delete")');
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - already defined in chat-messaging.steps.ts
// Then('the message should be removed', async function(this: CustomWorld) {
//   const messageRemoved = await this.page!.locator('text=/Message.*deleted|removed/i').isVisible();
//   expect(messageRemoved).toBe(true);
// });

// Chat reactions
When('I react with {string}', async function(this: CustomWorld, emoji: string) {
  // Hover over message to show reaction button
  const lastMessage = this.page!.locator('.chat-message').last();
  await lastMessage.hover();
  
  // Click reaction button
  await this.page!.click('button[aria-label="Add reaction"], .reaction-button');
  await this.page!.waitForTimeout(500);
  
  // Select emoji
  await this.page!.click(`.emoji-picker button:has-text("${emoji}")`);
  await this.page!.waitForTimeout(500);
});

Then('the message should show {string} reaction', async function(this: CustomWorld, emoji: string) {
  const reaction = await this.page!.locator(`.message-reaction:has-text("${emoji}")`).isVisible();
  expect(reaction).toBe(true);
});

// Chat polls
When('I create a poll with question {string}', async function(this: CustomWorld, question: string) {
  await this.page!.click('button[aria-label="Create poll"], button:has-text("Poll")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('input[placeholder*="Poll question"]', question);
  await this.page!.waitForTimeout(500);
});

When('I add poll options:', async function(this: CustomWorld, dataTable: any) {
  const options = dataTable.raw().flat();
  
  for (let i = 0; i < options.length; i++) {
    const optionInput = this.page!.locator(`input[placeholder*="Option ${i + 1}"]`).first();
    await optionInput.fill(options[i]);
    await this.page!.waitForTimeout(200);
    
    // Add another option if needed
    if (i < options.length - 1) {
      await this.page!.click('button:has-text("Add option")');
      await this.page!.waitForTimeout(200);
    }
  }
});

When('I post the poll', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Create poll"), button:has-text("Post poll")');
  await this.page!.waitForTimeout(1000);
});

Then('others should be able to vote', async function(this: CustomWorld) {
  const pollVisible = await this.page!.locator('.chat-poll, .poll-container').isVisible();
  expect(pollVisible).toBe(true);
  
  const voteButtons = await this.page!.locator('.poll-option-button').count();
  expect(voteButtons).toBeGreaterThan(0);
});

// Chat mentions
When('I type {string} to mention them', async function(this: CustomWorld, mention: string) {
  const input = this.page!.locator('textarea[placeholder*="Type a message"], .chat-input').first();
  await input.fill(mention);
  await this.page!.waitForTimeout(500);
});

Then('I should see user suggestions', async function(this: CustomWorld) {
  const suggestions = await this.page!.locator('.mention-suggestions, .user-suggestions').isVisible();
  expect(suggestions).toBe(true);
});

When('I select {string} from suggestions', async function(this: CustomWorld, userName: string) {
  await this.page!.click(`.suggestion-item:has-text("${userName}")`);
  await this.page!.waitForTimeout(500);
});

Then('{string} should be notified', async function(this: CustomWorld, userName: string) {
  // This would be verified on the other user's side
  // For testing, we verify the mention is formatted correctly
  const mention = await this.page!.locator(`.mention:has-text("@${userName}")`).isVisible();
  expect(mention).toBe(true);
});

// Chat search in context
When('I search for {string} in this chat', async function(this: CustomWorld, searchTerm: string) {
  await this.page!.click('button[aria-label="Search in chat"], .chat-search-button');
  await this.page!.waitForTimeout(500);
  
  await this.page!.fill('input[placeholder*="Search in chat"]', searchTerm);
  await this.page!.keyboard.press('Enter');
  await this.page!.waitForTimeout(1000);
});

Then('I should see highlighted search results', async function(this: CustomWorld) {
  const highlights = await this.page!.locator('.search-highlight, mark').count();
  expect(highlights).toBeGreaterThan(0);
});

// Chat typing indicators
Then('I should see {string} is typing', async function(this: CustomWorld, userName: string) {
  const typingIndicator = await this.page!.locator(`.typing-indicator:has-text("${userName}"), text="${userName} is typing"`).isVisible();
  expect(typingIndicator).toBe(true);
});

// Chat file sharing
When('I drag and drop a file', async function(this: CustomWorld) {
  // Simulate file drop
  const dropZone = this.page!.locator('.chat-input-area, .message-composer');
  
  // Create a data transfer event
  await dropZone.dispatchEvent('drop', {
    dataTransfer: {
      files: [{
        name: 'test-document.pdf',
        size: 1024,
        type: 'application/pdf'
      }]
    }
  });
  
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - already defined in file-extended.steps.ts
// Then('the file should be uploaded', async function(this: CustomWorld) {
//   const fileUploaded = await this.page!.locator('.file-upload-progress, .uploaded-file').isVisible();
//   expect(fileUploaded).toBe(true);
// });

// Chat permissions
Given('chat permissions are restricted', async function(this: CustomWorld) {
  this.testData.set('restrictedChat', true);
  
  // Verify some features are disabled
  const restricted = await this.page!.locator('.permission-notice, text=/restricted|limited/i').isVisible();
  expect(restricted).toBe(true);
});

Then('I should not be able to:', async function(this: CustomWorld, dataTable: any) {
  const restrictions = dataTable.raw().flat();
  
  for (const restriction of restrictions) {
    let element;
    switch (restriction) {
      case 'Delete messages':
        element = await this.page!.locator('button[aria-label="Delete message"]').isVisible({ timeout: 1000 }).catch(() => false);
        break;
      case 'Edit messages':
        element = await this.page!.locator('button[aria-label="Edit message"]').isVisible({ timeout: 1000 }).catch(() => false);
        break;
      case 'Pin messages':
        element = await this.page!.locator('button[aria-label="Pin message"]').isVisible({ timeout: 1000 }).catch(() => false);
        break;
    }
    expect(element).toBe(false);
  }
});

// Chat status
When('I set my status to {string}', async function(this: CustomWorld, status: string) {
  await this.page!.click('button[aria-label="Set status"], .status-button');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`button:has-text("${status}"), .status-option:has-text("${status}")`);
  await this.page!.waitForTimeout(500);
});

Then('others should see me as {string}', async function(this: CustomWorld, status: string) {
  const statusIndicator = await this.page!.locator(`.user-status:has-text("${status}"), .status-${status.toLowerCase()}`).isVisible();
  expect(statusIndicator).toBe(true);
});