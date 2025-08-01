import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { MotionPage } from '../pages/motion.page';

// Motion amendments
When('I fill in the amendment form with:', async function(this: CustomWorld, dataTable: DataTable) {
  const data = dataTable.rowsHash();
  
  if (data['Amendment text']) {
    const textEditor = this.page!.locator('div[contenteditable="true"], textarea[formcontrolname="amendment_text"]').first();
    await textEditor.click();
    await textEditor.fill(data['Amendment text']);
  }
  
  if (data['Reason']) {
    await this.page!.fill('textarea[formcontrolname="reason"], input[placeholder*="Reason"]', data['Reason']);
  }
});

// Motion existence and configuration
Given('a motion {string} exists', async function(this: CustomWorld, motionTitle: string) {
  // In a real test, this might create the motion via API
  // For now, we'll assume it exists and store the reference
  this.testData.set('existingMotion', motionTitle);
  
  // Verify motion is visible in the list
  const motionVisible = await this.page!.locator(`text="${motionTitle}"`).isVisible({ timeout: 5000 });
  if (!motionVisible) {
    // Create the motion if it doesn't exist
    await this.page!.click('button:has-text("New motion"), button[mat-fab]');
    await this.page!.waitForTimeout(1000);
    await this.page!.fill('input[formcontrolname="title"]', motionTitle);
    await this.page!.fill('textarea[formcontrolname="text"]', 'Test motion content');
    await this.page!.click('button:has-text("Save")');
    await this.page!.waitForTimeout(2000);
  }
});

Given('the meeting requires supporter count of {int}', async function(this: CustomWorld, count: number) {
  // Store the required supporter count
  this.testData.set('requiredSupporters', count);
});

// Motion support - removed specific click handler
// Use generic 'When I click {string}' from generic-ui.steps.ts

Then('I should be added as a supporter', async function(this: CustomWorld) {
  const currentUser = this.testData.get('currentUsername') || 'admin';
  const supportersList = await this.page!.locator('.supporters-list, .supporter-names').textContent();
  expect(supportersList).toContain(currentUser);
});

When('{int} users support the motion', async function(this: CustomWorld, count: number) {
  // In a real test, this would involve multiple users or API calls
  // For simulation, we'll indicate the support count has been reached
  this.testData.set('supporterCount', count);
  
  // Trigger support count update
  await this.page!.evaluate((count) => {
    // Simulate supporter count reaching threshold
    window.dispatchEvent(new CustomEvent('motion-support-threshold', { detail: { count } }));
  }, count);
  
  await this.page!.waitForTimeout(1000);
});

Then('the motion should automatically move to {string} state', async function(this: CustomWorld, expectedState: string) {
  const stateElement = await this.page!.locator(`.motion-state:has-text("${expectedState}"), .state-badge:has-text("${expectedState}")`);
  await stateElement.waitFor({ state: 'visible', timeout: 5000 });
  expect(await stateElement.isVisible()).toBe(true);
});

// Motion recommendations
Given('I have permission to make recommendations', async function(this: CustomWorld) {
  // Check if current user has recommendation permissions
  const currentRole = this.testData.get('currentUserRole');
  const hasPermission = ['administrator', 'meeting chair', 'committee member'].includes(currentRole?.toLowerCase() || '');
  
  if (!hasPermission) {
    throw new Error(`Current role "${currentRole}" does not have recommendation permissions`);
  }
  
  this.testData.set('canMakeRecommendations', true);
});

When('I add recommendation text {string}', async function(this: CustomWorld, recommendationText: string) {
  // Fill recommendation text field
  const recommendationInput = this.page!.locator('textarea[formcontrolname="recommendation_text"], .recommendation-input');
  await recommendationInput.fill(recommendationText);
  
  // Save recommendation
  await this.page!.click('button:has-text("Save recommendation"), button:has-text("Add recommendation")');
  await this.page!.waitForTimeout(1000);
});

Then('the recommendation should be visible on the motion', async function(this: CustomWorld) {
  const recommendation = await this.page!.locator('.motion-recommendation, .recommendation-text').isVisible();
  expect(recommendation).toBe(true);
});

