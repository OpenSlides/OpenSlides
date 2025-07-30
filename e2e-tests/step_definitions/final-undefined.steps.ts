import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Committee info visibility
Then('the committee info should be visible on the slide', async function(this: CustomWorld) {
  const slideInfo = await this.page!.locator('.slide-content .committee-info, .projector-view .committee-details').isVisible();
  expect(slideInfo).toBe(true);
});

// Tie votes
Then('the motion should be marked as tie', async function(this: CustomWorld) {
  const tieMarker = await this.page!.locator('.tie-marker, .vote-tie, text="Tie vote"').isVisible();
  expect(tieMarker).toBe(true);
});

// Motion acceptance
Then('the motion should still be accepted', async function(this: CustomWorld) {
  const accepted = await this.page!.locator('.state-badge:has-text("Accepted"), .motion-accepted').isVisible();
  expect(accepted).toBe(true);
});

// Progress tracking
Then('the progress bar should show {int}%', async function(this: CustomWorld, percentage: number) {
  const progressBar = this.page!.locator('.progress-bar, mat-progress-bar');
  const value = await progressBar.getAttribute('aria-valuenow') || await progressBar.getAttribute('value');
  expect(parseInt(value || '0')).toBe(percentage);
});

// Results summary
Then('the results summary should show:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedResults = dataTable.hashes();
  
  for (const result of expectedResults) {
    const option = result['Option'] || result['option'];
    const votes = result['Votes'] || result['votes'];
    
    const resultRow = this.page!.locator(`.result-row:has-text("${option}")`);
    const voteCount = await resultRow.locator('.vote-count').textContent();
    expect(voteCount).toContain(votes);
  }
});

// Vote invalidation
Then('the vote should be invalidated', async function(this: CustomWorld) {
  const invalidated = await this.page!.locator('text=/Vote.*invalid|Invalid.*vote/i').isVisible();
  expect(invalidated).toBe(true);
});

// Visibility checks
Then('they should not see voting options', async function(this: CustomWorld) {
  const votingOptions = await this.page!.locator('.voting-options, .vote-buttons').isVisible({ timeout: 1000 }).catch(() => false);
  expect(votingOptions).toBe(false);
});

Then('they should see the projector', async function(this: CustomWorld) {
  const projectorVisible = await this.page!.locator('.projector-view, .presentation-mode').isVisible();
  expect(projectorVisible).toBe(true);
});

// Timestamps
Then('timestamp should be recorded', async function(this: CustomWorld) {
  const timestamp = await this.page!.locator('.timestamp, time').isVisible();
  expect(timestamp).toBe(true);
});

// User imports
Then('users should be created with generated passwords', async function(this: CustomWorld) {
  const passwordsGenerated = await this.page!.locator('text=/Passwords.*generated|Generated.*passwords/i').isVisible();
  expect(passwordsGenerated).toBe(true);
});

// Vote counting
Then('vote count should increase', async function(this: CustomWorld) {
  const currentCount = await this.page!.locator('.vote-count, .total-votes').textContent();
  const previousCount = this.testData.get('previousVoteCount') || '0';
  expect(parseInt(currentCount || '0')).toBeGreaterThan(parseInt(previousCount));
});

Then('vote should be recorded', async function(this: CustomWorld) {
  const recorded = await this.page!.locator('text=/Vote.*recorded|Thank.*voting/i').isVisible();
  expect(recorded).toBe(true);
});

// Voting completion
Then('voting is complete', async function(this: CustomWorld) {
  const complete = await this.page!.locator('.voting-complete, text="Voting completed"').isVisible();
  expect(complete).toBe(true);
});

Then('voting results should reflect this', async function(this: CustomWorld) {
  const results = await this.page!.locator('.voting-results, .final-results').isVisible();
  expect(results).toBe(true);
});

// When steps for various actions
When('I assign {string} to {string}', async function(this: CustomWorld, item: string, target: string) {
  // Drag and drop or selection-based assignment
  const itemElement = this.page!.locator(`text="${item}"`).first();
  const targetElement = this.page!.locator(`text="${target}"`).first();
  
  await itemElement.dragTo(targetElement);
  await this.page!.waitForTimeout(1000);
});

