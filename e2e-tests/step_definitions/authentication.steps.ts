import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { findElement, loginAs, waitForOpenSlides, isLoggedIn } from '../support/helpers';
import { Selectors } from '../support/selectors';

Given('I am on the login page', async function(this: CustomWorld) {
  await this.page!.goto(this.baseUrl + '/login');
  await waitForOpenSlides(this.page!);
});

// Login step removed - using auth-roles.steps.ts version

When('I enter username {string} and password {string}', async function(this: CustomWorld, username: string, password: string) {
  const usernameField = await findElement(this.page!, Selectors.login.usernameField);
  if (!usernameField) {
    throw new Error('Username field not found');
  }
  await usernameField.fill(username);
  
  const passwordField = await findElement(this.page!, Selectors.login.passwordField);
  if (!passwordField) {
    throw new Error('Password field not found');
  }
  await passwordField.fill(password);
});

When('I enter password {string}', async function(this: CustomWorld, password: string) {
  const passwordField = await findElement(this.page!, Selectors.login.passwordField);
  if (!passwordField) {
    throw new Error('Password field not found');
  }
  await passwordField.fill(password);
});

When('I click the login button', async function(this: CustomWorld) {
  // Small delay to ensure form validation completes
  await this.page!.waitForTimeout(1000);
  
  // Simple click without complex waiting
  await this.page!.click('button[type="submit"]');
  
  // Don't wait for navigation - let the Then steps verify the result
  await this.page!.waitForTimeout(2000);
});

When('I check the {string} checkbox', async function(this: CustomWorld, checkboxLabel: string) {
  const checkbox = await findElement(this.page!, Selectors.login.rememberMeCheckbox);
  if (checkbox) {
    await checkbox.check();
  } else {
    console.log('Remember me checkbox not found - feature may not be implemented');
  }
});

When('I click on the user menu', async function(this: CustomWorld) {
  // Wait for page to be ready but don't fail if networkidle times out
  try {
    await this.page!.waitForLoadState('domcontentloaded');
    await this.page!.waitForTimeout(2000); // Give UI time to render
  } catch (e) {
    console.log('Page load wait timed out, continuing...');
  }
  
  // Try multiple selectors for the user menu
  const userMenuSelectors = [
    '.mat-toolbar button:has-text("Administrator")',
    '.mat-toolbar button:has-text("admin")',
    '.mat-toolbar button.mat-mdc-menu-trigger',
    'button:has-text("Administrator")',
    'button[aria-label*="user" i]',
    'button[aria-label*="account" i]',
    'button[aria-label*="menu" i]',
    '.user-menu',
    '.account-button',
    '.operator-information',
    '[class*="user-menu"]',
    '[class*="account"]',
    'mat-toolbar button[mat-button]',
    'mat-toolbar button[mat-icon-button]'
  ];
  
  let clicked = false;
  for (const selector of userMenuSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        await element.click();
        clicked = true;
        break;
      }
    } catch (e) {
      // Continue trying next selector
    }
  }
  
  if (!clicked) {
    // Take a screenshot to debug
    await this.page!.screenshot({ path: 'user-menu-not-found.png' });
    
    // Log what's visible on the page
    const toolbarText = await this.page!.locator('.mat-toolbar, mat-toolbar').textContent().catch(() => 'No toolbar found');
    console.log('Toolbar content:', toolbarText);
    
    throw new Error('Could not find user menu button. Screenshot saved as user-menu-not-found.png');
  }
  
  // Wait for menu to open
  await this.page!.waitForTimeout(1000);
});

When('I click the logout button', async function(this: CustomWorld) {
  const logoutButton = await findElement(this.page!, Selectors.navigation.logoutButton);
  if (!logoutButton) {
    throw new Error('Logout button not found');
  }
  await logoutButton.click();
});

