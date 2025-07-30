import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Voting states and transitions
When('a vote is active', async function(this: CustomWorld) {
  // Check if a vote is currently active
  const voteActive = await this.page!.locator('.vote-active, .voting-in-progress, .poll-open').isVisible();
  expect(voteActive).toBe(true);
  
  this.testData.set('voteActive', true);
});

When('I access the voting interface again', async function(this: CustomWorld) {
  // Navigate to voting interface
  const votingButton = await this.page!.locator('button:has-text("Vote"), button:has-text("Voting"), .voting-button').isVisible();
  if (votingButton) {
    await this.page!.click('button:has-text("Vote"), button:has-text("Voting"), .voting-button');
  }
  
  await this.page!.waitForTimeout(1000);
});

When('I change my vote to {string} and submit', async function(this: CustomWorld, newVote: string) {
  // Click on the new vote option
  await this.page!.click(`button:has-text("${newVote}"), label:has-text("${newVote}")`);
  await this.page!.waitForTimeout(500);
  
  // Submit the changed vote
  await this.page!.click('button:has-text("Submit vote"), button:has-text("Confirm vote")');
  await this.page!.waitForTimeout(1500);
  
  this.testData.set('changedVote', newVote);
});

Then('my vote should be updated', async function(this: CustomWorld) {
  const voteUpdated = await this.page!.locator('text=/Vote.*updated|Changed.*vote/i').isVisible({ timeout: 3000 });
  expect(voteUpdated).toBe(true);
});

When('I submit both votes', async function(this: CustomWorld) {
  // Submit personal vote
  await this.page!.click('button:has-text("Submit my vote"), button:has-text("Vote for myself")');
  await this.page!.waitForTimeout(1000);
  
  // Submit proxy vote
  const proxyFor = this.testData.get('proxyFor');
  if (proxyFor) {
    await this.page!.click(`button:has-text("Vote for ${proxyFor}"), button:has-text("Submit proxy vote")`);
    await this.page!.waitForTimeout(1000);
  }
});

// Voting results and reports
Then('I should see real-time vote counts', async function(this: CustomWorld) {
  const voteCounts = await this.page!.locator('.vote-counts, .live-results, .voting-progress').isVisible();
  expect(voteCounts).toBe(true);
});

Then('results should show {string}', async function(this: CustomWorld, expectedResult: string) {
  const result = await this.page!.locator(`.vote-result:has-text("${expectedResult}"), .voting-outcome:has-text("${expectedResult}")`).isVisible();
  expect(result).toBe(true);
});

// Voting delegation
When('I delegate my voting rights to {string}', async function(this: CustomWorld, delegateTo: string) {
  // Open delegation dialog
  await this.page!.click('button:has-text("Delegate"), button:has-text("Voting delegation")');
  await this.page!.waitForTimeout(1000);
  
  // Search for delegate
  await this.page!.fill('input[placeholder*="Search delegate"]', delegateTo);
  await this.page!.waitForTimeout(500);
  
  // Select delegate
  await this.page!.click(`.delegate-option:has-text("${delegateTo}")`);
  
  // Confirm delegation
  await this.page!.click('button:has-text("Confirm delegation")');
  await this.page!.waitForTimeout(1500);
});

Then('I should not be able to vote directly', async function(this: CustomWorld) {
  const voteButtons = await this.page!.locator('button:has-text("Yes"), button:has-text("No"), button:has-text("Abstain")').count();
  expect(voteButtons).toBe(0);
  
  // Should see delegation notice
  const delegationNotice = await this.page!.locator('text=/Delegated.*to|Voting.*rights.*delegated/i').isVisible();
  expect(delegationNotice).toBe(true);
});

// Vote verification
Then('I can verify my vote was counted', async function(this: CustomWorld) {
  const verification = await this.page!.locator('.vote-verification, button:has-text("Verify vote"), text=/Vote.*recorded/i').isVisible();
  expect(verification).toBe(true);
});

When('I request vote verification', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Verify vote"), button:has-text("Check my vote")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see my vote confirmation code', async function(this: CustomWorld) {
  const confirmationCode = await this.page!.locator('.confirmation-code, .vote-receipt').isVisible();
  expect(confirmationCode).toBe(true);
});

