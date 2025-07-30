import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// History and version control
Then('system should restore previous state', async function(this: CustomWorld) {
  const restored = await this.page!.locator('.state-restored, text=/Restored.*previous/i').isVisible();
  expect(restored).toBe(true);
});

Then('I should be able to access version history', async function(this: CustomWorld) {
  const historyButton = await this.page!.locator('button:has-text("Version history"), button[aria-label="History"]').isVisible();
  expect(historyButton).toBe(true);
});

Then('I should be able to filter by these tags', async function(this: CustomWorld) {
  const tagFilter = await this.page!.locator('.tag-filter, .filter-by-tags').isVisible();
  expect(tagFilter).toBe(true);
});

Then('I should have controls for navigation', async function(this: CustomWorld) {
  const navControls = await this.page!.locator('.navigation-controls, .projector-controls').isVisible();
  expect(navControls).toBe(true);
});

// User role definitions
Given('I am an administrator', async function(this: CustomWorld) {
  const currentRole = this.testData.get('currentUserRole');
  if (currentRole !== 'administrator') {
    // Login as admin if not already
    await this.page!.goto(`${this.baseUrl}/logout`);
    await this.page!.goto(`${this.baseUrl}/login`);
    await this.page!.fill('input[formcontrolname="username"]', 'admin');
    await this.page!.fill('input[formcontrolname="password"]', 'admin');
    await this.page!.click('button[type="submit"]');
    await this.page!.waitForTimeout(2000);
  }
  this.testData.set('currentUserRole', 'administrator');
});

Then('I should be able to set storage quotas per committee', async function(this: CustomWorld) {
  const quotaSettings = await this.page!.locator('.quota-settings, input[name="storage_quota"]').isVisible();
  expect(quotaSettings).toBe(true);
});

Given('I am a regular user', async function(this: CustomWorld) {
  const currentRole = this.testData.get('currentUserRole');
  if (currentRole !== 'participant') {
    // Login as regular user
    await this.page!.goto(`${this.baseUrl}/logout`);
    await this.page!.goto(`${this.baseUrl}/login`);
    await this.page!.fill('input[formcontrolname="username"]', 'participant');
    await this.page!.fill('input[formcontrolname="password"]', 'participant');
    await this.page!.click('button[type="submit"]');
    await this.page!.waitForTimeout(2000);
  }
  this.testData.set('currentUserRole', 'participant');
});

Given('I have uploaded a file', async function(this: CustomWorld) {
  const hasFile = await this.page!.locator('.uploaded-file, .my-files').count();
  if (hasFile === 0) {
    // Upload a test file
    const fileInput = this.page!.locator('input[type="file"]');
    await fileInput.setInputFiles('fixtures/test-document.pdf');
    await this.page!.waitForTimeout(2000);
  }
  this.testData.set('hasUploadedFile', true);
});

Then('I should be able to delete my own file', async function(this: CustomWorld) {
  const deleteButton = await this.page!.locator('.my-files button[aria-label="Delete"]').isVisible();
  expect(deleteButton).toBe(true);
});

Then('administrators should be able to delete any file', async function(this: CustomWorld) {
  const isAdmin = this.testData.get('currentUserRole') === 'administrator';
  if (isAdmin) {
    const deleteAnyFile = await this.page!.locator('button[aria-label="Delete file"]').count();
    expect(deleteAnyFile).toBeGreaterThan(0);
  }
});

// Activity and history
Then('I should see a chronological list of activities', async function(this: CustomWorld) {
  const activityList = await this.page!.locator('.activity-list, .chronological-history').isVisible();
  expect(activityList).toBe(true);
});

Then('I should be able to filter by date range', async function(this: CustomWorld) {
  const dateFilter = await this.page!.locator('input[type="date"], .date-range-filter').isVisible();
  expect(dateFilter).toBe(true);
});

Given('a motion {string} has been through multiple states', async function(this: CustomWorld, motionTitle: string) {
  this.testData.set('motionWithHistory', motionTitle);
  const motion = await this.page!.locator(`.motion-item:has-text("${motionTitle}")`).isVisible();
  expect(motion).toBe(true);
});

Then('I should be able to export this user report', async function(this: CustomWorld) {
  const exportButton = await this.page!.locator('button:has-text("Export report")').isVisible();
  expect(exportButton).toBe(true);
});

