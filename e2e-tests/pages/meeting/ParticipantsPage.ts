import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ParticipantsPage extends BasePage {
  private addParticipantButton = '[data-cy="headbarMainButton"]';
  private participantCards = '.participant-card';
  private presenceCheckbox = '.presence-checkbox';
  private participantMenu = '.participant-menu';

  constructor(page: Page) {
    super(page);
  }

  async navigateToParticipants(meetingId: string) {
    await this.goto(`/${meetingId}/participants`);
    await this.waitForPageLoad();
  }

  async addParticipant(userData: {
    username: string;
    group?: string;
    markAsPresent?: boolean;
  }) {
    await this.clickElement(this.addParticipantButton);
    
    // Search and select user
    await this.fillInput('input[placeholder*="Search"]', userData.username);
    await this.page.waitForTimeout(500);
    await this.clickElement(`.user-result:has-text("${userData.username}")`);
    
    if (userData.group) {
      await this.selectOption('mat-select[formcontrolname="group_ids"]', userData.group);
    }
    
    if (userData.markAsPresent) {
      await this.clickElement('mat-checkbox[formcontrolname="present"]');
    }
    
    await this.clickElement('button:has-text("Add Participants")');
    await this.waitForNotification('Participant added');
  }

  async togglePresence(participantName: string, present: boolean) {
    const participant = this.page.locator(this.participantCards, { hasText: participantName });
    const checkbox = participant.locator(this.presenceCheckbox);
    
    const isChecked = await checkbox.isChecked();
    if (isChecked !== present) {
      await checkbox.click();
      await this.waitForNotification('Presence updated');
    }
  }

  async changeParticipantGroup(participantName: string, newGroup: string) {
    const participant = this.page.locator(this.participantCards, { hasText: participantName });
    await participant.locator(this.participantMenu).click();
    await this.clickElement('button:has-text("Change groups")');
    
    await this.selectOption('mat-select[formcontrolname="group_ids"]', newGroup);
    await this.clickElement('button:has-text("Save")');
    await this.waitForNotification('Groups updated');
  }

  async addToSpeakersList(participantName: string) {
    const participant = this.page.locator(this.participantCards, { hasText: participantName });
    await participant.locator(this.participantMenu).click();
    await this.clickElement('button:has-text("Add to speakers")');
    await this.waitForNotification('Added to speakers list');
  }

  async getPresentCount(): Promise<number> {
    await this.waitForElement(this.participantCards);
    const checkedBoxes = await this.page.locator(`${this.presenceCheckbox}:checked`).count();
    return checkedBoxes;
  }

  async getParticipantCount(): Promise<number> {
    await this.waitForElement(this.participantCards);
    return await this.page.locator(this.participantCards).count();
  }

  async filterByGroup(groupName: string) {
    await this.clickElement('button:has-text("Filter")');
    await this.clickElement(`mat-checkbox:has-text("${groupName}")`);
    await this.clickElement('button:has-text("Apply")');
    await this.page.waitForTimeout(500);
  }

  async importParticipants(csvFile: string) {
    await this.clickElement('button[mattooltip="Import"]');
    
    const fileInput = await this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFile);
    
    // Map columns
    await this.selectOption('mat-select[formcontrolname="username_column"]', 'Username');
    await this.selectOption('mat-select[formcontrolname="first_name_column"]', 'First Name');
    await this.selectOption('mat-select[formcontrolname="last_name_column"]', 'Last Name');
    
    await this.clickElement('button:has-text("Import")');
    await this.waitForNotification('Import completed');
  }

  async removeParticipant(participantName: string) {
    const participant = this.page.locator(this.participantCards, { hasText: participantName });
    await participant.locator(this.participantMenu).click();
    await this.clickElement('button:has-text("Remove from meeting")');
    await this.clickElement('button:has-text("Confirm")');
    await this.waitForNotification('Participant removed');
  }
}