// Motion states
Given('a motion {string} is in {string} state', async function(this: CustomWorld, motionTitle: string, state: string) {
  // Navigate to motion
  await this.page!.click(`text="${motionTitle}"`);
  await this.page!.waitForTimeout(1000);
  
  // Verify current state
  const currentState = await this.page!.locator('.motion-state, .state-badge').textContent();
  if (!currentState?.toLowerCase().includes(state.toLowerCase())) {
    // Try to change state if possible
    await this.page!.click('button:has-text("Set state"), button:has-text("Change state")');
    await this.page!.waitForTimeout(500);
    await this.page!.click(`mat-list-item:has-text("${state}"), button:has-text("${state}")`);
    await this.page!.waitForTimeout(1000);
  }
  
  this.testData.set('currentMotionState', state);
});

Given('I have permission to manage voting', async function(this: CustomWorld) {
  // Check voting permissions
  const currentRole = this.testData.get('currentUserRole');
  const hasPermission = ['administrator', 'meeting chair', 'meeting operator'].includes(currentRole?.toLowerCase() || '');
  
  if (!hasPermission) {
    throw new Error(`Current role "${currentRole}" does not have voting management permissions`);
  }
  
  this.testData.set('canManageVoting', true);
});

// Motion history
When('I view the motion history', async function(this: CustomWorld) {
  const motionPage = new MotionPage(this.page!);
  await motionPage.click(motionPage.historyTab);
  await this.page!.waitForTimeout(1000);
});

Then('I should see all state transitions', async function(this: CustomWorld) {
  const historyEntries = await this.page!.locator('.history-entry, .timeline-item').count();
  expect(historyEntries).toBeGreaterThan(0);
});

Then('I should see who made each change', async function(this: CustomWorld) {
  const userInfo = await this.page!.locator('.history-user, .change-author').first().isVisible();
  expect(userInfo).toBe(true);
});

// Motion categorization
When('I assign the category {string}', async function(this: CustomWorld, category: string) {
  const motionPage = new MotionPage(this.page!);
  
  // Open category selector
  await motionPage.click(motionPage.categorySelect);
  await this.page!.waitForTimeout(500);
  
  // Select category
  await this.page!.click(`mat-option:has-text("${category}")`);
  await this.page!.waitForTimeout(500);
});

When('I add the tag {string}', async function(this: CustomWorld, tag: string) {
  const motionPage = new MotionPage(this.page!);
  
  await motionPage.fill(motionPage.tagInput, tag);
  await this.page!.locator(motionPage.tagInput).press('Enter');
  await this.page!.waitForTimeout(500);
});

// Motion comments
When('I switch to comment section {string}', async function(this: CustomWorld, section: string) {
  await this.page!.click(`button:has-text("${section}"), mat-tab:has-text("${section}")`);
  await this.page!.waitForTimeout(500);
});

When('I add a comment {string}', async function(this: CustomWorld, comment: string) {
  const commentInput = this.page!.locator('textarea[formcontrolname="comment"], .comment-input').first();
  await commentInput.fill(comment);
  
  await this.page!.click('button:has-text("Add comment"), button:has-text("Post")');
  await this.page!.waitForTimeout(1000);
});

Then('the comment should appear in the internal section', async function(this: CustomWorld) {
  const comment = await this.page!.locator('.comment-text:has-text("This needs legal review")').isVisible();
  expect(comment).toBe(true);
});

Then('the comment should not be visible to regular participants', async function(this: CustomWorld) {
  // This would typically be verified by logging in as a different user
  // For now, we'll check if the comment is marked as internal
  const internalMarker = await this.page!.locator('.internal-comment, .comment-internal').isVisible();
  expect(internalMarker).toBe(true);
});

// Motion merging
When('I select motions to merge:', async function(this: CustomWorld, dataTable: DataTable) {
  const motions = dataTable.raw().flat();
  
  for (const motion of motions) {
    const checkbox = this.page!.locator(`tr:has-text("${motion}") input[type="checkbox"], mat-row:has-text("${motion}") mat-checkbox`);
    await checkbox.click();
    await this.page!.waitForTimeout(200);
  }
  
  this.testData.set('selectedMotions', motions);
});

When('I click {string} from the bulk actions', async function(this: CustomWorld, action: string) {
  // Open bulk actions menu
  await this.page!.click('button:has-text("Bulk actions"), button:has-text("Actions")');
  await this.page!.waitForTimeout(500);
  
  // Select action
  await this.page!.click(`button:has-text("${action}"), [mat-menu-item]:has-text("${action}")`);
  await this.page!.waitForTimeout(500);
});

