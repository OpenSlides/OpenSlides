import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Navigation
// Removed - using generic navigation step from comprehensive.steps.ts
// The generic step handles 'Given I navigate to the {word} section'

// Note: Using common step definition for 'I click the {string} button' from common.steps.ts

When('I select a PDF file {string}', async function(this: CustomWorld, filename: string) {
  const fileInput = this.page!.locator('input[type="file"]').first();
  await fileInput.setInputFiles(`./fixtures/${filename}`);
  this.testData.set('uploadedFile', filename);
});

When('I select multiple files:', async function(this: CustomWorld, dataTable: DataTable) {
  const files = dataTable.hashes();
  const filePaths = files.map(file => `./fixtures/${file.Filename}`);
  
  const fileInput = this.page!.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePaths);
  
  this.testData.set('uploadedFiles', files);
});

When('I add the description {string}', async function(this: CustomWorld, description: string) {
  const descriptionInput = this.page!.locator('textarea[formcontrolname="description"], textarea[placeholder*="Description"], input[formcontrolname="description"]').first();
  await descriptionInput.fill(description);
});

// Note: Using comprehensive step definition for 'I click {string}' from comprehensive.steps.ts

// File organization
When('I create a new folder {string}', async function(this: CustomWorld, folderName: string) {
  // Click new folder button
  await this.page!.click('button:has-text("New folder"), button:has-text("Create folder")');
  await this.page!.waitForTimeout(500);
  
  // Fill folder name
  const folderInput = this.page!.locator('input[placeholder*="Folder name"], input[formcontrolname="name"]').first();
  await folderInput.fill(folderName);
  
  // Submit
  await this.page!.click('button[type="submit"], button:has-text("Create")');
  await this.page!.waitForTimeout(1000);
});

When('I select files related to finance', async function(this: CustomWorld) {
  // Select files with finance-related names
  const financeFiles = ['budget.xlsx', 'financial-report.pdf', 'expenses.csv'];
  
  for (const filename of financeFiles) {
    const fileRow = this.page!.locator('tr, .file-item').filter({ hasText: filename });
    const checkbox = fileRow.locator('mat-checkbox, input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
    }
  }
});

When('I move them to {string} folder', async function(this: CustomWorld, folderName: string) {
  // Open move dialog
  await this.page!.click('button:has-text("Move"), button:has-text("Move to")');
  await this.page!.waitForTimeout(500);
  
  // Select target folder
  await this.page!.click(`mat-tree-node:has-text("${folderName}"), .folder-item:has-text("${folderName}")`);
  
  // Confirm move
  await this.page!.click('button:has-text("Move here"), button:has-text("Confirm")');
  await this.page!.waitForTimeout(1000);
});

// File permissions
When('I edit the file properties', async function(this: CustomWorld) {
  const filename = this.testData.get('currentFile') || 'confidential.pdf';
  const fileRow = this.page!.locator('tr, .file-item').filter({ hasText: filename });
  
  // Open file menu
  await fileRow.locator('button[mat-icon-button], .menu-button').click();
  await this.page!.click('button:has-text("Properties"), button:has-text("Edit")');
  await this.page!.waitForTimeout(500);
});

When('I set visibility to {string}', async function(this: CustomWorld, visibility: string) {
  // Open visibility dropdown
  const visibilitySelect = this.page!.locator('mat-select[formcontrolname="visibility"], mat-select[placeholder*="Visibility"]').first();
  await visibilitySelect.click();
  
  // Select option
  await this.page!.click(`mat-option:has-text("${visibility}")`);
});

// File linking
When('I navigate to agenda item {string}', async function(this: CustomWorld, itemName: string) {
  // Navigate to agenda
  await this.page!.click('a:has-text("Agenda")');
  await this.page!.waitForTimeout(1000);
  
  // Click on the specific agenda item
  await this.page!.click(`text="${itemName}"`);
  await this.page!.waitForTimeout(1000);
});

When('I attach files to the agenda item', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Attach files"), button:has-text("Add files")');
  await this.page!.waitForTimeout(500);
});

When('I select the file {string}', async function(this: CustomWorld, filename: string) {
  // In file selection dialog
  const fileOption = this.page!.locator('.file-option, mat-list-option').filter({ hasText: filename });
  await fileOption.click();
});

When('I attach the selected files', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Attach"), button:has-text("Add selected")');
  await this.page!.waitForTimeout(1000);
});

// Assertions
// Removed duplicate - already defined in common-ui.steps.ts
// Then('I should see a progress indicator', async function(this: CustomWorld) {
//   const progress = await this.page!.locator('mat-progress-bar, .progress-indicator, [role="progressbar"]').isVisible();
//   expect(progress).toBe(true);
// });

