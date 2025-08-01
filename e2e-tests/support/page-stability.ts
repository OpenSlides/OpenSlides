import { Page } from '@playwright/test';

/**
 * Helper functions to ensure page stability before operations
 */

export async function waitForPageStability(page: Page, options?: {
  timeout?: number;
  waitForAngular?: boolean;
}): Promise<void> {
  const timeout = options?.timeout || 10000;
  const waitForAngular = options?.waitForAngular !== false;

  try {
    // Check if page is still valid
    if (page.isClosed()) {
      console.debug('Page is closed, skipping stability check');
      return;
    }
    
    // Wait for basic page load
    await page.waitForLoadState('domcontentloaded', { timeout }).catch((err: any) => {
      if (!err.message?.includes('Target page, context or browser has been closed')) {
        console.log('DOM content not loaded within timeout');
      }
    });
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout }).catch((err: any) => {
      if (!err.message?.includes('Target page, context or browser has been closed')) {
        console.log('Network did not become idle, continuing...');
      }
    });
    
    // Wait for Angular to be stable if requested
    if (waitForAngular) {
      await waitForAngularStability(page, timeout);
    }
  } catch (error: any) {
    if (!error.message?.includes('Target page, context or browser has been closed')) {
      console.warn('Page stability check failed:', error.message);
    }
    // Don't throw - let the test continue
  }
}

export async function waitForAngularStability(page: Page, timeout: number = 5000): Promise<void> {
  try {
    // First check if page is still valid
    if (page.isClosed()) {
      console.debug('Page is closed, skipping Angular stability check');
      return;
    }
    
    await page.waitForFunction(() => {
      const win = window as any;
      
      // Check if Angular is present
      if (!win.getAllAngularTestabilities && !win.ng) {
        return true; // No Angular, consider stable
      }
      
      // Try to get Angular testabilities
      const testabilities = win.getAllAngularTestabilities?.();
      if (testabilities && testabilities.length > 0) {
        return testabilities.every((t: any) => t.isStable());
      }
      
      // Fallback to ng.probe method
      if (win.ng?.probe) {
        const rootElement = document.querySelector('[ng-version]') || document.body;
        const probe = win.ng.probe(rootElement);
        return probe?.isStable?.() ?? true;
      }
      
      return true; // Default to stable if we can't determine
    }, { timeout }).catch((err: any) => {
      // Don't log page closed errors
      if (!err.message?.includes('Target page, context or browser has been closed')) {
        console.debug('Angular stability check failed:', err.message);
      }
    });
  } catch (error: any) {
    // Don't log page closed errors
    if (!error.message?.includes('Target page, context or browser has been closed')) {
      console.debug('Angular stability check failed:', error.message);
    }
  }
}

export async function ensurePageReady(page: Page): Promise<boolean> {
  try {
    // Check if page is closed
    if (page.isClosed()) {
      console.error('Page is closed');
      return false;
    }
    
    // Check if we can execute JavaScript
    const canExecute = await page.evaluate(() => true).catch(() => false);
    if (!canExecute) {
      console.error('Cannot execute JavaScript on page');
      return false;
    }
    
    // Wait for stability
    await waitForPageStability(page, { timeout: 5000 });
    
    return true;
  } catch (error) {
    console.error('Page readiness check failed:', error);
    return false;
  }
}

export async function safeNavigate(page: Page, url: string, options?: {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
}): Promise<boolean> {
  try {
    await page.goto(url, {
      waitUntil: options?.waitUntil || 'domcontentloaded',
      timeout: options?.timeout || 30000
    });
    
    await waitForPageStability(page);
    return true;
  } catch (error) {
    console.error(`Failed to navigate to ${url}:`, error);
    return false;
  }
}