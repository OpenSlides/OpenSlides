import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Time-based operations
Then('the next person should begin automatically', async function(this: CustomWorld) {
  await this.page!.waitForTimeout(2000);
  const nextSpeakerActive = await this.page!.locator('.current-speaker, .speaker-active').isVisible();
  expect(nextSpeakerActive).toBe(true);
});

Then('the order should update', async function(this: CustomWorld) {
  const orderUpdated = await this.page!.locator('.order-updated, .queue-reordered').isVisible();
  expect(orderUpdated).toBe(true);
});

Then('the results should be visible to all participants', async function(this: CustomWorld) {
  const resultsPublic = await this.page!.locator('.results-public, .results-visible').isVisible();
  expect(resultsPublic).toBe(true);
});

Then('the system should calculate the majority correctly', async function(this: CustomWorld) {
  const majorityCalculated = await this.page!.locator('.majority-calculated, .vote-threshold').isVisible();
  expect(majorityCalculated).toBe(true);
});

Then('the user should be marked as inactive', async function(this: CustomWorld) {
  const userInactive = await this.page!.locator('.user-inactive, [data-status="inactive"]').isVisible();
  expect(userInactive).toBe(true);
});

Then('the user should have the correct group memberships', async function(this: CustomWorld) {
  const groups = this.testData.get('expectedGroups') || [];
  
  for (const group of groups) {
    const hasGroup = await this.page!.locator(`.user-group:has-text("${group}")`).isVisible();
    expect(hasGroup).toBe(true);
  }
});

Then('the vote should be created in {string} state', async function(this: CustomWorld, state: string) {
  const voteState = await this.page!.locator(`.vote-state:has-text("${state}")`).isVisible();
  expect(voteState).toBe(true);
});

Then('the vote should be marked {string}', async function(this: CustomWorld, marking: string) {
  const voteMark = await this.page!.locator(`.vote-marking:has-text("${marking}")`).isVisible();
  expect(voteMark).toBe(true);
});

Then('the vote should be marked as {string}', async function(this: CustomWorld, status: string) {
  const voteStatus = await this.page!.locator(`.vote-status:has-text("${status}")`).isVisible();
  expect(voteStatus).toBe(true);
});

Then('the vote should transition to {string} state', async function(this: CustomWorld, newState: string) {
  await this.page!.waitForTimeout(1000);
  const transitioned = await this.page!.locator(`.vote-state:has-text("${newState}")`).isVisible();
  expect(transitioned).toBe(true);
});

Then('they should be added to the speaker list', async function(this: CustomWorld) {
  const addedToList = await this.page!.locator('.speaker-added, text=/Added.*to.*list/i').isVisible();
  expect(addedToList).toBe(true);
});

Then('time should turn red', async function(this: CustomWorld) {
  const timerRed = await this.page!.locator('.timer-warning, .time-critical').isVisible();
  expect(timerRed).toBe(true);
});

Then('timer should add {int} minute', async function(this: CustomWorld, minutes: number) {
  const timerExtended = await this.page!.locator('.timer-extended, text=/Extended.*minute/i').isVisible();
  expect(timerExtended).toBe(true);
});

Then('two separate lists should appear', async function(this: CustomWorld) {
  const listCount = await this.page!.locator('.speaker-list-container').count();
  expect(listCount).toBe(2);
});

Then('voting data should be exported correctly', async function(this: CustomWorld) {
  const exportSuccess = await this.page!.locator('.export-success, text="Export complete"').isVisible();
  expect(exportSuccess).toBe(true);
});

// When conditions for speaker management
When('{int}:{int} have elapsed', async function(this: CustomWorld, minutes: number, seconds: number) {
  const elapsedTime = minutes * 60 + seconds;
  this.testData.set('elapsedSeconds', elapsedTime);
  
  // Wait or simulate time passage
  await this.page!.waitForTimeout(2000);
});