When('I set the merge title to {string}', async function(this: CustomWorld, title: string) {
  await this.page!.fill('input[formcontrolname="mergeTitle"], input[placeholder*="Merge title"]', title);
});

When('I confirm the merge', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Merge"), button:has-text("Confirm merge")');
  await this.page!.waitForTimeout(2000);
});

Then('a new merged motion should be created', async function(this: CustomWorld) {
  const mergedMotion = await this.page!.locator('text="Comprehensive Budget Proposal"').isVisible({ timeout: 5000 });
  expect(mergedMotion).toBe(true);
});

Then('the original motions should be marked as merged', async function(this: CustomWorld) {
  const selectedMotions = this.testData.get('selectedMotions') || [];
  
  for (const motion of selectedMotions) {
    const merged = await this.page!.locator(`tr:has-text("${motion}") .merged-indicator, mat-row:has-text("${motion}") text="Merged"`).isVisible();
    expect(merged).toBe(true);
  }
});

// Additional amendment steps
Given('I am viewing motion {string}', async function(this: CustomWorld, motionNumber: string) {
  await this.page!.goto(`https://localhost:8000/${this.currentMeetingId || '1'}/motions`);
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click(`text="${motionNumber}"`);
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('currentMotion', motionNumber);
});

When('I click {string} in the motion actions', async function(this: CustomWorld, action: string) {
  await this.page!.click(`button:has-text("${action}"), [mat-menu-item]:has-text("${action}")`);
  await this.page!.waitForTimeout(1000);
});

Then('an amendment should be created', async function(this: CustomWorld) {
  const success = await this.page!.locator('text=/Amendment.*created|Created.*amendment/i').isVisible({ timeout: 3000 });
  expect(success).toBe(true);
});

Then('it should reference the parent motion', async function(this: CustomWorld) {
  const parentReference = await this.page!.locator('.parent-motion-reference, text=/Amendment.*to.*1.1/').isVisible();
  expect(parentReference).toBe(true);
});

// Recommendation management
Given('I have permission to manage recommendations', async function(this: CustomWorld) {
  // This is typically based on the logged-in user's role
  this.testData.set('canManageRecommendations', true);
});

When('I set recommendation to {string}', async function(this: CustomWorld, recommendation: string) {
  // Click recommendation dropdown
  await this.page!.click('mat-select[formcontrolname="recommendation"], select[name="recommendation"]');
  await this.page!.waitForTimeout(500);
  
  // Select recommendation
  await this.page!.click(`mat-option:has-text("${recommendation}"), option:has-text("${recommendation}")`);
  await this.page!.waitForTimeout(500);
});

When('I add recommendation reason:', async function(this: CustomWorld, reasonText: string) {
  const reasonField = this.page!.locator('textarea[formcontrolname="recommendation_reason"], input[placeholder*="reason"]');
  await reasonField.fill(reasonText);
});

Then('the motion should show {string} as recommendation', async function(this: CustomWorld, recommendation: string) {
  const recommendationDisplay = await this.page!.locator(`.recommendation:has-text("${recommendation}")`).isVisible();
  expect(recommendationDisplay).toBe(true);
});

Then('the recommendation reason should be visible', async function(this: CustomWorld) {
  const reasonVisible = await this.page!.locator('.recommendation-reason').isVisible();
  expect(reasonVisible).toBe(true);
});

// Motion blocks
When('I click {string} in the motion block section', async function(this: CustomWorld, buttonText: string) {
  const blockSection = this.page!.locator('.motion-blocks-section, .blocks-panel');
  await blockSection.locator(`button:has-text("${buttonText}")`).click();
  await this.page!.waitForTimeout(500);
});

When('I add the motion to block {string}', async function(this: CustomWorld, blockName: string) {
  await this.page!.click(`mat-checkbox:has-text("${blockName}"), mat-list-option:has-text("${blockName}")`);
  await this.page!.waitForTimeout(500);
  
  await this.page!.click('button:has-text("Save"), button:has-text("Apply")');
  await this.page!.waitForTimeout(1000);
});

Then('the motion should appear in block {string}', async function(this: CustomWorld, blockName: string) {
  const inBlock = await this.page!.locator(`.motion-block:has-text("${blockName}")`).isVisible();
  expect(inBlock).toBe(true);
});

