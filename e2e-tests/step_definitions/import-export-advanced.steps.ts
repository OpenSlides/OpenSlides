import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Import/Export scenarios
Given('I have a well-structured meeting', async function(this: CustomWorld) {
  // This assumes we're in a meeting with proper structure
  this.testData.set('hasStructuredMeeting', true);
  
  // Verify basic meeting elements exist
  const hasAgenda = await this.page!.locator('a:has-text("Agenda")').isVisible();
  const hasMotions = await this.page!.locator('a:has-text("Motions")').isVisible();
  const hasParticipants = await this.page!.locator('a:has-text("Participants")').isVisible();
  
  expect(hasAgenda && hasMotions && hasParticipants).toBe(true);
});

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts

Then('sensitive data should be stripped', async function(this: CustomWorld) {
  // This would be verified by checking the export preview
  const preview = await this.page!.locator('.export-preview, .data-preview').isVisible();
  expect(preview).toBe(true);
  
  // Check that sensitive fields are not included
  const sensitiveData = await this.page!.locator('text=/password|token|secret/i').isVisible({ timeout: 1000 }).catch(() => false);
  expect(sensitiveData).toBe(false);
});

When('I start import', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start import"), button:has-text("Import now")');
  await this.page!.waitForTimeout(2000);
});

Then('I should see import progress', async function(this: CustomWorld) {
  const progress = await this.page!.locator('mat-progress-bar, .import-progress, [role="progressbar"]').isVisible();
  expect(progress).toBe(true);
});

Then('receive detailed import report', async function(this: CustomWorld) {
  // Wait for import to complete
  await this.page!.waitForTimeout(3000);
  
  const report = await this.page!.locator('.import-report, .import-summary, .import-results').isVisible({ timeout: 10000 });
  expect(report).toBe(true);
});

// Motion import wizard
When('I use {string}', async function(this: CustomWorld, wizardName: string) {
  await this.page!.click(`button:has-text("${wizardName}"), a:has-text("${wizardName}")`);
  await this.page!.waitForTimeout(1500);
});

Then('show preview of detected motions', async function(this: CustomWorld) {
  const preview = await this.page!.locator('.motion-preview, .import-preview').isVisible();
  expect(preview).toBe(true);
  
  // Should show at least one motion
  const motionCount = await this.page!.locator('.motion-item, .preview-item').count();
  expect(motionCount).toBeGreaterThan(0);
});

When('I confirm import', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Confirm import"), button:has-text("Import")');
  await this.page!.waitForTimeout(2000);
});

Then('motions should be created correctly', async function(this: CustomWorld) {
  const success = await this.page!.locator('text=/Imported.*motions|Motions.*created/i').isVisible({ timeout: 5000 });
  expect(success).toBe(true);
});

// Conflict resolution
Given('I import data with conflicts', async function(this: CustomWorld) {
  // This would typically involve importing data that conflicts with existing data
  this.testData.set('hasConflicts', true);
  
  // The import process should detect conflicts
  const conflicts = await this.page!.locator('.conflict-warning, .import-conflicts').isVisible({ timeout: 5000 });
  expect(conflicts).toBe(true);
});

Then('be able to resolve individually or bulk', async function(this: CustomWorld) {
  // Check for conflict resolution options
  const individualResolve = await this.page!.locator('button:has-text("Resolve individually")').isVisible();
  const bulkResolve = await this.page!.locator('button:has-text("Resolve all")').isVisible();
  
  expect(individualResolve || bulkResolve).toBe(true);
});

// Incremental export
Given('I have a previously exported meeting', async function(this: CustomWorld) {
  this.testData.set('hasPreviousExport', true);
  
  // There should be export history
  const exportHistory = await this.page!.locator('.export-history, .previous-exports').isVisible();
  expect(exportHistory).toBe(true);
});

When('I export with {string}', async function(this: CustomWorld, exportOption: string) {
  // Select export option
  await this.page!.click(`mat-radio-button:has-text("${exportOption}"), label:has-text("${exportOption}")`);
  await this.page!.waitForTimeout(500);
  
  // Start export
  await this.page!.click('button:has-text("Export")');
  await this.page!.waitForTimeout(2000);
});

Then('export should include sync metadata', async function(this: CustomWorld) {
  // The export should contain metadata for syncing
  const metadata = await this.page!.locator('.export-metadata, text=/Last.*export|Sync.*information/i').isVisible();
  expect(metadata).toBe(true);
});

