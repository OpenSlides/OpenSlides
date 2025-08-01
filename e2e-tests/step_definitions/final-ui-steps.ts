import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Speaker time tracking
Then('Bob\'s speech time should be recorded', async function(this: CustomWorld) {
  const speechTime = await this.page!.locator('.speaker-time:has-text("Bob"), .speech-duration:has-text("Bob")').isVisible();
  expect(speechTime).toBe(true);
  
  // Store for verification
  const timeText = await this.page!.locator('.speaker-time:has-text("Bob")').textContent();
  this.testData.set('bobSpeechTime', timeText);
});

Then('Emma should speak next automatically', async function(this: CustomWorld) {
  // Wait for automatic speaker transition
  await this.page!.waitForTimeout(2000);
  
  const emmaSpeaking = await this.page!.locator('.current-speaker:has-text("Emma"), .speaking-now:has-text("Emma")').isVisible();
  expect(emmaSpeaking).toBe(true);
});

// Intervention handling
Then('I see intervention request', async function(this: CustomWorld) {
  const interventionRequest = await this.page!.locator('.intervention-request, .point-of-order').isVisible({ timeout: 3000 });
  expect(interventionRequest).toBe(true);
});

Then('I can approve\\/deny', async function(this: CustomWorld) {
  const approveButton = await this.page!.locator('button:has-text("Approve"), button:has-text("Accept")').isVisible();
  const denyButton = await this.page!.locator('button:has-text("Deny"), button:has-text("Reject")').isVisible();
  
  expect(approveButton).toBe(true);
  expect(denyButton).toBe(true);
});

// Generic action options
Then('I can:', async function(this: CustomWorld, dataTable: DataTable) {
  const actions = dataTable.raw().flat();
  
  for (const action of actions) {
    const actionAvailable = await this.page!.locator(`button:has-text("${action}"), [aria-label*="${action}"], a:has-text("${action}")`).isVisible();
    expect(actionAvailable).toBe(true);
  }
});

// Report generation
Then('I should be able to download a report containing:', async function(this: CustomWorld, dataTable: DataTable) {
  const reportSections = dataTable.raw().flat();
  
  // Click download/generate report
  await this.page!.click('button:has-text("Download report"), button:has-text("Generate report")');
  await this.page!.waitForTimeout(2000);
  
  // Verify report sections in preview or options
  for (const section of reportSections) {
    const sectionVisible = await this.page!.locator(`.report-section:has-text("${section}"), mat-checkbox:has-text("${section}")`).isVisible();
    expect(sectionVisible).toBe(true);
  }
});

Then('I should get a report with:', async function(this: CustomWorld, dataTable: DataTable) {
  const reportItems = dataTable.raw().flat();
  
  // Wait for report generation
  await this.page!.waitForTimeout(3000);
  
  // Verify report contains expected items
  for (const item of reportItems) {
    const itemInReport = await this.page!.locator(`.report-content:has-text("${item}"), .report-preview:has-text("${item}")`).isVisible();
    expect(itemInReport).toBe(true);
  }
});

// Edit permissions
Then('I should be able to edit:', async function(this: CustomWorld, dataTable: DataTable) {
  const editableFields = dataTable.raw().flat();
  
  for (const field of editableFields) {
    const isEditable = await this.page!.locator(`input[placeholder*="${field}"], textarea[placeholder*="${field}"], [contenteditable="true"]:has-text("${field}")`).isEnabled();
    expect(isEditable).toBe(true);
  }
});

Then('I should not be able to edit:', async function(this: CustomWorld, dataTable: DataTable) {
  const readOnlyFields = dataTable.raw().flat();
  
  for (const field of readOnlyFields) {
    const input = this.page!.locator(`input[placeholder*="${field}"], textarea[placeholder*="${field}"]`).first();
    if (await input.count() > 0) {
      const isDisabled = await input.isDisabled();
      expect(isDisabled).toBe(true);
    }
  }
});

// Motion viewing
Then('I should be able to see the motion details', async function(this: CustomWorld) {
  const motionDetails = await this.page!.locator('.motion-details, .motion-content').isVisible();
  expect(motionDetails).toBe(true);
});