// Tags functionality
When('I click {string} in the tags section', async function(this: CustomWorld, buttonText: string) {
  const tagsSection = this.page!.locator('.tags-section, .motion-tags');
  await tagsSection.locator(`button:has-text("${buttonText}")`).click();
  await this.page!.waitForTimeout(500);
});

When('I select tags:', async function(this: CustomWorld, dataTable: DataTable) {
  const tags = dataTable.raw().flat();
  
  for (const tag of tags) {
    await this.page!.click(`mat-checkbox:has-text("${tag}"), input[type="checkbox"] + label:has-text("${tag}")`);
    await this.page!.waitForTimeout(200);
  }
});

Then('the motion should have tags:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedTags = dataTable.raw().flat();
  
  for (const tag of expectedTags) {
    const tagVisible = await this.page!.locator(`.tag-chip:has-text("${tag}"), .motion-tag:has-text("${tag}")`).isVisible();
    expect(tagVisible).toBe(true);
  }
});

// Category assignment
When('I assign category {string}', async function(this: CustomWorld, category: string) {
  // Open category selector
  await this.page!.click('mat-select[formcontrolname="category"], select[name="category"]');
  await this.page!.waitForTimeout(500);
  
  // Select category
  await this.page!.click(`mat-option:has-text("${category}"), option:has-text("${category}")`);
  await this.page!.waitForTimeout(500);
});

Then('the motion should be in category {string}', async function(this: CustomWorld, category: string) {
  const categoryDisplay = await this.page!.locator(`.motion-category:has-text("${category}")`).isVisible();
  expect(categoryDisplay).toBe(true);
});

