import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private welcomeMessage = 'h1:has-text("Welcome")';
  private activeUsersWidget = '[data-cy="activeUsersWidget"]';
  private activeMeetingsWidget = '[data-cy="activeMeetingsWidget"]';
  private quickActionsPanel = '.quick-actions';
  private navigationLinks = {
    meetings: 'a[href*="/meetings"]',
    committees: 'a[href*="/committees"]',
    accounts: 'a[href*="/accounts"]',
    organization: 'a[href*="/organization"]'
  };

  constructor(page: Page) {
    super(page);
  }

  async navigateToDashboard() {
    await this.goto('/dashboard');
    await this.waitForElement(this.welcomeMessage);
  }

  async isOnDashboard(): Promise<boolean> {
    // Check multiple indicators that we're on the dashboard
    const url = this.page.url();
    if (url === 'https://localhost:8000/' || url.includes('/dashboard')) {
      return true;
    }
    
    // Also check for dashboard elements
    const hasCalendar = await this.isElementVisible('text=Calendar', 2000);
    const hasMeetings = await this.isElementVisible('text=Meetings', 2000);
    
    return hasCalendar || hasMeetings;
  }

  async getActiveUserCount(): Promise<number> {
    const widget = await this.waitForElement(this.activeUsersWidget);
    const text = await widget.textContent() || '0';
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  async getActiveMeetingCount(): Promise<number> {
    const widget = await this.waitForElement(this.activeMeetingsWidget);
    const text = await widget.textContent() || '0';
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  async navigateToMeetings() {
    await this.clickElement(this.navigationLinks.meetings);
    await this.page.waitForURL('**/meetings');
  }

  async navigateToCommittees() {
    await this.clickElement(this.navigationLinks.committees);
    await this.page.waitForURL('**/committees');
  }

  async navigateToAccounts() {
    await this.clickElement(this.navigationLinks.accounts);
    await this.page.waitForURL('**/accounts');
  }

  async navigateToOrganization() {
    await this.clickElement(this.navigationLinks.organization);
    await this.page.waitForURL('**/organization');
  }

  async quickCreateMeeting(meetingName: string) {
    await this.clickElement('.quick-action-create-meeting');
    await this.page.fill('input[formcontrolname="name"]', meetingName);
    await this.page.click('button:has-text("Create")');
    await this.waitForNotification('Meeting created successfully');
  }
}