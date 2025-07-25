import { Page, Locator } from '@playwright/test';

export class UserPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly userList: Locator;
  readonly usernameInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly groupSelect: Locator;
  readonly saveButton: Locator;
  readonly searchInput: Locator;
  readonly importButton: Locator;
  readonly resetPasswordButton: Locator;
  readonly deactivateButton: Locator;
  readonly groupsTab: Locator;
  readonly filterButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Create account"), [data-cy="create-user"]');
    this.userList = page.locator('.user-list, [class*="user-item"], mat-row');
    this.usernameInput = page.locator('input[formcontrolname="username"], input[name="username"]');
    this.firstNameInput = page.locator('input[formcontrolname="first_name"], input[name="firstName"]');
    this.lastNameInput = page.locator('input[formcontrolname="last_name"], input[name="lastName"]');
    this.emailInput = page.locator('input[formcontrolname="email"], input[type="email"]');
    this.passwordInput = page.locator('input[formcontrolname="password"], input[type="password"]');
    this.groupSelect = page.locator('mat-select[formcontrolname="groups"], select[name="groups"]');
    this.saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    this.importButton = page.locator('button:has-text("Import"), [data-cy="import-users"]');
    this.resetPasswordButton = page.locator('button:has-text("Reset password")');
    this.deactivateButton = page.locator('button:has-text("Deactivate")');
    this.groupsTab = page.locator('mat-tab:has-text("Groups"), [role="tab"]:has-text("Groups")');
    this.filterButton = page.locator('button:has-text("Filter"), [data-cy="filter-users"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/accounts');
    await this.page.waitForLoadState('networkidle');
  }

  async createUser(userData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    group?: string;
  }): Promise<void> {
    await this.createButton.click();
    await this.page.waitForTimeout(1000);
    
    await this.usernameInput.fill(userData.username);
    await this.firstNameInput.fill(userData.firstName);
    await this.lastNameInput.fill(userData.lastName);
    await this.emailInput.fill(userData.email);
    await this.passwordInput.fill(userData.password);
    
    if (userData.group) {
      await this.groupSelect.click();
      await this.page.locator(`mat-option:has-text("${userData.group}")`).click();
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async searchUser(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(1000);
  }

  async selectUser(username: string): Promise<void> {
    await this.page.locator(`mat-row:has-text("${username}"), tr:has-text("${username}")`).click();
    await this.page.waitForTimeout(1000);
  }

  async editUser(updates: Partial<{
    email: string;
    firstName: string;
    lastName: string;
  }>): Promise<void> {
    await this.page.locator('button:has-text("Edit")').click();
    await this.page.waitForTimeout(1000);
    
    if (updates.email) {
      await this.emailInput.clear();
      await this.emailInput.fill(updates.email);
    }
    
    if (updates.firstName) {
      await this.firstNameInput.clear();
      await this.firstNameInput.fill(updates.firstName);
    }
    
    if (updates.lastName) {
      await this.lastNameInput.clear();
      await this.lastNameInput.fill(updates.lastName);
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async resetPassword(newPassword: string): Promise<void> {
    await this.resetPasswordButton.click();
    await this.page.waitForTimeout(500);
    
    const newPasswordInput = this.page.locator('input[formcontrolname="new_password"]');
    const confirmPasswordInput = this.page.locator('input[formcontrolname="confirm_password"]');
    
    await newPasswordInput.fill(newPassword);
    await confirmPasswordInput.fill(newPassword);
    
    await this.page.locator('button:has-text("Reset")').click();
    await this.page.waitForTimeout(2000);
  }

  async assignGroups(groups: Array<{name: string, action: 'add' | 'remove'}>): Promise<void> {
    await this.groupsTab.click();
    await this.page.waitForTimeout(1000);
    
    for (const group of groups) {
      const groupCheckbox = this.page.locator(`mat-checkbox:has-text("${group.name}"), input[type="checkbox"][value="${group.name}"]`);
      const isChecked = await groupCheckbox.isChecked();
      
      if ((group.action === 'add' && !isChecked) || (group.action === 'remove' && isChecked)) {
        await groupCheckbox.click();
      }
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
  }

  async importUsers(csvFilePath: string): Promise<void> {
    await this.importButton.click();
    await this.page.waitForTimeout(1000);
    
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);
    
    // Wait for file processing
    await this.page.waitForTimeout(2000);
    
    // Map columns if needed
    await this.page.locator('button:has-text("Import")').click();
    await this.page.waitForTimeout(3000);
  }

  async deactivateUser(): Promise<void> {
    await this.deactivateButton.click();
    await this.page.locator('button:has-text("Confirm")').click();
    await this.page.waitForTimeout(2000);
  }

  async applyFilter(filterType: string, filterValue: string): Promise<void> {
    await this.filterButton.click();
    await this.page.waitForTimeout(500);
    
    await this.page.locator(`mat-select[formcontrolname="${filterType}"]`).click();
    await this.page.locator(`mat-option:has-text("${filterValue}")`).click();
    
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async getUserCount(): Promise<number> {
    return await this.userList.count();
  }

  async isUserVisible(username: string): Promise<boolean> {
    return await this.page.locator(`text="${username}"`).isVisible();
  }

  async canEditProfile(): Promise<boolean> {
    return await this.page.locator('button:has-text("Edit profile")').isVisible();
  }
}