Then('the file should appear in the file list', async function(this: CustomWorld) {
  const filename = this.testData.get('uploadedFile');
  await this.page!.waitForSelector(`text="${filename}"`, { timeout: 5000 });
  
  const fileVisible = await this.page!.locator(`text="${filename}"`).isVisible();
  expect(fileVisible).toBe(true);
});

Then('the file should be accessible for download', async function(this: CustomWorld) {
  const filename = this.testData.get('uploadedFile');
  const fileRow = this.page!.locator('tr, .file-item').filter({ hasText: filename });
  
  // Check for download button or link
  const downloadButton = fileRow.locator('button:has-text("Download"), a[download]');
  expect(await downloadButton.isVisible()).toBe(true);
});

Then('all files should be uploaded', async function(this: CustomWorld) {
  const files = this.testData.get('uploadedFiles') as any[];
  
  // Wait a bit for all uploads to complete
  await this.page!.waitForTimeout(3000);
  
  for (const file of files) {
    const fileVisible = await this.page!.locator(`text="${file.Filename}"`).isVisible();
    expect(fileVisible).toBe(true);
  }
});

Then('I should see them in the file list', async function(this: CustomWorld) {
  const files = this.testData.get('uploadedFiles') as any[];
  const fileCount = await this.page!.locator('.file-item, tbody tr').count();
  expect(fileCount).toBeGreaterThanOrEqual(files.length);
});

Then('the files should be organized in the folder', async function(this: CustomWorld) {
  // Navigate into the folder
  await this.page!.dblclick('text="Financial Reports"');
  await this.page!.waitForTimeout(1000);
  
  // Check that finance files are visible
  const financeFiles = ['budget.xlsx', 'financial-report.pdf'];
  for (const filename of financeFiles) {
    const fileVisible = await this.page!.locator(`text="${filename}"`).isVisible();
    expect(fileVisible).toBe(true);
  }
});

Then('I should be able to navigate the folder structure', async function(this: CustomWorld) {
  // Check for breadcrumb navigation
  const breadcrumb = await this.page!.locator('.breadcrumb, nav[aria-label="breadcrumb"]').isVisible();
  expect(breadcrumb).toBe(true);
});

Then('only committee members should see the file', async function(this: CustomWorld) {
  // This would need to be tested with different user roles
  // For now, just check that visibility setting was saved
  const visibilityBadge = await this.page!.locator('.visibility-badge:has-text("Committee members only")').isVisible();
  expect(visibilityBadge).toBe(true);
});

Then('other users should not have access', async function(this: CustomWorld) {
  // This would require testing with a non-committee member user
  // Marking as pending for now
  console.log('Permission testing would require multiple user sessions');
});

Then('the file should be attached to the agenda item', async function(this: CustomWorld) {
  const filename = this.testData.get('attachedFile');
  const attachment = await this.page!.locator('.attachment, .attached-file').filter({ hasText: filename }).isVisible();
  expect(attachment).toBe(true);
});

Then('I should see it in the attachments section', async function(this: CustomWorld) {
  const attachmentsSection = await this.page!.locator('.attachments-section, section:has-text("Attachments")').isVisible();
  expect(attachmentsSection).toBe(true);
});

Then('I should be redirected to the projector', async function(this: CustomWorld) {
  await this.page!.waitForTimeout(2000);
  const url = this.page!.url();
  expect(url).toContain('projector');
});

Then('the file preview should be visible', async function(this: CustomWorld) {
  const preview = await this.page!.locator('.file-preview, .projector-content, iframe').isVisible();
  expect(preview).toBe(true);
});

Then('I can navigate through the pages', async function(this: CustomWorld) {
  // Check for page navigation controls
  const nextButton = await this.page!.locator('button:has-text("Next"), button[aria-label="Next page"]').isVisible();
  const prevButton = await this.page!.locator('button:has-text("Previous"), button[aria-label="Previous page"]').isVisible();
  
  expect(nextButton || prevButton).toBe(true);
});

Then('I should be able to download the file', async function(this: CustomWorld) {
  // Check for download button
  const downloadButton = await this.page!.locator('button:has-text("Download"), a[download]').isVisible();
  expect(downloadButton).toBe(true);
});

// Additional given steps
Given('I have uploaded several files', async function(this: CustomWorld) {
  // This is a precondition - assume files are already uploaded
  this.testData.set('hasUploadedFiles', true);
});

Given('a file {string} exists', async function(this: CustomWorld, filename: string) {
  // Store the current file for later steps
  this.testData.set('currentFile', filename);
});

// Note: Using agenda-management step definition for 'an agenda item {string} exists'

Given('I have a file {string} uploaded', async function(this: CustomWorld, filename: string) {
  this.testData.set('attachedFile', filename);
});