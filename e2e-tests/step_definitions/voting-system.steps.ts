import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Background steps
// Removed duplicate - using auth-roles.steps.ts version

// Removed duplicate - using real-time.steps.ts version of "I am in an active meeting"

Given('electronic voting is enabled', async function(this: CustomWorld) {
  // This is typically a meeting configuration
  // For testing, we assume it's already enabled
  this.testData.set('electronicVotingEnabled', true);
});

// Motion voting
Given('a motion {string} has an active vote', async function(this: CustomWorld, motionTitle: string) {
  this.testData.set('activeMotion', motionTitle);
  this.testData.set('voteActive', true);
});

When('I navigate to the motion {string}', async function(this: CustomWorld, motionTitle: string) {
  // Navigate to motions
  const motionNavSelectors = [
    'a[href*="/motions"]',
    'a:has-text("Motions")',
    'nav >> text="Motions"',
    '.nav-link:has-text("Motions")'
  ];
  
  let navClicked = false;
  for (const selector of motionNavSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        await element.click();
        navClicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!navClicked) {
    // Try direct navigation
    await this.page!.goto(`${this.baseUrl}/${this.currentMeetingId || '1'}/motions`);
  }
  
  await this.page!.waitForTimeout(1000);
  
  // Click on the specific motion
  const motionSelectors = [
    `a:has-text("${motionTitle}")`,
    `mat-row:has-text("${motionTitle}")`,
    `tr:has-text("${motionTitle}")`,
    `.motion-item:has-text("${motionTitle}")`,
    `text="${motionTitle}"`
  ];
  
  let clicked = false;
  for (const selector of motionSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        await element.click();
        clicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!clicked) {
    throw new Error(`Could not find motion: ${motionTitle}`);
  }
  
  await this.page!.waitForTimeout(1000);
});

Then('I should see the voting interface', async function(this: CustomWorld) {
  // Look for voting buttons or interface
  const voteInterface = await this.page!.locator('.voting-interface, .vote-panel, .poll-form').isVisible();
  expect(voteInterface).toBe(true);
});

When('I select {string} and submit my vote', async function(this: CustomWorld, voteOption: string) {
  // Click the vote option - try multiple selectors
  const optionSelectors = [
    `button:has-text("${voteOption}")`,
    `mat-radio-button:has-text("${voteOption}")`,
    `label:has-text("${voteOption}")`,
    `input[value="${voteOption.toLowerCase()}"]`,
    `.vote-option:has-text("${voteOption}")`
  ];
  
  let optionClicked = false;
  for (const selector of optionSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        await element.click();
        optionClicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!optionClicked) {
    throw new Error(`Could not find vote option: ${voteOption}`);
  }
  
  // Submit the vote
  const submitSelectors = [
    'button:has-text("Submit vote")',
    'button:has-text("Cast vote")',
    'button:has-text("Vote")',
    'button[type="submit"]'
  ];
  
  let submitted = false;
  for (const selector of submitSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 500 })) {
        await button.click();
        submitted = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!submitted) {
    throw new Error('Could not find submit vote button');
  }
  
  await this.page!.waitForTimeout(1000);
  this.testData.set('myVote', voteOption);
});

Then('I should see a confirmation message', async function(this: CustomWorld) {
  const confirmation = await this.page!.locator('.vote-confirmation, .mat-snack-bar:has-text("vote"), text=/vote.*submitted|recorded/i').isVisible();
  expect(confirmation).toBe(true);
});

Then('my vote should be recorded', async function(this: CustomWorld) {
  // Check for vote status indicator
  const voteStatus = await this.page!.locator('.vote-status:has-text("Voted"), .voted-indicator').isVisible();
  expect(voteStatus).toBe(true);
});

Then('I should not be able to vote again', async function(this: CustomWorld) {
  // Vote buttons should be disabled or hidden
  const voteButtons = await this.page!.locator('button:has-text("Yes"), button:has-text("No")').isDisabled();
  expect(voteButtons).toBe(true);
});