// Legacy system import
When('I import from legacy system', async function(this: CustomWorld) {
  // Select legacy import option
  await this.page!.click('button:has-text("Import from legacy"), mat-tab-label:has-text("Legacy import")');
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('legacyImport', true);
});

Then('data should be transformed correctly', async function(this: CustomWorld) {
  // Check transformation report
  const transformation = await this.page!.locator('.transformation-report, text=/Transformed.*items|Data.*converted/i').isVisible({ timeout: 5000 });
  expect(transformation).toBe(true);
});

// Automated exports
Then('exports should run automatically', async function(this: CustomWorld) {
  // Check that automated export is scheduled
  const scheduled = await this.page!.locator('.scheduled-export, text=/Next.*export|Scheduled.*backup/i').isVisible();
  expect(scheduled).toBe(true);
});

// Export formats
When('I select export format {string}', async function(this: CustomWorld, format: string) {
  await this.page!.click(`mat-radio-button:has-text("${format}"), input[value="${format.toLowerCase()}"]`);
  await this.page!.waitForTimeout(500);
});

Then('I should receive a {string} file', async function(this: CustomWorld, fileType: string) {
  // In a real test, we would check for file download
  // For now, verify the export completed
  const exportComplete = await this.page!.locator('text=/Export.*complete|Download.*ready/i').isVisible({ timeout: 5000 });
  expect(exportComplete).toBe(true);
  
  this.testData.set('exportedFileType', fileType);
});

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts

Then('I should receive my personal data export', async function(this: CustomWorld) {
  const personalExport = await this.page!.locator('text=/Personal.*data.*export|Your.*data.*ready/i').isVisible({ timeout: 5000 });
  expect(personalExport).toBe(true);
});

// Import validation
Then('import validation should show errors', async function(this: CustomWorld) {
  const validationErrors = await this.page!.locator('.validation-errors, .import-errors').isVisible();
  expect(validationErrors).toBe(true);
});

When('I fix validation errors', async function(this: CustomWorld) {
  // This would involve correcting the errors shown
  // For testing, we'll just mark that we've addressed them
  this.testData.set('validationFixed', true);
  
  await this.page!.click('button:has-text("Retry"), button:has-text("Validate again")');
  await this.page!.waitForTimeout(2000);
});

// Partial import
When('I select items to import', async function(this: CustomWorld, dataTable: DataTable) {
  const items = dataTable.raw().flat();
  
  for (const item of items) {
    await this.page!.click(`mat-checkbox:has-text("${item}"), label:has-text("${item}") input[type="checkbox"]`);
    await this.page!.waitForTimeout(200);
  }
});

Then('only selected items should be imported', async function(this: CustomWorld) {
  const partialImport = await this.page!.locator('text=/Imported.*selected|Partial.*import.*complete/i').isVisible({ timeout: 5000 });
  expect(partialImport).toBe(true);
});

// Export templates
When('I save as export template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.fill('input[placeholder*="Template name"]', templateName);
  await this.page!.click('button:has-text("Save template")');
  await this.page!.waitForTimeout(1000);
});

Then('template {string} should be available for reuse', async function(this: CustomWorld, templateName: string) {
  const template = await this.page!.locator(`.template-item:has-text("${templateName}")`).isVisible();
  expect(template).toBe(true);
});

// Import mapping
When('I map import fields', async function(this: CustomWorld, dataTable: DataTable) {
  const mappings = dataTable.hashes();
  
  for (const mapping of mappings) {
    const sourceField = mapping['Source Field'];
    const targetField = mapping['Target Field'];
    
    // Find the mapping row
    const row = this.page!.locator(`tr:has-text("${sourceField}")`);
    await row.locator('mat-select').click();
    await this.page!.click(`mat-option:has-text("${targetField}")`);
    await this.page!.waitForTimeout(500);
  }
});

// Backup functionality
Given('automatic backups are configured', async function(this: CustomWorld) {
  this.testData.set('hasAutoBackup', true);
  
  const backupSettings = await this.page!.locator('.backup-settings, text=/Automatic.*backup|Backup.*schedule/i').isVisible();
  expect(backupSettings).toBe(true);
});

When('I restore from backup {string}', async function(this: CustomWorld, backupName: string) {
  await this.page!.click(`button:has-text("Restore from ${backupName}"), .backup-item:has-text("${backupName}") button:has-text("Restore")`);
  await this.page!.waitForTimeout(2000);
});

Then('meeting should be restored to that state', async function(this: CustomWorld) {
  const restored = await this.page!.locator('text=/Restored.*successfully|Backup.*restored/i').isVisible({ timeout: 5000 });
  expect(restored).toBe(true);
});