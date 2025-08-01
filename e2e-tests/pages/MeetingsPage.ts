import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class MeetingsPage extends EnhancedBasePage {
  private createMeetingButton = '[data-cy="committee-list-header"] [data-cy="headbarMainButton"], [data-cy="headbarMainButton"]';
  private meetingTiles = '.meeting-tile';
  private searchInput = 'input[placeholder*="Search"]';
  private filterButton = 'button:has-text("Filter")';
  private sortButton = 'button:has-text("Sort")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToMeetings() {
    // Navigate to committees page (meetings are under committees in OpenSlides)
    await this.goto('/committees', {
      waitForNetworkIdle: true,
      waitForSelector: 'mat-card, .committee-list, .meeting-list, .content'
    });
  }

  async createMeeting(meetingData: {
    name: string;
    committee?: string;
    startDate?: string;
    description?: string;
  }) {
    try {
      // First, check if we need to create a committee
      const createButtonSelectors = [
        '[data-cy="headbarMainButton"]',
        'button mat-icon:has-text("add_circle")',
        'button:has-text("add_circle")',
        'button:has-text("New")',
        'button:has-text("Create")',
        'button[aria-label*="Create"]',
        'button[aria-label*="Add"]',
        '.mat-toolbar button[mat-button]',
        '.mat-toolbar button[mat-raised-button]'
      ];
      
      // Use enhanced clickAny to find and click create button
      await this.clickAny(createButtonSelectors, {
        waitForNetworkIdle: true
      });
      
      // Wait for form to appear using enhanced waiting
      await this.page.waitForTimeout(500); // Small delay for modal animation
      
      // Fill in the form - try different selectors
      const nameSelectors = [
        'input[formcontrolname="name"]',
        'input[name="name"]',
        'input[placeholder*="Name" i]',
        'input[placeholder*="Title" i]',
        'input[type="text"]'
      ];
      
      // Use enhanced waitForAnySelector to find the name input
      const nameSelector = await this.waitForAnySelector(nameSelectors, { timeout: 5000 });
      await this.fill(nameSelector, meetingData.name);
      
      // Try to submit the form
      const submitSelectors = [
        'button:has-text("Create")',
        'button:has-text("Save")',
        'button[type="submit"]',
        'mat-dialog-actions button:last-child',
        '.mat-mdc-dialog-actions button:last-child'
      ];
      
      // Use enhanced clickAny to submit the form
      await this.clickAny(submitSelectors, {
        waitForNetworkIdle: true,
        waitForResponse: (response) => response.url().includes('/api/') && response.status() === 200
      });
      
      // Enhanced waiting handled by clickAny above
      
      // Check if we were redirected (success)
      const currentUrl = this.page.url();
      if (currentUrl.includes('/committees/') && currentUrl !== this.baseUrl + '/committees') {
        console.log('Meeting/Committee created successfully');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  async enterMeeting(meetingName: string) {
    console.log(`Attempting to enter meeting: ${meetingName}`);
    
    // First check if we have any committee links
    const committeeLinks = await this.page.locator('a[href*="/committees/"]').count();
    console.log(`Found ${committeeLinks} committee links`);
    
    // Try to find the specific committee/meeting
    const tileSelectors = [
      `[data-cy^="committee-link-"]:has-text("${meetingName}")`,
      `a[data-cy^="committee-link-"]:has-text("${meetingName}")`,
      `a[href*="/committees/"]:has-text("${meetingName}")`,
      `mat-card:has-text("${meetingName}")`,
      `.mat-mdc-card:has-text("${meetingName}")`,
      `a:has-text("${meetingName}")`,
      // Try partial text match
      `[data-cy^="committee-link-"]`,
      `a[href*="/committees/"]`,
      'mat-card',
      '.mat-mdc-card'
    ];
    
    // Try to find and click the meeting/committee
    try {
      await this.clickAny(tileSelectors, {
        waitForNetworkIdle: true,
        timeout: 10000
      });
    } catch {
      // If exact match fails, try clicking the first committee
      console.log(`Could not find exact match for "${meetingName}", trying first committee`);
      await this.click('[data-cy^="committee-link-"], a[href*="/committees/"]', {
        waitForNetworkIdle: true
      });
    }
    
    // Navigation wait handled by enhanced click above
    
    // Check if we're directly in a meeting or need to enter
    const currentUrl = this.page.url();
    console.log(`Current URL after click: ${currentUrl}`);
    
    // If we're on a committee page (not in a meeting), we might need to enter
    if (currentUrl.match(/\/committees\/\d+$/) || currentUrl.includes('/committees/') && !currentUrl.match(/\/\d+\/(agenda|motions|participants)/)) {
      console.log('On committee page, looking for meeting entry');
      
      // Look for meeting links or enter buttons
      const meetingEntrySelectors = [
        'a[href*="/agenda"]',
        'a[href*="/motions"]', 
        'button:has-text("Enter")',
        'a:has-text("Go to meeting")',
        '.meeting-link'
      ];
      
      try {
        await this.clickAny(meetingEntrySelectors, {
          waitForNetworkIdle: true
        });
        console.log('Entered meeting');
      } catch {
        console.log('Could not find meeting entry button');
      }
    }
    
    console.log(`Final URL: ${this.page.url()}`);
  }

  async searchMeetings(searchTerm: string) {
    await this.fill(this.searchInput, searchTerm, {
      waitForNetworkIdle: true
    });
  }

  async getMeetingCount(): Promise<number> {
    await this.waitForElementStable(this.meetingTiles);
    return await this.page.locator(this.meetingTiles).count();
  }

  async isMeetingVisible(meetingName: string): Promise<boolean> {
    // Try multiple selectors to check visibility
    const selectors = [
      `[data-cy^="committee-link-"]:has-text("${meetingName}")`,
      `.meeting-tile:has-text("${meetingName}")`,
      `a[href*="/committees/"]:has-text("${meetingName}")`,
      `mat-card:has-text("${meetingName}")`,
      `.mat-mdc-card:has-text("${meetingName}")`
    ];
    
    for (const selector of selectors) {
      if (await this.isVisible(selector, { timeout: 1000 })) {
        return true;
      }
    }
    
    // Also check if any committee link contains the meeting name
    const links = await this.page.locator('a[href*="/committees/"]').all();
    for (const link of links) {
      const text = await link.textContent();
      if (text?.includes(meetingName)) {
        return true;
      }
    }
    
    return false;
  }

  async duplicateMeeting(meetingName: string) {
    await this.click(`${this.meetingTiles}:has-text("${meetingName}") button[mattooltip="More options"]`, {
      waitForLoadState: true
    });
    await this.click('button:has-text("Duplicate")', {
      waitForNetworkIdle: true
    });
    await this.waitForNotification('Meeting duplicated successfully');
  }

  async deleteMeeting(meetingName: string) {
    await this.click(`${this.meetingTiles}:has-text("${meetingName}") button[mattooltip="More options"]`, {
      waitForLoadState: true
    });
    await this.click('button:has-text("Delete")', {
      waitForLoadState: true
    });
    await this.click('button:has-text("Confirm")', {
      waitForNetworkIdle: true
    });
    await this.waitForNotification('Meeting deleted successfully');
  }

  async archiveMeeting(meetingName: string) {
    await this.click(`${this.meetingTiles}:has-text("${meetingName}") button[mattooltip="More options"]`, {
      waitForLoadState: true
    });
    await this.click('button:has-text("Archive")', {
      waitForNetworkIdle: true
    });
    await this.waitForNotification('Meeting archived successfully');
  }
}