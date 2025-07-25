import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am on the login page', async function(this: CustomWorld) {
  await this.loginPage!.navigateToLogin();
});

Given('I am logged in as {string}', async function(this: CustomWorld, username: string) {
  await this.loginPage!.navigateToLogin();
  const password = username === 'admin' ? 'admin' : 'password'; // Default passwords
  await this.loginPage!.login(username, password);
  expect(await this.loginPage!.isLoggedIn()).toBe(true);
});

When('I enter username {string} and password {string}', async function(this: CustomWorld, username: string, password: string) {
  await this.page!.fill('input[formcontrolname="username"]', username);
  await this.page!.fill('input[formcontrolname="password"]', password);
});

When('I enter password {string}', async function(this: CustomWorld, password: string) {
  await this.page!.fill('input[formcontrolname="password"]', password);
});

When('I click the login button', async function(this: CustomWorld) {
  await this.page!.click('button[type="submit"]');
  // Wait for navigation to complete - OpenSlides redirects to / after login
  await this.page!.waitForTimeout(3000);
});

When('I check the {string} checkbox', async function(this: CustomWorld, checkboxLabel: string) {
  await this.page!.check(`mat-checkbox:has-text("${checkboxLabel}")`);
});

When('I click on the user menu', async function(this: CustomWorld) {
  await this.page!.click('[data-cy="userMenuButton"]');
});

When('I click the logout button', async function(this: CustomWorld) {
  await this.page!.click('[data-cy="logoutButton"]');
});

When('I remain inactive for {int} minutes', async function(this: CustomWorld, minutes: number) {
  // Simulate inactivity by waiting (in real tests, might manipulate session)
  await this.page!.waitForTimeout(minutes * 60 * 1000);
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
  const isVisible = await this.dashboardPage!.isOnDashboard();
  expect(isVisible).toBe(true);
});

Then('I should see an error message {string}', async function(this: CustomWorld, errorMessage: string) {
  const actualError = await this.loginPage!.getErrorMessage();
  expect(actualError).toContain(errorMessage);
});

Then('I should remain on the login page', async function(this: CustomWorld) {
  expect(this.page!.url()).toContain('/login');
});

Then('the password should be masked', async function(this: CustomWorld) {
  const inputType = await this.page!.getAttribute('input[formcontrolname="password"]', 'type');
  expect(inputType).toBe('password');
});

Then('I should see dots instead of characters', async function(this: CustomWorld) {
  const inputType = await this.page!.getAttribute('input[formcontrolname="password"]', 'type');
  expect(inputType).toBe('password');
});

Then('I should be logged in', async function(this: CustomWorld) {
  const isLoggedIn = await this.loginPage!.isLoggedIn();
  expect(isLoggedIn).toBe(true);
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

Then('I should see the login form', async function(this: CustomWorld) {
  const loginForm = await this.page!.isVisible('form[class*="login-form"]');
  expect(loginForm).toBe(true);
});

Then('I should be automatically logged out', async function(this: CustomWorld) {
  expect(this.page!.url()).toContain('/login');
});

Then('I should see a session timeout message', async function(this: CustomWorld) {
  const message = await this.page!.textContent('.session-timeout-message');
  expect(message).toContain('session');
});