When('I click save', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Save"), button[type="submit"]');
  await this.page!.waitForTimeout(1500);
});

When('I create a new ballot', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("New ballot"), button:has-text("Create ballot")');
  await this.page!.waitForTimeout(1000);
});

When('I enable {string} voting method', async function(this: CustomWorld, method: string) {
  await this.page!.click(`mat-radio-button:has-text("${method}"), label:has-text("${method}")`);
  await this.page!.waitForTimeout(500);
});

When('I end the voting phase', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("End voting"), button:has-text("Close voting")');
  await this.page!.waitForTimeout(2000);
});

When('I enter {string} in field {string}', async function(this: CustomWorld, value: string, fieldName: string) {
  const field = this.page!.locator(`input[formcontrolname="${fieldName}"], input[placeholder*="${fieldName}"]`).first();
  await field.fill(value);
  await this.page!.waitForTimeout(500);
});

When('I navigate to the motion', async function(this: CustomWorld) {
  const motionId = this.testData.get('currentMotionId') || '1';
  await this.page!.click(`a:has-text("Motion ${motionId}"), .motion-link`);
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - use 'When I open the chat panel' from chat-messaging.steps.ts

When('I open voting for the motion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start vote"), button:has-text("Open voting")');
  await this.page!.waitForTimeout(1500);
});

When('I project {string}', async function(this: CustomWorld, item: string) {
  const projectButton = this.page!.locator(`[aria-label="Project ${item}"], button:has-text("Project")`).first();
  await projectButton.click();
  await this.page!.waitForTimeout(1000);
});

When('I publish the results', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Publish results"), button:has-text("Make public")');
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - use 'When I refresh the page' from final-ui-steps.ts

When('I save the list as template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click('button:has-text("Save as template")');
  await this.page!.fill('input[placeholder*="Template name"]', templateName);
  await this.page!.click('button:has-text("Save")');
  await this.page!.waitForTimeout(1000);
});

When('I select voting type {string}', async function(this: CustomWorld, voteType: string) {
  await this.page!.click('mat-select[formcontrolname="type"], select[name="vote-type"]');
  await this.page!.click(`mat-option:has-text("${voteType}")`);
  await this.page!.waitForTimeout(500);
});

When('I set voting to be anonymous', async function(this: CustomWorld) {
  await this.page!.click('mat-checkbox:has-text("Anonymous"), label:has-text("Anonymous voting")');
  await this.page!.waitForTimeout(500);
});

When('I sort by {string}', async function(this: CustomWorld, sortField: string) {
  await this.page!.click(`th:has-text("${sortField}"), .sort-header:has-text("${sortField}")`);
  await this.page!.waitForTimeout(1000);
});

When('I submit', async function(this: CustomWorld) {
  await this.page!.click('button[type="submit"], button:has-text("Submit")');
  await this.page!.waitForTimeout(1500);
});

When('I submit the vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Submit vote"), button:has-text("Cast vote")');
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - use 'When I toggle {string}' from remaining-features.steps.ts

When('I wait', async function(this: CustomWorld) {
  await this.page!.waitForTimeout(2000);
});

When('I wait for the results', async function(this: CustomWorld) {
  await this.page!.waitForTimeout(3000);
});

// Given steps
Given('I am in the chat', async function(this: CustomWorld) {
  const chatOpen = await this.page!.locator('.chat-panel, .chat-window').isVisible();
  if (!chatOpen) {
    await this.page!.click('button[aria-label="Open chat"], .chat-toggle');
    await this.page!.waitForTimeout(1000);
  }
});

Given('I am moderating a discussion', async function(this: CustomWorld) {
  this.testData.set('isModerating', true);
  
  // Verify moderator controls are visible
  const modControls = await this.page!.locator('.moderator-controls, .discussion-controls').isVisible();
  expect(modControls).toBe(true);
});

Given('I am on the dashboard', async function(this: CustomWorld) {
  await this.page!.goto('https://localhost:8000/dashboard');
  await this.page!.waitForLoadState('networkidle');
});

