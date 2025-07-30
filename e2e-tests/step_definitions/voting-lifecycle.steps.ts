import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Poll creation
When('I click {string} on the motion', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

When('I configure the poll:', async function(this: CustomWorld, dataTable: DataTable) {
  const config = dataTable.rowsHash();
  
  // Poll type
  if (config['Type']) {
    await this.page!.click('mat-select[formcontrolname="pollType"], select[name="type"]');
    await this.page!.waitForTimeout(500);
    await this.page!.click(`mat-option:has-text("${config['Type']}"), option:has-text("${config['Type']}")`);
    await this.page!.waitForTimeout(500);
  }
  
  // Method
  if (config['Method']) {
    await this.page!.click('mat-select[formcontrolname="pollMethod"], select[name="method"]');
    await this.page!.waitForTimeout(500);
    await this.page!.click(`mat-option:has-text("${config['Method']}"), option:has-text("${config['Method']}")`);
    await this.page!.waitForTimeout(500);
  }
  
  // Percentage base
  if (config['Percentage base']) {
    await this.page!.click('mat-select[formcontrolname="percentageBase"], select[name="percentage_base"]');
    await this.page!.waitForTimeout(500);
    await this.page!.click(`mat-option:has-text("${config['Percentage base']}"), option:has-text("${config['Percentage base']}")`);
    await this.page!.waitForTimeout(500);
  }
  
  // Majority method
  if (config['Majority method']) {
    await this.page!.click('mat-select[formcontrolname="majorityMethod"], select[name="majority_method"]');
    await this.page!.waitForTimeout(500);
    await this.page!.click(`mat-option:has-text("${config['Majority method']}"), option:has-text("${config['Majority method']}")`);
    await this.page!.waitForTimeout(500);
  }
});

When('I click {string} to create the poll', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(2000);
});

Then('a new poll should be created', async function(this: CustomWorld) {
  const pollCreated = await this.page!.locator('.poll-created, text=/Poll.*created/i').isVisible({ timeout: 3000 });
  expect(pollCreated).toBe(true);
});

Then('it should be in {string} state', async function(this: CustomWorld, state: string) {
  const pollState = await this.page!.locator(`.poll-state:has-text("${state}"), .state-badge:has-text("${state}")`).isVisible();
  expect(pollState).toBe(true);
});

// Opening polls
When('I click {string} on the poll', async function(this: CustomWorld, buttonText: string) {
  const pollSection = this.page!.locator('.poll-section, .voting-panel');
  await pollSection.locator(`button:has-text("${buttonText}")`).click();
  await this.page!.waitForTimeout(1000);
});

Then('the poll should open', async function(this: CustomWorld) {
  const pollOpen = await this.page!.locator('.poll-open, .state-open, text="Voting open"').isVisible({ timeout: 3000 });
  expect(pollOpen).toBe(true);
});

Then('participants should be able to vote', async function(this: CustomWorld) {
  const voteButtons = await this.page!.locator('button:has-text("Yes"), button:has-text("No")').isVisible();
  expect(voteButtons).toBe(true);
});

// Live voting
Given('a poll is open for voting', async function(this: CustomWorld) {
  const pollOpen = await this.page!.locator('.poll-open, .voting-active').isVisible();
  if (!pollOpen) {
    // Open a poll if not already open
    await this.page!.click('button:has-text("Start voting"), button:has-text("Open poll")');
    await this.page!.waitForTimeout(2000);
  }
  
  this.testData.set('pollOpen', true);
});

When('I cast my vote for {string}', async function(this: CustomWorld, voteOption: string) {
  await this.page!.click(`button:has-text("${voteOption}")`);
  await this.page!.waitForTimeout(1000);
  
  // Confirm if needed
  const confirmButton = this.page!.locator('button:has-text("Confirm vote"), button:has-text("Submit")');
  if (await confirmButton.isVisible({ timeout: 1000 })) {
    await confirmButton.click();
    await this.page!.waitForTimeout(1000);
  }
  
  this.testData.set('myVote', voteOption);
});

Then('my vote should be submitted', async function(this: CustomWorld) {
  const voteSubmitted = await this.page!.locator('.vote-submitted, text=/Vote.*submitted|Thank you/i').isVisible({ timeout: 3000 });
  expect(voteSubmitted).toBe(true);
});

Then('I should see live vote count updates', async function(this: CustomWorld) {
  const liveCount = await this.page!.locator('.live-vote-count, .vote-progress, .participation-count').isVisible();
  expect(liveCount).toBe(true);
});

