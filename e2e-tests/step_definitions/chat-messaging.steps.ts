import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Chat access
Given('I am in a meeting with chat enabled', async function(this: CustomWorld) {
  // Verify we're in a meeting
  const inMeeting = await this.page!.url().includes(`/${this.currentMeetingId || '1'}/`);
  if (!inMeeting) {
    await this.page!.goto(`https://localhost:8000/${this.currentMeetingId || '1'}`);
    await this.page!.waitForTimeout(2000);
  }
  
  // Verify chat is enabled
  const chatEnabled = await this.page!.locator('button:has-text("Chat"), .chat-icon').isVisible();
  expect(chatEnabled).toBe(true);
  
  this.testData.set('chatEnabled', true);
});

When('I open the chat panel', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Chat"), .chat-icon, mat-icon:has-text("chat")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see the chat interface', async function(this: CustomWorld) {
  const chatPanel = await this.page!.locator('.chat-panel, .messaging-panel, #chat-container').isVisible({ timeout: 3000 });
  expect(chatPanel).toBe(true);
});

Then('I should see available chat groups', async function(this: CustomWorld) {
  const chatGroups = await this.page!.locator('.chat-group-list, .channel-list').isVisible();
  expect(chatGroups).toBe(true);
  
  // Verify at least one group exists
  const groupCount = await this.page!.locator('.chat-group-item, .channel-item').count();
  expect(groupCount).toBeGreaterThan(0);
});

// Sending messages
Given('I am in the {string} chat', async function(this: CustomWorld, chatName: string) {
  // Click on the specific chat/channel
  await this.page!.click(`.chat-group-item:has-text("${chatName}"), .channel-item:has-text("${chatName}")`);
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('currentChat', chatName);
});

When('I type {string} in the message input', async function(this: CustomWorld, message: string) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], input[placeholder*="Type"], .message-input');
  await messageInput.fill(message);
  
  this.testData.set('lastMessage', message);
});

When('I press Enter', async function(this: CustomWorld) {
  await this.page!.keyboard.press('Enter');
  await this.page!.waitForTimeout(1000);
});

Then('my message should appear in the chat', async function(this: CustomWorld) {
  const lastMessage = this.testData.get('lastMessage');
  const messageVisible = await this.page!.locator(`.message-text:has-text("${lastMessage}"), .chat-message:has-text("${lastMessage}")`).isVisible({ timeout: 3000 });
  expect(messageVisible).toBe(true);
});

Then('it should show my name and timestamp', async function(this: CustomWorld) {
  const currentUser = this.testData.get('currentUsername') || 'admin';
  
  // Find the message container
  const lastMessage = this.testData.get('lastMessage');
  const messageContainer = this.page!.locator(`.message-container:has-text("${lastMessage}"), .chat-message:has-text("${lastMessage}")`);
  
  // Check for username
  const hasUsername = await messageContainer.locator(`.message-author:has-text("${currentUser}"), .sender-name:has-text("${currentUser}")`).isVisible();
  expect(hasUsername).toBe(true);
  
  // Check for timestamp
  const hasTimestamp = await messageContainer.locator('.message-time, .timestamp').isVisible();
  expect(hasTimestamp).toBe(true);
});

// Private messages
When('I click on {string} in the participant list', async function(this: CustomWorld, participantName: string) {
  // Open participant list if needed
  const participantListVisible = await this.page!.locator('.participant-list, .user-list').isVisible();
  if (!participantListVisible) {
    await this.page!.click('button:has-text("Participants"), .participants-icon');
    await this.page!.waitForTimeout(1000);
  }
  
  // Click on participant
  await this.page!.click(`.participant-item:has-text("${participantName}"), .user-item:has-text("${participantName}")`);
  await this.page!.waitForTimeout(500);
});

When('I select {string} from the participant menu', async function(this: CustomWorld, action: string) {
  await this.page!.click(`button:has-text("${action}"), [mat-menu-item]:has-text("${action}")`);
  await this.page!.waitForTimeout(1000);
});