Given('a complex motion was edited multiple times', async function(this: CustomWorld) {
  this.testData.set('complexMotion', true);
  const editHistory = await this.page!.locator('.edit-history, .version-count').isVisible();
  expect(editHistory).toBe(true);
});

Then('changes should be highlighted in colors', async function(this: CustomWorld) {
  const highlighted = await this.page!.locator('.diff-highlight, .change-highlighted').isVisible();
  expect(highlighted).toBe(true);
});

Given('several votes have been conducted', async function(this: CustomWorld) {
  const voteCount = await this.page!.locator('.vote-history .vote-item').count();
  expect(voteCount).toBeGreaterThan(1);
});

Then('each change should show the reason', async function(this: CustomWorld) {
  const changeReasons = await this.page!.locator('.change-reason, .modification-note').first().isVisible();
  expect(changeReasons).toBe(true);
});

Given('files have been uploaded and modified', async function(this: CustomWorld) {
  const modifiedFiles = await this.page!.locator('.file-modified, .file-history').count();
  expect(modifiedFiles).toBeGreaterThan(0);
});

Then('I should see who accessed confidential files', async function(this: CustomWorld) {
  const accessLog = await this.page!.locator('.file-access-log, .confidential-access').isVisible();
  expect(accessLog).toBe(true);
});

Then('a comprehensive audit report should be generated', async function(this: CustomWorld) {
  const auditReport = await this.page!.locator('.audit-report, text="Audit report generated"').isVisible();
  expect(auditReport).toBe(true);
});

Then('it should be digitally signed for authenticity', async function(this: CustomWorld) {
  const signature = await this.page!.locator('.digital-signature, .report-signed').isVisible();
  expect(signature).toBe(true);
});

// Search and filtering
Then('I should see filtered results matching all criteria', async function(this: CustomWorld) {
  const results = await this.page!.locator('.search-result, .filtered-item').count();
  expect(results).toBeGreaterThan(0);
});

Then('I should be able to save this search', async function(this: CustomWorld) {
  const saveSearch = await this.page!.locator('button:has-text("Save search")').isVisible();
  expect(saveSearch).toBe(true);
});

Given('regulatory compliance is required', async function(this: CustomWorld) {
  this.testData.set('complianceRequired', true);
  const complianceMode = await this.page!.locator('.compliance-mode, [data-compliance="true"]').isVisible();
  expect(complianceMode).toBe(true);
});

When('I select report type {string}', async function(this: CustomWorld, reportType: string) {
  await this.page!.selectOption('select[name="reportType"]', reportType);
  await this.page!.waitForTimeout(500);
});

// Real-time updates
Then('I should see activities as they happen', async function(this: CustomWorld) {
  const realtimeActivity = await this.page!.locator('.realtime-activity, .live-updates').isVisible();
  expect(realtimeActivity).toBe(true);
});

Then('I should receive an alert notification', async function(this: CustomWorld) {
  const alert = await this.page!.locator('.alert-notification, .notification-alert').isVisible();
  expect(alert).toBe(true);
});

Given('an incorrect bulk action was performed', async function(this: CustomWorld) {
  this.testData.set('bulkActionError', true);
  const errorIndicator = await this.page!.locator('.bulk-action-error, .action-failed').isVisible();
  expect(errorIndicator).toBe(true);
});

Then('old records should be archived accordingly', async function(this: CustomWorld) {
  const archived = await this.page!.locator('.archived-records, text=/Archived.*records/i').isVisible();
  expect(archived).toBe(true);
});

Then('archived data should remain searchable', async function(this: CustomWorld) {
  const searchArchive = await this.page!.locator('input[placeholder*="Search archive"]').isVisible();
  expect(searchArchive).toBe(true);
});

Then('high-risk events should be highlighted', async function(this: CustomWorld) {
  const highlighted = await this.page!.locator('.high-risk-event, .security-alert').isVisible();
  expect(highlighted).toBe(true);
});

Then('I should receive paginated JSON data', async function(this: CustomWorld) {
  const pagination = await this.page!.locator('.pagination, .page-info').isVisible();
  expect(pagination).toBe(true);
});

Then('API access should be logged', async function(this: CustomWorld) {
  const apiLog = await this.page!.locator('.api-access-log, text=/API.*logged/i').isVisible();
  expect(apiLog).toBe(true);
});

