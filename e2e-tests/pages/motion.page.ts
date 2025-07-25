import { Page, Locator } from '@playwright/test';

export class MotionPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly motionList: Locator;
  readonly titleInput: Locator;
  readonly textInput: Locator;
  readonly reasonInput: Locator;
  readonly categorySelect: Locator;
  readonly tagInput: Locator;
  readonly saveButton: Locator;
  readonly stateSelect: Locator;
  readonly amendmentButton: Locator;
  readonly supportButton: Locator;
  readonly recommendationButton: Locator;
  readonly voteButton: Locator;
  readonly editButton: Locator;
  readonly searchInput: Locator;
  readonly exportButton: Locator;
  readonly historyTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("New motion"), [data-cy="create-motion"]');
    this.motionList = page.locator('.motion-list, [class*="motion-item"], mat-card');
    this.titleInput = page.locator('input[formcontrolname="title"], input[name="motion-title"]');
    this.textInput = page.locator('div[contenteditable="true"], textarea[formcontrolname="text"]');
    this.reasonInput = page.locator('textarea[formcontrolname="reason"], div[name="reason"]');
    this.categorySelect = page.locator('mat-select[formcontrolname="category"], select[name="category"]');
    this.tagInput = page.locator('input[formcontrolname="tags"], mat-chip-input');
    this.saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
    this.stateSelect = page.locator('mat-select[formcontrolname="state"], button:has-text("Change state")');
    this.amendmentButton = page.locator('button:has-text("Create amendment")');
    this.supportButton = page.locator('button:has-text("Support")');
    this.recommendationButton = page.locator('button:has-text("Add recommendation")');
    this.voteButton = page.locator('button:has-text("Start voting")');
    this.editButton = page.locator('button:has-text("Edit"), [data-cy="edit-motion"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    this.exportButton = page.locator('button:has-text("Export")');
    this.historyTab = page.locator('mat-tab:has-text("History"), [role="tab"]:has-text("History")');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/motions');
    await this.page.waitForLoadState('networkidle');
  }

  async createMotion(data: {
    title: string;
    text: string;
    reason?: string;
    category?: string;
    tags?: string[];
  }): Promise<void> {
    await this.createButton.click();
    await this.page.waitForTimeout(1000);
    
    await this.titleInput.fill(data.title);
    await this.textInput.fill(data.text);
    
    if (data.reason) {
      await this.reasonInput.fill(data.reason);
    }
    
    if (data.category) {
      await this.categorySelect.click();
      await this.page.locator(`mat-option:has-text("${data.category}")`).click();
    }
    
    if (data.tags) {
      for (const tag of data.tags) {
        await this.tagInput.fill(tag);
        await this.page.keyboard.press('Enter');
      }
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async selectMotion(title: string): Promise<void> {
    await this.page.locator(`mat-card:has-text("${title}"), .motion-item:has-text("${title}")`).click();
    await this.page.waitForTimeout(1000);
  }

  async changeState(newState: string): Promise<void> {
    await this.stateSelect.click();
    await this.page.locator(`mat-option:has-text("${newState}"), button:has-text("${newState}")`).click();
    await this.page.waitForTimeout(2000);
  }

  async createAmendment(amendmentText: string, reason?: string): Promise<void> {
    await this.amendmentButton.click();
    await this.page.waitForTimeout(1000);
    
    const amendmentInput = this.page.locator('[formcontrolname="amendment_text"]');
    await amendmentInput.fill(amendmentText);
    
    if (reason) {
      const amendmentReason = this.page.locator('[formcontrolname="amendment_reason"]');
      await amendmentReason.fill(reason);
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async supportMotion(): Promise<void> {
    await this.supportButton.click();
    await this.page.waitForTimeout(1000);
  }

  async addRecommendation(type: string, text: string): Promise<void> {
    await this.recommendationButton.click();
    await this.page.waitForTimeout(500);
    
    await this.page.locator(`mat-select[formcontrolname="recommendation_type"]`).click();
    await this.page.locator(`mat-option:has-text("${type}")`).click();
    
    const recommendationText = this.page.locator('[formcontrolname="recommendation_text"]');
    await recommendationText.fill(text);
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async startVoting(config: {
    type: string;
    method: string;
    majority: string;
  }): Promise<void> {
    await this.voteButton.click();
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
    await this.editButton.click();
    await this.page.waitForTimeout(1000);
    
    if (updates.title) {
      await this.titleInput.clear();
      await this.titleInput.fill(updates.title);
    }
    
    if (updates.text) {
      await this.textInput.clear();
      await this.textInput.fill(updates.text);
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async exportMotions(format: string, options?: string[]): Promise<void> {
    await this.exportButton.click();
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