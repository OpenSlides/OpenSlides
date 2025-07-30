import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class ChatPage extends EnhancedBasePage {
  readonly chatButton: string;
  readonly messageInput: string;
  readonly sendButton: string;
  readonly messageList: string;
  readonly participantList: string;
  readonly createGroupButton: string;
  readonly attachmentButton: string;
  readonly searchButton: string;
  readonly settingsButton: string;
  readonly mentionsList: string;
  readonly emojiButton: string;
  readonly typingIndicator: string;

  constructor(page: Page) {
    super(page);
    this.chatButton = 'a[href*="/chat"], mat-nav-list a:has-text("Chat")';
    this.messageInput = 'input[placeholder*="Type a message"], textarea[formcontrolname="message"]';
    this.sendButton = 'button:has-text("Send"), button[type="submit"][mat-icon="send"]';
    this.messageList = '.message-list, .chat-messages, [data-cy="message-container"]';
    this.participantList = '.participant-list, [data-cy="chat-participants"]';
    this.createGroupButton = 'button:has-text("Create group"), [data-cy="create-group-chat"]';
    this.attachmentButton = 'button[mat-icon="attach_file"], [data-cy="attach-file"]';
    this.searchButton = 'button[mat-icon="search"], [data-cy="search-chat"]';
    this.settingsButton = 'button[mat-icon="settings"], [data-cy="chat-settings"]';
    this.mentionsList = '.mentions-autocomplete, [data-cy="mentions-list"]';
    this.emojiButton = 'button[mat-icon="mood"], [data-cy="emoji-picker"]';
    this.typingIndicator = '.typing-indicator, [data-cy="typing-status"]';
  }

  async navigate(): Promise<void> {
    await this.click(this.chatButton, {
      waitForNetworkIdle: true
    });
  }

  async sendMessage(message: string): Promise<void> {
    await this.fill(this.messageInput, message);
    await this.click(this.sendButton, {
      waitForNetworkIdle: true
    });
  }

  async sendPrivateMessage(recipientName: string, message: string): Promise<void> {
    await this.click(`${this.participantList} >> text="${recipientName}"`);
    await this.click('button:has-text("Send private message")', {
      waitForLoadState: true
    });
    await this.fill(this.messageInput, message);
    await this.click(this.sendButton, {
      waitForNetworkIdle: true
    });
  }

  async createGroupChat(groupName: string, participants: string[]): Promise<void> {
    await this.click(this.createGroupButton);
    await this.page.waitForTimeout(500);
    
    await this.page.fill('input[formcontrolname="group_name"]', groupName);
    
    for (const participant of participants) {
      await this.page.locator(`mat-checkbox:has-text("${participant}")`).click();
    }
    
    await this.page.locator('button:has-text("Create")').click();
    await this.page.waitForTimeout(1000);
  }

  async mentionUser(username: string, message: string): Promise<void> {
    await this.fill(this.messageInput, `@${username.substring(0, 3)}`);
    await this.waitForSelector(this.mentionsList, { state: 'visible' });
    await this.page.locator(`mat-option:has-text("${username}")`).click();
    await this.fill(this.messageInput, `@${username} ${message}`);
    await this.click(this.sendButton);
    await this.page.waitForTimeout(500);
  }

  async attachFile(filePath: string, message?: string): Promise<void> {
    await this.click(this.attachmentButton);
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    if (message) {
      await this.fill(this.messageInput, message);
    }
    
    await this.click(this.sendButton);
    await this.page.waitForTimeout(2000);
  }

  async searchMessages(searchTerm: string): Promise<void> {
    await this.click(this.searchButton);
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
    await this.click(this.settingsButton);
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
    await this.fill(this.messageInput, reply);
    await this.click(this.sendButton);
    await this.page.waitForTimeout(500);
  }

  async createPoll(question: string, options: string[]): Promise<void> {
    await this.fill(this.messageInput, `/poll ${question}`);
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
    return await this.isVisible(this.typingIndicator);
  }

  async getTypingText(): Promise<string> {
    const element = await this.page.locator(this.typingIndicator);
    return await element.textContent() || '';
  }

  async exportChatTranscript(dateRange?: { start: string; end: string }, format: string = 'PDF'): Promise<void> {
    await this.click(this.settingsButton);
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