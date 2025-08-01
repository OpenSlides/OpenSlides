import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class MotionsPage extends BasePage {
  private createMotionButton = '[data-cy="headbarMainButton"]';
  private motionCards = '.motion-card';
  private stateButton = '.state-button';
  private workflowButton = '.workflow-button';
  private amendmentButton = '.amendment-button';

  constructor(page: Page) {
    super(page);
  }

  async navigateToMotions(meetingId: string) {
    await this.goto(`/${meetingId}/motions`);
    await this.waitForPageLoad();
  }

  async createMotion(motionData: {
    title: string;
    text: string;
    reason?: string;
    category?: string;
    tags?: string[];
  }) {
    await this.clickElement(this.createMotionButton);
    
    await this.fillInput('input[formcontrolname="title"]', motionData.title);
    await this.fillInput('div[contenteditable="true"].motion-text', motionData.text);
    
    if (motionData.reason) {
      await this.fillInput('div[contenteditable="true"].motion-reason', motionData.reason);
    }
    
    if (motionData.category) {
      await this.selectOption('mat-select[formcontrolname="category_id"]', motionData.category);
    }
    
    if (motionData.tags && motionData.tags.length > 0) {
      await this.clickElement('mat-select[formcontrolname="tag_ids"]');
      for (const tag of motionData.tags) {
        await this.clickElement(`mat-option:has-text("${tag}")`);
      }
      await this.page.keyboard.press('Escape');
    }
    
    await this.clickElement('button:has-text("Create")');
    await this.waitForNotification('Motion created');
  }

  async changeMotionState(motionTitle: string, newState: string) {
    const motion = this.page.locator(this.motionCards, { hasText: motionTitle });
    await motion.locator(this.stateButton).click();
    await this.clickElement(`button:has-text("${newState}")`);
    await this.waitForNotification('State changed');
  }

  async createAmendment(parentMotionTitle: string, amendmentData: {
    paragraph: number;
    text: string;
  }) {
    const motion = this.page.locator(this.motionCards, { hasText: parentMotionTitle });
    await motion.locator(this.amendmentButton).click();
    
    await this.clickElement(`button:has-text("Paragraph ${amendmentData.paragraph}")`);
    await this.fillInput('div[contenteditable="true"].amendment-text', amendmentData.text);
    await this.clickElement('button:has-text("Create amendment")');
    await this.waitForNotification('Amendment created');
  }

  async supportMotion(motionTitle: string) {
    const motion = this.page.locator(this.motionCards, { hasText: motionTitle });
    await motion.locator('button:has-text("Support")').click();
    await this.waitForNotification('Motion supported');
  }

  async createPoll(motionTitle: string, pollData: {
    type: 'analog' | 'named' | 'pseudoanonymous';
    method: 'YN' | 'YNA';
  }) {
    const motion = this.page.locator(this.motionCards, { hasText: motionTitle });
    await motion.locator('button:has-text("Create poll")').click();
    
    await this.selectOption('mat-select[formcontrolname="type"]', pollData.type);
    await this.selectOption('mat-select[formcontrolname="pollmethod"]', pollData.method);
    
    await this.clickElement('button:has-text("Create")');
    await this.waitForNotification('Poll created');
  }

  async startPoll(motionTitle: string) {
    const motion = this.page.locator(this.motionCards, { hasText: motionTitle });
    await motion.locator('button:has-text("Start poll")').click();
    await this.waitForNotification('Poll started');
  }

  async getMotionCount(): Promise<number> {
    await this.waitForElement(this.motionCards);
    return await this.page.locator(this.motionCards).count();
  }

  async filterByState(state: string) {
    await this.clickElement('button:has-text("Filter")');
    await this.clickElement(`mat-checkbox:has-text("${state}")`);
    await this.clickElement('button:has-text("Apply")');
    await this.page.waitForTimeout(500);
  }

  async searchMotions(searchTerm: string) {
    await this.fillInput('input[placeholder*="Search"]', searchTerm);
    await this.page.waitForTimeout(500);
  }

  async exportMotions(format: 'pdf' | 'csv' | 'xlsx') {
    await this.clickElement('button[mattooltip="Export"]');
    await this.clickElement(`button:has-text("Export as ${format.toUpperCase()}")`);
    
    // Wait for download
    const downloadPromise = this.page.waitForEvent('download');
    await downloadPromise;
  }
}