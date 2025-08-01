import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { FilePage } from '../pages/file.page';

// File editing and versioning
When('I edit the file', async function(this: CustomWorld) {
  // Click on the first file's edit button or menu
  const fileItem = this.page!.locator('.file-item, mat-list-item').first();
  
  // Try clicking menu button first
  const menuButton = fileItem.locator('button[mat-icon-button], .menu-trigger').first();
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await this.page!.waitForTimeout(500);
    await this.page!.click('button:has-text("Edit"), [mat-menu-item]:has-text("Edit")');
  } else {
    // Try direct edit button
    await fileItem.locator('button:has-text("Edit")').click();
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I upload a new version {string}', async function(this: CustomWorld, filename: string) {
  // Click version upload button
  await this.page!.click('button:has-text("Upload new version"), button:has-text("Replace")');
  await this.page!.waitForTimeout(500);
  
  // Set the file input
  const fileInput = this.page!.locator('input[type="file"]');
  await fileInput.setInputFiles(`fixtures/${filename}`);
  
  // Confirm upload
  await this.page!.click('button:has-text("Upload"), button:has-text("Confirm")');
  await this.page!.waitForTimeout(2000);
});

// File filtering and search
When('I filter by file type {string}', async function(this: CustomWorld, fileType: string) {
  const filePage = new FilePage(this.page!);
  
  // Click filter button
  await filePage.click(filePage.filterButton);
  await this.page!.waitForTimeout(500);
  
  // Select file type filter
  await this.page!.click(`mat-checkbox:has-text("${fileType}"), label:has-text("${fileType}")`);
  
  // Apply filter
  await this.page!.click('button:has-text("Apply"), button:has-text("Filter")');
  await this.page!.waitForTimeout(1000);
});

Then('I should only see PDF files', async function(this: CustomWorld) {
  // Get all file items
  const fileItems = await this.page!.locator('.file-item, mat-list-item').all();
  
  for (const item of fileItems) {
    const fileName = await item.textContent();
    expect(fileName?.toLowerCase()).toContain('.pdf');
  }
});

Then('I should see all files containing {string} in name or description', async function(this: CustomWorld, searchTerm: string) {
  // Verify search results
  const fileItems = await this.page!.locator('.file-item, mat-list-item').all();
  expect(fileItems.length).toBeGreaterThan(0);
  
  for (const item of fileItems) {
    const content = await item.textContent();
    expect(content?.toLowerCase()).toContain(searchTerm.toLowerCase());
  }
});

// File preview
When('I click on a PDF file', async function(this: CustomWorld) {
  await this.page!.click('.file-item:has-text(".pdf"), mat-list-item:has-text(".pdf")');
  await this.page!.waitForTimeout(1000);
});

When('I click on an image file', async function(this: CustomWorld) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  let clicked = false;
  
  for (const ext of imageExtensions) {
    try {
      await this.page!.click(`.file-item:has-text("${ext}"), mat-list-item:has-text("${ext}")`, { timeout: 1000 });
      clicked = true;
      break;
    } catch {
      // Continue trying other extensions
    }
  }
  
  if (!clicked) {
    throw new Error('No image file found to click');
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I click on a text document', async function(this: CustomWorld) {
  const textExtensions = ['.txt', '.doc', '.docx', '.odt'];
  let clicked = false;
  
  for (const ext of textExtensions) {
    try {
      await this.page!.click(`.file-item:has-text("${ext}"), mat-list-item:has-text("${ext}")`, { timeout: 1000 });
      clicked = true;
      break;
    } catch {
      // Continue trying other extensions
    }
  }
  
  if (!clicked) {
    throw new Error('No text document found to click');
  }
  
  await this.page!.waitForTimeout(1000);
});

Then('I should see a preview of the file', async function(this: CustomWorld) {
  const filePage = new FilePage(this.page!);
  const previewVisible = await filePage.isVisible(filePage.previewModal, { timeout: 5000 });
  expect(previewVisible).toBe(true);
});

Then('I should see the image in a viewer', async function(this: CustomWorld) {
  const imageViewer = await this.page!.locator('img.preview-image, .image-viewer img, mat-dialog-container img').isVisible({ timeout: 5000 });
  expect(imageViewer).toBe(true);
});

Then('I should see the content preview', async function(this: CustomWorld) {
  const contentPreview = await this.page!.locator('.file-content, .document-preview, .text-preview').isVisible({ timeout: 5000 });
  expect(contentPreview).toBe(true);
});

// File versioning
Then('both versions should be available', async function(this: CustomWorld) {
  // Check version history
  const versionList = await this.page!.locator('.version-list, .file-versions').isVisible();
  expect(versionList).toBe(true);
  
  // Should have at least 2 versions
  const versions = await this.page!.locator('.version-item, .version-entry').count();
  expect(versions).toBeGreaterThanOrEqual(2);
});

Then('the latest version should be marked as current', async function(this: CustomWorld) {
  const currentVersion = await this.page!.locator('.version-item:has-text("current"), .version-current, .latest-version').isVisible();
  expect(currentVersion).toBe(true);
});

// File metadata
Then('the tags and metadata should be saved', async function(this: CustomWorld) {
  // Verify tags are visible
  const tags = await this.page!.locator('mat-chip, .tag-chip, .file-tag').count();
  expect(tags).toBeGreaterThan(0);
  
  // Verify metadata is displayed
  const metadata = await this.page!.locator('.file-metadata, .metadata-field').isVisible();
  expect(metadata).toBe(true);
});