// Removed duplicate - already defined in authentication.steps.ts
// Given('I am on the login page', async function(this: CustomWorld) {
//   await this.page!.goto('https://localhost:8000/login');
//   await this.page!.waitForLoadState('domcontentloaded');
// });

Given('I am viewing the current list of speakers', async function(this: CustomWorld) {
  const speakerList = await this.page!.locator('.speaker-list, .speakers-panel').isVisible();
  if (!speakerList) {
    await this.page!.click('button:has-text("Speakers"), mat-tab-label:has-text("Speakers")');
    await this.page!.waitForTimeout(1000);
  }
});

Given('I have administrative rights', async function(this: CustomWorld) {
  const isAdmin = this.testData.get('currentRole') === 'admin' || this.testData.get('currentRole') === 'administrator';
  expect(isAdmin).toBe(true);
});

Given('I have created multiple voting options', async function(this: CustomWorld) {
  const optionCount = await this.page!.locator('.voting-option, .poll-option').count();
  expect(optionCount).toBeGreaterThan(1);
});

Given('I have enabled ranked choice voting', async function(this: CustomWorld) {
  const rankedChoice = await this.page!.locator('mat-checkbox[formcontrolname="rankedChoice"]:checked, .ranked-choice-enabled').isVisible();
  expect(rankedChoice).toBe(true);
});

Given('I have previously participated in votes', async function(this: CustomWorld) {
  this.testData.set('hasVotingHistory', true);
});

Given('I have selected multiple users', async function(this: CustomWorld) {
  const selectedCount = await this.page!.locator('mat-checkbox:checked').count();
  expect(selectedCount).toBeGreaterThan(1);
});

Given('I navigate to {string} page', async function(this: CustomWorld, pageName: string) {
  const pageMap: Record<string, string> = {
    'settings': '/settings',
    'users': '/users',
    'committees': '/committees',
    'dashboard': '/dashboard'
  };
  
  const path = pageMap[pageName.toLowerCase()] || `/${pageName.toLowerCase()}`;
  await this.page!.goto(`https://localhost:8000${path}`);
  await this.page!.waitForLoadState('networkidle');
});

Given('motion {string} exists', async function(this: CustomWorld, motionId: string) {
  // Store the motion ID for later use
  this.testData.set('currentMotionId', motionId);
  
  // Verify motion exists in the list
  const motionExists = await this.page!.locator(`text="Motion ${motionId}"`).isVisible();
  expect(motionExists).toBe(true);
});

Given('the chat is active', async function(this: CustomWorld) {
  const chatActive = await this.page!.locator('.chat-active, .chat-panel.open').isVisible();
  expect(chatActive).toBe(true);
});

Given('the list of speakers has multiple entries', async function(this: CustomWorld) {
  const speakerCount = await this.page!.locator('.speaker-item, .speaker-entry').count();
  expect(speakerCount).toBeGreaterThan(1);
});

Given('the meeting has ended', async function(this: CustomWorld) {
  const meetingEnded = await this.page!.locator('.meeting-ended, text=/Meeting.*ended/i').isVisible();
  expect(meetingEnded).toBe(true);
});

Given('the motion is in discussion', async function(this: CustomWorld) {
  const inDiscussion = await this.page!.locator('.state-badge:has-text("Discussion"), .motion-discussing').isVisible();
  expect(inDiscussion).toBe(true);
});

Given('there are users in the participant list', async function(this: CustomWorld) {
  const participantCount = await this.page!.locator('.participant-item, .user-row').count();
  expect(participantCount).toBeGreaterThan(0);
});

Given('voting is configured for public results', async function(this: CustomWorld) {
  const publicResults = await this.page!.locator('.public-results-enabled, mat-checkbox[formcontrolname="publicResults"]:checked').isVisible();
  expect(publicResults).toBe(true);
});

// Additional Then steps
Then('all groups should be updated', async function(this: CustomWorld) {
  const updated = await this.page!.locator('text=/Groups.*updated|Updated.*all.*groups/i').isVisible();
  expect(updated).toBe(true);
});

Then('users should be notified of the change', async function(this: CustomWorld) {
  const notification = await this.page!.locator('.user-notification, text=/Users.*notified/i').isVisible();
  expect(notification).toBe(true);
});