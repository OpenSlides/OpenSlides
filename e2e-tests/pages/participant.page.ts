import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class ParticipantPage extends EnhancedBasePage {
  readonly addButton: string;
  readonly searchInput: string;
  readonly participantRows: string;
  readonly groupSelect: string;
  readonly firstNameInput: string;
  readonly lastNameInput: string;
  readonly emailInput: string;
  readonly usernameInput: string;
  readonly saveButton: string;
  readonly importButton: string;
  readonly bulkActionButton: string;
  readonly successNotification: string;

  constructor(page: Page) {
    super(page);
    
    // Locators
    this.addButton = '[data-cy="headbarMainButton"], button[mat-fab], button:has(mat-icon)';
    this.searchInput = 'input[placeholder="Search"]';
    this.participantRows = 'mat-row, tbody tr';
    this.groupSelect = 'mat-select[formcontrolname="group_ids"]';
    
    // Form fields - multiple possible selectors
    this.firstNameInput = 'input[formcontrolname="first_name"], input[formcontrolname="firstName"], input[placeholder*="First"], input[placeholder*="Given"]';
    this.lastNameInput = 'input[formcontrolname="last_name"], input[formcontrolname="lastName"], input[placeholder*="Last"], input[placeholder*="Surname"]';
    this.emailInput = 'input[formcontrolname="email"], input[type="email"]';
    this.usernameInput = 'input[formcontrolname="username"], input[placeholder*="Username"]';
    
    // Buttons
    this.saveButton = 'button:has-text("Save"), button:has-text("SAVE"), button:has-text("Create"), button:has-text("CREATE")';
    this.importButton = 'button:has-text("Import")';
    this.bulkActionButton = 'button:has-text("Bulk actions")';
    
    // Notifications
    this.successNotification = '.mat-snack-bar-container';
  }

  // Dynamic locators
  presenceCheckbox(name: string): string {
    return `mat-row:has-text("${name}") mat-checkbox`;
  }

  // Methods
  async navigateToParticipants() {
    await this.click('a:has-text("Participants")', {
      waitForNetworkIdle: true
    });
  }

  async addParticipant(firstName: string, lastName: string, email: string, username: string) {
    await this.click(this.addButton);
    await this.page.waitForTimeout(2000);
    
    await this.fill(this.firstNameInput, firstName);
    await this.fill(this.lastNameInput, lastName);
    await this.fill(this.emailInput, email);
    await this.fill(this.usernameInput, username);
    
    await this.click(this.saveButton);
    await this.page.waitForTimeout(2000);
  }

  async togglePresence(participantName: string) {
    const checkbox = this.presenceCheckbox(participantName);
    await checkbox.click();
    await this.page.waitForTimeout(1000);
  }

  async searchParticipant(searchTerm: string) {
    await this.fill(this.searchInput, searchTerm);
    await this.page.waitForTimeout(1000);
  }
}