import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';

// User roles and permissions
Given('I am logged in as a regular user', async function(this: CustomWorld) {
  // Login as a regular participant user
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login('participant', 'participant');
  
  this.testData.set('currentRole', 'participant');
  this.testData.set('currentUsername', 'participant');
});

Given('I am the only administrator', async function(this: CustomWorld) {
  this.testData.set('isOnlyAdmin', true);
  this.testData.set('currentRole', 'administrator');
});

// Voting creation and types
Given('I create a vote of type {string}', async function(this: CustomWorld, voteType: string) {
  await this.page!.click('button:has-text("New vote"), button:has-text("Create vote")');
  await this.page!.waitForTimeout(1000);
  
  // Select vote type
  await this.page!.click('mat-select[formcontrolname="type"], select[name="vote-type"]');
  await this.page!.click(`mat-option:has-text("${voteType}")`);
  
  this.testData.set('voteType', voteType);
});

Given('I create an anonymous vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("New vote"), button:has-text("Create vote")');
  await this.page!.waitForTimeout(1000);
  
  // Enable anonymous voting
  await this.page!.click('mat-checkbox:has-text("Anonymous"), label:has-text("Anonymous voting")');
  
  this.testData.set('anonymousVote', true);
});

// Voting rights and delegation
Given('I do not have voting rights for this motion', async function(this: CustomWorld) {
  this.testData.set('hasVotingRights', false);
  
  // Verify no voting UI is shown
  const voteButtons = await this.page!.locator('button:has-text("Yes"), button:has-text("No"), button:has-text("Abstain")').count();
  expect(voteButtons).toBe(0);
});

Given('I have already voted {string} on a motion', async function(this: CustomWorld, vote: string) {
  this.testData.set('previousVote', vote);
  this.testData.set('hasVoted', true);
});

Given('I have been assigned as a proxy for {string}', async function(this: CustomWorld, delegator: string) {
  this.testData.set('proxyFor', delegator);
  this.testData.set('hasProxy', true);
  
  // Check for proxy indicator
  const proxyIndicator = await this.page!.locator(`.proxy-indicator:has-text("${delegator}")`).isVisible();
  expect(proxyIndicator).toBe(true);
});

// Multiple motions
Given('I have {int} related motions to vote on', async function(this: CustomWorld, count: number) {
  this.testData.set('relatedMotionsCount', count);
  
  // Verify motion list shows the expected count
  const motionCount = await this.page!.locator('.motion-item, .vote-item').count();
  expect(motionCount).toBe(count);
});

// Report generation
Given('I have permission to generate reports', async function(this: CustomWorld) {
  this.testData.set('canGenerateReports', true);
  
  // Verify report button is visible
  const reportButton = await this.page!.locator('button:has-text("Generate report"), button:has-text("Export report")').isVisible();
  expect(reportButton).toBe(true);
});

// Complex voting scenarios
Given('a complex motion requires two voting phases', async function(this: CustomWorld) {
  this.testData.set('votingPhases', 2);
  this.testData.set('currentPhase', 1);
});

Given('a motion requires a {int}\\/{int} majority', async function(this: CustomWorld, numerator: number, denominator: number) {
  this.testData.set('majorityRequired', { numerator, denominator });
  this.testData.set('majorityPercentage', (numerator / denominator) * 100);
});

Given('a motion {string} is in state {string}', async function(this: CustomWorld, motionId: string, state: string) {
  // This is already implemented in additional-features.steps.ts
  // But let's add it here too for clarity
  this.testData.set(`motion_${motionId}_state`, state);
});

// Vote timing and deadlines
Given('a vote has a deadline of {string}', async function(this: CustomWorld, deadline: string) {
  this.testData.set('voteDeadline', deadline);
  
  // Check for deadline display
  const deadlineDisplay = await this.page!.locator(`.deadline:has-text("${deadline}"), .vote-deadline:has-text("${deadline}")`).isVisible();
  expect(deadlineDisplay).toBe(true);
});