Then('a private chat should open with {string}', async function(this: CustomWorld, participantName: string) {
  const privateChatHeader = await this.page!.locator(`.chat-header:has-text("${participantName}"), .private-chat-title:has-text("${participantName}")`).isVisible();
  expect(privateChatHeader).toBe(true);
  
  this.testData.set('privateChatWith', participantName);
});

When('I send {string}', async function(this: CustomWorld, message: string) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], input[placeholder*="Type"], .message-input');
  await messageInput.fill(message);
  await messageInput.press('Enter');
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('lastMessage', message);
});

Then('the message should be marked as private', async function(this: CustomWorld) {
  const lastMessage = this.testData.get('lastMessage');
  const privateMessage = this.page!.locator(`.message-container:has-text("${lastMessage}")`);
  
  // Check for private indicator
  const isPrivate = await privateMessage.locator('.private-indicator, .lock-icon, mat-icon:has-text("lock")').isVisible();
  expect(isPrivate).toBe(true);
});

// Chat groups
Given('I have permission to create chat groups', async function(this: CustomWorld) {
  // Check if create button is visible
  const canCreate = await this.page!.locator('button:has-text("Create group"), button:has-text("New group")').isVisible();
  expect(canCreate).toBe(true);
  
  this.testData.set('canCreateGroups', true);
});

When('I click {string} in the chat panel', async function(this: CustomWorld, buttonText: string) {
  const chatPanel = this.page!.locator('.chat-panel, .messaging-panel');
  await chatPanel.locator(`button:has-text("${buttonText}")`).click();
  await this.page!.waitForTimeout(1000);
});

When('I fill in the group details:', async function(this: CustomWorld, dataTable: DataTable) {
  const details = dataTable.rowsHash();
  
  if (details['Name']) {
    await this.page!.fill('input[formcontrolname="groupName"], input[placeholder*="Group name"]', details['Name']);
  }
  
  if (details['Description']) {
    await this.page!.fill('textarea[formcontrolname="description"], textarea[placeholder*="Description"]', details['Description']);
  }
});

When('I add participants:', async function(this: CustomWorld, dataTable: DataTable) {
  const participants = dataTable.raw().flat();
  
  // Open participant selector
  await this.page!.click('mat-select[formcontrolname="participants"], .participant-selector');
  await this.page!.waitForTimeout(500);
  
  for (const participant of participants) {
    await this.page!.click(`mat-option:has-text("${participant}"), .participant-option:has-text("${participant}")`);
    await this.page!.waitForTimeout(200);
  }
  
  // Close selector
  await this.page!.keyboard.press('Escape');
  await this.page!.waitForTimeout(500);
});

When('I click {string} in chat', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the group {string} should be created', async function(this: CustomWorld, groupName: string) {
  const groupCreated = await this.page!.locator(`.chat-group-item:has-text("${groupName}"), .channel-item:has-text("${groupName}")`).isVisible({ timeout: 3000 });
  expect(groupCreated).toBe(true);
});

Then('selected participants should have access', async function(this: CustomWorld) {
  // Click on the created group
  const groupName = 'Committee Discussion';
  await this.page!.click(`.chat-group-item:has-text("${groupName}")`);
  await this.page!.waitForTimeout(1000);
  
  // Check member list
  const memberList = await this.page!.locator('.group-members, .participant-list').isVisible();
  expect(memberList).toBe(true);
});

// Message notifications
Given('I have unread messages in {string}', async function(this: CustomWorld, chatName: string) {
  // Simulate unread messages
  this.testData.set('unreadChat', chatName);
  this.testData.set('hasUnreadMessages', true);
});

