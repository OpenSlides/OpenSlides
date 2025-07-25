import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

When('I navigate to the base URL', async function(this: CustomWorld) {
  await this.page!.goto('/', { waitUntil: 'domcontentloaded' });
  // Wait for any redirects
  await this.page!.waitForLoadState('networkidle');
});

When('I navigate to the base URL with HTTPS', async function(this: CustomWorld) {
  await this.page!.goto(this.baseUrl);
});

Then('the page should load successfully', async function(this: CustomWorld) {
  // Check that we're not on an error page
  const title = await this.page!.title();
  expect(title).not.toContain('Error');
  expect(title).not.toContain('This site can\'t be reached');
});

Then('I should see the OpenSlides login page or dashboard', async function(this: CustomWorld) {
  const url = this.page!.url();
  const validPages = ['/login', '/dashboard'];
  const isValidPage = validPages.some(page => url.includes(page));
  expect(isValidPage).toBe(true);
});

Then('the page should load despite self-signed certificate', async function(this: CustomWorld) {
  // The page context is configured to ignore HTTPS errors
  // Just verify we can access the page
  const response = await this.page!.evaluate(() => document.readyState);
  expect(response).toBe('complete');
});

Then('no SSL errors should block the page', async function(this: CustomWorld) {
  // Check that the page loaded and isn't showing a browser error
  const bodyText = await this.page!.textContent('body');
  expect(bodyText).not.toContain('NET::ERR_CERT_AUTHORITY_INVALID');
  expect(bodyText).not.toContain('Your connection is not private');
});

Then('I should see the username input field', async function(this: CustomWorld) {
  const usernameField = await this.page!.isVisible('input[formcontrolname="username"]');
  expect(usernameField).toBe(true);
});

Then('I should see the password input field', async function(this: CustomWorld) {
  const passwordField = await this.page!.isVisible('input[formcontrolname="password"]');
  expect(passwordField).toBe(true);
});

Then('I should see the login button', async function(this: CustomWorld) {
  const loginButton = await this.page!.isVisible('button[type="submit"]');
  expect(loginButton).toBe(true);
});

Then('I should see the OpenSlides logo', async function(this: CustomWorld) {
  const logo = await this.page!.isVisible('img[alt*="OpenSlides"], .logo, [class*="logo"]');
  expect(logo).toBe(true);
});