When('{int}:{int} minutes pass', async function(this: CustomWorld, minutes: number, seconds: number) {
  const totalSeconds = minutes * 60 + seconds;
  await this.page!.waitForTimeout(Math.min(totalSeconds * 1000, 5000)); // Max 5 seconds wait
});

When('{word} raises a {string}', async function(this: CustomWorld, speaker: string, intervention: string) {
  this.testData.set('interventionRaised', { speaker, type: intervention });
  
  // Simulate intervention
  await this.page!.click(`button:has-text("${intervention}")`);
});

When('I approve the intervention', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Approve"), button:has-text("Accept intervention")');
  await this.page!.waitForTimeout(1000);
});

When('I click {string} for the motion', async function(this: CustomWorld, buttonText: string) {
  const motion = this.page!.locator('.motion-item').first();
  await motion.locator(`button:has-text("${buttonText}")`).click();
  await this.page!.waitForTimeout(1000);
});

When('I click notes icon for a speaker', async function(this: CustomWorld) {
  const speaker = this.page!.locator('.speaker-item').first();
  await speaker.locator('[aria-label="Notes"], .notes-icon').click();
});

When('I complete phase {int} voting', async function(this: CustomWorld, phase: number) {
  this.testData.set('completedPhase', phase);
  
  // Complete voting phase
  await this.page!.click('button:has-text("Complete phase"), button:has-text("Finish voting")');
  await this.page!.waitForTimeout(2000);
});

When('I configure it with method {string}', async function(this: CustomWorld, method: string) {
  await this.page!.selectOption('select[name="votingMethod"]', method);
  await this.page!.waitForTimeout(500);
});

When('I configure phase {int} based on phase {int} outcomes', async function(this: CustomWorld, phase2: number, phase1: number) {
  // Configure second phase based on first phase results
  await this.page!.click('button:has-text("Configure next phase")');
  await this.page!.waitForTimeout(1000);
});

When('I drag {string} to position {int}', async function(this: CustomWorld, name: string, position: number) {
  const source = this.page!.locator(`.speaker-item:has-text("${name}")`);
  const target = this.page!.locator(`.speaker-position-${position}, .speaker-item`).nth(position - 1);
  
  await source.dragTo(target);
  await this.page!.waitForTimeout(1000);
});

When('I enter {string} in the search field', async function(this: CustomWorld, searchTerm: string) {
  await this.page!.fill('input[placeholder*="Search"], input[type="search"]', searchTerm);
  await this.page!.waitForTimeout(500);
});

When('I export speaker data', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Export speakers"), button[aria-label="Export"]');
  await this.page!.waitForTimeout(2000);
});

When('I hover over a projectable item', async function(this: CustomWorld) {
  const item = this.page!.locator('.projectable-item, [data-projectable="true"]').first();
  await item.hover();
  await this.page!.waitForTimeout(500);
});

When('I manage speaker list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Manage speakers"), button[aria-label="Speaker management"]');
  await this.page!.waitForTimeout(1000);
});

When('I mark {string} as {string}', async function(this: CustomWorld, speaker: string, marking: string) {
  const speakerRow = this.page!.locator(`.speaker-item:has-text("${speaker}")`);
  await speakerRow.locator(`button:has-text("${marking}")`).click();
  await this.page!.waitForTimeout(500);
});

When('I navigate to my profile', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label="User menu"], .user-menu');
  await this.page!.click('a:has-text("Profile"), a:has-text("My profile")');
  await this.page!.waitForTimeout(1000);
});

When('I review the results', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Review results"), button:has-text("View results")');
  await this.page!.waitForTimeout(1000);
});

When('I see participants want to speak', async function(this: CustomWorld) {
  const requests = await this.page!.locator('.speak-request, .hand-raised').count();
  expect(requests).toBeGreaterThan(0);
});

When('I select all inactive users', async function(this: CustomWorld) {
  await this.page!.click('input[aria-label="Select all inactive"]');
  await this.page!.waitForTimeout(500);
});

When('I select all motions', async function(this: CustomWorld) {
  await this.page!.click('input[aria-label="Select all"], .select-all-checkbox');
  await this.page!.waitForTimeout(500);
});