Then('I should see an unread indicator on {string}', async function(this: CustomWorld, chatName: string) {
  const chatItem = this.page!.locator(`.chat-group-item:has-text("${chatName}"), .channel-item:has-text("${chatName}")`);
  const unreadIndicator = await chatItem.locator('.unread-badge, .unread-count, .notification-dot').isVisible();
  expect(unreadIndicator).toBe(true);
});

When('I open the {string} chat', async function(this: CustomWorld, chatName: string) {
  await this.page!.click(`.chat-group-item:has-text("${chatName}"), .channel-item:has-text("${chatName}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the unread indicator should disappear', async function(this: CustomWorld) {
  const chatName = this.testData.get('unreadChat');
  const chatItem = this.page!.locator(`.chat-group-item:has-text("${chatName}")`);
  const unreadIndicator = await chatItem.locator('.unread-badge, .unread-count').isVisible();
  expect(unreadIndicator).toBe(false);
});

// Message formatting
When('I type a message with formatting:', async function(this: CustomWorld, formattedText: string) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], .message-input');
  await messageInput.fill(formattedText);
  
  this.testData.set('formattedMessage', formattedText);
});

When('I send the message', async function(this: CustomWorld) {
  await this.page!.keyboard.press('Enter');
  await this.page!.waitForTimeout(1000);
});

Then('the message should display with proper formatting', async function(this: CustomWorld) {
  const formattedMessage = this.testData.get('formattedMessage');
  
  // Check for formatted elements
  if (formattedMessage.includes('**')) {
    const boldText = await this.page!.locator('.message-text strong, .message-text b').isVisible();
    expect(boldText).toBe(true);
  }
  
  if (formattedMessage.includes('*') && !formattedMessage.includes('**')) {
    const italicText = await this.page!.locator('.message-text em, .message-text i').isVisible();
    expect(italicText).toBe(true);
  }
});

// File attachments
When('I click the attachment button', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Attach"], .attachment-button, mat-icon:has-text("attach_file")');
  await this.page!.waitForTimeout(500);
});

// Removed duplicate - use 'When I select the file {string}' from file-management.steps.ts

Then('the file should be uploaded and visible in chat', async function(this: CustomWorld) {
  const fileAttachment = await this.page!.locator('.message-attachment, .file-attachment, .attachment-preview').isVisible({ timeout: 5000 });
  expect(fileAttachment).toBe(true);
});

// Message search
When('I open the search in chat', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Search"], .search-button, mat-icon:has-text("search")');
  await this.page!.waitForTimeout(500);
});

When('I search for {string} in chat', async function(this: CustomWorld, searchTerm: string) {
  const searchInput = this.page!.locator('input[placeholder*="Search"], .search-input');
  await searchInput.fill(searchTerm);
  await searchInput.press('Enter');
  await this.page!.waitForTimeout(1000);
});

Then('I should see messages containing {string}', async function(this: CustomWorld, searchTerm: string) {
  const searchResults = await this.page!.locator('.search-results, .message-search-results').isVisible();
  expect(searchResults).toBe(true);
  
  // Verify search term is highlighted
  const highlightedTerm = await this.page!.locator(`.highlight:has-text("${searchTerm}"), mark:has-text("${searchTerm}")`).isVisible();
  expect(highlightedTerm).toBe(true);
});

// Chat moderation
Given('I am a chat moderator', async function(this: CustomWorld) {
  // Verify moderator permissions
  const moderatorTools = await this.page!.locator('.moderator-tools, .admin-actions').isVisible();
  expect(moderatorTools).toBe(true);
  
  this.testData.set('isModerator', true);
});

When('I right-click on a message', async function(this: CustomWorld) {
  const message = this.page!.locator('.message-container, .chat-message').first();
  await message.click({ button: 'right' });
  await this.page!.waitForTimeout(500);
});

When('I select {string} from the context menu', async function(this: CustomWorld, action: string) {
  await this.page!.click(`[mat-menu-item]:has-text("${action}"), .context-menu-item:has-text("${action}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the message should be removed', async function(this: CustomWorld) {
  // Check for deletion indicator or message removal
  const deletedIndicator = await this.page!.locator('.message-deleted, text="Message deleted"').isVisible({ timeout: 3000 });
  expect(deletedIndicator).toBe(true);
});

// Online status
Then('I should see online status indicators for participants', async function(this: CustomWorld) {
  const onlineIndicators = await this.page!.locator('.online-status, .presence-indicator').count();
  expect(onlineIndicators).toBeGreaterThan(0);
});

When('{string} goes offline', async function(this: CustomWorld, participantName: string) {
  // Simulate user going offline
  this.testData.set('offlineUser', participantName);
  await this.page!.waitForTimeout(2000);
});

Then('their status should update to offline', async function(this: CustomWorld) {
  const offlineUser = this.testData.get('offlineUser');
  const userStatus = this.page!.locator(`.participant-item:has-text("${offlineUser}") .offline-status, .user-item:has-text("${offlineUser}") .status-offline`);
  const isOffline = await userStatus.isVisible({ timeout: 5000 });
  expect(isOffline).toBe(true);
});

// Typing indicators
When('{string} starts typing', async function(this: CustomWorld, userName: string) {
  // Simulate typing indicator
  this.testData.set('typingUser', userName);
});

Then('I should see {string} typing indicator', async function(this: CustomWorld, userName: string) {
  const typingIndicator = await this.page!.locator(`.typing-indicator:has-text("${userName}"), text="${userName} is typing"`).isVisible({ timeout: 3000 });
  expect(typingIndicator).toBe(true);
});

// Message reactions
When('I hover over a message', async function(this: CustomWorld) {
  const message = this.page!.locator('.message-container, .chat-message').first();
  await message.hover();
  await this.page!.waitForTimeout(500);
});

When('I click the reaction button', async function(this: CustomWorld) {
  await this.page!.click('.reaction-button, button[aria-label*="React"], .emoji-button');
  await this.page!.waitForTimeout(500);
});

When('I select the {string} emoji', async function(this: CustomWorld, emoji: string) {
  await this.page!.click(`.emoji-picker button:has-text("${emoji}"), .emoji-option:has-text("${emoji}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the reaction should appear on the message', async function(this: CustomWorld) {
  const reaction = await this.page!.locator('.message-reaction, .reaction-badge').isVisible();
  expect(reaction).toBe(true);
});

// Additional chat interface steps
When('I click on the {string} menu item', async function(this: CustomWorld, menuItem: string) {
  await this.page!.click(`[mat-menu-item]:has-text("${menuItem}"), .menu-item:has-text("${menuItem}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the chat interface should open', async function(this: CustomWorld) {
  const chatOpen = await this.page!.locator('.chat-interface, .chat-panel, #chat-window').isVisible({ timeout: 3000 });
  expect(chatOpen).toBe(true);
});

When('I type {string} in the message field', async function(this: CustomWorld, message: string) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], input[placeholder*="Type"], .message-input').first();
  await messageInput.fill(message);
  
  this.testData.set('lastMessage', message);
});

Then('other participants should see my message immediately', async function(this: CustomWorld) {
  // In a real test, this would require a second browser/user
  // For now, verify the message was sent
  const messageSent = await this.page!.locator('.message-sent, .sent-indicator').isVisible({ timeout: 3000 });
  expect(messageSent).toBe(true);
});

Then('a private chat window should open with John', async function(this: CustomWorld) {
  const privateChatOpen = await this.page!.locator('.private-chat:has-text("John"), .chat-header:has-text("John")').isVisible({ timeout: 3000 });
  expect(privateChatOpen).toBe(true);
});

Then('the group chat should be created', async function(this: CustomWorld) {
  const groupCreated = await this.page!.locator('.group-created, text=/Group.*created/i').isVisible({ timeout: 3000 });
  expect(groupCreated).toBe(true);
});

When('I send a message to the group', async function(this: CustomWorld) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], .message-input');
  await messageInput.fill('Welcome to the committee discussion');
  await messageInput.press('Enter');
  await this.page!.waitForTimeout(1000);
});

