import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Removed duplicate - use generic 'When I click {string}' from generic-ui.steps.ts

When('I name the group {string}', async function(this: CustomWorld, groupName: string) {
  await this.page!.fill('input[placeholder*="Group name"], input[formcontrolname="groupName"]', groupName);
  await this.page!.waitForTimeout(500);
});

// Removed duplicate - use 'I add participants:' from chat-messaging.steps.ts

When('I create the group', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Create"), button:has-text("Create group")');
  await this.page!.waitForTimeout(1500);
});

// Meeting templates
When('I use meeting template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click('button:has-text("Use template"), mat-select[formcontrolname="template"]');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`mat-option:has-text("${templateName}"), .template-option:has-text("${templateName}")`);
  await this.page!.waitForTimeout(1000);
});

Then('meeting should be pre-configured', async function(this: CustomWorld) {
  // Check that fields are pre-filled
  const nameField = await this.page!.locator('input[formcontrolname="name"]').inputValue();
  expect(nameField).not.toBe('');
  
  // Check that agenda items exist
  const agendaItems = await this.page!.locator('.agenda-item-preview').count();
  expect(agendaItems).toBeGreaterThan(0);
});

// Meeting permissions
When('I set meeting permissions:', async function(this: CustomWorld, dataTable: any) {
  const permissions = dataTable.hashes();
  
  for (const permission of permissions) {
    const role = permission['Role'];
    const canDo = permission['Can'];
    
    // Find role section
    const roleSection = this.page!.locator(`.role-section:has-text("${role}")`);
    
    // Toggle permission
    await roleSection.locator(`mat-checkbox:has-text("${canDo}")`).click();
    await this.page!.waitForTimeout(300);
  }
});

// Meeting scheduling
When('I schedule the meeting for {string}', async function(this: CustomWorld, dateTime: string) {
  // Parse date and time
  const [date, time] = dateTime.split(' at ');
  
  // Set date
  await this.page!.fill('input[formcontrolname="date"], input[type="date"]', date);
  await this.page!.waitForTimeout(500);
  
  // Set time if provided
  if (time) {
    await this.page!.fill('input[formcontrolname="time"], input[type="time"]', time);
    await this.page!.waitForTimeout(500);
  }
});

Then('meeting should appear in calendar', async function(this: CustomWorld) {
  // Navigate to calendar view
  await this.page!.click('button:has-text("Calendar"), mat-tab-label:has-text("Calendar")');
  await this.page!.waitForTimeout(1000);
  
  const meetingInCalendar = await this.page!.locator('.calendar-event, .meeting-scheduled').isVisible();
  expect(meetingInCalendar).toBe(true);
});

// Meeting invitations
When('I invite external participants', async function(this: CustomWorld, dataTable: any) {
  const emails = dataTable.raw().flat();
  
  await this.page!.click('button:has-text("Invite external"), button:has-text("Add external")');
  await this.page!.waitForTimeout(1000);
  
  for (const email of emails) {
    await this.page!.fill('input[type="email"], input[placeholder*="Email"]', email);
    await this.page!.click('button:has-text("Add")');
    await this.page!.waitForTimeout(500);
  }
});

Then('invitation emails should be sent', async function(this: CustomWorld) {
  const emailsSent = await this.page!.locator('text=/Invitations.*sent|Emails.*sent/i').isVisible({ timeout: 3000 });
  expect(emailsSent).toBe(true);
});

// Meeting recording
Given('meeting recording is enabled', async function(this: CustomWorld) {
  const recordingEnabled = await this.page!.locator('.recording-indicator, mat-icon:has-text("fiber_manual_record")').isVisible();
  expect(recordingEnabled).toBe(true);
  
  this.testData.set('recordingEnabled', true);
});

When('I start recording', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start recording"), button[aria-label="Record"]');
  await this.page!.waitForTimeout(2000);
});

Then('meeting should be recorded', async function(this: CustomWorld) {
  const recording = await this.page!.locator('.recording-active, text=/Recording.*in.*progress/i').isVisible();
  expect(recording).toBe(true);
});

