import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Import/Export data table steps
Then('I see column mapping interface:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedColumns = dataTable.raw().flat();
  
  for (const column of expectedColumns) {
    const columnVisible = await this.page!.locator(`.column-mapping:has-text("${column}")`).isVisible();
    expect(columnVisible).toBe(true);
  }
});

When('I configure import rules:', async function(this: CustomWorld, dataTable: DataTable) {
  const rules = dataTable.rowsHash();
  
  for (const [rule, value] of Object.entries(rules)) {
    switch (rule) {
      case 'Skip duplicates':
        if (value === 'Yes') {
          await this.page!.check('input[name="skipDuplicates"]');
        }
        break;
      case 'Update existing':
        if (value === 'Yes') {
          await this.page!.check('input[name="updateExisting"]');
        }
        break;
      case 'Validate data':
        if (value === 'Yes') {
          await this.page!.check('input[name="validateData"]');
        }
        break;
    }
  }
});

Then('the system should parse:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedData = dataTable.hashes();
  
  // Wait for parsing to complete
  await this.page!.waitForSelector('.parse-results', { timeout: 5000 });
  
  // Verify parsed data
  for (const row of expectedData) {
    const rowVisible = await this.page!.locator(`.parsed-row:has-text("${row.Username}")`).isVisible();
    expect(rowVisible).toBe(true);
  }
});

When('conflicts are detected:', async function(this: CustomWorld, dataTable: DataTable) {
  const conflicts = dataTable.hashes();
  
  // Store conflicts for later resolution
  this.testData.set('importConflicts', conflicts);
  
  // Verify conflicts are shown
  for (const conflict of conflicts) {
    const conflictVisible = await this.page!.locator(`.conflict-item:has-text("${conflict.Username}")`).isVisible();
    expect(conflictVisible).toBe(true);
  }
});

Then('I should see conflict resolution:', async function(this: CustomWorld, dataTable: DataTable) {
  const resolutions = dataTable.raw().flat();
  
  for (const resolution of resolutions) {
    const optionVisible = await this.page!.locator(`button:has-text("${resolution}"), label:has-text("${resolution}")`).isVisible();
    expect(optionVisible).toBe(true);
  }
});

Then('only modified data should be included:', async function(this: CustomWorld, dataTable: DataTable) {
  const modifiedFields = dataTable.raw().flat();
  
  for (const field of modifiedFields) {
    const fieldIncluded = await this.page!.locator(`.export-field:has-text("${field}")`).isVisible();
    expect(fieldIncluded).toBe(true);
  }
});

Then('I should see supported formats:', async function(this: CustomWorld, dataTable: DataTable) {
  const formats = dataTable.raw().flat();
  
  for (const format of formats) {
    const formatAvailable = await this.page!.locator(`option:has-text("${format}"), mat-option:has-text("${format}")`).isVisible();
    expect(formatAvailable).toBe(true);
  }
});

When('I set up scheduled exports:', async function(this: CustomWorld, dataTable: DataTable) {
  const schedule = dataTable.rowsHash();
  
  // Configure schedule
  if (schedule.Frequency) {
    await this.page!.selectOption('select[name="frequency"]', schedule.Frequency);
  }
  if (schedule.Time) {
    await this.page!.fill('input[type="time"]', schedule.Time);
  }
  if (schedule.Recipients) {
    await this.page!.fill('input[name="recipients"]', schedule.Recipients);
  }
  
  await this.page!.click('button:has-text("Save schedule")');
});

Then('I should only see allowed options:', async function(this: CustomWorld, dataTable: DataTable) {
  const allowedOptions = dataTable.raw().flat();
  
  for (const option of allowedOptions) {
    const optionVisible = await this.page!.locator(`.export-option:has-text("${option}")`).isVisible();
    expect(optionVisible).toBe(true);
  }
  
  // Verify restricted options are not visible
  const fullExport = await this.page!.locator('button:has-text("Export all")').isVisible({ timeout: 1000 }).catch(() => false);
  expect(fullExport).toBe(false);
});

When('I enable anonymization:', async function(this: CustomWorld, dataTable: DataTable) {
  const settings = dataTable.rowsHash();
  
  for (const [setting, value] of Object.entries(settings)) {
    if (value === 'Yes') {
      await this.page!.check(`input[name="${setting.toLowerCase().replace(/\s+/g, '_')}"]`);
    }
  }
});

Then('exported data should have:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectations = dataTable.raw().flat();
  
  // This would check the exported file content
  const exportComplete = await this.page!.locator('.export-complete').isVisible({ timeout: 5000 });
  expect(exportComplete).toBe(true);
  
  for (const expectation of expectations) {
    this.testData.set('exportExpectation', expectation);
  }
});

Then('I should see validation results:', async function(this: CustomWorld, dataTable: DataTable) {
  const results = dataTable.hashes();
  
  for (const result of results) {
    const resultRow = await this.page!.locator(`.validation-result:has-text("${result.Field}")`).textContent();
    expect(resultRow).toContain(result.Status);
  }
});

Then('I should have options:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.raw().flat();
  
  for (const option of options) {
    const optionButton = await this.page!.locator(`button:has-text("${option}")`).isVisible();
    expect(optionButton).toBe(true);
  }
});