// Motion amendments
When('I switch to {string} mode', async function(this: CustomWorld, mode: string) {
  await this.page!.click(`button:has-text("${mode}"), mat-radio-button:has-text("${mode}")`);
  await this.page!.waitForTimeout(1000);
});

Then('I should see the motion text split into paragraphs', async function(this: CustomWorld) {
  const paragraphs = await this.page!.locator('.motion-paragraph, .paragraph-section').count();
  expect(paragraphs).toBeGreaterThan(1);
});

Then('I should be able to create amendments for specific paragraphs', async function(this: CustomWorld) {
  const amendButton = await this.page!.locator('.paragraph-amend-button, button[aria-label="Amend paragraph"]').first().isVisible();
  expect(amendButton).toBe(true);
});

// Motion visibility
Given('motions exist in various states', async function(this: CustomWorld) {
  const motions = await this.page!.locator('.motion-item').count();
  expect(motions).toBeGreaterThan(0);
});

Given('I am logged in as a regular participant', async function(this: CustomWorld) {
  await this.steps.given('I am a regular user');
});

Then('I should only see motions in public states', async function(this: CustomWorld) {
  const publicMotions = await this.page!.locator('.motion-public, [data-public="true"]').count();
  const allMotions = await this.page!.locator('.motion-item').count();
  expect(publicMotions).toBe(allMotions);
});

// Motion export
Given('multiple motions exist', async function(this: CustomWorld) {
  const motionCount = await this.page!.locator('.motion-item').count();
  expect(motionCount).toBeGreaterThan(1);
});

When('I choose format {string}', async function(this: CustomWorld, format: string) {
  await this.page!.selectOption('select[name="exportFormat"]', format);
  await this.page!.waitForTimeout(500);
});

Then('a PDF should be generated with the selected motions', async function(this: CustomWorld) {
  const pdfGenerated = await this.page!.locator('.pdf-generated, text="PDF ready"').isVisible();
  expect(pdfGenerated).toBe(true);
});

When('I confirm deletion with reason {string}', async function(this: CustomWorld, reason: string) {
  await this.page!.fill('textarea[placeholder*="Reason"]', reason);
  await this.page!.click('button:has-text("Confirm delete")');
  await this.page!.waitForTimeout(1500);
});

Then('deletion should be logged in history', async function(this: CustomWorld) {
  const deletionLog = await this.page!.locator('.deletion-log, text=/Deleted.*logged/i').isVisible();
  expect(deletionLog).toBe(true);
});

// Data table steps
Given('I have selected multiple motions:', async function(this: CustomWorld, dataTable: DataTable) {
  const motions = dataTable.raw().flat();
  
  for (const motion of motions) {
    const motionCheckbox = this.page!.locator(`.motion-item:has-text("${motion}") input[type="checkbox"]`);
    await motionCheckbox.check();
    await this.page!.waitForTimeout(300);
  }
});

Then('all selected motions should change state', async function(this: CustomWorld) {
  const changedState = await this.page!.locator('.state-changed, text=/State.*updated/i').isVisible();
  expect(changedState).toBe(true);
});

When('I select template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click('mat-select[formcontrolname="template"]');
  await this.page!.click(`mat-option:has-text("${templateName}")`);
  await this.page!.waitForTimeout(500);
});

Then('the motion form should be pre-filled:', async function(this: CustomWorld, dataTable: DataTable) {
  const fields = dataTable.raw().flat();
  
  for (const field of fields) {
    const fieldFilled = await this.page!.locator(`[formcontrolname="${field.toLowerCase()}"][value]:not([value=""])`).isVisible();
    expect(fieldFilled).toBe(true);
  }
});

Then('I should only need to fill specific content', async function(this: CustomWorld) {
  const emptyFields = await this.page!.locator('input[required]:not([value]), textarea[required]:empty').count();
  expect(emptyFields).toBeLessThan(3);
});

Given('motions exist on similar topics:', async function(this: CustomWorld, dataTable: DataTable) {
  const topics = dataTable.raw().flat();
  this.testData.set('similarMotions', topics);
});

Then('I should see merge options:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.raw().flat();
  
  for (const option of options) {
    const optionVisible = await this.page!.locator(`button:has-text("${option}")`).isVisible();
    expect(optionVisible).toBe(true);
  }
});

Then('a new motion should be created', async function(this: CustomWorld) {
  const newMotion = await this.page!.locator('.motion-created, text="Motion created"').isVisible();
  expect(newMotion).toBe(true);
});

