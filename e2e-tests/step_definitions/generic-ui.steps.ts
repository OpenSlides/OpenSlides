import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Generic click handler for buttons
When('I click {string}', async function(this: CustomWorld, buttonText: string) {
  // Try multiple selectors in order of preference
  const selectors = [
    `button:has-text("${buttonText}")`,
    `a:has-text("${buttonText}")`,
    `[role="button"]:has-text("${buttonText}")`,
    `mat-button:has-text("${buttonText}")`,
    `mat-raised-button:has-text("${buttonText}")`,
    `mat-icon-button[aria-label="${buttonText}"]`,
    `.clickable:has-text("${buttonText}")`
  ];
  
  let clicked = false;
  for (const selector of selectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        await element.click();
        clicked = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  
  if (!clicked) {
    throw new Error(`Could not find clickable element with text "${buttonText}"`);
  }
  
  await this.page!.waitForTimeout(1000);
});

// Generic search functionality
When('I search for {string}', async function(this: CustomWorld, searchTerm: string) {
  // Find any visible search input
  const searchSelectors = [
    'input[placeholder*="Search"]',
    'input[type="search"]',
    'input[formcontrolname*="search"]',
    'input[name*="search"]',
    '.search-input',
    'input.search'
  ];
  
  let filled = false;
  for (const selector of searchSelectors) {
    try {
      const input = this.page!.locator(selector).first();
      if (await input.isVisible({ timeout: 1000 })) {
        await input.fill(searchTerm);
        await input.press('Enter');
        filled = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  
  if (!filled) {
    throw new Error('Could not find search input');
  }
  
  await this.page!.waitForTimeout(1500);
});

// Generic confirmation
When('I confirm the deletion', async function(this: CustomWorld) {
  // Try various confirmation button texts
  const confirmSelectors = [
    'button:has-text("Confirm")',
    'button:has-text("Delete")',
    'button:has-text("Yes")',
    'button:has-text("OK")',
    'button[mat-dialog-close]:has-text("Confirm")',
    '.confirm-button'
  ];
  
  for (const selector of confirmSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click();
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  
  await this.page!.waitForTimeout(2000);
});

// Generic file upload
// Removed duplicate - already defined in common.steps.ts
// When('I upload the file {string}', async function(this: CustomWorld, fileName: string) {
//   // Find file input
//   const fileInput = this.page!.locator('input[type="file"]').first();
//   
//   // Create a test file path (in real tests, this would be an actual file)
//   const filePath = `/tmp/${fileName}`;
//   
//   // Set the file on the input
//   await fileInput.setInputFiles(filePath);
//   
//   await this.page!.waitForTimeout(1000);
// });

// Generic confirmation dialog
When('I confirm', async function(this: CustomWorld) {
  await this.page!.locator('button:has-text("Confirm"), button:has-text("OK"), button:has-text("Yes")').first().click();
  await this.page!.waitForTimeout(1000);
});

// Generic form submission
When('I submit the form', async function(this: CustomWorld) {
  const submitButton = this.page!.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save")').first();
  await submitButton.click();
  await this.page!.waitForTimeout(2000);
});

// Generic navigation
When('I go back', async function(this: CustomWorld) {
  await this.page!.goBack();
  await this.page!.waitForLoadState('networkidle');
});

// Generic wait - removed duplicate
// Use 'When I wait for {int} seconds' from common.steps.ts

// Generic visibility checks
Then('I should see the {string} section', async function(this: CustomWorld, sectionName: string) {
  const section = await this.page!.locator(`section:has-text("${sectionName}"), div[class*="section"]:has-text("${sectionName}"), [aria-label="${sectionName}"]`).isVisible();
  expect(section).toBe(true);
});

Then('I should not see {string}', async function(this: CustomWorld, text: string) {
  const element = await this.page!.locator(`text="${text}"`).isVisible({ timeout: 3000 }).catch(() => false);
  expect(element).toBe(false);
});

// Generic input field filling
When('I fill {string} with {string}', async function(this: CustomWorld, fieldLabel: string, value: string) {
  // Try to find input by label
  const labelSelectors = [
    `label:has-text("${fieldLabel}") + input`,
    `label:has-text("${fieldLabel}") ~ input`,
    `input[placeholder*="${fieldLabel}"]`,
    `input[aria-label*="${fieldLabel}"]`,
    `input[formcontrolname="${fieldLabel.toLowerCase().replace(/\s+/g, '_')}"]`
  ];
  
  let filled = false;
  for (const selector of labelSelectors) {
    try {
      const input = this.page!.locator(selector).first();
      if (await input.isVisible({ timeout: 1000 })) {
        await input.fill(value);
        filled = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  
  if (!filled) {
    // Try finding by nearby label
    const label = this.page!.locator(`label:has-text("${fieldLabel}")`).first();
    const input = await label.locator('~ input, + input').first();
    await input.fill(value);
  }
  
  await this.page!.waitForTimeout(500);
});

// Generic dropdown selection
When('I select {string} from {string}', async function(this: CustomWorld, option: string, dropdownLabel: string) {
  // Find and click the dropdown
  const dropdown = this.page!.locator(`mat-select[aria-label*="${dropdownLabel}"], select[aria-label*="${dropdownLabel}"], label:has-text("${dropdownLabel}") ~ mat-select`).first();
  await dropdown.click();
  await this.page!.waitForTimeout(500);
  
  // Select the option
  await this.page!.locator(`mat-option:has-text("${option}"), option:has-text("${option}")`).first().click();
  await this.page!.waitForTimeout(500);
});

// Generic checkbox
When('I check {string}', async function(this: CustomWorld, checkboxLabel: string) {
  const checkbox = this.page!.locator(`mat-checkbox:has-text("${checkboxLabel}"), label:has-text("${checkboxLabel}") input[type="checkbox"]`).first();
  await checkbox.click();
  await this.page!.waitForTimeout(500);
});

// Generic radio button
When('I choose {string}', async function(this: CustomWorld, radioLabel: string) {
  const radio = this.page!.locator(`mat-radio-button:has-text("${radioLabel}"), label:has-text("${radioLabel}") input[type="radio"]`).first();
  await radio.click();
  await this.page!.waitForTimeout(500);
});

// Generic tab selection
When('I switch to {string} tab', async function(this: CustomWorld, tabName: string) {
  await this.page!.locator(`mat-tab-label:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first().click();
  await this.page!.waitForTimeout(1000);
});

// Generic progress indicator
Then('I should see progress indicator', async function(this: CustomWorld) {
  const progress = await this.page!.locator('mat-progress-bar, mat-progress-spinner, .progress-indicator, [role="progressbar"]').isVisible();
  expect(progress).toBe(true);
});

// Generic success message
Then('I should see a success message', async function(this: CustomWorld) {
  const success = await this.page!.locator('.success-message, .mat-snack-bar-container:has-text("Success"), .notification-success').isVisible({ timeout: 5000 });
  expect(success).toBe(true);
});

// Generic error message
Then('I should see an error message', async function(this: CustomWorld) {
  const error = await this.page!.locator('.error-message, .mat-snack-bar-container:has-text("Error"), .notification-error, .alert-danger').isVisible({ timeout: 5000 });
  expect(error).toBe(true);
});

// Generic dialog handling
Then('I should see a dialog', async function(this: CustomWorld) {
  const dialog = await this.page!.locator('mat-dialog-container, [role="dialog"], .modal').isVisible();
  expect(dialog).toBe(true);
});

When('I close the dialog', async function(this: CustomWorld) {
  // Try multiple ways to close a dialog
  const closeSelectors = [
    'button[mat-dialog-close]',
    'button[aria-label="Close"]',
    'mat-icon:has-text("close")',
    'button:has-text("Cancel")',
    'button:has-text("Close")'
  ];
  
  for (const selector of closeSelectors) {
    try {
      const closeButton = this.page!.locator(selector).first();
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  
  await this.page!.waitForTimeout(1000);
});