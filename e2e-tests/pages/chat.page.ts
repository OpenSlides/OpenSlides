import { Page, Locator } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly chatButton: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageList: Locator;
  readonly participantList: Locator;
  readonly createGroupButton: Locator;
  readonly attachmentButton: Locator;
  readonly searchButton: Locator;
  readonly settingsButton: Locator;
  readonly mentionsList: Locator;
  readonly emojiButton: Locator;
  readonly typingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatButton = page.locator('a[href*="/chat"], mat-nav-list a:has-text("Chat")');
    this.messageInput = page.locator('input[placeholder*="Type a message"], textarea[formcontrolname="message"]');
    this.sendButton = page.locator('button:has-text("Send"), button[type="submit"][mat-icon="send"]');
    this.messageList = page.locator('.message-list, .chat-messages, [data-cy="message-container"]');
    this.participantList = page.locator('.participant-list, [data-cy="chat-participants"]');
    this.createGroupButton = page.locator('button:has-text("Create group"), [data-cy="create-group-chat"]');
    this.attachmentButton = page.locator('button[mat-icon="attach_file"], [data-cy="attach-file"]');
    this.searchButton = page.locator('button[mat-icon="search"], [data-cy="search-chat"]');
    this.settingsButton = page.locator('button[mat-icon="settings"], [data-cy="chat-settings"]');
    this.mentionsList = page.locator('.mentions-autocomplete, [data-cy="mentions-list"]');
    this.emojiButton = page.locator('button[mat-icon="mood"], [data-cy="emoji-picker"]');
    this.typingIndicator = page.locator('.typing-indicator, [data-cy="typing-status"]');
  }

  async navigate(): Promise<void> {
    await this.chatButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async sendMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    await this.page.waitForTimeout(500);
  }

  async sendPrivateMessage(recipientName: string, message: string): Promise<void> {
    await this.participantList.locator(`text="${recipientName}"`).click();
    await this.page.locator('button:has-text("Send private message")').click();
    await this.messageInput.fill(message);
    await this.sendButton.click();
    await this.page.waitForTimeout(500);
  }

  async createGroupChat(groupName: string, participants: string[]): Promise<void> {
    await this.createGroupButton.click();
    await this.page.waitForTimeout(500);
    
    await this.page.fill('input[formcontrolname="group_name"]', groupName);
    
    for (const participant of participants) {
      await this.page.locator(`mat-checkbox:has-text("${participant}")`).click();
    }
    
    await this.page.locator('button:has-text("Create")').click();
    await this.page.waitForTimeout(1000);
  }

  async mentionUser(username: string, message: string): Promise<void> {
    await this.messageInput.fill(`@${username.substring(0, 3)}`);
    await this.mentionsList.waitFor({ state: 'visible' });
    await this.page.locator(`mat-option:has-text("${username}")`).click();
    await this.messageInput.fill(`@${username} ${message}`);
    await this.sendButton.click();
    await this.page.waitForTimeout(500);
  }

  async attachFile(filePath: string, message?: string): Promise<void> {
    await this.attachmentButton.click();
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    if (message) {
      await this.messageInput.fill(message);
    }
    
    await this.sendButton.click();
    await this.page.waitForTimeout(2000);
  }

  async searchMessages(searchTerm: string): Promise<void> {
    await this.searchButton.click();
    await this.page.fill('input[placeholder*="Search"]', searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async addReaction(messageText: string, emoji: string): Promise<void> {
    const message = this.messageList.locator(`text="${messageText}"`).first();
    await message.hover();
    await message.locator('button[mat-icon="mood"]').click();
    await this.page.locator(`.emoji-picker`).locator(`text="${emoji}"`).click();
    await this.page.waitForTimeout(500);
  }

  async deleteMessage(messageText: string, reason?: string): Promise<void> {
    const message = this.messageList.locator(`text="${messageText}"`).first();
    await message.hover();
    await message.locator('button[mat-icon="more_vert"]').click();
    await this.page.locator('button:has-text("Delete")').click();
    
    if (reason) {
      await this.page.fill('textarea[formcontrolname="reason"]', reason);
    }
    
    await this.page.locator('button:has-text("Confirm")').click();
    await this.page.waitForTimeout(1000);
  }

  async configureNotifications(settings: {
    allMessages: boolean;
    mentions: boolean;
    privateMessages: boolean;
    keywords?: string[];
  }): Promise<void> {
    await this.settingsButton.click();
    await this.page.waitForTimeout(500);
    
    const allMessagesCheckbox = this.page.locator('mat-checkbox[formcontrolname="all_messages"]');
    if ((await allMessagesCheckbox.isChecked()) !== settings.allMessages) {
      await allMessagesCheckbox.click();
    }
    
    const mentionsCheckbox = this.page.locator('mat-checkbox[formcontrolname="mentions"]');
    if ((await mentionsCheckbox.isChecked()) !== settings.mentions) {
      await mentionsCheckbox.click();
    }
    
    const privateCheckbox = this.page.locator('mat-checkbox[formcontrolname="private_messages"]');
    if ((await privateCheckbox.isChecked()) !== settings.privateMessages) {
      await privateCheckbox.click();
    }
    
    if (settings.keywords) {
      await this.page.fill('input[formcontrolname="keywords"]', settings.keywords.join(', '));
    }
    
    await this.page.locator('button:has-text("Save")').click();
    await this.page.waitForTimeout(1000);
  }

  async replyInThread(originalMessage: string, reply: string): Promise<void> {
    const message = this.messageList.locator(`text="${originalMessage}"`).first();
    await message.hover();
    await message.locator('button:has-text("Reply in thread")').click();
    await this.messageInput.fill(reply);
    await this.sendButton.click();
    await this.page.waitForTimeout(500);
  }

  async createPoll(question: string, options: string[]): Promise<void> {
    await this.messageInput.fill(`/poll ${question}`);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
    
    for (const option of options) {
      await this.page.locator('button:has-text("Add option")').click();
      await this.page.fill('input[placeholder="Option"]', option);
    }
    
    await this.page.locator('button:has-text("Create poll")').click();
    await this.page.waitForTimeout(1000);
  }

  async getMessageCount(): Promise<number> {
    return await this.messageList.locator('.message-item').count();
  }

  async isTypingIndicatorVisible(): Promise<boolean> {
    return await this.typingIndicator.isVisible();
  }

  async getTypingText(): Promise<string> {
    return await this.typingIndicator.textContent() || '';
  }

  async exportChatTranscript(dateRange?: { start: string; end: string }, format: string = 'PDF'): Promise<void> {
    await this.settingsButton.click();
    await this.page.locator('button:has-text("Export chat")').click();
    
    if (dateRange) {
      await this.page.fill('input[formcontrolname="start_date"]', dateRange.start);
      await this.page.fill('input[formcontrolname="end_date"]', dateRange.end);
    }
    
    await this.page.locator(`mat-radio-button:has-text("${format}")`).click();
    await this.page.locator('button:has-text("Export")').click();
    await this.page.waitForTimeout(3000);
  }

  async scrollToTop(): Promise<void> {
    await this.messageList.evaluate(el => el.scrollTop = 0);
    await this.page.waitForTimeout(1000);
  }

  async loadMoreMessages(): Promise<void> {
    await this.scrollToTop();
    await this.page.waitForTimeout(2000); // Wait for lazy loading
  }
}