// Vote results
Given('a vote ended with exactly {int}\\/{int} split', async function(this: CustomWorld, yes: number, no: number) {
  this.testData.set('voteResult', { yes, no, total: yes + no });
  this.testData.set('isTiedVote', yes === no);
});

Given('a vote has finished with results:', async function(this: CustomWorld, dataTable: DataTable) {
  const results = dataTable.hashes();
  this.testData.set('voteResults', results);
  
  // Store individual results
  for (const result of results) {
    const option = result['Option'];
    const votes = parseInt(result['Votes']);
    this.testData.set(`votes_${option}`, votes);
  }
});

// Active voting
Given('a vote is currently active', async function(this: CustomWorld) {
  this.testData.set('voteActive', true);
  
  // Verify voting UI is visible
  const votingInterface = await this.page!.locator('.voting-interface, .vote-options').isVisible();
  expect(votingInterface).toBe(true);
});

Given('a vote {string} is currently running', async function(this: CustomWorld, voteId: string) {
  this.testData.set('activeVoteId', voteId);
  this.testData.set('voteActive', true);
  
  // Check for active vote indicator
  const activeIndicator = await this.page!.locator(`.vote-active:has-text("${voteId}"), .running-vote:has-text("${voteId}")`).isVisible();
  expect(activeIndicator).toBe(true);
});

Given('a vote requires {int}\\/{int} majority', async function(this: CustomWorld, numerator: number, denominator: number) {
  this.testData.set('requiredMajority', { numerator, denominator });
  this.testData.set('majorityThreshold', (numerator / denominator) * 100);
});

// Participation requirements
Given('minimum participation is {int}%', async function(this: CustomWorld, percentage: number) {
  this.testData.set('minimumParticipation', percentage);
  
  // Check for participation requirement display
  const participationRequirement = await this.page!.locator(`.participation-requirement:has-text("${percentage}%")`).isVisible();
  expect(participationRequirement).toBe(true);
});

// Vote history
Given('a vote has been completed', async function(this: CustomWorld) {
  this.testData.set('voteCompleted', true);
  
  // Check for completed vote indicator
  const completedIndicator = await this.page!.locator('.vote-completed, .vote-closed').isVisible();
  expect(completedIndicator).toBe(true);
});

Given('multiple votes have been completed', async function(this: CustomWorld) {
  this.testData.set('multipleVotesCompleted', true);
  
  // Check vote history exists
  const voteHistory = await this.page!.locator('.vote-history, .completed-votes').count();
  expect(voteHistory).toBeGreaterThan(1);
});

// Speaker management
Given('Alice is currently speaking', async function(this: CustomWorld) {
  this.testData.set('currentSpeaker', 'Alice');
  
  // Verify speaker indicator
  const speakerIndicator = await this.page!.locator('.current-speaker:has-text("Alice"), .speaking-now:has-text("Alice")').isVisible();
  expect(speakerIndicator).toBe(true);
});

Given('Bob is currently speaking', async function(this: CustomWorld) {
  this.testData.set('currentSpeaker', 'Bob');
  
  // Verify speaker indicator
  const speakerIndicator = await this.page!.locator('.current-speaker:has-text("Bob"), .speaking-now:has-text("Bob")').isVisible();
  expect(speakerIndicator).toBe(true);
});

Given('Sarah is currently speaking', async function(this: CustomWorld) {
  this.testData.set('currentSpeaker', 'Sarah');
  
  // Verify speaker indicator
  const speakerIndicator = await this.page!.locator('.current-speaker:has-text("Sarah"), .speaking-now:has-text("Sarah")').isVisible();
  expect(speakerIndicator).toBe(true);
});

