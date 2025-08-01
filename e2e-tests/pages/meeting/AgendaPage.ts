import { Page } from '@playwright/test';
import { EnhancedBasePage } from '../EnhancedBasePage';

export class AgendaPage extends EnhancedBasePage {
  private createItemButton = '[data-cy="headbarMainButton"]';
  private agendaItems = '.agenda-item';
  private speakerButton = '.speaker-button';
  private projectorButton = '.projector-button';
  private itemMenu = '.item-menu';

  constructor(page: Page) {
    super(page);
  }

  async navigateToAgenda(meetingId: string) {
    await this.goto(`/${meetingId}/agenda`);
    // Don't wait for networkidle as it can timeout, just wait for agenda elements
    await this.page.waitForTimeout(2000);
    try {
      await this.page.waitForSelector('.agenda-list, .agenda-content, .agenda-container, mat-card', { timeout: 5000 });
    } catch {
      // Page might be empty, that's okay
      console.log('No agenda items found, page might be empty');
    }
  }

  async createAgendaItem(itemData: {
    title: string;
    type?: 'common' | 'internal' | 'hidden';
    duration?: number;
    comment?: string;
  }) {
    await this.click(this.createItemButton);
    
    await this.fill('input[formcontrolname="title"]', itemData.title);
    
    if (itemData.type) {
      await this.select('mat-select[formcontrolname="type"]', itemData.type);
    }
    
    if (itemData.duration) {
      await this.fill('input[formcontrolname="duration"]', itemData.duration.toString());
    }
    
    if (itemData.comment) {
      await this.fill('textarea[formcontrolname="comment"]', itemData.comment);
    }
    
    await this.click('button:has-text("Create")');
    await this.waitForNotification('Agenda item created');
  }

  async openSpeakerList(itemTitle: string) {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.speakerButton).click();
    await this.page.waitForSelector('.speaker-dialog', { timeout: 5000 });
  }

  async addSpeaker(userName: string) {
    await this.fill('input[placeholder*="Add speaker"]', userName);
    await this.page.locator('.user-suggestion', { hasText: userName }).click();
    await this.click('button:has-text("Add")');
  }

  async startSpeaker(speakerName: string) {
    const speakerRow = this.page.locator('.speaker-row', { hasText: speakerName });
    await speakerRow.locator('button:has-text("Start")').click();
  }

  async stopSpeaker() {
    await this.click('button:has-text("Stop")');
  }

  async projectAgendaItem(itemTitle: string) {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.projectorButton).click();
    await this.waitForNotification('Projected');
  }

  async getAgendaItemCount(): Promise<number> {
    await this.page.waitForSelector(this.agendaItems, { timeout: 5000 });
    return await this.page.locator(this.agendaItems).count();
  }

  async deleteAgendaItem(itemTitle: string) {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.itemMenu).click();
    await this.click('button:has-text("Delete")');
    await this.click('button:has-text("Confirm")');
    await this.waitForNotification('Agenda item deleted');
  }

  async changeItemVisibility(itemTitle: string, visibility: 'public' | 'internal' | 'hidden') {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.itemMenu).click();
    await this.click(`button:has-text("Set as ${visibility}")`);
    await this.waitForNotification('Visibility changed');
  }

  async reorderAgendaItem(itemTitle: string, direction: 'up' | 'down') {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    const handle = item.locator('.drag-handle');
    
    const box = await item.boundingBox();
    if (!box) throw new Error('Could not find agenda item');
    
    const offset = direction === 'up' ? -100 : 100;
    await handle.dragTo(handle, {
      targetPosition: { x: 0, y: offset }
    });
  }
}