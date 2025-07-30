import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class DashboardPage extends EnhancedBasePage {
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
    await this.goto('/dashboard', {
      waitForSelector: this.welcomeMessage
    });
  }

  async isOnDashboard(): Promise<boolean> {
    // Check multiple indicators that we're on the dashboard
    const url = this.page.url();
    if (url === 'https://localhost:8000/' || url.includes('/dashboard')) {
      return true;
    }
    
    // Also check for dashboard elements
    const hasCalendar = await this.isVisible('text=Calendar', { timeout: 2000 });
    const hasMeetings = await this.isVisible('text=Meetings', { timeout: 2000 });
    
    return hasCalendar || hasMeetings;
  }

  async getActiveUserCount(): Promise<number> {
    await this.waitForElementStable(this.activeUsersWidget);
    const text = await this.getText(this.activeUsersWidget);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  async getActiveMeetingCount(): Promise<number> {
    await this.waitForElementStable(this.activeMeetingsWidget);
    const text = await this.getText(this.activeMeetingsWidget);
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  async navigateToMeetings() {
    await this.click(this.navigationLinks.meetings, {
      waitForNetworkIdle: true
    });
    await this.page.waitForURL('**/meetings');
  }

  async navigateToCommittees() {
    await this.click(this.navigationLinks.committees, {
      waitForNetworkIdle: true
    });
    await this.page.waitForURL('**/committees');
  }

  async navigateToAccounts() {
    await this.click(this.navigationLinks.accounts, {
      waitForNetworkIdle: true
    });
    await this.page.waitForURL('**/accounts');
  }

  async navigateToOrganization() {
    await this.click(this.navigationLinks.organization, {
      waitForNetworkIdle: true
    });
    await this.page.waitForURL('**/organization');
  }

  async quickCreateMeeting(meetingName: string) {
    await this.click('.quick-action-create-meeting', {
      waitForLoadState: true
    });
    await this.fill('input[formcontrolname="name"]', meetingName);
    await this.click('button:has-text("Create")', {
      waitForNetworkIdle: true
    });
    await this.waitForNotification('Meeting created successfully');
  }
}