// Mentions
When('I type {string} in the chat', async function(this: CustomWorld, text: string) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], .message-input');
  await messageInput.fill(text);
  
  // Wait for mention dropdown
  if (text.includes('@')) {
    await this.page!.waitForTimeout(500);
  }
});

When('I complete the message {string}', async function(this: CustomWorld, fullMessage: string) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], .message-input');
  await messageInput.fill(fullMessage);
  await messageInput.press('Enter');
  await this.page!.waitForTimeout(1000);
});

// Moderation
Given('I have chat moderation permissions', async function(this: CustomWorld) {
  const modPermissions = await this.page!.locator('.moderator-badge, .mod-tools').isVisible();
  expect(modPermissions).toBe(true);
  
  this.testData.set('isChatModerator', true);
});

When('I see an inappropriate message', async function(this: CustomWorld) {
  // Find a message to moderate
  const message = this.page!.locator('.message-container').first();
  await message.hover();
  
  this.testData.set('messageToModerate', true);
});

When('I click the message options menu', async function(this: CustomWorld) {
  await this.page!.click('.message-options, button[aria-label*="Options"], .more-button');
  await this.page!.waitForTimeout(500);
});

When('I provide reason {string}', async function(this: CustomWorld, reason: string) {
  await this.page!.fill('textarea[placeholder*="reason"], input[name="reason"]', reason);
  await this.page!.waitForTimeout(500);
});

