import { Page, Locator } from '@playwright/test';

/**
 * Helper function to find elements using multiple selector strategies
 */
export async function findElement(page: Page, selectors: string[], options?: { waitForEnabled?: boolean }): Promise<Locator | null> {
    for (const selector of selectors) {
        try {
            const element = page.locator(selector).first(); // Use first() to avoid multiple matches
            if (await element.isVisible({ timeout: 1000 })) {
                if (options?.waitForEnabled) {
                    // Wait for element to be enabled
                    await element.waitFor({ state: 'visible', timeout: 5000 });
                    await page.waitForFunction(
                        (sel) => {
                            const el = document.querySelector(sel);
                            return el && !el.hasAttribute('disabled') && !el.classList.contains('disabled');
                        },
                        selector,
                        { timeout: 5000 }
                    ).catch(() => {});
                }
                return element;
            }
        } catch (e) {
            // Try next selector
        }
    }
    return null;
}

/**
 * Wait for OpenSlides to be fully loaded
 */
export async function waitForOpenSlides(page: Page): Promise<void> {
    // Wait for Angular to be ready
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for common OpenSlides elements
    const readySelectors = [
        'os-root',
        'app-root',
        '[class*="openslides"]',
        'router-outlet'
    ];
    
    for (const selector of readySelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 5000, state: 'attached' });
            break;
        } catch (e) {
            // Try next
        }
    }
    
    // Give Angular time to render
    await page.waitForTimeout(500);
}

/**
 * Login helper with multiple selector strategies
 */
export async function loginAs(page: Page, username: string, password: string): Promise<void> {
    // Fill username - OpenSlides uses formcontrolname
    await page.fill('input[formcontrolname="username"]', username);
    
    // Fill password
    await page.fill('input[formcontrolname="password"]', password);
    
    // Small delay to ensure form validation
    await page.waitForTimeout(1000);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation away from login page
    try {
        await page.waitForURL((url) => !url.toString().includes('login'), { timeout: 10000 });
    } catch (e) {
        // Check if we're already logged in
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
            return;
        }
        throw new Error(`Login failed - still on login page: ${currentUrl}`);
    }
}

/**
 * Navigate to a section within OpenSlides
 */
export async function navigateToSection(page: Page, section: string): Promise<void> {
    const sectionLower = section.toLowerCase();
    
    // Try multiple navigation patterns
    const navSelectors = [
        `a[href*="/${sectionLower}"]`,
        `a:has-text("${section}")`,
        `mat-nav-list a:has-text("${section}")`,
        `.nav-link:has-text("${section}")`,
        `button:has-text("${section}")`,
        `[routerlink*="${sectionLower}"]`
    ];
    
    const navElement = await findElement(page, navSelectors);
    if (!navElement) {
        throw new Error(`Navigation element for ${section} not found`);
    }
    
    await navElement.click();
    await page.waitForLoadState('networkidle');
}

/**
 * Create a meeting for testing
 */
export async function createMeeting(page: Page, meetingData: any): Promise<void> {
    await navigateToSection(page, 'Meetings');
    
    // Click new meeting button
    const newButtonSelectors = [
        'button:has-text("New meeting")',
        'button:has-text("Create meeting")',
        'button[mat-fab]',
        '.add-button',
        'button:has-text("+")'
    ];
    
    const newButton = await findElement(page, newButtonSelectors);
    if (newButton) {
        await newButton.click();
    }
    
    // Fill meeting form
    if (meetingData.name) {
        const nameField = await findElement(page, [
            'input[formcontrolname="name"]',
            'input[name="name"]',
            'input[placeholder*="name" i]'
        ]);
        if (nameField) {
            await nameField.fill(meetingData.name);
        }
    }
    
    // Submit form
    const submitButton = await findElement(page, [
        'button[type="submit"]',
        'button:has-text("Save")',
        'button:has-text("Create")'
    ]);
    if (submitButton) {
        await submitButton.click();
    }
    
    await page.waitForLoadState('networkidle');
}

/**
 * Wait for Material Design animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
    await page.waitForTimeout(300); // Standard Material animation duration
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    // First check URL - if we're on login page, we're not logged in
    const url = page.url();
    if (url.includes('login')) {
        return false;
    }
    
    // Check for common logged-in indicators
    const loggedInSelectors = [
        'text="Administrator"', // User name in top right
        'text="Dashboard"', // Dashboard link in sidebar
        'text="Meetings"', // Meetings link in sidebar
        'text="Calendar"', // Calendar header
        '.mat-sidenav', // Material sidenav
        'mat-sidenav', // Material sidenav element
        '[role="navigation"]', // Navigation sidebar
        'button[aria-label*="user" i]',
        '.user-menu'
    ];
    
    for (const selector of loggedInSelectors) {
        try {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 1000 })) {
                return true;
            }
        } catch (e) {
            // Continue checking
        }
    }
    
    return false;
}

/**
 * Get current section from URL or page
 */
export async function getCurrentSection(page: Page): Promise<string> {
    const url = page.url();
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1] || 'home';
}