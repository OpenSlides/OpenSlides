import { Page, Locator, expect, Response } from '@playwright/test';

export interface WaitOptions {
  timeout?: number;
  waitForLoadState?: boolean;
  waitForNetworkIdle?: boolean;
  retries?: number;
  retryDelay?: number;
  waitForSelector?: string;
  waitForResponse?: (response: Response) => boolean;
}

export interface EnhancedPageConfig {
  defaultTimeout?: number;
  defaultRetries?: number;
  defaultRetryDelay?: number;
  autoWaitForLoadState?: boolean;
  autoWaitForNetworkIdle?: boolean;
  slowMo?: number;
}

const DEFAULT_CONFIG: Required<EnhancedPageConfig> = {
  defaultTimeout: 15000,
  defaultRetries: 3,
  defaultRetryDelay: 1000,
  autoWaitForLoadState: true,
  autoWaitForNetworkIdle: false,
  slowMo: 100
};

export class EnhancedBasePage {
  protected page: Page;
  protected baseUrl: string;
  protected config: Required<EnhancedPageConfig>;
  
  constructor(page: Page, baseUrl: string = 'https://localhost:8000', config?: EnhancedPageConfig) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Enhanced navigation with automatic waiting
   */
  async goto(path: string = '', options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      await this.page.goto(`${this.baseUrl}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: opts.timeout
      });
      
      // Automatic load state waiting
      if (opts.waitForLoadState) {
        await this.page.waitForLoadState('domcontentloaded');
      }
      
      if (opts.waitForNetworkIdle) {
        await this.page.waitForLoadState('networkidle');
      }
      
      // Wait for specific selector if provided
      if (opts.waitForSelector) {
        await this.page.waitForSelector(opts.waitForSelector, {
          state: 'visible',
          timeout: opts.timeout
        });
      }
    }, opts);
  }

  /**
   * Enhanced click with automatic retries and waiting
   */
  async click(selector: string, options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      // First wait for element to be visible and stable
      await this.waitForElementStable(selector, opts.timeout);
      
      // Add slight delay for UI stability
      if (this.config.slowMo > 0) {
        await this.page.waitForTimeout(this.config.slowMo);
      }
      
      // Click the element
      await this.page.click(selector, { timeout: opts.timeout });
      
      // Wait for any resulting navigation or network activity
      if (opts.waitForLoadState) {
        await this.page.waitForLoadState('domcontentloaded', { timeout: opts.timeout });
      }
      
      if (opts.waitForNetworkIdle) {
        await this.page.waitForLoadState('networkidle', { timeout: opts.timeout });
      }
      
      // Wait for specific response if provided
      if (opts.waitForResponse) {
        await this.page.waitForResponse(opts.waitForResponse, { timeout: opts.timeout });
      }
    }, opts);
  }

  /**
   * Enhanced fill with automatic waiting
   */
  async fill(selector: string, value: string, options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      await this.waitForElementStable(selector, opts.timeout);
      
      // Clear existing value
      await this.page.fill(selector, '', { timeout: opts.timeout });
      
      // Add slight delay
      if (this.config.slowMo > 0) {
        await this.page.waitForTimeout(this.config.slowMo);
      }
      
      // Fill new value
      await this.page.fill(selector, value, { timeout: opts.timeout });
    }, opts);
  }

  /**
   * Clear an input field
   */
  async clear(selector: string, options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      await this.waitForElementStable(selector, opts.timeout);
      await this.page.fill(selector, '', { timeout: opts.timeout });
    }, opts);
  }

  /**
   * Enhanced select with automatic waiting
   */
  async select(selector: string, value: string, options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      await this.waitForElementStable(selector, opts.timeout);
      await this.page.selectOption(selector, value, { timeout: opts.timeout });
    }, opts);
  }

  /**
   * Wait for element to be visible and stable (not moving)
   */
  async waitForElementStable(selector: string, timeout?: number) {
    const timeoutMs = timeout || this.config.defaultTimeout;
    
    // First wait for element to be visible
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout: timeoutMs
    });
    
    // Then ensure it's stable (not animating)
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        
        const rect1 = element.getBoundingClientRect();
        return new Promise(resolve => {
          setTimeout(() => {
            const rect2 = element.getBoundingClientRect();
            resolve(
              rect1.top === rect2.top && 
              rect1.left === rect2.left &&
              rect1.width === rect2.width &&
              rect1.height === rect2.height
            );
          }, 100);
        });
      },
      selector,
      { timeout: timeoutMs }
    );
  }

  /**
   * Check if element exists with timeout
   */
  async exists(selector: string, options?: WaitOptions): Promise<boolean> {
    const opts = this.mergeOptions(options);
    
    try {
      await this.page.waitForSelector(selector, {
        state: 'attached',
        timeout: opts.timeout
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is visible with timeout
   */
  async isVisible(selector: string, options?: WaitOptions): Promise<boolean> {
    const opts = this.mergeOptions(options);
    
    try {
      await this.page.waitForSelector(selector, {
        state: 'visible',
        timeout: opts.timeout
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content with automatic waiting
   */
  async getText(selector: string, options?: WaitOptions): Promise<string> {
    const opts = this.mergeOptions(options);
    
    return await this.retryOperation(async () => {
      await this.waitForElementStable(selector, opts.timeout);
      const element = this.page.locator(selector).first();
      return await element.textContent() || '';
    }, opts);
  }

  /**
   * Wait for notification with enhanced error handling
   */
  async waitForNotification(text: string, options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      await this.page.locator('.mat-snack-bar, .mat-mdc-snack-bar', { hasText: text })
        .waitFor({ state: 'visible', timeout: opts.timeout });
    }, opts);
  }

  /**
   * Enhanced screenshot with automatic directory creation
   */
  async screenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `reports/screenshots/${timestamp}-${name}.png`, 
      fullPage: true 
    });
  }

  /**
   * Wait for multiple conditions
   */
  async waitForAll(conditions: Array<() => Promise<any>>, options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      await Promise.all(conditions.map(condition => condition()));
    }, opts);
  }

  /**
   * Wait for any of multiple selectors
   */
  async waitForAnySelector(selectors: string[], options?: WaitOptions): Promise<string> {
    const opts = this.mergeOptions(options);
    
    return await this.retryOperation(async () => {
      const promises = selectors.map(selector => 
        this.page.waitForSelector(selector, { 
          state: 'visible', 
          timeout: opts.timeout 
        }).then(() => selector)
      );
      
      return await Promise.race(promises);
    }, opts);
  }

  /**
   * Click with fallback selectors
   */
  async clickAny(selectors: string[], options?: WaitOptions) {
    const opts = this.mergeOptions(options);
    
    await this.retryOperation(async () => {
      let clicked = false;
      
      for (const selector of selectors) {
        if (await this.exists(selector, { ...opts, timeout: 1000 })) {
          await this.click(selector, opts);
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        throw new Error(`Could not find any selector: ${selectors.join(', ')}`);
      }
    }, opts);
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    options: Required<WaitOptions>
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = options.retryDelay;
    
    for (let i = 0; i < options.retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry ${i + 1}/${options.retries} failed: ${lastError.message}`);
        
        if (i < options.retries - 1) {
          await this.page.waitForTimeout(delay);
          delay *= 1.5; // Exponential backoff
        }
      }
    }
    
    // Take screenshot on final failure
    await this.screenshot(`error-${Date.now()}`);
    throw lastError;
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(options?: WaitOptions): Required<WaitOptions> {
    return {
      timeout: options?.timeout ?? this.config.defaultTimeout,
      waitForLoadState: options?.waitForLoadState ?? this.config.autoWaitForLoadState,
      waitForNetworkIdle: options?.waitForNetworkIdle ?? this.config.autoWaitForNetworkIdle,
      retries: options?.retries ?? this.config.defaultRetries,
      retryDelay: options?.retryDelay ?? this.config.defaultRetryDelay,
      waitForSelector: options?.waitForSelector ?? '',
      waitForResponse: options?.waitForResponse ?? (() => false)
    };
  }

  /**
   * Get the underlying Playwright page (for advanced operations)
   */
  getPage(): Page {
    return this.page;
  }
}