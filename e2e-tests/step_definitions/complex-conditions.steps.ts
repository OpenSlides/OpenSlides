import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Complex multi-condition steps
Then('speakers should alternate pro\\/contra', async function(this: CustomWorld) {
  const speakers = await this.page!.locator('.speaker-item').all();
  let lastType = '';
  
  for (const speaker of speakers) {
    const speakerText = await speaker.textContent();
    const currentType = speakerText?.includes('Pro') ? 'pro' : 'contra';
    
    if (lastType && lastType === currentType) {
      throw new Error('Speakers are not alternating pro/contra');
    }
    lastType = currentType;
  }
});

Then('speakers should be notified of changes', async function(this: CustomWorld) {
  const notification = await this.page!.locator('.speaker-notification, text=/Speaker.*notified/i').isVisible();
  expect(notification).toBe(true);
});

Then('statistics should update', async function(this: CustomWorld) {
  // Wait for statistics to update
  await this.page!.waitForTimeout(1000);
  
  const statsUpdated = await this.page!.locator('.statistics-updated, [data-stats-refreshed]').isVisible();
  expect(statsUpdated).toBe(true);
});

Then('technical issues have been reported', async function(this: CustomWorld) {
  const issueReported = await this.page!.locator('.technical-issue-reported, text=/Technical.*issue/i').isVisible();
  expect(issueReported).toBe(true);
});

Then('the anonymity should be preserved in all reports', async function(this: CustomWorld) {
  const reports = await this.page!.locator('.report-section, .export-preview').all();
  
  for (const report of reports) {
    const reportText = await report.textContent();
    expect(reportText).not.toContain('participant names');
    expect(reportText).not.toMatch(/\b[A-Z][a-z]+\s[A-Z][a-z]+\b/); // No full names
  }
});

Given('the current time is {string}', async function(this: CustomWorld, timeString: string) {
  // Store the current time for testing
  this.testData.set('currentTime', timeString);
  
  // Some tests might need to mock the time
  await this.page!.evaluate((time) => {
    (window as any).__mockTime = time;
  }, timeString);
});

Then('the delete action should be prevented', async function(this: CustomWorld) {
  const deletePrevented = await this.page!.locator('.delete-prevented, text=/Cannot.*delete/i').isVisible();
  expect(deletePrevented).toBe(true);
});

Then('the motion state should update based on the outcome', async function(this: CustomWorld) {
  const stateUpdated = await this.page!.locator('.motion-state-updated, .state-changed').isVisible();
  expect(stateUpdated).toBe(true);
});

Then('the results should update in real-time', async function(this: CustomWorld) {
  const realtimeUpdate = await this.page!.locator('.realtime-results, [data-live-update]').isVisible();
  expect(realtimeUpdate).toBe(true);
});

Then('the status should update in real-time', async function(this: CustomWorld) {
  const statusUpdate = await this.page!.locator('.status-realtime, .live-status').isVisible();
  expect(statusUpdate).toBe(true);
});

Then('the user should be able to login with the new password', async function(this: CustomWorld) {
  // Logout first
  await this.page!.click('button:has-text("Logout"), [aria-label="Logout"]');
  await this.page!.waitForTimeout(1000);
  
  // Try login with new password
  const newPassword = this.testData.get('newPassword') || 'newPassword123';
  await this.page!.fill('input[formcontrolname="username"]', 'testuser');
  await this.page!.fill('input[formcontrolname="password"]', newPassword);
  await this.page!.click('button[type="submit"]');
  
  // Verify successful login
  await this.page!.waitForURL('**/dashboard', { timeout: 5000 });
});

Then('the vote count should reflect all delegations', async function(this: CustomWorld) {
  const voteCount = await this.page!.locator('.vote-count, .total-votes').textContent();
  const delegations = this.testData.get('delegationCount') || 0;
  
  expect(voteCount).toContain((delegations + 1).toString());
});

Then('the vote counting should follow {string} rules', async function(this: CustomWorld, countingRule: string) {
  const ruleApplied = await this.page!.locator(`.counting-rule:has-text("${countingRule}")`).isVisible();
  expect(ruleApplied).toBe(true);
});

Then('they should see their position in queue', async function(this: CustomWorld) {
  const queuePosition = await this.page!.locator('.queue-position, .speaker-number').isVisible();
  expect(queuePosition).toBe(true);
});

Then('time limits should apply automatically', async function(this: CustomWorld) {
  const timeLimitActive = await this.page!.locator('.time-limit-active, .timer-running').isVisible();
  expect(timeLimitActive).toBe(true);
});

Then('visible only to operators', async function(this: CustomWorld) {
  // Check if current user is operator
  const userRole = this.testData.get('currentUserRole');
  
  if (userRole !== 'operator' && userRole !== 'administrator') {
    const hiddenContent = await this.page!.locator('.operator-only').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hiddenContent).toBe(false);
  }
});

Then('warning sound should play', async function(this: CustomWorld) {
  // Check if audio element exists and is playing
  const audioPlaying = await this.page!.evaluate(() => {
    const audio = document.querySelector('audio');
    return audio && !audio.paused;
  });
  
  expect(audioPlaying).toBe(true);
});

// Given conditions
Given('{int} speakers are in queue', async function(this: CustomWorld, speakerCount: number) {
  const actualCount = await this.page!.locator('.speaker-item').count();
  expect(actualCount).toBe(speakerCount);
});

Given('normal speakers are in queue', async function(this: CustomWorld) {
  const speakers = await this.page!.locator('.speaker-item:not(.priority)').count();
  expect(speakers).toBeGreaterThan(0);
});

