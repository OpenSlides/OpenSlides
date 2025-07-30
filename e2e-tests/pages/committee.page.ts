import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class CommitteePage extends EnhancedBasePage {
  readonly createButton: string;
  readonly committeeList: string;
  readonly nameInput: string;
  readonly descriptionInput: string;
  readonly prefixInput: string;
  readonly saveButton: string;
  readonly deleteButton: string;
  readonly editButton: string;
  readonly searchInput: string;
  readonly membersTab: string;
  readonly addMemberButton: string;

  constructor(page: Page) {
    super(page);
    this.createButton = 'button:has-text("Create committee"), [data-cy="create-committee"]';
    this.committeeList = '.committee-list, [class*="committee-item"]';
    this.nameInput = 'input[formcontrolname="name"], input[name="committee-name"]';
    this.descriptionInput = 'textarea[formcontrolname="description"], textarea[name="description"]';
    this.prefixInput = 'input[formcontrolname="meeting_prefix"], input[name="prefix"]';
    this.saveButton = 'button:has-text("Save"), button[type="submit"]';
    this.deleteButton = 'button:has-text("Delete"), [data-cy="delete-committee"]';
    this.editButton = 'button:has-text("Edit"), [data-cy="edit-committee"]';
    this.searchInput = 'input[type="search"], input[placeholder*="Search"]';
    this.membersTab = 'mat-tab:has-text("Members"), [role="tab"]:has-text("Members")';
    this.addMemberButton = 'button:has-text("Add member"), [data-cy="add-member"]';
  }

  async navigate(): Promise<void> {
    await this.goto('/committees', {
      waitForNetworkIdle: true
    });
  }

  async createCommittee(name: string, description?: string, prefix?: string): Promise<void> {
    await this.click(this.createButton, {
      waitForLoadState: true
    });
    await this.fill(this.nameInput, name);
    
    if (description) {
      await this.fill(this.descriptionInput, description);
    }
    
    if (prefix) {
      await this.fill(this.prefixInput, prefix);
    }
    
    await this.click(this.saveButton, {
      waitForNetworkIdle: true,
      waitForResponse: (response) => response.url().includes('/api/') && response.status() === 200
    });
  }

  async searchCommittee(searchTerm: string): Promise<void> {
    await this.fill(this.searchInput, searchTerm, {
      waitForNetworkIdle: true
    });
  }

  async selectCommittee(name: string): Promise<void> {
    await this.click(`text="${name}"`, {
      waitForLoadState: true
    });
  }

  async editCommittee(newName: string): Promise<void> {
    await this.click(this.editButton, {
      waitForLoadState: true
    });
    await this.fill(this.nameInput, newName);
    await this.click(this.saveButton, {
      waitForNetworkIdle: true
    });
  }

  async deleteCommittee(): Promise<void> {
    await this.click(this.deleteButton, {
      waitForLoadState: true
    });
    // Wait for confirmation dialog
    await this.click('button:has-text("Confirm"), button:has-text("Yes")', {
      waitForNetworkIdle: true
    });
  }

  async addMembers(members: Array<{user: string, role: string}>): Promise<void> {
    await this.click(this.membersTab, {
      waitForLoadState: true
    });
    
    for (const member of members) {
      await this.click(this.addMemberButton, {
        waitForLoadState: true
      });
      // Fill member details - this would depend on the actual UI
      await this.fill('[formcontrolname="user"]', member.user);
      await this.fill('[formcontrolname="role"]', member.role);
      await this.click('button:has-text("Add")', {
        waitForNetworkIdle: true
      });
    }
  }

  async getCommitteeCount(): Promise<number> {
    await this.waitForElementStable(this.committeeList);
    return await this.page.locator(this.committeeList).count();
  }

  async isCommitteeVisible(name: string): Promise<boolean> {
    return await this.isVisible(`text="${name}"`, { timeout: 5000 });
  }

  async hasCreatePermission(): Promise<boolean> {
    return await this.isVisible(this.createButton, { timeout: 5000 });
  }
}