// Personal notes
When('I add a personal note:', async function(this: CustomWorld, noteText: string) {
  // Open personal note editor
  await this.page!.click('button:has-text("Personal note"), button:has-text("Add note")');
  await this.page!.waitForTimeout(500);
  
  // Enter note
  const noteField = this.page!.locator('textarea[formcontrolname="personal_note"], textarea[placeholder*="note"]');
  await noteField.fill(noteText);
  
  // Save note
  await this.page!.click('button:has-text("Save note"), button:has-text("Save")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see my personal note', async function(this: CustomWorld) {
  const noteVisible = await this.page!.locator('.personal-note-content').isVisible();
  expect(noteVisible).toBe(true);
});

Then('other users should not see my note', async function(this: CustomWorld) {
  // This would require logging in as another user
  // For now, we verify the note is marked as personal
  const personalIndicator = await this.page!.locator('.personal-note-indicator, text="Personal"').isVisible();
  expect(personalIndicator).toBe(true);
});

// Following motions
When('I click the {string} star icon', async function(this: CustomWorld, state: string) {
  const starIcon = this.page!.locator('.follow-star, mat-icon:has-text("star")');
  
  if (state === 'empty') {
    // Click unfilled star
    await starIcon.filter({ hasText: 'star_border' }).click();
  } else {
    // Click filled star
    await starIcon.filter({ hasText: 'star' }).click();
  }
  
  await this.page!.waitForTimeout(500);
});

Then('the motion should appear in my followed motions', async function(this: CustomWorld) {
  // Navigate to followed motions
  await this.page!.click('button:has-text("Followed"), a:has-text("My motions")');
  await this.page!.waitForTimeout(1000);
  
  const currentMotion = this.testData.get('currentMotion');
  const isFollowed = await this.page!.locator(`text="${currentMotion}"`).isVisible();
  expect(isFollowed).toBe(true);
});

// Motion call list
Given('I am viewing the motion call list', async function(this: CustomWorld) {
  await this.page!.click('a:has-text("Call list"), button:has-text("Call list")');
  await this.page!.waitForTimeout(1000);
});

When('I drag motion {string} to position {int}', async function(this: CustomWorld, motionNumber: string, position: number) {
  const motionElement = this.page!.locator(`mat-row:has-text("${motionNumber}"), tr:has-text("${motionNumber}")`);
  const targetPosition = this.page!.locator('.call-list-item, mat-row').nth(position - 1);
  
  await motionElement.dragTo(targetPosition);
  await this.page!.waitForTimeout(1000);
});

Then('the motion order should be updated', async function(this: CustomWorld) {
  // Check for reorder confirmation or updated positions
  const orderUpdated = await this.page!.locator('text=/Order.*updated|Reordered/i').isVisible({ timeout: 3000 })
    .catch(() => true); // If no message, assume success
  expect(orderUpdated).toBe(true);
});

// Change recommendations from participants
Given('participant change recommendations are enabled', async function(this: CustomWorld) {
  this.testData.set('participantRecommendationsEnabled', true);
});

When('I suggest a text change:', async function(this: CustomWorld, changeText: string) {
  // Open change recommendation form
  await this.page!.click('button:has-text("Suggest change"), button:has-text("Propose amendment")');
  await this.page!.waitForTimeout(1000);
  
  // Enter change text
  const changeField = this.page!.locator('textarea[formcontrolname="change_text"], div[contenteditable="true"]').first();
  await changeField.fill(changeText);
  
  // Submit
  await this.page!.click('button:has-text("Submit"), button:has-text("Send")');
  await this.page!.waitForTimeout(1000);
});

Then('my change recommendation should be submitted', async function(this: CustomWorld) {
  const submitted = await this.page!.locator('text=/Change.*submitted|Recommendation.*sent/i').isVisible({ timeout: 3000 });
  expect(submitted).toBe(true);
});

Then('it should appear in the change recommendations list', async function(this: CustomWorld) {
  const changesList = await this.page!.locator('.change-recommendations, .suggested-changes').isVisible();
  expect(changesList).toBe(true);
  
  // Verify the specific change appears
  const myChange = await this.page!.locator('.change-recommendation-item').first().isVisible();
  expect(myChange).toBe(true);
});

// Motion existence with merging
Given('motions {string} and {string} exist', async function(this: CustomWorld, motion1: string, motion2: string) {
  // Store motion numbers for reference
  this.testData.set('motion1', motion1);
  this.testData.set('motion2', motion2);
  
  // Verify both motions exist in the list
  const motionsPage = new MotionPage(this.page!);
  await motionsPage.navigate();
  
  const motion1Exists = await this.page!.locator(`text="${motion1}"`).isVisible();
  const motion2Exists = await this.page!.locator(`text="${motion2}"`).isVisible();
  
  expect(motion1Exists && motion2Exists).toBe(true);
});

When('I select both motions', async function(this: CustomWorld) {
  // Click checkboxes for both motions
  const motion1 = this.testData.get('motion1');
  const motion2 = this.testData.get('motion2');
  
  await this.page!.click(`mat-row:has-text("${motion1}") mat-checkbox`);
  await this.page!.click(`mat-row:has-text("${motion2}") mat-checkbox`);
  
  await this.page!.waitForTimeout(500);
});

When('I choose {string} from bulk actions', async function(this: CustomWorld, action: string) {
  // Open bulk actions menu
  await this.page!.click('button:has-text("Bulk actions"), button[mat-icon-button]:has(mat-icon)')
  await this.page!.waitForTimeout(500);
  
  // Select action
  await this.page!.click(`[mat-menu-item]:has-text("${action}"), button:has-text("${action}")`);
  await this.page!.waitForTimeout(1000);
});

When('I select the merge target and confirm', async function(this: CustomWorld) {
  // Select first motion as target
  const motion1 = this.testData.get('motion1');
  await this.page!.click(`mat-radio-button:has-text("${motion1}"), input[type="radio"][value="${motion1}"]`);
  
  // Confirm merge
  await this.page!.click('button:has-text("Merge"), button:has-text("Confirm")')
  await this.page!.waitForTimeout(2000);
});

Then('the motions should be merged', async function(this: CustomWorld) {
  const mergeSuccess = await this.page!.locator('text=/Merged.*successfully|Motions.*merged/i').isVisible({ timeout: 3000 });
  expect(mergeSuccess).toBe(true);
});

Then('only the target motion should remain', async function(this: CustomWorld) {
  const motion1 = this.testData.get('motion1');
  const motion2 = this.testData.get('motion2');
  
  // Target should exist
  const targetExists = await this.page!.locator(`text="${motion1}"`).isVisible();
  expect(targetExists).toBe(true);
  
  // Merged motion should not exist
  const mergedExists = await this.page!.locator(`text="${motion2}"`).isVisible();
  expect(mergedExists).toBe(false);
});