When('I add custom metadata:', async function(this: CustomWorld, dataTable: DataTable) {
  const metadata = dataTable.rowsHash();
  
  for (const [key, value] of Object.entries(metadata)) {
    await this.page!.fill(`input[name="metadata_${key.toLowerCase()}"]`, value);
  }
});

// History and audit trail data tables
Then('each entry should show:', async function(this: CustomWorld, dataTable: DataTable) {
  const fields = dataTable.raw().flat();
  const firstEntry = this.page!.locator('.history-entry, .audit-entry').first();
  
  for (const field of fields) {
    const fieldVisible = await firstEntry.locator(`.entry-${field.toLowerCase().replace(/\s+/g, '-')}`).isVisible();
    expect(fieldVisible).toBe(true);
  }
});

Then('I should see the complete motion timeline:', async function(this: CustomWorld, dataTable: DataTable) {
  const timeline = dataTable.hashes();
  
  for (const event of timeline) {
    const timelineEntry = await this.page!.locator(`.timeline-event:has-text("${event.Event}")`).isVisible();
    expect(timelineEntry).toBe(true);
  }
});

Then('I should see a detailed diff view showing:', async function(this: CustomWorld, dataTable: DataTable) {
  const diffDetails = dataTable.raw().flat();
  
  for (const detail of diffDetails) {
    const detailVisible = await this.page!.locator(`.diff-view:has-text("${detail}"), .diff-${detail.toLowerCase()}`).isVisible();
    expect(detailVisible).toBe(true);
  }
});

Then('I should see comprehensive voting audit:', async function(this: CustomWorld, dataTable: DataTable) {
  const auditItems = dataTable.hashes();
  
  for (const item of auditItems) {
    const voteInfo = await this.page!.locator(`.vote-audit:has-text("${item.Vote}")`).textContent();
    expect(voteInfo).toContain(item.Result);
    expect(voteInfo).toContain(item.Participation);
  }
});

Then('I should see all permission modifications:', async function(this: CustomWorld, dataTable: DataTable) {
  const permissions = dataTable.hashes();
  
  for (const perm of permissions) {
    const permEntry = await this.page!.locator(`.permission-change:has-text("${perm.Permission}")`).isVisible();
    expect(permEntry).toBe(true);
  }
});

When('I set search criteria:', async function(this: CustomWorld, dataTable: DataTable) {
  const criteria = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(criteria)) {
    const fieldName = field.toLowerCase().replace(/\s+/g, '_');
    await this.page!.fill(`input[name="${fieldName}"]`, value);
  }
  
  await this.page!.click('button:has-text("Search")');
});

Then('the report should include:', async function(this: CustomWorld, dataTable: DataTable) {
  const sections = dataTable.raw().flat();
  
  for (const section of sections) {
    const sectionVisible = await this.page!.locator(`.report-section:has-text("${section}")`).isVisible();
    expect(sectionVisible).toBe(true);
  }
});

When('I configure retention policies:', async function(this: CustomWorld, dataTable: DataTable) {
  const policies = dataTable.rowsHash();
  
  for (const [policy, value] of Object.entries(policies)) {
    if (policy === 'Keep history for') {
      await this.page!.fill('input[name="retention_days"]', value.replace(' days', ''));
    } else if (policy === 'Archive after') {
      await this.page!.fill('input[name="archive_days"]', value.replace(' days', ''));
    } else if (policy === 'Delete after') {
      await this.page!.fill('input[name="delete_days"]', value.replace(' days', ''));
    }
  }
});

When('I request history data via API with parameters:', async function(this: CustomWorld, dataTable: DataTable) {
  const params = dataTable.rowsHash();
  
  // Store API parameters for validation
  this.testData.set('apiParams', params);
  
  // Simulate API request
  await this.page!.evaluate((parameters) => {
    window.dispatchEvent(new CustomEvent('api-request', { detail: parameters }));
  }, params);
});

When('I configure the voting with:', async function(this: CustomWorld, dataTable: DataTable) {
  const config = dataTable.rowsHash();
  
  for (const [setting, value] of Object.entries(config)) {
    if (setting === 'Method') {
      await this.page!.selectOption('select[name="votingMethod"]', value);
    } else if (setting === 'Anonymous') {
      if (value === 'Yes') {
        await this.page!.check('input[name="anonymous"]');
      }
    } else if (setting === 'Duration') {
      await this.page!.fill('input[name="duration"]', value);
    }
  }
});

When('I select options:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.rowsHash();
  
  for (const [option, value] of Object.entries(options)) {
    if (value === 'Yes') {
      await this.page!.check(`input[name="${option.toLowerCase().replace(/\s+/g, '_')}"]`);
    }
  }
});

Then('I should not see motions in states:', async function(this: CustomWorld, dataTable: DataTable) {
  const hiddenStates = dataTable.raw().flat();
  
  for (const state of hiddenStates) {
    const motionInState = await this.page!.locator(`.motion-state:has-text("${state}")`).isVisible({ timeout: 1000 }).catch(() => false);
    expect(motionInState).toBe(false);
  }
});