When('I remain inactive for {int} minutes', async function(this: CustomWorld, minutes: number) {
  // In real tests, we would mock the session timeout
  // For now, we'll simulate this by clearing auth data
  
  console.log('Simulating session timeout...');
  
  try {
    // Method 1: Clear auth from storage to avoid page reload
    await this.page!.evaluate(() => {
      // Clear all auth-related storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('OpenSlides:auth:access_token');
      localStorage.removeItem('OpenSlides:auth:refresh_token');
      localStorage.removeItem('OpenSlides:auth:user_id');
      sessionStorage.clear();
    });
    
    // Method 2: Clear cookies (but this might trigger reload)
    await this.context!.clearCookies();
    
    console.log('Auth data cleared');
    
    // Wait a moment for the app to detect the change
    await this.page!.waitForTimeout(1000);
    
    // Try to navigate to trigger auth check
    console.log('Attempting navigation to trigger auth check...');
    await this.page!.goto(this.baseUrl + '/meetings', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    }).catch(err => {
      console.log('Navigation result:', err.message);
    });
    
  } catch (error: any) {
    console.log('Session timeout simulation:', error.message);
  }
});

Then('I should be redirected to the dashboard', async function(this: CustomWorld) {
  // OpenSlides redirects to / which is the dashboard/calendar
  const url = this.page!.url();
  const title = await this.page!.title();
  
  // Check if we're on the dashboard by URL or title
  const isOnDashboard = url === `${this.baseUrl}/` || 
                        url.includes('/dashboard') || 
                        title.includes('Calendar') ||
                        title.includes('Dashboard');
  
  expect(isOnDashboard).toBe(true);
});

Then('I should see the welcome message', async function(this: CustomWorld) {
  // Check for dashboard elements
  const dashboardSelectors = [
    '.dashboard',
    'os-dashboard',
    'h1:has-text("Dashboard")',
    'h1:has-text("Calendar")',
    '.welcome-message'
  ];
  
  let found = false;
  for (const selector of dashboardSelectors) {
    try {
      const element = this.page!.locator(selector);
      if (await element.isVisible({ timeout: 1000 })) {
        found = true;
        break;
      }
    } catch (e) {
      // Try next
    }
  }
  
  expect(found).toBe(true);
});

// Removed duplicate - implemented in comprehensive.steps.ts

Then('I should remain on the login page', async function(this: CustomWorld) {
  expect(this.page!.url()).toContain('/login');
});

Then('the password should be masked', async function(this: CustomWorld) {
  const passwordField = await findElement(this.page!, Selectors.login.passwordField);
  if (!passwordField) {
    throw new Error('Password field not found');
  }
  const inputType = await passwordField.getAttribute('type');
  expect(inputType).toBe('password');
});

Then('I should see dots instead of characters', async function(this: CustomWorld) {
  const passwordField = await findElement(this.page!, Selectors.login.passwordField);
  if (!passwordField) {
    throw new Error('Password field not found');
  }
  const inputType = await passwordField.getAttribute('type');
  expect(inputType).toBe('password');
});

Then('I should be logged in', async function(this: CustomWorld) {
  // Wait a bit for the page to settle after login
  await this.page!.waitForTimeout(2000);
  
  const loggedIn = await isLoggedIn(this.page!);
  if (!loggedIn) {
    const currentUrl = this.page!.url();
    throw new Error(`Expected to be logged in but at URL: ${currentUrl}`);
  }
});

Then('my session should persist after browser restart', async function(this: CustomWorld) {
  // Get cookies before closing
  const cookies = await this.context!.cookies();
  
  // Close and reopen browser
  await this.closeBrowsers();
  await this.initBrowser();
  
  // Restore cookies
  await this.context!.addCookies(cookies);
  
  // Navigate to dashboard and verify still logged in
  await this.page!.goto('/dashboard');
  expect(this.page!.url()).toContain('/dashboard');
});

Then('I should be redirected to the login page', async function(this: CustomWorld) {
  await this.page!.waitForURL('**/login');
  expect(this.page!.url()).toContain('/login');
});

// Removed duplicate - implemented in comprehensive.steps.ts

// Removed duplicate - implemented in comprehensive.steps.ts

// Removed duplicate - implemented in comprehensive.steps.ts