// Voting restrictions
Then('I should not be able to submit a vote', async function(this: CustomWorld) {
  const voteButtons = await this.page!.locator('button:has-text("Yes"), button:has-text("No"), button:has-text("Abstain")').count();
  
  if (voteButtons > 0) {
    // Check if buttons are disabled
    const firstButton = this.page!.locator('button:has-text("Yes")').first();
    const isDisabled = await firstButton.isDisabled();
    expect(isDisabled).toBe(true);
  } else {
    // No vote buttons shown
    expect(voteButtons).toBe(0);
  }
});

// Alerts and messages
Then('I should get an alert', async function(this: CustomWorld) {
  const alert = await this.page!.locator('.alert, .mat-dialog-container[role="alertdialog"], .notification-alert').isVisible({ timeout: 3000 });
  expect(alert).toBe(true);
});

Then('I should see a message {string}', async function(this: CustomWorld, message: string) {
  const messageVisible = await this.page!.locator(`text="${message}"`).isVisible({ timeout: 3000 });
  expect(messageVisible).toBe(true);
});

// Confirmation dialogs
Then('I should see confirmation dialog', async function(this: CustomWorld) {
  const confirmDialog = await this.page!.locator('mat-dialog-container, .confirmation-dialog').isVisible({ timeout: 3000 });
  expect(confirmDialog).toBe(true);
});

Then('I should see a confirmation of the change', async function(this: CustomWorld) {
  const confirmation = await this.page!.locator('.confirmation-message, text=/Success|Updated|Changed/i').isVisible({ timeout: 3000 });
  expect(confirmation).toBe(true);
});

// Vote management
Then('I should have option to extend or revote', async function(this: CustomWorld) {
  const extendOption = await this.page!.locator('button:has-text("Extend"), button:has-text("Prolong")').isVisible();
  const revoteOption = await this.page!.locator('button:has-text("Revote"), button:has-text("Repeat vote")').isVisible();
  
  expect(extendOption || revoteOption).toBe(true);
});

Then('I should see phase {int} results', async function(this: CustomWorld, phase: number) {
  const phaseResults = await this.page!.locator(`.phase-${phase}-results, .voting-phase:has-text("Phase ${phase}")`).isVisible();
  expect(phaseResults).toBe(true);
});

Then('I should see my current vote', async function(this: CustomWorld) {
  const myVote = await this.page!.locator('.my-vote, .current-vote, .your-vote').isVisible();
  expect(myVote).toBe(true);
});

Then('I should see vote counts but no voter information', async function(this: CustomWorld) {
  // Check vote counts are visible
  const voteCounts = await this.page!.locator('.vote-count, .vote-results').isVisible();
  expect(voteCounts).toBe(true);
  
  // Check voter names are NOT visible
  const voterNames = await this.page!.locator('.voter-name, .who-voted').count();
  expect(voterNames).toBe(0);
});

// Import results
Then('I should see a summary of imported and failed records', async function(this: CustomWorld) {
  const importSummary = await this.page!.locator('.import-summary, .import-results').isVisible({ timeout: 5000 });
  expect(importSummary).toBe(true);
  
  // Check for success/failure counts
  const successCount = await this.page!.locator('.imported-count, .success-count').isVisible();
  const failureCount = await this.page!.locator('.failed-count, .error-count').isVisible();
  
  expect(successCount || failureCount).toBe(true);
});

// User filtering
Then('I should see only users in the {string} group', async function(this: CustomWorld, groupName: string) {
  const users = await this.page!.locator('.user-item, .participant-row').all();
  
  for (const user of users) {
    const userGroup = await user.locator('.group-badge, .user-group').textContent();
    expect(userGroup).toContain(groupName);
  }
});

Then('I should see only users matching {string}', async function(this: CustomWorld, searchTerm: string) {
  const users = await this.page!.locator('.user-item, .participant-row').all();
  
  for (const user of users) {
    const userName = await user.textContent();
    expect(userName?.toLowerCase()).toContain(searchTerm.toLowerCase());
  }
});