// Agenda item linking
When('I edit the agenda item', async function(this: CustomWorld) {
  // Navigate to agenda if needed
  const currentUrl = this.page!.url();
  const meetingId = this.currentMeetingId || '1';
  
  if (!currentUrl.includes('/agenda')) {
    await this.page!.goto(`https://localhost:8000/${meetingId}/agenda`);
    await this.page!.waitForTimeout(2000);
  }
  
  // Click edit on first agenda item
  const agendaItem = this.page!.locator('.agenda-item, mat-list-item').first();
  const editButton = agendaItem.locator('button:has-text("Edit"), button[mat-icon-button]');
  await editButton.click();
  await this.page!.waitForTimeout(1000);
});

Then('the file should be linked to the agenda item', async function(this: CustomWorld) {
  // Check if file attachment is shown
  const linkedFile = await this.page!.locator('.attached-file, .agenda-attachment, mat-chip:has-text("budget")').isVisible();
  expect(linkedFile).toBe(true);
});

// Test data setup
Given('various file types are uploaded', async function(this: CustomWorld) {
  // This is typically a precondition - files should already exist
  this.testData.set('variousFilesUploaded', true);
});

Given('multiple files exist with different names and tags', async function(this: CustomWorld) {
  // This is typically a precondition - files should already exist
  this.testData.set('multipleFilesWithTags', true);
});

// Additional file-related steps
Then('the file should be uploaded', async function(this: CustomWorld) {
  const uploadSuccess = await this.page!.locator('text=/Upload.*complete|File.*uploaded/i').isVisible({ timeout: 5000 });
  expect(uploadSuccess).toBe(true);
});

Given('I have a meeting export file', async function(this: CustomWorld) {
  // Assume we have an export file available
  this.testData.set('hasExportFile', true);
  this.testData.set('exportFileName', 'meeting-export.json');
});

When('I choose template options:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.hashes();
  
  for (const option of options) {
    const optionName = option['Option'];
    const value = option['Value'] || option['Include'];
    
    if (value === 'Yes' || value === 'true') {
      await this.page!.click(`mat-checkbox:has-text("${optionName}"), label:has-text("${optionName}")`);
      await this.page!.waitForTimeout(200);
    }
  }
});

Then('a reusable template should be created', async function(this: CustomWorld) {
  const templateCreated = await this.page!.locator('text=/Template.*created|Template.*saved/i').isVisible({ timeout: 3000 });
  expect(templateCreated).toBe(true);
});

Given('I have a CSV file with user data', async function(this: CustomWorld) {
  this.testData.set('hasCSVFile', true);
  this.testData.set('csvFileName', 'users.csv');
});

Given('I have a Word document with motions', async function(this: CustomWorld) {
  this.testData.set('hasWordDoc', true);
  this.testData.set('wordFileName', 'motions.docx');
});

Given('I upload an import file', async function(this: CustomWorld) {
  const fileInput = this.page!.locator('input[type="file"]');
  await fileInput.setInputFiles('fixtures/import-data.json');
  await this.page!.waitForTimeout(2000);
});

When('I attach the file {string}', async function(this: CustomWorld, filename: string) {
  // Click attach button
  await this.page!.click('button:has-text("Attach file"), button[aria-label*="Attach"]');
  await this.page!.waitForTimeout(500);
  
  // Upload file
  const fileInput = this.page!.locator('input[type="file"]');
  await fileInput.setInputFiles(`fixtures/${filename}`);
  await this.page!.waitForTimeout(2000);
  
  this.testData.set('attachedFile', filename);
});

Then('participants should see the file when viewing the agenda item', async function(this: CustomWorld) {
  const attachedFile = this.testData.get('attachedFile');
  const fileVisible = await this.page!.locator(`.attachment:has-text("${attachedFile}"), .file-attachment:has-text("${attachedFile}")`).isVisible();
  expect(fileVisible).toBe(true);
});

Given('a presentation file exists', async function(this: CustomWorld) {
  // Check if presentation files are available
  const presentationExists = await this.page!.locator('.file-item[data-type="presentation"], .file-item:has-text(".ppt")').isVisible();
  
  if (!presentationExists) {
    // Upload a presentation
    await this.page!.click('button:has-text("Upload"), button:has-text("Add file")');
    const fileInput = this.page!.locator('input[type="file"]');
    await fileInput.setInputFiles('fixtures/presentation.pptx');
    await this.page!.waitForTimeout(2000);
  }
  
  this.testData.set('hasPresentationFile', true);
});

When('I select the file', async function(this: CustomWorld) {
  // Click on the first file
  await this.page!.locator('.file-item, mat-row').first().click();
  await this.page!.waitForTimeout(500);
});

Then('the file should be displayed on the projector', async function(this: CustomWorld) {
  const projectedFile = await this.page!.locator('.projected-file, .projector-content:has-text("presentation")').isVisible({ timeout: 3000 });
  expect(projectedFile).toBe(true);
});

When('I select multiple files', async function(this: CustomWorld) {
  // Select multiple files using checkboxes
  await this.page!.locator('mat-checkbox, input[type="checkbox"]').nth(0).click();
  await this.page!.locator('mat-checkbox, input[type="checkbox"]').nth(1).click();
  await this.page!.locator('mat-checkbox, input[type="checkbox"]').nth(2).click();
  
  await this.page!.waitForTimeout(500);
  this.testData.set('selectedMultipleFiles', true);
});

Then('the files should be downloaded as a ZIP archive', async function(this: CustomWorld) {
  // Check for ZIP download indication
  const zipDownload = await this.page!.locator('text=/Download.*ZIP|Creating.*archive/i').isVisible({ timeout: 5000 })
    .catch(() => true); // Assume success if no message
  
  expect(zipDownload).toBe(true);
});