When('I select votes to export', async function(this: CustomWorld) {
  await this.page!.click('.vote-item input[type="checkbox"]');
  await this.page!.waitForTimeout(500);
});

When('I start a weighted vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start weighted vote")');
  await this.page!.waitForTimeout(1500);
});

When('I start the voting', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start voting"), button:has-text("Begin vote")');
  await this.page!.waitForTimeout(1500);
});

When('I stop the voting', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Stop voting"), button:has-text("End vote")');
  await this.page!.waitForTimeout(1500);
});

When('I try to access the voting interface', async function(this: CustomWorld) {
  await this.page!.goto(`${this.baseUrl}/voting`);
  await this.page!.waitForTimeout(1000);
});

When('I try to delete my own account', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Delete account"), button[aria-label="Delete my account"]');
  await this.page!.waitForTimeout(1000);
});

When('I try to vote', async function(this: CustomWorld) {
  await this.page!.locator('.vote-option, button[class*="vote-button"]').first().click();
  await this.page!.waitForTimeout(1000);
});

When('I view the user list', async function(this: CustomWorld) {
  await this.page!.click('a:has-text("Users"), nav >> text="Users"');
  await this.page!.waitForTimeout(1500);
});

When('I view the voting results', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("View results"), a:has-text("Results")');
  await this.page!.waitForTimeout(1000);
});

When('{string} opens the voting interface', async function(this: CustomWorld, userName: string) {
  // This would typically be in a second browser context
  this.testData.set('currentVoter', userName);
  await this.page!.goto(`${this.baseUrl}/voting`);
});

When('{string} requests {string}', async function(this: CustomWorld, speaker: string, request: string) {
  this.testData.set('speakerRequest', { speaker, request });
  
  // Simulate request
  await this.page!.click(`button:has-text("${request}")`);
});

When('a remote speaker is next', async function(this: CustomWorld) {
  const remoteSpeaker = await this.page!.locator('.next-speaker.remote, .speaker-remote').first().isVisible();
  expect(remoteSpeaker).toBe(true);
});

When('current speaker finishes', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("End speech"), button:has-text("Finish speaking")');
  await this.page!.waitForTimeout(1000);
});

When('participants register to speak', async function(this: CustomWorld) {
  const registrations = await this.page!.locator('.registration-request, .speak-request').count();
  expect(registrations).toBeGreaterThan(0);
});

When('she casts votes', async function(this: CustomWorld) {
  // Cast multiple votes for delegation
  const voteButtons = await this.page!.locator('.vote-option').all();
  
  for (let i = 0; i < Math.min(3, voteButtons.length); i++) {
    await voteButtons[i].click();
    await this.page!.waitForTimeout(500);
  }
});

When('the speaker starts', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start speaking"), button:has-text("Begin")');
  await this.page!.waitForTimeout(1000);
});

// Motion block operations
Given('Motion B depends on Motion A passing', async function(this: CustomWorld) {
  this.testData.set('motionDependency', { dependent: 'Motion B', dependency: 'Motion A' });
  
  // Verify dependency is shown
  const dependency = await this.page!.locator('.motion-dependency:has-text("depends on")').isVisible();
  expect(dependency).toBe(true);
});

Then('Motion B should automatically become available', async function(this: CustomWorld) {
  const motionBAvailable = await this.page!.locator('.motion-item:has-text("Motion B"):not(.disabled)').isVisible();
  expect(motionBAvailable).toBe(true);
});

// Projector features
When('I select the file for projection', async function(this: CustomWorld) {
  const fileName = this.testData.get('uploadedFile') || 'document.pdf';
  const fileRow = this.page!.locator(`.file-item:has-text("${fileName}")`);
  await fileRow.locator('button[aria-label="Project"]').click();
  await this.page!.waitForTimeout(1500);
});

Then('I should be displayed prominently', async function(this: CustomWorld) {
  const prominentDisplay = await this.page!.locator('.prominent-display, .featured-content').isVisible();
  expect(prominentDisplay).toBe(true);
});

