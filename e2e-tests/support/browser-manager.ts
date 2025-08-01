import { chromium, Browser } from '@playwright/test';

/**
 * Global browser manager to maintain a single browser instance
 * across all tests for better performance and stability
 */
class BrowserManager {
  private static instance: BrowserManager;
  private browser?: Browser;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      console.log('Starting global browser instance...');
      this.browser = await chromium.launch({
        headless: process.env.HEADLESS !== 'false',
        args: [
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--disable-web-security',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled'
        ],
        timeout: 60000
      });
      
      this.isInitialized = true;
      console.log('Global browser instance started successfully');
      
      // Handle browser crashes
      this.browser.on('disconnected', () => {
        console.error('Browser disconnected unexpectedly');
        this.isInitialized = false;
        this.browser = undefined;
      });
    }
    
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser && this.browser.isConnected()) {
      console.log('Closing global browser instance...');
      try {
        await this.browser.close();
      } catch (error) {
        console.warn('Error closing browser:', error);
      }
      this.browser = undefined;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.browser?.isConnected() === true;
  }
}

export const browserManager = BrowserManager.getInstance();