Given('some participants are remote', async function(this: CustomWorld) {
  const remoteParticipants = await this.page!.locator('.participant-remote, [data-remote="true"]').count();
  expect(remoteParticipants).toBeGreaterThan(0);
  this.testData.set('hasRemoteParticipants', true);
});

Given('speaking time is set to {int} minutes', async function(this: CustomWorld, minutes: number) {
  this.testData.set('speakingTimeLimit', minutes);
  
  // Verify time limit is set
  const timeLimit = await this.page!.locator('.time-limit-setting').textContent();
  expect(timeLimit).toContain(`${minutes}`);
});

Given('the topic has controversial discussion', async function(this: CustomWorld) {
  this.testData.set('controversialTopic', true);
  
  // This might check for certain indicators
  const controversial = await this.page!.locator('.topic-controversial, [data-controversial="true"]').isVisible();
  expect(controversial).toBe(true);
});

Given('voting allows changing votes', async function(this: CustomWorld) {
  const changeAllowed = await this.page!.locator('.vote-change-allowed, input[name="allowVoteChange"]:checked').isVisible();
  expect(changeAllowed).toBe(true);
  this.testData.set('voteChangeAllowed', true);
});

// Complex Then conditions
Then('{int} linked votes should be created', async function(this: CustomWorld, voteCount: number) {
  const linkedVotes = await this.page!.locator('.linked-vote, .vote-linked').count();
  expect(linkedVotes).toBe(voteCount);
});

Then('I should see a preview thumbnail', async function(this: CustomWorld) {
  const thumbnail = await this.page!.locator('.preview-thumbnail, img.preview').isVisible();
  expect(thumbnail).toBe(true);
});

Then('I should see exactly what would be projected', async function(this: CustomWorld) {
  const projectionPreview = await this.page!.locator('.projection-preview, .projector-preview').isVisible();
  expect(projectionPreview).toBe(true);
});

Then('a new vote should be created', async function(this: CustomWorld) {
  const newVote = await this.page!.locator('.vote-created, text=/Vote.*created/i').isVisible();
  expect(newVote).toBe(true);
});

Then('all selected users should be deleted', async function(this: CustomWorld) {
  const selectedUsers = this.testData.get('selectedUsers') || [];
  
  for (const user of selectedUsers) {
    const userExists = await this.page!.locator(`text="${user}"`).isVisible({ timeout: 1000 }).catch(() => false);
    expect(userExists).toBe(false);
  }
});

Then('all speakers should be removed', async function(this: CustomWorld) {
  const speakerCount = await this.page!.locator('.speaker-item').count();
  expect(speakerCount).toBe(0);
});

Then('board members\' votes should count 3x', async function(this: CustomWorld) {
  const weightedVotes = await this.page!.locator('.weighted-vote:has-text("3x"), .vote-weight:has-text("3")').isVisible();
  expect(weightedVotes).toBe(true);
});

Then('new registrations are allowed', async function(this: CustomWorld) {
  const registrationOpen = await this.page!.locator('.registration-open, button:has-text("Register to speak")').isVisible();
  expect(registrationOpen).toBe(true);
});

Then('no new speakers can be added', async function(this: CustomWorld) {
  const registrationClosed = await this.page!.locator('.registration-closed, text="Speaker list closed"').isVisible();
  expect(registrationClosed).toBe(true);
});

Then('only qualified voters should participate', async function(this: CustomWorld) {
  const voterList = await this.page!.locator('.voter-qualified, .eligible-voter').count();
  const totalVoters = await this.page!.locator('.voter-item').count();
  
  expect(voterList).toBe(totalVoters);
});

Then('participant names should not be recorded', async function(this: CustomWorld) {
  const voteRecords = await this.page!.locator('.vote-record, .vote-detail').all();
  
  for (const record of voteRecords) {
    const recordText = await record.textContent();
    expect(recordText).not.toMatch(/\b[A-Z][a-z]+\s[A-Z][a-z]+\b/); // No full names
  }
});

Then('participants should vote on all items in sequence', async function(this: CustomWorld) {
  const sequentialVoting = await this.page!.locator('.sequential-voting, .vote-sequence').isVisible();
  expect(sequentialVoting).toBe(true);
});

Then('she should cast {int} separate votes', async function(this: CustomWorld, voteCount: number) {
  const votesCount = await this.page!.locator('.vote-cast, .submitted-vote').count();
  expect(votesCount).toBe(voteCount);
});

Then('she should get priority placement', async function(this: CustomWorld) {
  const priorityPlacement = await this.page!.locator('.speaker-priority, .priority-speaker').first().isVisible();
  expect(priorityPlacement).toBe(true);
});

Then('she should jump to priority queue', async function(this: CustomWorld) {
  const inPriorityQueue = await this.page!.locator('.priority-queue .speaker-item').first().isVisible();
  expect(inPriorityQueue).toBe(true);
});

Then('she should see {string}', async function(this: CustomWorld, expectedText: string) {
  const textVisible = await this.page!.locator(`text="${expectedText}"`).isVisible();
  expect(textVisible).toBe(true);
});

Then('speakers should be categorized', async function(this: CustomWorld) {
  const categories = await this.page!.locator('.speaker-category, .speaker-type').count();
  expect(categories).toBeGreaterThan(1);
});

Then('system should verify connection', async function(this: CustomWorld) {
  const connectionVerified = await this.page!.locator('.connection-verified, .connection-check-passed').isVisible();
  expect(connectionVerified).toBe(true);
});