// Meeting documents
When('I upload meeting documents:', async function(this: CustomWorld, dataTable: any) {
  const documents = dataTable.raw().flat();
  
  for (const doc of documents) {
    // This would normally use actual file upload
    await this.page!.click('button:has-text("Upload document"), button:has-text("Add file")');
    await this.page!.waitForTimeout(1000);
    
    // Simulate file selection
    const fileInput = this.page!.locator('input[type="file"]');
    await fileInput.setInputFiles(`/tmp/${doc}`);
    await this.page!.waitForTimeout(1500);
  }
});

Then('documents should be available to participants', async function(this: CustomWorld) {
  const documentsSection = await this.page!.locator('.meeting-documents, .file-list').isVisible();
  expect(documentsSection).toBe(true);
  
  const fileCount = await this.page!.locator('.document-item, .file-item').count();
  expect(fileCount).toBeGreaterThan(0);
});

// Meeting roles
When('I assign {string} as {string}', async function(this: CustomWorld, userName: string, role: string) {
  // Find user row
  const userRow = this.page!.locator(`tr:has-text("${userName}"), .participant-row:has-text("${userName}")`);
  
  // Click role selector
  await userRow.locator('mat-select, .role-selector').click();
  await this.page!.waitForTimeout(500);
  
  // Select role
  await this.page!.click(`mat-option:has-text("${role}")`);
  await this.page!.waitForTimeout(1000);
});

Then('{string} should have {string} permissions', async function(this: CustomWorld, userName: string, role: string) {
  const userRow = this.page!.locator(`tr:has-text("${userName}")`);
  const roleCell = await userRow.locator(`td:has-text("${role}")`).isVisible();
  expect(roleCell).toBe(true);
});

// Meeting status
When('I set meeting status to {string}', async function(this: CustomWorld, status: string) {
  await this.page!.click('mat-select[formcontrolname="status"], .status-selector');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`mat-option:has-text("${status}")`);
  await this.page!.waitForTimeout(1000);
});

Then('meeting should show as {string}', async function(this: CustomWorld, status: string) {
  const statusBadge = await this.page!.locator(`.status-badge:has-text("${status}"), .meeting-status:has-text("${status}")`).isVisible();
  expect(statusBadge).toBe(true);
});

// Meeting notes
When('I add meeting notes {string}', async function(this: CustomWorld, notes: string) {
  await this.page!.click('mat-tab-label:has-text("Notes"), button:has-text("Notes")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('textarea[placeholder*="Meeting notes"], .notes-editor', notes);
  await this.page!.waitForTimeout(500);
  
  // Auto-save or manual save
  const saveButton = await this.page!.locator('button:has-text("Save notes")').isVisible();
  if (saveButton) {
    await this.page!.click('button:has-text("Save notes")');
    await this.page!.waitForTimeout(1000);
  }
});

Then('notes should be saved', async function(this: CustomWorld) {
  const notesSaved = await this.page!.locator('text=/Notes.*saved|Auto-saved/i').isVisible();
  expect(notesSaved).toBe(true);
});

// Meeting lockdown
When('I enable meeting lockdown', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Lockdown"), mat-checkbox:has-text("Lock meeting")');
  await this.page!.waitForTimeout(1000);
});

Then('only authorized users can join', async function(this: CustomWorld) {
  const lockdownActive = await this.page!.locator('.lockdown-active, text=/Meeting.*locked/i').isVisible();
  expect(lockdownActive).toBe(true);
});

// Meeting breakout rooms
When('I create {int} breakout rooms', async function(this: CustomWorld, count: number) {
  await this.page!.click('button:has-text("Breakout rooms"), button:has-text("Create breakouts")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('input[formcontrolname="roomCount"], input[type="number"]', count.toString());
  await this.page!.waitForTimeout(500);
  
  await this.page!.click('button:has-text("Create rooms")');
  await this.page!.waitForTimeout(1500);
});

When('I assign participants randomly', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Random assignment"), button:has-text("Shuffle")');
  await this.page!.waitForTimeout(1000);
});

Then('participants should be distributed across rooms', async function(this: CustomWorld) {
  const rooms = await this.page!.locator('.breakout-room').count();
  expect(rooms).toBeGreaterThan(0);
  
  // Check each room has participants
  for (let i = 0; i < rooms; i++) {
    const participants = await this.page!.locator('.breakout-room').nth(i).locator('.participant').count();
    expect(participants).toBeGreaterThan(0);
  }
});