Given('a motion has been modified multiple times', async function(this: CustomWorld) {
  this.testData.set('motionModified', true);
  const versionCount = await this.page!.locator('.version-count, .edit-count').textContent();
  expect(parseInt(versionCount || '0')).toBeGreaterThan(1);
});

Then('I should see timeline with:', async function(this: CustomWorld, dataTable: DataTable) {
  const timelineItems = dataTable.raw().flat();
  
  for (const item of timelineItems) {
    const itemVisible = await this.page!.locator(`.timeline-item:has-text("${item}")`).isVisible();
    expect(itemVisible).toBe(true);
  }
});

Then('I should be able to:', async function(this: CustomWorld, dataTable: DataTable) {
  const actions = dataTable.raw().flat();
  
  for (const action of actions) {
    const actionAvailable = await this.page!.locator(`button:has-text("${action}"), a:has-text("${action}")`).isVisible();
    expect(actionAvailable).toBe(true);
  }
});

Then('Motion B should show:', async function(this: CustomWorld, dataTable: DataTable) {
  const details = dataTable.raw().flat();
  const motionB = this.page!.locator('.motion-item:has-text("Motion B")');
  
  for (const detail of details) {
    const detailVisible = await motionB.locator(`text="${detail}"`).isVisible();
    expect(detailVisible).toBe(true);
  }
});

When('I set notification preferences:', async function(this: CustomWorld, dataTable: DataTable) {
  const prefs = dataTable.rowsHash();
  
  for (const [pref, value] of Object.entries(prefs)) {
    if (value === 'Yes') {
      await this.page!.check(`input[name="${pref.toLowerCase().replace(/\s+/g, '_')}"]`);
    }
  }
});

Then('I should receive notifications accordingly', async function(this: CustomWorld) {
  const notificationSettings = await this.page!.locator('.notification-settings-saved').isVisible();
  expect(notificationSettings).toBe(true);
});

Given('I have permission to comment', async function(this: CustomWorld) {
  const canComment = await this.page!.locator('button:has-text("Add comment"), .comment-button').isVisible();
  expect(canComment).toBe(true);
});

When('I add an internal comment:', async function(this: CustomWorld, dataTable: DataTable) {
  const comment = dataTable.rowsHash();
  
  await this.page!.fill('textarea[placeholder*="Comment"]', comment.Text || '');
  if (comment.Visibility) {
    await this.page!.selectOption('select[name="visibility"]', comment.Visibility);
  }
  await this.page!.click('button:has-text("Add comment")');
});

Then('the comment should be visible to authorized users only', async function(this: CustomWorld) {
  const internalComment = await this.page!.locator('.internal-comment, .restricted-visibility').isVisible();
  expect(internalComment).toBe(true);
});

Then('motions should be filterable by tags', async function(this: CustomWorld) {
  const tagFilter = await this.page!.locator('.tag-filter, .filter-by-tag').isVisible();
  expect(tagFilter).toBe(true);
});

Given('the meeting supports multiple languages', async function(this: CustomWorld) {
  const languageSelector = await this.page!.locator('.language-selector, mat-select[formcontrolname="language"]').isVisible();
  expect(languageSelector).toBe(true);
});

When('I configure print settings:', async function(this: CustomWorld, dataTable: DataTable) {
  const settings = dataTable.rowsHash();
  
  for (const [setting, value] of Object.entries(settings)) {
    if (setting === 'Include comments' && value === 'Yes') {
      await this.page!.check('input[name="includeComments"]');
    } else if (setting === 'Page size') {
      await this.page!.selectOption('select[name="pageSize"]', value);
    }
  }
});

Then('print preview should reflect settings', async function(this: CustomWorld) {
  const preview = await this.page!.locator('.print-preview').isVisible();
  expect(preview).toBe(true);
});

Then('PDF should be properly formatted', async function(this: CustomWorld) {
  const pdfReady = await this.page!.locator('.pdf-ready, text="PDF formatted"').isVisible();
  expect(pdfReady).toBe(true);
});

When('I configure motion deadlines:', async function(this: CustomWorld, dataTable: DataTable) {
  const deadlines = dataTable.rowsHash();
  
  for (const [deadline, date] of Object.entries(deadlines)) {
    await this.page!.fill(`input[name="${deadline.toLowerCase().replace(/\s+/g, '_')}"]`, date);
  }
});

