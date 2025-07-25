import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MeetingsPage extends BasePage {
  private createMeetingButton = '[data-cy="headbarMainButton"]';
  private meetingTiles = '.meeting-tile';
  private searchInput = 'input[placeholder*="Search"]';
  private filterButton = 'button:has-text("Filter")';
  private sortButton = 'button:has-text("Sort")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToMeetings() {
    await this.goto('/meetings');
    // Wait for the Angular app to load
    await this.page.waitForSelector('os-root, app-root', { timeout: 10000 }).catch(() => {});
    // Additional wait for components to render
    await this.page.waitForTimeout(3000);
  }

  async createMeeting(meetingData: {
    name: string;
    committee?: string;
    startDate?: string;
    description?: string;
  }) {
    await this.clickElement(this.createMeetingButton);
    
    // Fill meeting form
    await this.fillInput('input[formcontrolname="name"]', meetingData.name);
    
    if (meetingData.committee) {
      await this.selectOption('mat-select[formcontrolname="committee_id"]', meetingData.committee);
    }
    
    if (meetingData.startDate) {
      await this.fillInput('input[formcontrolname="start_time"]', meetingData.startDate);
    }
    
    if (meetingData.description) {
      await this.fillInput('textarea[formcontrolname="description"]', meetingData.description);
    }
    
    await this.clickElement('button:has-text("Create")');
    await this.waitForNotification('Meeting created successfully');
  }

  async enterMeeting(meetingName: string) {
    const meetingTile = this.page.locator(this.meetingTiles, { hasText: meetingName });
    await meetingTile.click();
    await this.page.waitForURL(/.*\/\d+\/home/);
  }

  async searchMeetings(searchTerm: string) {
    await this.fillInput(this.searchInput, searchTerm);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getMeetingCount(): Promise<number> {
    await this.waitForElement(this.meetingTiles);
    return await this.page.locator(this.meetingTiles).count();
  }

  async isMeetingVisible(meetingName: string): Promise<boolean> {
    return await this.isElementVisible(`.meeting-tile:has-text("${meetingName}")`);
  }

  async duplicateMeeting(meetingName: string) {
    const meetingTile = this.page.locator(this.meetingTiles, { hasText: meetingName });
    await meetingTile.locator('button[mattooltip="More options"]').click();
    await this.clickElement('button:has-text("Duplicate")');
    await this.waitForNotification('Meeting duplicated successfully');
  }

  async deleteMeeting(meetingName: string) {
    const meetingTile = this.page.locator(this.meetingTiles, { hasText: meetingName });
    await meetingTile.locator('button[mattooltip="More options"]').click();
    await this.clickElement('button:has-text("Delete")');
    await this.clickElement('button:has-text("Confirm")');
    await this.waitForNotification('Meeting deleted successfully');
  }

  async archiveMeeting(meetingName: string) {
    const meetingTile = this.page.locator(this.meetingTiles, { hasText: meetingName });
    await meetingTile.locator('button[mattooltip="More options"]').click();
    await this.clickElement('button:has-text("Archive")');
    await this.waitForNotification('Meeting archived successfully');
  }
}