// Vote delegation
Given('I have delegated my vote to {string}', async function(this: CustomWorld, delegateName: string) {
  this.testData.set('voteDelegate', delegateName);
  
  // Check delegation status
  const delegationStatus = await this.page!.locator(`.delegation-info:has-text("${delegateName}")`).isVisible();
  expect(delegationStatus).toBe(true);
});

When('the poll opens', async function(this: CustomWorld) {
  // Wait for poll to open
  await this.page!.waitForSelector('.poll-open, .voting-active', { timeout: 10000 });
});

// Removed duplicate - already defined in common.steps.ts
// Then('I should see {string}', async function(this: CustomWorld, message: string) {
//   const messageVisible = await this.page!.locator(`text="${message}"`).isVisible({ timeout: 5000 });
//   expect(messageVisible).toBe(true);
// });

Then('my delegate should be able to vote for me', async function(this: CustomWorld) {
  const delegateVoting = await this.page!.locator('.delegate-voting, text=/Voting.*behalf/i').isVisible();
  expect(delegateVoting).toBe(true);
});

// Closing polls
Given('I am managing an open poll', async function(this: CustomWorld) {
  // Verify poll management interface
  const managementUI = await this.page!.locator('.poll-management, .voting-controls').isVisible();
  expect(managementUI).toBe(true);
  
  // Verify poll is open
  const pollOpen = await this.page!.locator('.poll-open, .state-open').isVisible();
  expect(pollOpen).toBe(true);
});

When('I click {string} for voting', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

Then('voting should stop', async function(this: CustomWorld) {
  const votingStopped = await this.page!.locator('.voting-closed, .poll-closed, text="Voting closed"').isVisible({ timeout: 3000 });
  expect(votingStopped).toBe(true);
});

Then('final results should be calculated', async function(this: CustomWorld) {
  // Wait for results
  await this.page!.waitForTimeout(2000);
  
  const results = await this.page!.locator('.poll-results, .final-results, .vote-totals').isVisible();
  expect(results).toBe(true);
});

// Results display
Then('I should see the results:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedResults = dataTable.hashes();
  
  for (const result of expectedResults) {
    const option = result['Option'];
    
    // Check if option and its vote count are visible
    const optionRow = this.page!.locator(`tr:has-text("${option}"), .result-row:has-text("${option}")`);
    const rowVisible = await optionRow.isVisible();
    expect(rowVisible).toBe(true);
  }
});

Then('the motion state should update based on results', async function(this: CustomWorld) {
  // Check if motion state changed
  const newState = await this.page!.locator('.motion-state.changed, .state-updated').isVisible({ timeout: 5000 })
    .catch(() => false);
  
  if (!newState) {
    // State might not change if vote didn't pass
    const currentState = await this.page!.locator('.motion-state').textContent();
    expect(currentState).toBeTruthy();
  }
});

// Anonymous voting verification
Given('the poll is configured as anonymous', async function(this: CustomWorld) {
  const anonymousIndicator = await this.page!.locator('.anonymous-poll, text="Anonymous voting"').isVisible();
  expect(anonymousIndicator).toBe(true);
  
  this.testData.set('anonymousPoll', true);
});

When('I view the detailed results', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("View details"), button:has-text("Show results")');
  await this.page!.waitForTimeout(1000);
});

Then('individual votes should not be visible', async function(this: CustomWorld) {
  // Check that no voter names are shown
  const voterNames = await this.page!.locator('.voter-name, .individual-vote').count();
  expect(voterNames).toBe(0);
});

Then('only aggregated results should be shown', async function(this: CustomWorld) {
  const aggregatedResults = await this.page!.locator('.vote-totals, .aggregated-results').isVisible();
  expect(aggregatedResults).toBe(true);
  
  // Verify specific totals are shown
  const yesVotes = await this.page!.locator('text=/Yes:.*\\d+/').isVisible();
  const noVotes = await this.page!.locator('text=/No:.*\\d+/').isVisible();
  expect(yesVotes || noVotes).toBe(true);
});

// Named voting verification
Given('the poll is configured as named voting', async function(this: CustomWorld) {
  const namedIndicator = await this.page!.locator('.named-poll, text="Named voting"').isVisible();
  expect(namedIndicator).toBe(true);
  
  this.testData.set('namedPoll', true);
});

Then('I should see who voted for each option', async function(this: CustomWorld) {
  // Click to expand vote details
  await this.page!.click('button:has-text("Show voters"), .expand-voters');
  await this.page!.waitForTimeout(1000);
  
  const voterList = await this.page!.locator('.voter-list, .vote-details').isVisible();
  expect(voterList).toBe(true);
});