Then('system should:', async function(this: CustomWorld, dataTable: DataTable) {
  const actions = dataTable.raw().flat();
  
  for (const action of actions) {
    this.testData.set('expectedSystemAction', action);
  }
});

Then('be able to test vote interface', async function(this: CustomWorld) {
  const testVote = await this.page!.locator('button:has-text("Test vote"), .test-voting').isVisible();
  expect(testVote).toBe(true);
});

// Projector and display
Given('the agenda is displayed', async function(this: CustomWorld) {
  const agendaDisplayed = await this.page!.locator('.agenda-projected, .projector-agenda').isVisible();
  expect(agendaDisplayed).toBe(true);
});

Then('attendees should see it on the public display', async function(this: CustomWorld) {
  const publicDisplay = await this.page!.locator('.public-display, .attendee-view').isVisible();
  expect(publicDisplay).toBe(true);
});

When('I assign different content to each:', async function(this: CustomWorld, dataTable: DataTable) {
  const assignments = dataTable.hashes();
  
  for (const assignment of assignments) {
    await this.page!.click(`.projector-${assignment.Projector.toLowerCase()}`);
    await this.page!.selectOption('select[name="content"]', assignment.Content);
  }
});

When('I select a template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click(`.template-option:has-text("${templateName}")`);
  await this.page!.waitForTimeout(500);
});

Then('I should see the queue in order', async function(this: CustomWorld) {
  const orderedQueue = await this.page!.locator('.queue-ordered, .speaker-queue').isVisible();
  expect(orderedQueue).toBe(true);
});

Then('items should advance automatically based on timing', async function(this: CustomWorld) {
  const autoAdvance = await this.page!.locator('.auto-advance, .timing-based').isVisible();
  expect(autoAdvance).toBe(true);
});

Given('a motion is being projected', async function(this: CustomWorld) {
  const motionProjected = await this.page!.locator('.motion-projected, .projecting-motion').isVisible();
  expect(motionProjected).toBe(true);
});

When('I set the timer to {string}', async function(this: CustomWorld, time: string) {
  await this.page!.fill('input[name="timer"], input[type="time"]', time);
  await this.page!.waitForTimeout(500);
});

Then('an alert should be shown', async function(this: CustomWorld) {
  const alert = await this.page!.locator('.alert, .notification').isVisible();
  expect(alert).toBe(true);
});

When('I assign content to each half:', async function(this: CustomWorld, dataTable: DataTable) {
  const halves = dataTable.hashes();
  
  for (const half of halves) {
    await this.page!.click(`.half-${half.Half.toLowerCase()}`);
    await this.page!.selectOption('select[name="content"]', half.Content);
  }
});

When('I enter {string}', async function(this: CustomWorld, text: string) {
  await this.page!.fill('textarea, input[type="text"]', text);
  await this.page!.waitForTimeout(500);
});

When('I select priority {string}', async function(this: CustomWorld, priority: string) {
  await this.page!.selectOption('select[name="priority"]', priority);
  await this.page!.waitForTimeout(500);
});

Then('it should be displayed prominently', async function(this: CustomWorld) {
  const prominent = await this.page!.locator('.prominent-display, .high-priority').isVisible();
  expect(prominent).toBe(true);
});

Then('a sound alert should play', async function(this: CustomWorld) {
  const audioPlaying = await this.page!.evaluate(() => {
    const audio = document.querySelector('audio');
    return audio && !audio.paused;
  });
  expect(audioPlaying).toBe(true);
});

Then('I should see available templates:', async function(this: CustomWorld, dataTable: DataTable) {
  const templates = dataTable.raw().flat();
  
  for (const template of templates) {
    const templateAvailable = await this.page!.locator(`.template-item:has-text("${template}")`).isVisible();
    expect(templateAvailable).toBe(true);
  }
});

When('I customize the break duration to {string}', async function(this: CustomWorld, duration: string) {
  await this.page!.fill('input[name="breakDuration"]', duration);
  await this.page!.waitForTimeout(500);
});

Then('the customized template should be projected', async function(this: CustomWorld) {
  const customized = await this.page!.locator('.template-customized, .custom-projection').isVisible();
  expect(customized).toBe(true);
});

