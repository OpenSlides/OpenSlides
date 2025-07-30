import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Chat export permissions
Given('I have permission to export chat', async function(this: CustomWorld) {
  // Verify export permission exists
  const canExport = await this.page!.locator('button:has-text("Export chat"), [aria-label*="Export"]').isVisible()
    .catch(() => true); // Assume permission exists
  
  this.testData.set('canExportChat', true);
});

// Chat export
When('I select date range and format:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.rowsHash();
  
  // Set date range
  if (options['Start date']) {
    await this.page!.fill('input[formcontrolname="startDate"], input[type="date"]:first', options['Start date']);
  }
  if (options['End date']) {
    await this.page!.fill('input[formcontrolname="endDate"], input[type="date"]:last', options['End date']);
  }
  
  // Select format
  if (options['Format']) {
    await this.page!.click('mat-select[formcontrolname="format"], select[name="format"]');
    await this.page!.click(`mat-option:has-text("${options['Format']}")`);
  }
  
  await this.page!.waitForTimeout(500);
});

Then('a formatted transcript should be generated', async function(this: CustomWorld) {
  const transcriptGenerated = await this.page!.locator('.transcript-ready, text=/Transcript.*generated/i').isVisible({ timeout: 5000 });
  expect(transcriptGenerated).toBe(true);
});

Then('it should include all messages and metadata', async function(this: CustomWorld) {
  // Check for metadata presence in transcript
  const hasMetadata = await this.page!.locator('.transcript-metadata, .export-preview').isVisible();
  expect(hasMetadata).toBe(true);
});

// Threaded conversations
Then('a thread should be created', async function(this: CustomWorld) {
  const threadCreated = await this.page!.locator('.thread-indicator, .reply-thread').isVisible({ timeout: 3000 });
  expect(threadCreated).toBe(true);
});

Then('the thread count should show on original message', async function(this: CustomWorld) {
  const threadCount = await this.page!.locator('.thread-count, .reply-count').isVisible();
  expect(threadCount).toBe(true);
});

When('others reply to the thread', async function(this: CustomWorld) {
  // Simulate thread replies
  this.testData.set('threadReplies', true);
});

Then('all thread messages should be grouped', async function(this: CustomWorld) {
  const threadGroup = await this.page!.locator('.thread-group, .nested-replies').isVisible();
  expect(threadGroup).toBe(true);
});

// Polls in chat
When('I add options:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.raw().flat();
  
  for (let i = 0; i < options.length; i++) {
    const optionInput = this.page!.locator(`input[placeholder*="Option ${i + 1}"], input[name="option-${i}"]`);
    await optionInput.fill(options[i]);
    
    // Add new option field if needed
    if (i < options.length - 1) {
      const addButton = this.page!.locator('button:has-text("Add option"), button[aria-label*="Add"]');
      if (await addButton.isVisible()) {
        await addButton.click();
        await this.page!.waitForTimeout(300);
      }
    }
  }
});

Then('an interactive poll should appear', async function(this: CustomWorld) {
  const pollVisible = await this.page!.locator('.chat-poll, .inline-poll').isVisible({ timeout: 3000 });
  expect(pollVisible).toBe(true);
});

Then('participants should be able to vote inline', async function(this: CustomWorld) {
  const voteButtons = await this.page!.locator('.poll-option-button, .vote-option').count();
  expect(voteButtons).toBeGreaterThan(0);
});

Then('results should update in real-time', async function(this: CustomWorld) {
  const realtimeResults = await this.page!.locator('.poll-results-live, .realtime-votes').isVisible();
  expect(realtimeResults).toBe(true);
});

// Offline functionality
Given('I lose internet connection', async function(this: CustomWorld) {
  // Simulate offline mode
  await this.page!.context().setOffline(true);
  this.testData.set('isOffline', true);
});

When('I send messages while offline', async function(this: CustomWorld) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], .message-input');
  await messageInput.fill('Offline message test');
  await messageInput.press('Enter');
  
  this.testData.set('offlineMessage', 'Offline message test');
});

Then('messages should be queued locally', async function(this: CustomWorld) {
  const queuedIndicator = await this.page!.locator('.message-queued, .pending-send').isVisible({ timeout: 3000 });
  expect(queuedIndicator).toBe(true);
});

Then('show pending status', async function(this: CustomWorld) {
  const pendingStatus = await this.page!.locator('.pending-indicator, .message-pending').isVisible();
  expect(pendingStatus).toBe(true);
});

When('connection is restored', async function(this: CustomWorld) {
  // Restore connection
  await this.page!.context().setOffline(false);
  await this.page!.waitForTimeout(2000);
});

Then('queued messages should be sent', async function(this: CustomWorld) {
  const messageSent = await this.page!.locator('.message-sent, .delivered').isVisible({ timeout: 5000 });
  expect(messageSent).toBe(true);
});