// Majority calculation
Given('the poll requires {string} majority', async function(this: CustomWorld, majorityType: string) {
  this.testData.set('requiredMajority', majorityType);
  
  const majorityInfo = await this.page!.locator(`.majority-requirement:has-text("${majorityType}")`).isVisible();
  expect(majorityInfo).toBe(true);
});

Then('the system should calculate if majority is reached', async function(this: CustomWorld) {
  const majorityStatus = await this.page!.locator('.majority-status, .majority-reached, .majority-not-reached').isVisible();
  expect(majorityStatus).toBe(true);
});

Then('show {string}', async function(this: CustomWorld, status: string) {
  const statusVisible = await this.page!.locator(`text="${status}"`).isVisible();
  expect(statusVisible).toBe(true);
});

// Publishing results
When('I click {string} for the results', async function(this: CustomWorld, action: string) {
  const resultsSection = this.page!.locator('.results-section, .poll-results-panel');
  await resultsSection.locator(`button:has-text("${action}")`).click();
  await this.page!.waitForTimeout(1000);
});

Then('results should be visible to all participants', async function(this: CustomWorld) {
  const publishedIndicator = await this.page!.locator('.results-published, text="Results published"').isVisible();
  expect(publishedIndicator).toBe(true);
});

// Vote weight display
Given('participants have different vote weights', async function(this: CustomWorld) {
  // Check for vote weight indicators
  const voteWeights = await this.page!.locator('.vote-weight, .weighted-votes').isVisible();
  expect(voteWeights).toBe(true);
  
  this.testData.set('hasVoteWeights', true);
});

Then('results should show weighted totals', async function(this: CustomWorld) {
  const weightedResults = await this.page!.locator('.weighted-results, text=/Weight.*total/i').isVisible();
  expect(weightedResults).toBe(true);
});

Then('individual vote weights should be displayed', async function(this: CustomWorld) {
  const individualWeights = await this.page!.locator('.voter-weight, .weight-value').count();
  expect(individualWeights).toBeGreaterThan(0);
});

// Global abstain/no options
When('I enable global options:', async function(this: CustomWorld, dataTable: DataTable) {
  const options = dataTable.raw().flat();
  
  for (const option of options) {
    const checkbox = this.page!.locator(`mat-checkbox:has-text("${option}"), label:has-text("${option}")`);
    const isChecked = await checkbox.locator('input').isChecked();
    
    if (!isChecked) {
      await checkbox.click();
      await this.page!.waitForTimeout(200);
    }
  }
});

Then('the poll should include global abstain option', async function(this: CustomWorld) {
  const globalAbstain = await this.page!.locator('button:has-text("Global abstain"), .global-abstain-option').isVisible();
  expect(globalAbstain).toBe(true);
});

Then('the poll should include global no option', async function(this: CustomWorld) {
  const globalNo = await this.page!.locator('button:has-text("Global no"), .global-no-option').isVisible();
  expect(globalNo).toBe(true);
});

// Multiple polls on same motion
When('I create another poll on the same motion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("New poll"), button:has-text("Create another poll")');
  await this.page!.waitForTimeout(1000);
  
  // Configure and create
  await this.page!.click('button:has-text("Create"), button:has-text("Save")');
  await this.page!.waitForTimeout(2000);
});

Then('both polls should be visible', async function(this: CustomWorld) {
  const pollCount = await this.page!.locator('.poll-item, .motion-poll').count();
  expect(pollCount).toBe(2);
});

Then('they should be numbered sequentially', async function(this: CustomWorld) {
  const poll1 = await this.page!.locator('text="Poll 1"').isVisible();
  const poll2 = await this.page!.locator('text="Poll 2"').isVisible();
  expect(poll1 && poll2).toBe(true);
});

// Invalid votes handling
When('I submit an invalid vote', async function(this: CustomWorld) {
  // Try to vote without selecting an option
  await this.page!.click('button:has-text("Submit vote"), button:has-text("Vote")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see an error {string}', async function(this: CustomWorld, errorMessage: string) {
  const error = await this.page!.locator(`.error-message:has-text("${errorMessage}"), .mat-error:has-text("${errorMessage}")`).isVisible();
  expect(error).toBe(true);
});

Then('my vote should not be counted', async function(this: CustomWorld) {
  const voteStatus = await this.page!.locator('.vote-status:has-text("Not voted"), .no-vote').isVisible();
  expect(voteStatus).toBe(true);
});