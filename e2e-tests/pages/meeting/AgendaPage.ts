import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AgendaPage extends BasePage {
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
    await this.waitForPageLoad();
  }

  async createAgendaItem(itemData: {
    title: string;
    type?: 'common' | 'internal' | 'hidden';
    duration?: number;
    comment?: string;
  }) {
    await this.clickElement(this.createItemButton);
    
    await this.fillInput('input[formcontrolname="title"]', itemData.title);
    
    if (itemData.type) {
      await this.selectOption('mat-select[formcontrolname="type"]', itemData.type);
    }
    
    if (itemData.duration) {
      await this.fillInput('input[formcontrolname="duration"]', itemData.duration.toString());
    }
    
    if (itemData.comment) {
      await this.fillInput('textarea[formcontrolname="comment"]', itemData.comment);
    }
    
    await this.clickElement('button:has-text("Create")');
    await this.waitForNotification('Agenda item created');
  }

  async openSpeakerList(itemTitle: string) {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.speakerButton).click();
    await this.waitForElement('.speaker-dialog');
  }

  async addSpeaker(userName: string) {
    await this.fillInput('input[placeholder*="Add speaker"]', userName);
    await this.page.locator('.user-suggestion', { hasText: userName }).click();
    await this.clickElement('button:has-text("Add")');
  }

  async startSpeaker(speakerName: string) {
    const speakerRow = this.page.locator('.speaker-row', { hasText: speakerName });
    await speakerRow.locator('button:has-text("Start")').click();
  }

  async stopSpeaker() {
    await this.clickElement('button:has-text("Stop")');
  }

  async projectAgendaItem(itemTitle: string) {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.projectorButton).click();
    await this.waitForNotification('Projected');
  }

  async getAgendaItemCount(): Promise<number> {
    await this.waitForElement(this.agendaItems);
    return await this.page.locator(this.agendaItems).count();
  }

  async deleteAgendaItem(itemTitle: string) {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.itemMenu).click();
    await this.clickElement('button:has-text("Delete")');
    await this.clickElement('button:has-text("Confirm")');
    await this.waitForNotification('Agenda item deleted');
  }

  async changeItemVisibility(itemTitle: string, visibility: 'public' | 'internal' | 'hidden') {
    const item = this.page.locator(this.agendaItems, { hasText: itemTitle });
    await item.locator(this.itemMenu).click();
    await this.clickElement(`button:has-text("Set as ${visibility}")`);
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