// Profile and status
Then('I should see my profile information', async function(this: CustomWorld) {
  const profileInfo = await this.page!.locator('.profile-info, .user-profile').isVisible();
  expect(profileInfo).toBe(true);
});

Then('I should see online status indicators', async function(this: CustomWorld) {
  const statusIndicators = await this.page!.locator('.online-status, .presence-indicator').count();
  expect(statusIndicators).toBeGreaterThan(0);
});

// User activity
Then('I should see the user\'s recent activities:', async function(this: CustomWorld, dataTable: DataTable) {
  const activities = dataTable.raw().flat();
  
  for (const activity of activities) {
    const activityVisible = await this.page!.locator(`.activity-item:has-text("${activity}"), .user-action:has-text("${activity}")`).isVisible();
    expect(activityVisible).toBe(true);
  }
});

// Gender statistics
Then('I should see gender balance statistics', async function(this: CustomWorld) {
  const genderStats = await this.page!.locator('.gender-statistics, .gender-balance').isVisible();
  expect(genderStats).toBe(true);
});

// Speaker queue management
Then('Tom appears in special queue', async function(this: CustomWorld) {
  const specialQueue = await this.page!.locator('.special-queue:has-text("Tom"), .priority-speakers:has-text("Tom")').isVisible();
  expect(specialQueue).toBe(true);
});

Then('Tom gets {int} minute immediately after Sarah', async function(this: CustomWorld, minutes: number) {
  // Check speaker order
  const speakerList = await this.page!.locator('.speaker-queue .speaker-item').allTextContents();
  
  const sarahIndex = speakerList.findIndex(s => s.includes('Sarah'));
  const tomIndex = speakerList.findIndex(s => s.includes('Tom'));
  
  expect(tomIndex).toBe(sarahIndex + 1);
  
  // Check Tom's time allocation
  const tomTime = await this.page!.locator('.speaker-item:has-text("Tom") .speaker-time').textContent();
  expect(tomTime).toContain(`${minutes}`);
});

// Note reminders
Then('I should see the note reminder', async function(this: CustomWorld) {
  const noteReminder = await this.page!.locator('.note-reminder, .note-notification').isVisible({ timeout: 3000 });
  expect(noteReminder).toBe(true);
});

// Action options
Then('I should see options to:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.raw().flat();
  
  for (const option of options) {
    const optionVisible = await this.page!.locator(`button:has-text("${option}"), a:has-text("${option}"), mat-menu-item:has-text("${option}")`).isVisible();
    expect(optionVisible).toBe(true);
  }
});

// Additional helper steps
// Removed duplicate - use 'When I wait for {int} seconds' from common.steps.ts

When('I refresh the page', async function(this: CustomWorld) {
  await this.page!.reload();
  await this.page!.waitForTimeout(2000);
});

Then('the page should reload', async function(this: CustomWorld) {
  // Page reload is handled by previous step
  // Just verify we're still on a valid page
  const pageLoaded = await this.page!.locator('body').isVisible();
  expect(pageLoaded).toBe(true);
});

When('I scroll to {string}', async function(this: CustomWorld, element: string) {
  const targetElement = this.page!.locator(`text="${element}"`).first();
  await targetElement.scrollIntoViewIfNeeded();
  await this.page!.waitForTimeout(500);
});

// Removed generic version - using more specific versions in other files

Then('I should not see {string} in the list', async function(this: CustomWorld, item: string) {
  const itemVisible = await this.page!.locator(`mat-list-item:has-text("${item}"), li:has-text("${item}"), tr:has-text("${item}")`).isVisible();
  expect(itemVisible).toBe(false);
});

When('I hover over {string}', async function(this: CustomWorld, element: string) {
  const targetElement = this.page!.locator(`text="${element}"`).first();
  await targetElement.hover();
  await this.page!.waitForTimeout(500);
});

Then('I should see a tooltip {string}', async function(this: CustomWorld, tooltipText: string) {
  const tooltip = await this.page!.locator(`.mat-tooltip:has-text("${tooltipText}"), [role="tooltip"]:has-text("${tooltipText}")`).isVisible({ timeout: 3000 });
  expect(tooltip).toBe(true);
});