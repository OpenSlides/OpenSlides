import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private usernameInput = 'input[formcontrolname="username"]';
  private passwordInput = 'input[formcontrolname="password"]';
  private loginButton = 'button[type="submit"]';
  private errorMessage = '.error-message';
  private forgotPasswordLink = 'a:has-text("Forgot password?")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToLogin() {
    await this.goto('/login');
    // Wait for Angular app to load
    await this.page.waitForSelector('os-root, app-root', { timeout: 10000 }).catch(() => {
      console.log('App root not found');
    });
    // Additional wait for form to render
    await this.page.waitForTimeout(2000);
    // Wait for the login form to be ready
    await this.waitForElement(this.usernameInput, 10000);
  }

  async login(username: string, password: string) {
    await this.fillInput(this.usernameInput, username);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);
    
    // Wait for navigation away from login page
    await this.page.waitForFunction(
      () => !window.location.href.includes('/login'),
      { timeout: 10000 }
    ).catch(() => {
      // If still on login page, check for error
      return this.waitForElement(this.errorMessage, 2000);
    });
  }

  async getErrorMessage(): Promise<string> {
    if (await this.isElementVisible(this.errorMessage)) {
      return await this.getElementText(this.errorMessage);
    }
    return '';
  }

  async isLoggedIn(): Promise<boolean> {
    const url = this.page.url();
    // Check if we're not on the login page and the page has loaded
    if (url.includes('/login')) {
      return false;
    }
    
    // Wait a bit for any redirects
    await this.page.waitForTimeout(1000);
    
    // Check again after wait
    const finalUrl = this.page.url();
    return !finalUrl.includes('/login');
  }

  async logout() {
    await this.page.locator('[data-cy="userMenuButton"]').click();
    await this.page.locator('[data-cy="logoutButton"]').click();
    await this.page.waitForURL('**/login');
  }

  async clickForgotPassword() {
    await this.clickElement(this.forgotPasswordLink);
  }
}