import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;
  protected baseUrl: string;

  constructor(page: Page, baseUrl: string = 'https://localhost:8000') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async goto(path: string = '') {
    await this.page.goto(`${this.baseUrl}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }

  async waitForElement(selector: string, timeout: number = 30000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async clickElement(selector: string) {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  async fillInput(selector: string, value: string) {
    const element = await this.waitForElement(selector);
    await element.fill(value);
  }

  async selectOption(selector: string, value: string) {
    const element = await this.waitForElement(selector);
    await element.selectOption(value);
  }

  async getElementText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return await element.textContent() || '';
  }

  async isElementVisible(selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.waitForElement(selector, timeout);
      return true;
    } catch {
      return false;
    }
  }

  async waitForNotification(text: string) {
    await this.page.locator('.mat-snack-bar', { hasText: text }).waitFor({ state: 'visible' });
  }

  async closeNotification() {
    const closeButton = this.page.locator('.mat-snack-bar button');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  async waitForWebSocketConnection() {
    await this.page.waitForFunction(() => {
      return window.performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('ws://') || entry.name.includes('wss://'));
    });
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async reload() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }
}