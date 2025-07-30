import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class UserPage extends EnhancedBasePage {
  readonly createButton: string;
  readonly userList: string;
  readonly usernameInput: string;
  readonly firstNameInput: string;
  readonly lastNameInput: string;
  readonly emailInput: string;
  readonly passwordInput: string;
  readonly groupSelect: string;
  readonly saveButton: string;
  readonly searchInput: string;
  readonly importButton: string;
  readonly resetPasswordButton: string;
  readonly deactivateButton: string;
  readonly groupsTab: string;
  readonly filterButton: string;

  constructor(page: Page) {
    super(page);
    this.createButton = 'button:has-text("Create account"), [data-cy="create-user"]';
    this.userList = '.user-list, [class*="user-item"], mat-row';
    this.usernameInput = 'input[formcontrolname="username"], input[name="username"]';
    this.firstNameInput = 'input[formcontrolname="first_name"], input[name="firstName"]';
    this.lastNameInput = 'input[formcontrolname="last_name"], input[name="lastName"]';
    this.emailInput = 'input[formcontrolname="email"], input[type="email"]';
    this.passwordInput = 'input[formcontrolname="password"], input[type="password"]';
    this.groupSelect = 'mat-select[formcontrolname="groups"], select[name="groups"]';
    this.saveButton = 'button:has-text("Save"), button[type="submit"]';
    this.searchInput = 'input[type="search"], input[placeholder*="Search"]';
    this.importButton = 'button:has-text("Import"), [data-cy="import-users"]';
    this.resetPasswordButton = 'button:has-text("Reset password")';
    this.deactivateButton = 'button:has-text("Deactivate")';
    this.groupsTab = 'mat-tab:has-text("Groups"), [role="tab"]:has-text("Groups")';
    this.filterButton = 'button:has-text("Filter"), [data-cy="filter-users"]';
  }

  async navigate(): Promise<void> {
    await this.goto('/accounts', {
      waitForNetworkIdle: true
    });
  }

  async createUser(userData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    group?: string;
  }): Promise<void> {
    await this.click(this.createButton, {
      waitForLoadState: true
    });
    
    await this.fill(this.usernameInput, userData.username);
    await this.fill(this.firstNameInput, userData.firstName);
    await this.fill(this.lastNameInput, userData.lastName);
    await this.fill(this.emailInput, userData.email);
    await this.fill(this.passwordInput, userData.password);
    
    if (userData.group) {
      await this.click(this.groupSelect);
      await this.click(`mat-option:has-text("${userData.group}")`);
    }
    
    await this.click(this.saveButton, {
      waitForNetworkIdle: true,
      waitForResponse: (response) => response.url().includes('/api/') && response.status() === 200
    });
  }

  async searchUser(searchTerm: string): Promise<void> {
    await this.fill(this.searchInput, searchTerm, {
      waitForNetworkIdle: true
    });
  }

  async selectUser(username: string): Promise<void> {
    await this.click(`mat-row:has-text("${username}"), tr:has-text("${username}")`, {
      waitForLoadState: true
    });
  }

  async editUser(updates: Partial<{
    email: string;
    firstName: string;
    lastName: string;
  }>): Promise<void> {
    await this.click('button:has-text("Edit")', {
      waitForLoadState: true
    });
    
    if (updates.email) {
      await this.fill(this.emailInput, updates.email);
    }
    
    if (updates.firstName) {
      await this.fill(this.firstNameInput, updates.firstName);
    }
    
    if (updates.lastName) {
      await this.fill(this.lastNameInput, updates.lastName);
    }
    
    await this.click(this.saveButton, {
      waitForNetworkIdle: true
    });
  }

  async resetPassword(newPassword: string): Promise<void> {
    await this.click(this.resetPasswordButton, {
      waitForLoadState: true
    });
    
    const newPasswordInput = 'input[formcontrolname="new_password"]';
    const confirmPasswordInput = 'input[formcontrolname="confirm_password"]';
    
    await this.fill(newPasswordInput, newPassword);
    await this.fill(confirmPasswordInput, newPassword);
    
    await this.click('button:has-text("Reset")', {
      waitForNetworkIdle: true
    });
  }

  async assignGroups(groups: Array<{name: string, action: 'add' | 'remove'}>): Promise<void> {
    await this.click(this.groupsTab, {
      waitForLoadState: true
    });
    
    for (const group of groups) {
      const groupCheckbox = `mat-checkbox:has-text("${group.name}"), input[type="checkbox"][value="${group.name}"]`;
      const locator = this.page.locator(groupCheckbox);
      const isChecked = await locator.isChecked();
      
      if ((group.action === 'add' && !isChecked) || (group.action === 'remove' && isChecked)) {
        await this.click(groupCheckbox);
      }
    }
    
    await this.click(this.saveButton, {
      waitForNetworkIdle: true
    });
  }

  async importUsers(csvFilePath: string): Promise<void> {
    await this.click(this.importButton, {
      waitForLoadState: true
    });
    
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);
    
    // Wait for file processing
    await this.page.waitForTimeout(2000);
    
    // Map columns if needed
    await this.click('button:has-text("Import")', {
      waitForNetworkIdle: true,
      timeout: 30000
    });
  }

  async deactivateUser(): Promise<void> {
    await this.click(this.deactivateButton, {
      waitForLoadState: true
    });
    await this.click('button:has-text("Confirm")', {
      waitForNetworkIdle: true
    });
  }

  async applyFilter(filterType: string, filterValue: string): Promise<void> {
    await this.click(this.filterButton, {
      waitForLoadState: true
    });
    
    await this.click(`mat-select[formcontrolname="${filterType}"]`);
    await this.click(`mat-option:has-text("${filterValue}")`);
    
    await this.click('button:has-text("Apply")', {
      waitForNetworkIdle: true
    });
  }

  async getUserCount(): Promise<number> {
    await this.waitForElementStable(this.userList);
    return await this.page.locator(this.userList).count();
  }

  async isUserVisible(username: string): Promise<boolean> {
    return await this.isVisible(`text="${username}"`, { timeout: 5000 });
  }

  async canEditProfile(): Promise<boolean> {
    return await this.isVisible('button:has-text("Edit profile")', { timeout: 5000 });
  }
}