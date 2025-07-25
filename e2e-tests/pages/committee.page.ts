import { Page, Locator } from '@playwright/test';

export class CommitteePage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly committeeList: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly prefixInput: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly editButton: Locator;
  readonly searchInput: Locator;
  readonly membersTab: Locator;
  readonly addMemberButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Create committee"), [data-cy="create-committee"]');
    this.committeeList = page.locator('.committee-list, [class*="committee-item"]');
    this.nameInput = page.locator('input[formcontrolname="name"], input[name="committee-name"]');
    this.descriptionInput = page.locator('textarea[formcontrolname="description"], textarea[name="description"]');
    this.prefixInput = page.locator('input[formcontrolname="meeting_prefix"], input[name="prefix"]');
    this.saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
    this.deleteButton = page.locator('button:has-text("Delete"), [data-cy="delete-committee"]');
    this.editButton = page.locator('button:has-text("Edit"), [data-cy="edit-committee"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    this.membersTab = page.locator('mat-tab:has-text("Members"), [role="tab"]:has-text("Members")');
    this.addMemberButton = page.locator('button:has-text("Add member"), [data-cy="add-member"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/committees');
    await this.page.waitForLoadState('networkidle');
  }

  async createCommittee(name: string, description?: string, prefix?: string): Promise<void> {
    await this.createButton.click();
    await this.nameInput.fill(name);
    
    if (description) {
      await this.descriptionInput.fill(description);
    }
    
    if (prefix) {
      await this.prefixInput.fill(prefix);
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async searchCommittee(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(1000);
  }

  async selectCommittee(name: string): Promise<void> {
    await this.page.locator(`text="${name}"`).click();
    await this.page.waitForTimeout(1000);
  }

  async editCommittee(newName: string): Promise<void> {
    await this.editButton.click();
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteCommittee(): Promise<void> {
    await this.deleteButton.click();
    // Wait for confirmation dialog
    await this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').click();
    await this.page.waitForTimeout(2000);
  }

  async addMembers(members: Array<{user: string, role: string}>): Promise<void> {
    await this.membersTab.click();
    await this.page.waitForTimeout(1000);
    
    for (const member of members) {
      await this.addMemberButton.click();
      // Fill member details - this would depend on the actual UI
      await this.page.fill('[formcontrolname="user"]', member.user);
      await this.page.fill('[formcontrolname="role"]', member.role);
      await this.page.locator('button:has-text("Add")').click();
      await this.page.waitForTimeout(500);
    }
  }

  async getCommitteeCount(): Promise<number> {
    return await this.committeeList.count();
  }

  async isCommitteeVisible(name: string): Promise<boolean> {
    return await this.page.locator(`text="${name}"`).isVisible();
  }

  async hasCreatePermission(): Promise<boolean> {
    return await this.createButton.isVisible();
  }
}