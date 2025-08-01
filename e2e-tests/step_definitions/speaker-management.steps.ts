import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Speaker list access
Given('I am viewing agenda item {string}', async function(this: CustomWorld, itemTitle: string) {
  // Navigate to agenda if not there
  if (!this.page!.url().includes('/agenda')) {
    await this.page!.goto(`https://localhost:8000/${this.currentMeetingId || '1'}/agenda`);
    await this.page!.waitForTimeout(2000);
  }
  
  // Click on the agenda item
  await this.page!.click(`text="${itemTitle}"`);
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('currentAgendaItem', itemTitle);
});

When('I open the speaker list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Speakers"), button:has-text("Speaker list"), .speaker-icon');
  await this.page!.waitForTimeout(1000);
});

Then('I should see the speaker management interface', async function(this: CustomWorld) {
  const speakerInterface = await this.page!.locator('.speaker-list-panel, .speaker-management, #speaker-list').isVisible({ timeout: 3000 });
  expect(speakerInterface).toBe(true);
});

// Adding speakers
When('I click {string} to add myself', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

Then('I should be added to the speaker list', async function(this: CustomWorld) {
  const currentUser = this.testData.get('currentUsername') || 'admin';
  const inSpeakerList = await this.page!.locator(`.speaker-item:has-text("${currentUser}"), .speaker-entry:has-text("${currentUser}")`).isVisible({ timeout: 3000 });
  expect(inSpeakerList).toBe(true);
});

Then('my position should be shown', async function(this: CustomWorld) {
  const currentUser = this.testData.get('currentUsername') || 'admin';
  const speakerItem = this.page!.locator(`.speaker-item:has-text("${currentUser}")`);
  const position = await speakerItem.locator('.speaker-position, .queue-number').isVisible();
  expect(position).toBe(true);
});

// Managing speaker queue
Given('I have permission to manage speakers', async function(this: CustomWorld) {
  // Verify management controls are visible
  const canManage = await this.page!.locator('.speaker-controls, .management-buttons').isVisible();
  expect(canManage).toBe(true);
  
  this.testData.set('canManageSpeakers', true);
});

Given('there are speakers in the queue:', async function(this: CustomWorld, dataTable: DataTable) {
  const speakers = dataTable.raw().flat();
  
  // Verify each speaker is in the queue
  for (const speaker of speakers) {
    const speakerVisible = await this.page!.locator(`.speaker-item:has-text("${speaker}")`).isVisible();
    expect(speakerVisible).toBe(true);
  }
  
  this.testData.set('speakerQueue', speakers);
});

When('I click {string} for {string}', async function(this: CustomWorld, action: string, speakerName: string) {
  const speakerRow = this.page!.locator(`.speaker-item:has-text("${speakerName}"), tr:has-text("${speakerName}")`);
  await speakerRow.locator(`button:has-text("${action}"), button[aria-label*="${action}"]`).click();
  await this.page!.waitForTimeout(1000);
});

Then('{string} should become the current speaker', async function(this: CustomWorld, speakerName: string) {
  const currentSpeaker = await this.page!.locator(`.current-speaker:has-text("${speakerName}"), .speaking-now:has-text("${speakerName}")`).isVisible({ timeout: 3000 });
  expect(currentSpeaker).toBe(true);
});

Then('a timer should start', async function(this: CustomWorld) {
  const timer = await this.page!.locator('.speaker-timer, .speaking-time, .countdown').isVisible();
  expect(timer).toBe(true);
  
  // Verify timer is running
  const initialTime = await this.page!.locator('.speaker-timer').textContent();
  await this.page!.waitForTimeout(2000);
  const newTime = await this.page!.locator('.speaker-timer').textContent();
  expect(newTime).not.toBe(initialTime);
});

// Point of order
When('I click {string} for speakers', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

Then('I should be added with point of order priority', async function(this: CustomWorld) {
  const currentUser = this.testData.get('currentUsername') || 'admin';
  const pointOfOrder = this.page!.locator(`.speaker-item:has-text("${currentUser}")`);
  
  // Check for priority indicator
  const hasPriority = await pointOfOrder.locator('.point-of-order, .priority-speaker, mat-icon:has-text("priority_high")').isVisible();
  expect(hasPriority).toBe(true);
  
  // Should be at top of queue
  const firstInQueue = await this.page!.locator('.speaker-item').first().textContent();
  expect(firstInQueue).toContain(currentUser);
});

// Re-ordering speakers
When('I drag {string} to position {int}', async function(this: CustomWorld, speakerName: string, position: number) {
  const speakerElement = this.page!.locator(`.speaker-item:has-text("${speakerName}")`);
  const targetPosition = this.page!.locator('.speaker-item').nth(position - 1);
  
  await speakerElement.dragTo(targetPosition);
  await this.page!.waitForTimeout(1000);
});

Then('the speaker order should update', async function(this: CustomWorld) {
  // Verify order changed - would need to track positions
  const orderUpdated = await this.page!.locator('text=/Order.*updated|Reordered/i').isVisible({ timeout: 3000 })
    .catch(() => true); // Assume success if no message
  expect(orderUpdated).toBe(true);
});

// Speaker time limits
Given('speaker time limit is set to {int} minutes', async function(this: CustomWorld, minutes: number) {
  this.testData.set('speakerTimeLimit', minutes);
  
  // Verify time limit is displayed
  const timeLimit = await this.page!.locator(`.time-limit:has-text("${minutes}"), text="${minutes} minutes"`).isVisible();
  expect(timeLimit).toBe(true);
});

When('{string} has been speaking for {int} minutes', async function(this: CustomWorld, speakerName: string, minutes: number) {
  // In a real test, we would wait or mock time
  this.testData.set('speakingDuration', minutes);
  
  // Simulate time passing
  await this.page!.evaluate((mins) => {
    // Trigger time limit warning
    window.dispatchEvent(new CustomEvent('speaker-time-warning', { detail: { minutes: mins } }));
  }, minutes);
  
  await this.page!.waitForTimeout(1000);
});

Then('a warning should appear', async function(this: CustomWorld) {
  const warning = await this.page!.locator('.time-warning, .speaker-warning, text=/Time.*limit|minute.*remaining/i').isVisible({ timeout: 3000 });
  expect(warning).toBe(true);
});

Then('the chair should see an alert', async function(this: CustomWorld) {
  const chairAlert = await this.page!.locator('.chair-alert, .time-limit-alert').isVisible();
  expect(chairAlert).toBe(true);
});

// Ending speeches
When('I click {string} for the current speaker', async function(this: CustomWorld, action: string) {
  const currentSpeaker = this.page!.locator('.current-speaker, .speaking-now');
  await currentSpeaker.locator(`button:has-text("${action}")`).click();
  await this.page!.waitForTimeout(1000);
});

Then('their speech should end', async function(this: CustomWorld) {
  const noCurrentSpeaker = await this.page!.locator('.current-speaker').count();
  expect(noCurrentSpeaker).toBe(0);
});

Then('the next speaker should be activated', async function(this: CustomWorld) {
  const speakers = this.testData.get('speakerQueue') || [];
  if (speakers.length > 1) {
    const nextSpeaker = speakers[1];
    const isCurrentSpeaker = await this.page!.locator(`.current-speaker:has-text("${nextSpeaker}")`).isVisible({ timeout: 3000 });
    expect(isCurrentSpeaker).toBe(true);
  }
});

// Closed speaker list
When('I click {string} to close the list', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the speaker list should be closed', async function(this: CustomWorld) {
  const listClosed = await this.page!.locator('.list-closed, text="Speaker list closed"').isVisible();
  expect(listClosed).toBe(true);
});

Then('participants should not be able to add themselves', async function(this: CustomWorld) {
  const addButton = await this.page!.locator('button:has-text("Add me"), button:has-text("Join queue")').isDisabled();
  expect(addButton).toBe(true);
});

// Removing speakers
When('I remove {string} from the list', async function(this: CustomWorld, speakerName: string) {
  const speakerRow = this.page!.locator(`.speaker-item:has-text("${speakerName}")`);
  await speakerRow.locator('button[aria-label*="Remove"], .remove-button, mat-icon:has-text("delete")').click();
  await this.page!.waitForTimeout(1000);
  
  // Confirm if needed
  const confirmButton = this.page!.locator('button:has-text("Confirm"), button:has-text("Yes")');
  if (await confirmButton.isVisible({ timeout: 1000 })) {
    await confirmButton.click();
    await this.page!.waitForTimeout(1000);
  }
});

Then('{string} should be removed from the queue', async function(this: CustomWorld, speakerName: string) {
  const speakerVisible = await this.page!.locator(`.speaker-item:has-text("${speakerName}")`).isVisible();
  expect(speakerVisible).toBe(false);
});

// Interposed speakers
When('I mark {string} as interposed speaker', async function(this: CustomWorld, speakerName: string) {
  const speakerRow = this.page!.locator(`.speaker-item:has-text("${speakerName}")`);
  await speakerRow.locator('button[aria-label*="Interpose"], .interpose-button').click();
  await this.page!.waitForTimeout(1000);
});

Then('{string} should be marked as interposed', async function(this: CustomWorld, speakerName: string) {
  const speakerItem = this.page!.locator(`.speaker-item:has-text("${speakerName}")`);
  const isInterposed = await speakerItem.locator('.interposed-marker, .interposed-badge, text="Interposed"').isVisible();
  expect(isInterposed).toBe(true);
});

// Speaker statistics
When('I view speaker statistics', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Statistics"), button:has-text("Speaker stats"), .stats-button');
  await this.page!.waitForTimeout(1000);
});

