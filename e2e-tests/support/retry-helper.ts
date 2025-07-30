import { Page } from '@playwright/test';

export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Retry ${i + 1}/${retries} failed: ${lastError.message}`);
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function waitForStableElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' | 'detached' } = {}
): Promise<void> {
  const { timeout = 10000, state = 'visible' } = options;
  
  await retryOperation(async () => {
    const element = page.locator(selector).first();
    await element.waitFor({ state, timeout: timeout / 3 });
    
    // Ensure element is stable
    const box1 = await element.boundingBox();
    await page.waitForTimeout(100);
    const box2 = await element.boundingBox();
    
    if (box1 && box2 && (box1.x !== box2.x || box1.y !== box2.y)) {
      throw new Error('Element is still moving');
    }
  }, 3, 500);
}

export async function clickWithRetry(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<void> {
  await retryOperation(async () => {
    const element = page.locator(selector).first();
    await element.click({ timeout: options.timeout || 5000 });
  });
}