// Anonymous voting
Given('a motion has an anonymous vote configured', async function(this: CustomWorld) {
  this.testData.set('anonymousVote', true);
});

When('I cast my vote', async function(this: CustomWorld) {
  // Cast a vote (Yes/No/Abstain) - try multiple selectors
  const voteSelectors = [
    'button:has-text("Yes")',
    'mat-radio-button:has-text("Yes")',
    'label:has-text("Yes")',
    '.vote-option:has-text("Yes")'
  ];
  
  let voteClicked = false;
  for (const selector of voteSelectors) {
    try {
      const element = this.page!.locator(selector).first();
      if (await element.isVisible({ timeout: 500 })) {
        await element.click();
        voteClicked = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!voteClicked) {
    throw new Error('Could not find Yes vote option');
  }
  
  // Submit the vote
  const submitSelectors = [
    'button:has-text("Submit vote")',
    'button:has-text("Cast vote")',
    'button:has-text("Vote")',
    'button[type="submit"]'
  ];
  
  let submitted = false;
  for (const selector of submitSelectors) {
    try {
      const button = this.page!.locator(selector).first();
      if (await button.isVisible({ timeout: 500 })) {
        await button.click();
        submitted = true;
        break;
      }
    } catch {
      // Continue
    }
  }
  
  if (!submitted) {
    throw new Error('Could not find submit vote button');
  }
  
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - using the first version of 'my vote should be recorded' from line 65

Then('my name should not be associated with the vote', async function(this: CustomWorld) {
  // In anonymous voting, individual votes shouldn't show names
  const myName = 'delegate'; // Current user
  const voteWithName = await this.page!.locator(`.vote-entry:has-text("${myName}")`).count();
  expect(voteWithName).toBe(0);
});

Then('only the vote totals should be visible', async function(this: CustomWorld) {
  // Check for vote totals display
  const voteTotals = await this.page!.locator('.vote-totals, .vote-results').isVisible();
  expect(voteTotals).toBe(true);
  
  // Should see numbers but not names
  const yesVotes = await this.page!.locator('text=/Yes:.*\\d+/').isVisible();
  const noVotes = await this.page!.locator('text=/No:.*\\d+/').isVisible();
  expect(yesVotes || noVotes).toBe(true);
});

// Delegation
// Removed duplicate - already defined in voting-lifecycle.steps.ts
// Given('I have delegated my vote to {string}', async function(this: CustomWorld, delegateName: string) {
//   this.testData.set('voteDelegate', delegateName);
//   // In real implementation, this would be set up in user settings
// });

Given('a motion has a named vote', async function(this: CustomWorld) {
  this.testData.set('namedVote', true);
});

When('the voting starts', async function(this: CustomWorld) {
  // Wait for vote to become active
  await this.page!.waitForSelector('.vote-active, .voting-open', { timeout: 5000 });
});

Then('{string} should be able to vote on my behalf', async function(this: CustomWorld, delegateName: string) {
  // Check delegation indicator
  const delegationInfo = await this.page!.locator(`.delegation-info:has-text("${delegateName}")`).isVisible();
  expect(delegationInfo).toBe(true);
});

Then('the vote should show as delegated', async function(this: CustomWorld) {
  const delegatedStatus = await this.page!.locator('.vote-status:has-text("Delegated")').isVisible();
  expect(delegatedStatus).toBe(true);
});

// Elections
Given('an election {string} is active with {int} positions', async function(this: CustomWorld, electionName: string, positions: number) {
  this.testData.set('activeElection', electionName);
  this.testData.set('electionPositions', positions);
});

Given('there are {int} candidates', async function(this: CustomWorld, candidateCount: number) {
  this.testData.set('candidateCount', candidateCount);
});

When('I open the election voting interface', async function(this: CustomWorld) {
  // Navigate to elections
  await this.page!.click('a:has-text("Elections"), nav >> text="Elections"');
  await this.page!.waitForTimeout(1000);
  
  const electionName = this.testData.get('activeElection');
  await this.page!.click(`text="${electionName}"`);
  await this.page!.waitForTimeout(1000);
});

Then('I should be able to select up to {int} candidates', async function(this: CustomWorld, maxSelections: number) {
  // Count available candidate checkboxes
  const candidateCheckboxes = await this.page!.locator('.candidate-checkbox, input[type="checkbox"].candidate').count();
  expect(candidateCheckboxes).toBeGreaterThanOrEqual(maxSelections);
  
  // Store max selections for validation
  this.testData.set('maxSelections', maxSelections);
});

When('I select my preferred candidates and submit', async function(this: CustomWorld) {
  const maxSelections = this.testData.get('maxSelections') || 3;
  
  // Select first N candidates
  for (let i = 0; i < maxSelections; i++) {
    await this.page!.locator('.candidate-checkbox, input[type="checkbox"].candidate').nth(i).click();
  }
  
  // Submit the vote
  await this.page!.click('button:has-text("Submit vote"), button:has-text("Cast ballot")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see a confirmation', async function(this: CustomWorld) {
  const confirmation = await this.page!.locator('.election-confirmation, text="Your ballot has been cast"').isVisible();
  expect(confirmation).toBe(true);
});

// Weighted voting
Given('I represent an organization with {int} votes', async function(this: CustomWorld, voteWeight: number) {
  this.testData.set('voteWeight', voteWeight);
  // This would be configured in the user's profile
});

Given('weighted voting is enabled', async function(this: CustomWorld) {
  this.testData.set('weightedVotingEnabled', true);
});

When('I vote on a motion', async function(this: CustomWorld) {
  // Cast a vote
  await this.page!.click('button:has-text("Yes")');
  await this.page!.click('button:has-text("Submit vote")');
  await this.page!.waitForTimeout(1000);
});

// Removed duplicate - already defined in voting-extended.steps.ts
// Then('my vote should count as {int} votes', async function(this: CustomWorld, expectedWeight: number) {
//   // Check that the vote weight is displayed
//   const voteWeightDisplay = await this.page!.locator(`.vote-weight:has-text("${expectedWeight}"), text="Weight: ${expectedWeight}"`).isVisible();
//   expect(voteWeightDisplay).toBe(true);
// });

Then('the vote weight should be clearly displayed', async function(this: CustomWorld) {
  const voteWeight = this.testData.get('voteWeight');
  const weightIndicator = await this.page!.locator('.vote-weight-indicator, .weighted-vote-info').isVisible();
  expect(weightIndicator).toBe(true);
});

// Additional voting scenarios
Given('voting is currently in progress', async function(this: CustomWorld) {
  this.testData.set('votingInProgress', true);
});

Then('I should see the time remaining', async function(this: CustomWorld) {
  const timer = await this.page!.locator('.vote-timer, .countdown, text=/\\d+:\\d+/').isVisible();
  expect(timer).toBe(true);
});

Then('I should see real-time vote updates', async function(this: CustomWorld) {
  // Check for live vote counter
  const liveCounter = await this.page!.locator('.live-vote-count, .vote-progress').isVisible();
  expect(liveCounter).toBe(true);
});

When('the voting period ends', async function(this: CustomWorld) {
  // Wait for voting to close (in real test, this would be time-based)
  await this.page!.waitForTimeout(5000);
});

Then('the final results should be displayed', async function(this: CustomWorld) {
  const results = await this.page!.locator('.vote-results, .final-results').isVisible();
  expect(results).toBe(true);
});

Then('I should see the vote breakdown', async function(this: CustomWorld) {
  // Check for detailed results
  const yesVotes = await this.page!.locator('text=/Yes:.*\\d+/').isVisible();
  const noVotes = await this.page!.locator('text=/No:.*\\d+/').isVisible();
  const abstainVotes = await this.page!.locator('text=/Abstain:.*\\d+/').isVisible();
  
  expect(yesVotes && noVotes).toBe(true);
});