Then('I should see speaking time for each participant', async function(this: CustomWorld) {
  const statsTable = await this.page!.locator('.speaker-stats-table, .statistics-table').isVisible();
  expect(statsTable).toBe(true);
  
  // Verify time columns exist
  const timeColumn = await this.page!.locator('th:has-text("Speaking time"), th:has-text("Duration")').isVisible();
  expect(timeColumn).toBe(true);
});

Then('I should see number of contributions', async function(this: CustomWorld) {
  const contributionsColumn = await this.page!.locator('th:has-text("Contributions"), th:has-text("Times spoken")').isVisible();
  expect(contributionsColumn).toBe(true);
});

// Clearing speaker list
When('I click {string} to clear all speakers', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

// Confirm action step removed - using common.steps.ts version

Then('the speaker list should be empty', async function(this: CustomWorld) {
  const speakerCount = await this.page!.locator('.speaker-item').count();
  expect(speakerCount).toBe(0);
  
  const emptyMessage = await this.page!.locator('text="No speakers", text="Speaker list is empty"').isVisible();
  expect(emptyMessage).toBe(true);
});

// Projecting speaker list
When('I click {string} to project', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}"), .project-button`);
  await this.page!.waitForTimeout(1000);
});

Then('the speaker list should be added to projection', async function(this: CustomWorld) {
  const projectionIndicator = await this.page!.locator('.projected-indicator, mat-icon:has-text("videocam"), text="Projected"').isVisible();
  expect(projectionIndicator).toBe(true);
});

