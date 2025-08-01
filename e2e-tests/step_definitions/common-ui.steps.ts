import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Common "I should see" with table support
Then('I should see:', async function(this: CustomWorld, dataTable: DataTable) {
  const items = dataTable.raw().flat();
  
  for (const item of items) {
    const isVisible = await this.page!.locator(`text="${item}"`).isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      // Try alternative selectors
      const alternatives = [
        `text=/${item}/i`,
        `*:has-text("${item}")`,
        `[aria-label*="${item}" i]`,
        `[title*="${item}" i]`
      ];
      
      let found = false;
      for (const selector of alternatives) {
        if (await this.page!.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        throw new Error(`Expected to see "${item}" but it was not found on the page`);
      }
    }
  }
});

// Common save button variations
// Removed - using generic 'I click {string}' from generic-ui.steps.ts instead
// When('I click "Save"', async function(this: CustomWorld) {
//   // Use common save button selector
//   const saveSelectors = [
//     'button:has-text("Save")',
//     'button[type="submit"]:has-text("Save")',
//     'button[mat-raised-button]:has-text("Save")',
//     '[data-cy="save-button"]',
//     'button.save-button'
//   ];
//   
//   let clicked = false;
//   for (const selector of saveSelectors) {
//     try {
//       const button = this.page!.locator(selector).first();
//       if (await button.isVisible({ timeout: 1000 })) {
//         await button.click();
//         clicked = true;
//         break;
//       }
//     } catch {
//       // Continue to next selector
//     }
//   }
//   
//   if (!clicked) {
//     throw new Error('Could not find Save button');
//   }
//   
//   await this.page!.waitForTimeout(2000);
// });

When('I save the changes', async function(this: CustomWorld) {
  // Use the generic click handler
  await this.page!.click('button:has-text("Save")');
  await this.page!.waitForTimeout(2000);
});

// Create button variations
When('I click the create button', async function(this: CustomWorld) {
  // Wait for any loading to complete
  await this.page!.waitForTimeout(1000);
  
  const createSelectors = [
    'button:has-text("Create")',
    'button[type="submit"]:has-text("Create")',
    'button[mat-raised-button]:has-text("Create")',
    '[data-cy="create-button"]',
    'button.create-button',
    'button:has-text("Save")',
    'button:has-text("Submit")',
    'button[type="submit"]',
    'mat-dialog-actions button:last-child',
    '.mat-mdc-dialog-actions button:last-child'
  ];
  
  let clicked = false;
  for (const selector of createSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }
  
  if (!clicked) {
    // Take screenshot for debugging
    await this.page!.screenshot({ path: 'create-button-not-found.png' });
    
    // Log visible buttons
    const buttons = await this.page!.locator('button').allTextContents();
    console.log('Visible buttons:', buttons);
    
    throw new Error('Could not find Create button');
  }
  
  await this.page!.waitForTimeout(2000);
});

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts

// Success notification variations
Then('I should see a success notification', async function(this: CustomWorld) {
  const successSelectors = [
    '.mat-snack-bar',
    '.success-message',
    '.notification-success',
    '[role="alert"]:has-text("success")',
    '.alert-success'
  ];
  
  let found = false;
  for (const selector of successSelectors) {
    if (await this.page!.locator(selector).isVisible({ timeout: 5000 }).catch(() => false)) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    // Also check for common success text
    const successTexts = ['saved', 'created', 'updated', 'success'];
    for (const text of successTexts) {
      if (await this.page!.locator(`text=/${text}/i`).isVisible({ timeout: 1000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
  }
  
  expect(found).toBe(true);
});

// Progress indicator
Then('I should see a progress indicator', async function(this: CustomWorld) {
  const progressSelectors = [
    'mat-progress-bar',
    'mat-progress-spinner',
    '.progress-indicator',
    '[role="progressbar"]',
    '.loading',
    '.spinner'
  ];
  
  let found = false;
  for (const selector of progressSelectors) {
    if (await this.page!.locator(selector).isVisible({ timeout: 3000 }).catch(() => false)) {
      found = true;
      break;
    }
  }
  
  expect(found).toBe(true);
});

// Export button
// Removed - using generic 'I click {string}' from generic-ui.steps.ts instead
// When('I click "Export"', async function(this: CustomWorld) {
//   const exportSelectors = [
//     'button:has-text("Export")',
//     'a:has-text("Export")',
//     '[data-cy="export-button"]',
//     'button[mat-button]:has-text("Export")'
//   ];
//   
//   let clicked = false;
//   for (const selector of exportSelectors) {
//     try {
//       const button = this.page!.locator(selector).first();
//       if (await button.isVisible({ timeout: 1000 })) {
//         await button.click();
//         clicked = true;
//         break;
//       }
//     } catch {
//       // Continue to next selector
//     }
//   }
//   
//   if (!clicked) {
//     throw new Error('Could not find Export button');
//   }
//   
//   await this.page!.waitForTimeout(1000);
// });

// Start button
// Removed - using generic 'I click {string}' from generic-ui.steps.ts instead
// When('I click "Start"', async function(this: CustomWorld) {
//   await this.page!.click('button:has-text("Start")');
//   await this.page!.waitForTimeout(1000);
// });

// Tags input
When('I add tags:', async function(this: CustomWorld, dataTable: DataTable) {
  const tags = dataTable.raw().flat();
  
  // Find tag input field
  const tagInput = this.page!.locator('input[placeholder*="tag" i], mat-chip-input, input[formcontrolname="tags"]').first();
  
  for (const tag of tags) {
    await tagInput.fill(tag);
    await tagInput.press('Enter');
    await this.page!.waitForTimeout(500);
  }
});

// User should not be able to login
Then('the user should not be able to login', async function(this: CustomWorld) {
  // Check if we're still on login page
  const currentUrl = this.page!.url();
  expect(currentUrl).toContain('login');
  
  // Check for error message
  const hasError = await this.page!.locator('.mat-error, .error-message, .alert-danger').isVisible({ timeout: 3000 }).catch(() => false);
  expect(hasError).toBe(true);
});