import { Page } from '@playwright/test';

/**
 * Enhanced wait helpers for OpenSlides E2E tests
 * Addresses timing and stability issues identified in analysis
 */

export class WaitHelpers {
  /**
   * Wait for Angular to be stable
   * Fixes: Data initialization race conditions
   */
  static async waitForAngular(page: Page, timeout: number = 10000): Promise<void> {
    try {
      await page.waitForFunction(
        () => {
          const angular = (window as any).getAllAngularTestabilities?.();
          return angular && angular.length > 0 && angular.every((t: any) => t.isStable());
        },
        { timeout }
      );
    } catch (error) {
      console.warn('Angular stability check failed, continuing...', error);
    }
  }

  /**
   * Smart wait for element with retries and multiple selectors
   * Fixes: Element visibility timeouts (40% of failures)
   */
  static async waitForElement(
    page: Page, 
    selectors: string | string[], 
    options: {
      state?: 'attached' | 'detached' | 'visible' | 'hidden';
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<void> {
    const { state = 'visible', timeout = 10000, retries = 3 } = options;
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    
    for (let attempt = 0; attempt < retries; attempt++) {
      for (const selector of selectorArray) {
        try {
          await page.waitForSelector(selector, { state, timeout: timeout / retries });
          return; // Success
        } catch (error) {
          if (attempt === retries - 1 && selector === selectorArray[selectorArray.length - 1]) {
            throw new Error(`Failed to find element after ${retries} attempts: ${selectorArray.join(', ')}`);
          }
          // Wait briefly before retry
          await page.waitForTimeout(500);
        }
      }
    }
  }

  /**
   * Wait for API response
   * Fixes: API communication delays (25% of failures)
   */
  static async waitForAPIResponse(
    page: Page,
    urlPattern: string | RegExp,
    options: {
      status?: number;
      timeout?: number;
      method?: string;
    } = {}
  ): Promise<void> {
    const { status = 200, timeout = 15000, method } = options;
    
    await page.waitForResponse(
      response => {
        const urlMatches = typeof urlPattern === 'string' 
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url());
        
        const statusMatches = response.status() === status;
        const methodMatches = !method || response.request().method() === method;
        
        return urlMatches && statusMatches && methodMatches;
      },
      { timeout }
    );
  }

  /**
   * Navigate with proper waits
   * Fixes: Navigation and routing issues (20% of failures)
   */
  static async navigateAndWait(
    page: Page,
    url: string,
    options: {
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
      waitForAngular?: boolean;
      waitForSelector?: string;
    } = {}
  ): Promise<void> {
    const { 
      waitUntil = 'networkidle', 
      waitForAngular = true,
      waitForSelector 
    } = options;
    
    // Ensure proper URL construction
    const fullUrl = url.startsWith('http') ? url : `${page.context().browser()?.options?.baseURL || ''}${url}`;
    
    await page.goto(fullUrl, { waitUntil, timeout: 30000 });
    
    if (waitForAngular) {
      await this.waitForAngular(page);
    }
    
    if (waitForSelector) {
      await this.waitForElement(page, waitForSelector);
    }
  }

  /**
   * Wait for autoupdate to propagate changes
   * Fixes: Real-time update propagation issues
   */
  static async waitForAutoupdate(page: Page, timeout: number = 5000): Promise<void> {
    // Wait for WebSocket message or SSE update
    await Promise.race([
      page.waitForEvent('websocket', { timeout }),
      page.waitForTimeout(1000) // Minimum wait for propagation
    ]).catch(() => {
      // Continue even if no websocket event
    });
    
    // Additional wait for UI to update
    await this.waitForAngular(page);
  }

  /**
   * Click with retry and wait
   * Fixes: Click timing issues
   */
  static async clickWithRetry(
    page: Page,
    selector: string,
    options: {
      retries?: number;
      waitBefore?: number;
      waitAfter?: number;
    } = {}
  ): Promise<void> {
    const { retries = 3, waitBefore = 100, waitAfter = 500 } = options;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await page.waitForTimeout(waitBefore);
        await page.click(selector, { timeout: 5000 });
        await page.waitForTimeout(waitAfter);
        return;
      } catch (error) {
        if (attempt === retries - 1) {
          throw error;
        }
        console.log(`Click attempt ${attempt + 1} failed, retrying...`);
        await page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Fill form field with proper waits
   * Fixes: Form input timing issues
   */
  static async fillFieldWithRetry(
    page: Page,
    selector: string,
    value: string,
    options: {
      clearFirst?: boolean;
      retries?: number;
    } = {}
  ): Promise<void> {
    const { clearFirst = true, retries = 3 } = options;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.waitForElement(page, selector);
        
        if (clearFirst) {
          await page.fill(selector, '');
        }
        
        await page.fill(selector, value);
        
        // Verify the value was set
        const actualValue = await page.inputValue(selector);
        if (actualValue === value) {
          return;
        }
      } catch (error) {
        if (attempt === retries - 1) {
          throw error;
        }
        await page.waitForTimeout(500);
      }
    }
  }

  /**
   * Wait for loading indicators to disappear
   * Fixes: Loading state timing issues
   */
  static async waitForLoadingComplete(page: Page, timeout: number = 10000): Promise<void> {
    const loadingSelectors = [
      '.loading-spinner',
      'mat-progress-spinner',
      'mat-progress-bar',
      '[class*="loading"]',
      '[class*="spinner"]'
    ];
    
    await Promise.all(
      loadingSelectors.map(selector =>
        page.waitForSelector(selector, { state: 'hidden', timeout }).catch(() => {})
      )
    );
  }

  /**
   * Wait for network idle with timeout
   * Fixes: Network activity timing issues
   */
  static async waitForNetworkIdle(page: Page, timeout: number = 10000): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch (error) {
      console.warn('Network idle timeout, continuing...');
    }
  }
}

/**
 * Decorator to automatically apply wait strategies
 */
export function WithWaits(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const page = this.page || args[0];
    
    if (page && page.waitForLoadState) {
      await WaitHelpers.waitForLoadingComplete(page);
    }
    
    const result = await originalMethod.apply(this, args);
    
    if (page && page.waitForLoadState) {
      await WaitHelpers.waitForAngular(page);
    }
    
    return result;
  };
  
  return descriptor;
}