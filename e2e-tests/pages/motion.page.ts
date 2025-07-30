import { Page, Locator } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class MotionPage extends EnhancedBasePage {
  declare readonly page: Page;
  readonly createButton: string;
  readonly motionList: string;
  readonly titleInput: string;
  readonly textInput: string;
  readonly reasonInput: string;
  readonly categorySelect: string;
  readonly tagInput: string;
  readonly saveButton: string;
  readonly stateSelect: string;
  readonly amendmentButton: string;
  readonly supportButton: string;
  readonly recommendationButton: string;
  readonly voteButton: string;
  readonly editButton: string;
  readonly searchInput: string;
  readonly exportButton: string;
  readonly historyTab: string;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.createButton = 'button:has-text("New motion"), [data-cy="create-motion"]';
    this.motionList = '.motion-list, [class*="motion-item"], mat-card';
    this.titleInput = 'input[formcontrolname="title"], input[name="motion-title"]';
    this.textInput = 'div[contenteditable="true"], textarea[formcontrolname="text"]';
    this.reasonInput = 'textarea[formcontrolname="reason"], div[name="reason"]';
    this.categorySelect = 'mat-select[formcontrolname="category"], select[name="category"]';
    this.tagInput = 'input[formcontrolname="tags"], mat-chip-input';
    this.saveButton = 'button:has-text("Save"), button[type="submit"]';
    this.stateSelect = 'mat-select[formcontrolname="state"], button:has-text("Change state")';
    this.amendmentButton = 'button:has-text("Create amendment")';
    this.supportButton = 'button:has-text("Support")';
    this.recommendationButton = 'button:has-text("Add recommendation")';
    this.voteButton = 'button:has-text("Start voting")';
    this.editButton = 'button:has-text("Edit"), [data-cy="edit-motion"]';
    this.searchInput = 'input[type="search"], input[placeholder*="Search"]';
    this.exportButton = 'button:has-text("Export")';
    this.historyTab = 'mat-tab:has-text("History"), [role="tab"]:has-text("History")';
  }

  async navigate(): Promise<void> {
    await this.goto('/motions', {
      waitForNetworkIdle: true
    });
  }

  async createMotion(data: {
    title: string;
    text: string;
    reason?: string;
    category?: string;
    tags?: string[];
  }): Promise<void> {
    await this.click(this.createButton, {
      waitForLoadState: true
    });
    
    await this.fill(this.titleInput, data.title);
    await this.fill(this.textInput, data.text);
    
    if (data.reason) {
      await this.fill(this.reasonInput, data.reason);
    }
    
    if (data.category) {
      await this.click(this.categorySelect);
      await this.click(`mat-option:has-text("${data.category}")`);
    }
    
    if (data.tags) {
      for (const tag of data.tags) {
        await this.fill(this.tagInput, tag);
        await this.page.keyboard.press('Enter');
      }
    }
    
    await this.click(this.saveButton, {
      waitForNetworkIdle: true,
      waitForResponse: (response) => response.url().includes('/api/') && response.status() === 200
    });
  }

  async selectMotion(title: string): Promise<void> {
    await this.click(`mat-card:has-text("${title}"), .motion-item:has-text("${title}")`, {
      waitForLoadState: true
    });
  }

  async changeState(newState: string): Promise<void> {
    await this.click(this.stateSelect);
    await this.click(`mat-option:has-text("${newState}"), button:has-text("${newState}")`, {
      waitForNetworkIdle: true
    });
  }

  async createAmendment(amendmentText: string, reason?: string): Promise<void> {
    await this.click(this.amendmentButton, {
      waitForLoadState: true
    });
    
    const amendmentInput = '[formcontrolname="amendment_text"]';
    await this.fill(amendmentInput, amendmentText);
    
    if (reason) {
      const amendmentReason = this.page.locator('[formcontrolname="amendment_reason"]');
      await amendmentReason.fill(reason);
    }
    
    await this.click(this.saveButton);
    await this.page.waitForTimeout(2000);
  }

  async supportMotion(): Promise<void> {
    await this.click(this.supportButton);
    await this.page.waitForTimeout(1000);
  }

  async addRecommendation(type: string, text: string): Promise<void> {
    await this.click(this.recommendationButton);
    await this.page.waitForTimeout(500);
    
    await this.page.locator(`mat-select[formcontrolname="recommendation_type"]`).click();
    await this.page.locator(`mat-option:has-text("${type}")`).click();
    
    const recommendationText = this.page.locator('[formcontrolname="recommendation_text"]');
    await recommendationText.fill(text);
    
    await this.click(this.saveButton);
    await this.page.waitForTimeout(2000);
  }

  async startVoting(config: {
    type: string;
    method: string;
    majority: string;
  }): Promise<void> {
    await this.click(this.voteButton);
    await this.page.waitForTimeout(1000);
    
    await this.page.locator('[formcontrolname="voting_type"]').click();
    await this.page.locator(`mat-option:has-text("${config.type}")`).click();
    
    await this.page.locator('[formcontrolname="voting_method"]').click();
    await this.page.locator(`mat-option:has-text("${config.method}")`).click();
    
    await this.page.locator('[formcontrolname="majority_type"]').click();
    await this.page.locator(`mat-option:has-text("${config.majority}")`).click();
    
    await this.page.locator('button:has-text("Start")').click();
    await this.page.waitForTimeout(2000);
  }

  async editMotion(updates: Partial<{
    title: string;
    text: string;
  }>): Promise<void> {
    await this.click(this.editButton);
    await this.page.waitForTimeout(1000);
    
    if (updates.title) {
      await this.clear(this.titleInput);
      await this.fill(this.titleInput, updates.title);
    }
    
    if (updates.text) {
      await this.clear(this.textInput);
      await this.fill(this.textInput, updates.text);
    }
    
    await this.click(this.saveButton);
    await this.page.waitForTimeout(2000);
  }

  async exportMotions(format: string, options?: string[]): Promise<void> {
    await this.click(this.exportButton);
    await this.page.waitForTimeout(500);
    
    await this.page.locator(`mat-radio-button:has-text("${format}")`).click();
    
    if (options) {
      for (const option of options) {
        await this.page.locator(`mat-checkbox:has-text("${option}")`).click();
      }
    }
    
    await this.page.locator('button:has-text("Export")').click();
    await this.page.waitForTimeout(3000);
  }

  async getMotionState(): Promise<string> {
    const stateElement = await this.page.locator('.motion-state, .state-badge').first();
    return await stateElement.textContent() || '';
  }

  async getSupporterCount(): Promise<number> {
    const supporterText = await this.page.locator('.supporter-count').textContent() || '0';
    return parseInt(supporterText.replace(/\D/g, ''));
  }

  async isVotingActive(): Promise<boolean> {
    return await this.page.locator('.voting-active, button:has-text("Vote now")').isVisible();
  }
}