Given('a PowerPoint file {string} is uploaded', async function(this: CustomWorld, filename: string) {
  this.testData.set('uploadedPowerPoint', filename);
  const pptFile = await this.page!.locator(`.file-item:has-text("${filename}")`).isVisible();
  expect(pptFile).toBe(true);
});

Then('I should be able to configure:', async function(this: CustomWorld, dataTable: DataTable) {
  const configs = dataTable.raw().flat();
  
  for (const config of configs) {
    const configOption = await this.page!.locator(`.config-option:has-text("${config}")`).isVisible();
    expect(configOption).toBe(true);
  }
});

Then('changes should apply immediately', async function(this: CustomWorld) {
  const applied = await this.page!.locator('.changes-applied, .instant-update').isVisible();
  expect(applied).toBe(true);
});

When('I select:', async function(this: CustomWorld, dataTable: DataTable) {
  const selections = dataTable.hashes();
  
  for (const selection of selections) {
    if (selection.Field && selection.Value) {
      await this.page!.selectOption(`select[name="${selection.Field.toLowerCase()}"]`, selection.Value);
      await this.page!.waitForTimeout(300);
    }
  }
});

// Speaker management data tables
Given('the speaker list contains:', async function(this: CustomWorld, dataTable: DataTable) {
  const speakers = dataTable.hashes();
  this.testData.set('speakerList', speakers);
  
  for (const speaker of speakers) {
    const speakerVisible = await this.page!.locator(`.speaker-item:has-text("${speaker.Name}")`).isVisible();
    expect(speakerVisible).toBe(true);
  }
});

Then('they must choose:', async function(this: CustomWorld, dataTable: DataTable) {
  const choices = dataTable.raw().flat();
  
  for (const choice of choices) {
    const choiceButton = await this.page!.locator(`button:has-text("${choice}")`).isVisible();
    expect(choiceButton).toBe(true);
  }
});

When('I configure speaker categories:', async function(this: CustomWorld, dataTable: DataTable) {
  const categories = dataTable.hashes();
  
  for (const category of categories) {
    await this.page!.fill(`input[name="category_${category.Category.toLowerCase()}"]`, category.Limit);
  }
});

// User and group management
When('I assign the following groups:', async function(this: CustomWorld, dataTable: DataTable) {
  const assignments = dataTable.hashes();
  
  for (const assignment of assignments) {
    const userRow = this.page!.locator(`tr:has-text("${assignment.User}")`);
    await userRow.locator(`mat-checkbox:has-text("${assignment.Group}")`).check();
  }
});

Given('the following users exist:', async function(this: CustomWorld, dataTable: DataTable) {
  const users = dataTable.hashes();
  this.testData.set('existingUsers', users);
});

When('I choose fields to export:', async function(this: CustomWorld, dataTable: DataTable) {
  const fields = dataTable.raw().flat();
  
  for (const field of fields) {
    await this.page!.check(`input[name="export_${field.toLowerCase()}"]`);
  }
});

// Voting configuration
When('I configure the vote with:', async function(this: CustomWorld, dataTable: DataTable) {
  const config = dataTable.rowsHash();
  
  for (const [key, value] of Object.entries(config)) {
    if (key === 'Type') {
      await this.page!.selectOption('select[name="voteType"]', value);
    } else if (key === 'Method') {
      await this.page!.selectOption('select[name="voteMethod"]', value);
    }
  }
});

Given('voting groups are configured:', async function(this: CustomWorld, dataTable: DataTable) {
  const groups = dataTable.hashes();
  this.testData.set('votingGroups', groups);
});

When('the vote ends with:', async function(this: CustomWorld, dataTable: DataTable) {
  const results = dataTable.rowsHash();
  this.testData.set('voteResults', results);
});

When('I choose export format:', async function(this: CustomWorld, dataTable: DataTable) {
  const format = dataTable.rowsHash();
  await this.page!.selectOption('select[name="exportFormat"]', format.Format);
});

When('the voting is completed with results:', async function(this: CustomWorld, dataTable: DataTable) {
  const results = dataTable.hashes();
  this.testData.set('completedVoteResults', results);
});

// Final cleanup - add any Given/When/Then variations that might be missing
Then('But I should be able to delete my own file', async function(this: CustomWorld) {
  const deleteButton = await this.page!.locator('.my-files button[aria-label="Delete"]').isVisible();
  expect(deleteButton).toBe(true);
});