Given('I need to track speaker points', async function(this: CustomWorld) {
  this.testData.set('trackSpeakerPoints', true);
  
  // Enable point tracking if needed
  const pointsEnabled = await this.page!.locator('.speaker-points, .points-tracking').isVisible();
  if (!pointsEnabled) {
    await this.page!.click('button:has-text("Enable points"), mat-checkbox:has-text("Track points")');
  }
});

Given('I select multiple speakers', async function(this: CustomWorld) {
  // Select multiple speaker checkboxes
  await this.page!.locator('.speaker-checkbox, mat-checkbox').nth(0).click();
  await this.page!.locator('.speaker-checkbox, mat-checkbox').nth(1).click();
  await this.page!.locator('.speaker-checkbox, mat-checkbox').nth(2).click();
  
  this.testData.set('multipleSpealersSelected', true);
});

Given('multiple people have spoken', async function(this: CustomWorld) {
  this.testData.set('multipleSpeakers', true);
  
  // Check speaker history
  const speakerHistory = await this.page!.locator('.speaker-history, .past-speakers').count();
  expect(speakerHistory).toBeGreaterThan(1);
});

Given('multiple speakers are waiting', async function(this: CustomWorld) {
  this.testData.set('speakersWaiting', true);
  
  // Check speaker queue
  const speakerQueue = await this.page!.locator('.speaker-queue .speaker-item').count();
  expect(speakerQueue).toBeGreaterThan(1);
});

// Multi-user scenarios
Given('multiple users are logged in', async function(this: CustomWorld) {
  this.testData.set('multipleUsersActive', true);
  
  // Check active users indicator
  const activeUsers = await this.page!.locator('.active-users, .online-count').textContent();
  const userCount = parseInt(activeUsers?.match(/\d+/)?.[0] || '0');
  expect(userCount).toBeGreaterThan(1);
});

// Discussion management
Given('a discussion has concluded', async function(this: CustomWorld) {
  this.testData.set('discussionConcluded', true);
  
  // Check for discussion closed indicator
  const discussionClosed = await this.page!.locator('.discussion-closed, .debate-ended').isVisible();
  expect(discussionClosed).toBe(true);
});

// Additional voting steps
When('I delegate my vote to {string}', async function(this: CustomWorld, delegateTo: string) {
  await this.page!.click('button:has-text("Delegate"), button:has-text("Proxy")');
  await this.page!.waitForTimeout(1000);
  
  // Select delegate
  await this.page!.fill('input[placeholder*="Search"], input[placeholder*="Delegate"]', delegateTo);
  await this.page!.click(`.search-result:has-text("${delegateTo}")`);
  
  await this.page!.click('button:has-text("Confirm"), button:has-text("Delegate")');
  await this.page!.waitForTimeout(1000);
  
  this.testData.set('delegatedTo', delegateTo);
});

Then('I should see {string} voted on my behalf', async function(this: CustomWorld, delegateName: string) {
  const delegateVote = await this.page!.locator(`.delegate-vote:has-text("${delegateName}"), .proxy-vote:has-text("${delegateName}")`).isVisible();
  expect(delegateVote).toBe(true);
});

When('I vote {string} as proxy for {string}', async function(this: CustomWorld, vote: string, proxyFor: string) {
  // Look for proxy voting interface
  const proxyVoteButton = this.page!.locator(`.proxy-vote-${vote.toLowerCase()}, button:has-text("Vote ${vote} for ${proxyFor}")`);
  await proxyVoteButton.click();
  await this.page!.waitForTimeout(1000);
  
  this.testData.set(`proxyVote_${proxyFor}`, vote);
});

Then('both votes should be recorded separately', async function(this: CustomWorld) {
  // Check for separate vote indicators
  const ownVote = await this.page!.locator('.own-vote, .personal-vote').isVisible();
  const proxyVote = await this.page!.locator('.proxy-vote, .delegated-vote').isVisible();
  
  expect(ownVote).toBe(true);
  expect(proxyVote).toBe(true);
});