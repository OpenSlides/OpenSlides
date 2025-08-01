import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

When('I navigate to the base URL', async function(this: CustomWorld) {
    await this.page.goto(this.baseUrl);
});

When('I navigate to the base URL with HTTPS', async function(this: CustomWorld) {
    // Same as above since baseUrl already includes https
    await this.page.goto(this.baseUrl);
});

Then('the page should load successfully', async function(this: CustomWorld) {
    // Wait for page to be ready (not necessarily network idle)
    await this.page.waitForLoadState('domcontentloaded');
    
    // Check if page has content
    const bodyContent = await this.page.locator('body').textContent();
    if (!bodyContent || bodyContent.trim().length === 0) {
        throw new Error('Page did not load - no content found');
    }
});

Then('I should see the OpenSlides login page or dashboard', async function(this: CustomWorld) {
    // Wait a bit for page to render
    await this.page.waitForTimeout(2000);
    
    // Get page content for debugging
    const pageTitle = await this.page.title();
    const pageUrl = this.page.url();
    
    // Try multiple selectors
    const selectors = [
        'input[type="text"]',
        'input[type="password"]', 
        'button',
        'form',
        'a[href*="login"]',
        'text="Login"',
        'text="Username"',
        'text="Meetings"',
        '[class*="login"]',
        '[class*="dashboard"]'
    ];
    
    let foundElements = [];
    for (const selector of selectors) {
        const isVisible = await this.page.locator(selector).first().isVisible().catch(() => false);
        if (isVisible) {
            foundElements.push(selector);
        }
    }
    
    // If we found login-related or dashboard elements, we're good
    if (foundElements.length > 0) {
        console.log(`Found elements: ${foundElements.join(', ')}`);
        return;
    }
    
    // Otherwise fail with detailed info
    const bodyText = await this.page.locator('body').innerText().catch(() => 'Could not get body text');
    throw new Error(`Neither login page nor dashboard is visible.\nURL: ${pageUrl}\nTitle: ${pageTitle}\nBody preview: ${bodyText.substring(0, 200)}`);
});

Then('the page should load despite self-signed certificate', async function(this: CustomWorld) {
    // If we got here, the certificate was already accepted due to ignoreHTTPSErrors
    const response = await this.page.evaluate(() => window.location.protocol);
    if (response !== 'https:') {
        throw new Error('Not using HTTPS protocol');
    }
});

Then('no SSL errors should block the page', async function(this: CustomWorld) {
    // Check that page loaded without SSL blocking
    const blocked = await this.page.locator('text=/certificate|security|SSL/i').isVisible().catch(() => false);
    if (blocked) {
        throw new Error('SSL error message detected on page');
    }
});

// Login page element checks
Then('I should see the username input field', async function(this: CustomWorld) {
    const usernameField = await this.page.locator('input[formcontrolname="username"], input[name="username"], #username').isVisible();
    if (!usernameField) {
        throw new Error('Username input field not found');
    }
});

Then('I should see the password input field', async function(this: CustomWorld) {
    const passwordField = await this.page.locator('input[formcontrolname="password"], input[type="password"], #password').isVisible();
    if (!passwordField) {
        throw new Error('Password input field not found');
    }
});

Then('I should see the login button', async function(this: CustomWorld) {
    const loginButton = await this.page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').isVisible();
    if (!loginButton) {
        throw new Error('Login button not found');
    }
});

Then('I should see the OpenSlides logo', async function(this: CustomWorld) {
    const logo = await this.page.locator('img[alt*="OpenSlides"], img[src*="logo"], .logo, .brand-logo').isVisible();
    if (!logo) {
        throw new Error('OpenSlides logo not found');
    }
});