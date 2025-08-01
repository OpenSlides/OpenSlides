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
    console.log(`Attempting login for user: ${username}`);
    
    try {
      // Clear any existing values first
      await this.clear(this.usernameInput);
      await this.clear(this.passwordInput);
      
      // Fill credentials
      await this.fill(this.usernameInput, username);
      await this.fill(this.passwordInput, password);
      
      // Set up response listener before clicking
      const responsePromise = this.page.waitForResponse(
        response => {
          const isAuthEndpoint = response.url().includes('/system/auth/login');
          if (isAuthEndpoint) {
            console.log(`Auth response: ${response.status()} - ${response.url()}`);
          }
          return isAuthEndpoint;
        },
        { timeout: 30000 }
      );
      
      // Click login button
      await this.click(this.loginButton);
      
      // Wait for auth response
      const authResponse = await responsePromise;
      console.log(`Login response status: ${authResponse.status()}`);
      
      if (authResponse.status() === 403) {
        const errorText = await authResponse.text().catch(() => 'No error details');
        console.error('Login failed with 403:', errorText);
        throw new Error(`Authentication failed: 403 Forbidden - ${errorText}`);
      }
      
      if (authResponse.status() >= 400) {
        throw new Error(`Login failed with status ${authResponse.status()}`);
      }
      
      // Wait for navigation away from login page
      try {
        await this.page.waitForFunction(
          () => !window.location.href.includes('/login'),
          { timeout: 20000 }
        );
        console.log('Successfully navigated away from login page');
      } catch (navError) {
        // Check if we have an error message
        const errorMsg = await this.getErrorMessage();
        if (errorMsg) {
          throw new Error(`Login failed: ${errorMsg}`);
        }
        
        // Check if we're still on login page
        if (this.page.url().includes('/login')) {
          throw new Error('Login failed: Still on login page after 20 seconds');
        }
      }
      
      // Give the page a moment to stabilize
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('Login completed successfully');
      
    } catch (error) {
      console.error('Login error:', error);
      // Take a screenshot for debugging
      await this.screenshot(`login-error-${username}`);
      throw error;
    }
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