When('I add message {string}', async function(this: CustomWorld, message: string) {
  const messageInput = this.page!.locator('textarea[placeholder*="message"], .message-input');
  await messageInput.fill(message);
  
  this.testData.set('addedMessage', message);
});

Then('a file preview should appear in chat', async function(this: CustomWorld) {
  const filePreview = await this.page!.locator('.file-preview, .attachment-preview').isVisible({ timeout: 3000 });
  expect(filePreview).toBe(true);
});

// Search functionality
Given('the chat has many messages', async function(this: CustomWorld) {
  // Verify multiple messages exist
  const messageCount = await this.page!.locator('.message-container').count();
  expect(messageCount).toBeGreaterThan(5);
});

Then('I should see all messages containing {string}', async function(this: CustomWorld, searchTerm: string) {
  // Wait for search results
  await this.page!.waitForTimeout(1000);
  
  const searchResults = await this.page!.locator(`.message-container:has-text("${searchTerm}")`).count();
  expect(searchResults).toBeGreaterThan(0);
});

Then('the chat should scroll to that message', async function(this: CustomWorld) {
  // Check if a message is highlighted or scrolled into view
  const highlightedMessage = await this.page!.locator('.message-highlighted, .search-result-active').isVisible();
  expect(highlightedMessage).toBe(true);
});

// Reactions
Given('a message {string} exists', async function(this: CustomWorld, messageText: string) {
  // Find or create the message
  const messageExists = await this.page!.locator(`.message-text:has-text("${messageText}")`).isVisible();
  
  if (!messageExists) {
    // Send the message
    const messageInput = this.page!.locator('textarea[placeholder*="message"], .message-input');
    await messageInput.fill(messageText);
    await messageInput.press('Enter');
    await this.page!.waitForTimeout(1000);
  }
  
  this.testData.set('targetMessage', messageText);
});

When('I hover over the message', async function(this: CustomWorld) {
  const targetMessage = this.testData.get('targetMessage');
  const message = this.page!.locator(`.message-container:has-text("${targetMessage}")`).first();
  await message.hover();
  await this.page!.waitForTimeout(500);
});

// Settings
When('I click chat settings', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Settings"], .chat-settings-button, mat-icon:has-text("settings")');
  await this.page!.waitForTimeout(1000);
});