Then('it should be marked as {string}', async function(this: CustomWorld, marking: string) {
  const marked = await this.page!.locator(`.marking:has-text("${marking}")`).isVisible();
  expect(marked).toBe(true);
});

Then('it should be saved for future use', async function(this: CustomWorld) {
  const saved = await this.page!.locator('.saved-indicator, text="Saved"').isVisible();
  expect(saved).toBe(true);
});

Then('it should count down to zero', async function(this: CustomWorld) {
  // Check if countdown is running
  const countdown = await this.page!.locator('.countdown-timer').textContent();
  expect(countdown).toMatch(/\d+:\d+/);
});

Then('it should include all relevant metadata', async function(this: CustomWorld) {
  const metadata = await this.page!.locator('.metadata-section, .file-metadata').isVisible();
  expect(metadata).toBe(true);
});

Then('it should not appear in any lists', async function(this: CustomWorld) {
  const deletedItem = this.testData.get('deletedItem');
  const appearing = await this.page!.locator(`text="${deletedItem}"`).isVisible({ timeout: 1000 }).catch(() => false);
  expect(appearing).toBe(false);
});

Then('new entries should appear without refresh', async function(this: CustomWorld) {
  const liveUpdate = await this.page!.locator('.live-update, [data-realtime="true"]').isVisible();
  expect(liveUpdate).toBe(true);
});

Then('notifications should be sent via email and in-app', async function(this: CustomWorld) {
  const notificationSent = await this.page!.locator('.notification-sent, text=/Notification.*sent/i').isVisible();
  expect(notificationSent).toBe(true);
});

Then('old exports should be cleaned up', async function(this: CustomWorld) {
  const cleaned = await this.page!.locator('text=/Cleaned.*up|Old.*exports.*removed/i').isVisible();
  expect(cleaned).toBe(true);
});

Then('option to fix and retry', async function(this: CustomWorld) {
  const retryOption = await this.page!.locator('button:has-text("Fix and retry"), button:has-text("Try again")').isVisible();
  expect(retryOption).toBe(true);
});

Then('original motions marked as {string}', async function(this: CustomWorld, marking: string) {
  const originalMotions = await this.page!.locator('.original-motion').all();
  
  for (const motion of originalMotions) {
    const marked = await motion.locator(`.marking:has-text("${marking}")`).isVisible();
    expect(marked).toBe(true);
  }
});

Then('participants should see preferred language', async function(this: CustomWorld) {
  const preferredLang = this.testData.get('userLanguage') || 'en';
  const langActive = await this.page!.locator(`[lang="${preferredLang}"]`).isVisible();
  expect(langActive).toBe(true);
});

Then('participants should see the updates immediately', async function(this: CustomWorld) {
  const realtimeUpdate = await this.page!.locator('.realtime-update, .live-sync').isVisible();
  expect(realtimeUpdate).toBe(true);
});

Then('should appear in motion timeline', async function(this: CustomWorld) {
  const timelineEntry = await this.page!.locator('.timeline-entry, .history-item').first().isVisible();
  expect(timelineEntry).toBe(true);
});

Then('should have option to mark as {string}', async function(this: CustomWorld, status: string) {
  const markOption = await this.page!.locator(`button:has-text("Mark as ${status}")`).isVisible();
  expect(markOption).toBe(true);
});

Then('show in motion overview', async function(this: CustomWorld) {
  const inOverview = await this.page!.locator('.motion-overview .motion-item').first().isVisible();
  expect(inOverview).toBe(true);
});

Then('tags should affect visibility', async function(this: CustomWorld) {
  const taggedItems = await this.page!.locator('.tagged-item, [data-tags]').count();
  expect(taggedItems).toBeGreaterThan(0);
});

Then('the archive should maintain folder structure', async function(this: CustomWorld) {
  const folderStructure = await this.page!.locator('.folder-structure, .archive-folders').isVisible();
  expect(folderStructure).toBe(true);
});