// Voting statistics
Then('I should see voting statistics', async function(this: CustomWorld) {
  const stats = await this.page!.locator('.voting-statistics, .vote-stats').isVisible();
  expect(stats).toBe(true);
  
  // Check for common statistics
  const participation = await this.page!.locator('text=/Participation|Turnout/i').isVisible();
  expect(participation).toBe(true);
});

// Electronic voting system checks
Given('the electronic voting system is operational', async function(this: CustomWorld) {
  const systemStatus = await this.page!.locator('.voting-system-status, text=/Voting.*system.*online/i').isVisible();
  expect(systemStatus).toBe(true);
});

When('I test my voting connection', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Test connection"), button:has-text("Check voting system")');
  await this.page!.waitForTimeout(2000);
});

Then('I should see connection is working', async function(this: CustomWorld) {
  const connectionOk = await this.page!.locator('text=/Connection.*successful|Voting.*system.*ready/i').isVisible();
  expect(connectionOk).toBe(true);
});

// Batch voting
Given('I have multiple votes to cast', async function(this: CustomWorld) {
  const multipleVotes = await this.page!.locator('.pending-votes, .vote-queue').count();
  expect(multipleVotes).toBeGreaterThan(1);
  
  this.testData.set('hasBatchVotes', true);
});

When('I use batch voting', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Batch vote"), button:has-text("Vote on all")');
  await this.page!.waitForTimeout(1000);
});

Then('I can vote on all items efficiently', async function(this: CustomWorld) {
  const batchInterface = await this.page!.locator('.batch-voting, .multi-vote-interface').isVisible();
  expect(batchInterface).toBe(true);
});

// Vote weight
Given('I have weighted voting rights of {int}', async function(this: CustomWorld, weight: number) {
  this.testData.set('voteWeight', weight);
  
  // Check weight is displayed
  const weightDisplay = await this.page!.locator(`.vote-weight:has-text("${weight}"), text=/Weight.*${weight}/i`).isVisible();
  expect(weightDisplay).toBe(true);
});

Then('my vote should count as {int} votes', async function(this: CustomWorld, weight: number) {
  const weightedVote = await this.page!.locator(`text=/Vote.*weight.*${weight}|${weight}.*votes/i`).isVisible();
  expect(weightedVote).toBe(true);
});

// Secret ballot
Given('secret ballot is enabled', async function(this: CustomWorld) {
  const secretBallot = await this.page!.locator('.secret-ballot-indicator, text=/Secret.*ballot|Anonymous.*voting/i').isVisible();
  expect(secretBallot).toBe(true);
  
  this.testData.set('secretBallot', true);
});

Then('voter identities should not be visible', async function(this: CustomWorld) {
  // Check that no voter names are shown with votes
  const voterNames = await this.page!.locator('.voter-name, .vote-cast-by').isVisible({ timeout: 1000 }).catch(() => false);
  expect(voterNames).toBe(false);
});

// Voting phases
When('the first voting phase ends', async function(this: CustomWorld) {
  // Wait for phase to end or simulate it
  const phaseEnded = await this.page!.locator('text=/Phase.*1.*ended|First.*round.*complete/i').isVisible({ timeout: 5000 });
  expect(phaseEnded).toBe(true);
});

Then('the second voting phase should begin', async function(this: CustomWorld) {
  const phase2 = await this.page!.locator('text=/Phase.*2|Second.*round|Runoff/i').isVisible();
  expect(phase2).toBe(true);
});

// Vote reasoning
When('I add reasoning {string}', async function(this: CustomWorld, reasoning: string) {
  await this.page!.fill('textarea[placeholder*="Reasoning"], textarea[placeholder*="Comment"]', reasoning);
  await this.page!.waitForTimeout(500);
});

Then('my reasoning should be recorded with my vote', async function(this: CustomWorld) {
  const reasoningRecorded = await this.page!.locator('text=/Reasoning.*recorded|Comment.*saved/i').isVisible();
  expect(reasoningRecorded).toBe(true);
});