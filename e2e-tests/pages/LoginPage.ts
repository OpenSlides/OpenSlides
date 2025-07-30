import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class LoginPage extends EnhancedBasePage {
  private usernameInput = 'input[formcontrolname="username"]';
  private passwordInput = 'input[formcontrolname="password"]';
  private loginButton = 'button[type="submit"]';
  private errorMessage = '.error-message';
  private forgotPasswordLink = 'a:has-text("Forgot password?")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToLogin() {
    await this.goto('/login', {
      waitForLoadState: true,
      waitForSelector: this.usernameInput
    });
  }

  async login(username: string, password: string) {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton, {
      waitForNetworkIdle: true,
      waitForResponse: (response) => response.url().includes('/system/auth/login') && response.status() === 200
    });
    
    // Wait for navigation away from login page
    await this.page.waitForFunction(
      () => !window.location.href.includes('/login'),
      { timeout: 10000 }
    ).catch(() => {
      // If still on login page, check for error
      return this.waitForElementStable(this.errorMessage, 2000);
    });
  }

  async getErrorMessage(): Promise<string> {
    if (await this.isVisible(this.errorMessage, { timeout: 2000 })) {
      return await this.getText(this.errorMessage);
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
    await this.click('[data-cy="userMenuButton"]', {
      waitForLoadState: true
    });
    await this.click('[data-cy="logoutButton"]', {
      waitForNetworkIdle: true
    });
    await this.page.waitForURL('**/login');
  }

  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink, {
      waitForLoadState: true
    });
  }
}