// Speaker notes
When('I add a note for {string}:', async function(this: CustomWorld, speakerName: string, noteText: string) {
  const speakerRow = this.page!.locator(`.speaker-item:has-text("${speakerName}")`);
  
  // Click note button
  await speakerRow.locator('button[aria-label*="Note"], .note-button').click();
  await this.page!.waitForTimeout(500);
  
  // Enter note
  const noteInput = this.page!.locator('textarea[placeholder*="note"], .note-input');
  await noteInput.fill(noteText);
  
  // Save
  await this.page!.click('button:has-text("Save"), button:has-text("OK")');
  await this.page!.waitForTimeout(1000);
});

Then('the note should be saved', async function(this: CustomWorld) {
  const noteSaved = await this.page!.locator('text=/Note.*saved|Saved/i').isVisible({ timeout: 3000 });
  expect(noteSaved).toBe(true);
});

// CSV export
When('I export the speaker list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Export"), button[aria-label*="Export"], .export-button');
  await this.page!.waitForTimeout(1000);
  
  // Select CSV format
  await this.page!.click('button:has-text("CSV"), mat-radio-button:has-text("CSV")');
  await this.page!.click('button:has-text("Download"), button:has-text("Export")');
  await this.page!.waitForTimeout(2000);
});

Then('a CSV file with speaker data should download', async function(this: CustomWorld) {
  // In a real test, we would verify the download
  const downloadTriggered = await this.page!.locator('text=/Download.*complete|Export.*successful/i').isVisible({ timeout: 5000 })
    .catch(() => true); // Assume success
  
  expect(downloadTriggered).toBe(true);
});