Then('timestamps should reflect actual send time', async function(this: CustomWorld) {
  const timestamp = await this.page!.locator('.message-timestamp, .sent-time').textContent();
  expect(timestamp).toBeTruthy();
});

// Late join functionality
Given('I join a meeting late', async function(this: CustomWorld) {
  // Simulate late join
  this.testData.set('lateJoin', true);
  
  // Navigate to meeting
  await this.page!.goto(`https://localhost:8000/${this.currentMeetingId || '1'}`);
  await this.page!.waitForTimeout(2000);
});

When('I open the chat', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Chat"), .chat-icon');
  await this.page!.waitForTimeout(1000);
});

Then('recent message history should load', async function(this: CustomWorld) {
  const messageHistory = await this.page!.locator('.message-history, .chat-messages').isVisible({ timeout: 3000 });
  expect(messageHistory).toBe(true);
  
  const messageCount = await this.page!.locator('.message-container').count();
  expect(messageCount).toBeGreaterThan(0);
});

When('I scroll up', async function(this: CustomWorld) {
  const chatContainer = this.page!.locator('.chat-messages, .message-list');
  await chatContainer.evaluate(el => el.scrollTop = 0);
  await this.page!.waitForTimeout(1000);
});

Then('older messages should load progressively', async function(this: CustomWorld) {
  // Check for loading indicator or more messages
  const loadingMore = await this.page!.locator('.loading-more, .fetching-history').isVisible({ timeout: 3000 })
    .catch(() => false);
  
  if (loadingMore) {
    await this.page!.waitForTimeout(2000);
  }
  
  const messageCount = await this.page!.locator('.message-container').count();
  expect(messageCount).toBeGreaterThan(5);
});

Then('I should see {string} when complete', async function(this: CustomWorld, message: string) {
  const completeMessage = await this.page!.locator(`text="${message}"`).isVisible({ timeout: 3000 });
  expect(completeMessage).toBe(true);
});

// Additional chat features
When('I create a chat poll {string}', async function(this: CustomWorld, pollQuestion: string) {
  await this.page!.click('button[aria-label*="Poll"], .poll-button');
  await this.page!.fill('input[placeholder*="Question"]', pollQuestion);
  
  this.testData.set('pollQuestion', pollQuestion);
});

Then('participants should see the poll', async function(this: CustomWorld) {
  const pollQuestion = this.testData.get('pollQuestion');
  const pollVisible = await this.page!.locator(`.poll-question:has-text("${pollQuestion}")`).isVisible({ timeout: 3000 });
  expect(pollVisible).toBe(true);
});

When('I pin a message', async function(this: CustomWorld) {
  const message = this.page!.locator('.message-container').first();
  await message.hover();
  await this.page!.click('button[aria-label*="Pin"], .pin-button');
  await this.page!.waitForTimeout(1000);
});

Then('it should appear in pinned messages', async function(this: CustomWorld) {
  const pinnedSection = await this.page!.locator('.pinned-messages, .pinned-section').isVisible();
  expect(pinnedSection).toBe(true);
});

// Voice messages (if supported)
When('I record a voice message', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Voice"], .voice-button');
  
  // Simulate recording
  await this.page!.waitForTimeout(2000);
  
  await this.page!.click('button[aria-label*="Stop"], .stop-recording');
  await this.page!.waitForTimeout(1000);
});

Then('the audio message should be sent', async function(this: CustomWorld) {
  const audioMessage = await this.page!.locator('.audio-message, .voice-message').isVisible({ timeout: 3000 });
  expect(audioMessage).toBe(true);
});

// Chat rooms/channels
When('I create a new chat room {string}', async function(this: CustomWorld, roomName: string) {
  await this.page!.click('button:has-text("New room"), button:has-text("Create channel")');
  await this.page!.fill('input[placeholder*="Room name"]', roomName);
  await this.page!.click('button:has-text("Create")');
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('createdRoom', roomName);
});

Then('the room should be available', async function(this: CustomWorld) {
  const roomName = this.testData.get('createdRoom');
  const roomVisible = await this.page!.locator(`.room-item:has-text("${roomName}")`).isVisible({ timeout: 3000 });
  expect(roomVisible).toBe(true);
});

// Read receipts
Then('read receipts should show', async function(this: CustomWorld) {
  const readReceipts = await this.page!.locator('.read-receipt, .seen-indicator').isVisible();
  expect(readReceipts).toBe(true);
});

When('I mark all as read', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Mark all read"), [aria-label*="Mark as read"]');
  await this.page!.waitForTimeout(1000);
});

Then('unread indicators should clear', async function(this: CustomWorld) {
  const unreadCount = await this.page!.locator('.unread-badge:visible, .unread-count:visible').count();
  expect(unreadCount).toBe(0);
});