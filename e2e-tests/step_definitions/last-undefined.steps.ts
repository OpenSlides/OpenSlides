import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Removed duplicate - use '{string} button appears' from last-remaining.steps.ts

// Video spotlight
Then('his video should be spotlighted', async function(this: CustomWorld) {
  const spotlight = await this.page!.locator('.video-spotlight, .speaker-video.active').isVisible();
  expect(spotlight).toBe(true);
});

Then('her video should be spotlighted', async function(this: CustomWorld) {
  const spotlight = await this.page!.locator('.video-spotlight, .speaker-video.active').isVisible();
  expect(spotlight).toBe(true);
});

// Removed duplicate - use 'it should contain all selected user data' from last-remaining.steps.ts

Then('it should include all selected metadata', async function(this: CustomWorld) {
  const metadataIncluded = await this.page!.locator('text=/Metadata.*included|All.*fields.*exported/i').isVisible();
  expect(metadataIncluded).toBe(true);
});

// Vote references
Then('it should reference the original vote', async function(this: CustomWorld) {
  const reference = await this.page!.locator('.original-vote-ref, text=/Original.*vote|Reference.*previous/i').isVisible();
  expect(reference).toBe(true);
});

// Removed duplicate - use 'next speaker should be highlighted' from last-remaining.steps.ts

// Removed duplicate - use 'no more votes should be accepted' from last-remaining.steps.ts

// Removed duplicate - use 'notifications should be sent' from last-remaining.steps.ts

// Observer interface
Then('observers should not see voting interface', async function(this: CustomWorld) {
  const votingInterface = await this.page!.locator('.voting-interface, .vote-buttons').isVisible({ timeout: 1000 }).catch(() => false);
  expect(votingInterface).toBe(false);
});

// Audio control
Then('other participants should be muted', async function(this: CustomWorld) {
  const mutedIndicator = await this.page!.locator('.participants-muted, mat-icon:has-text("mic_off")').count();
  expect(mutedIndicator).toBeGreaterThan(0);
});

// Removed duplicate - use 'participants see closed status' from last-remaining.steps.ts

// Removed duplicate - use 'participants should be notified of cancellation' from last-remaining.steps.ts

Then('participants should be notified of revote', async function(this: CustomWorld) {
  const revoteNotice = await this.page!.locator('text=/Revote.*required|New.*vote.*started/i').isVisible();
  expect(revoteNotice).toBe(true);
});

// Removed duplicate - use 'participants should see the voting interface' from last-remaining.steps.ts

// Charts and visualization
Then('participation distribution charts', async function(this: CustomWorld) {
  const charts = await this.page!.locator('.participation-chart, canvas, .chart-container').isVisible();
  expect(charts).toBe(true);
});

// Removed duplicate - use 'preliminary results should be available' from last-remaining.steps.ts

// Removed duplicate - use 'queue ordering should respect priorities' from last-remaining.steps.ts

// Results collection
Then('results should be collected together', async function(this: CustomWorld) {
  const consolidatedResults = await this.page!.locator('.consolidated-results, .combined-results').isVisible();
  expect(consolidatedResults).toBe(true);
});

// Removed duplicate - use 'she should have reduced time limit' from last-remaining.steps.ts

Then('he should have reduced time limit', async function(this: CustomWorld) {
  const timeLimit = await this.page!.locator('.time-limit, .speaker-time').textContent();
  const reducedTime = parseInt(timeLimit?.match(/\d+/)?.[0] || '0') < 180; // Less than 3 minutes
  expect(reducedTime).toBe(true);
});

// Majority requirements
Then('show that the motion failed to reach {int}\\/{int} majority', async function(this: CustomWorld, numerator: number, denominator: number) {
  const failureMessage = await this.page!.locator(`text=/Failed.*${numerator}.*${denominator}|Did.*not.*reach.*majority/i`).isVisible();
  expect(failureMessage).toBe(true);
});

// Additional speaker-related steps
Then('speaker history should show {string} and {string}', async function(this: CustomWorld, speaker1: string, speaker2: string) {
  const history = await this.page!.locator('.speaker-history, .past-speakers');
  const hasSpeaker1 = await history.locator(`text="${speaker1}"`).isVisible();
  const hasSpeaker2 = await history.locator(`text="${speaker2}"`).isVisible();
  expect(hasSpeaker1 && hasSpeaker2).toBe(true);
});

Then('speaker queue should be clear', async function(this: CustomWorld) {
  const queueCount = await this.page!.locator('.speaker-queue .speaker-item').count();
  expect(queueCount).toBe(0);
});

Then('speaker time should reset', async function(this: CustomWorld) {
  const timer = await this.page!.locator('.speaker-timer').textContent();
  expect(timer).toBe('00:00');
});

Then('speaking time should be tracked', async function(this: CustomWorld) {
  const timeTracking = await this.page!.locator('.time-tracking, .speaker-duration').isVisible();
  expect(timeTracking).toBe(true);
});

// System status
Then('system should be in read-only mode', async function(this: CustomWorld) {
  const readOnly = await this.page!.locator('.read-only-mode, text=/Read.*only|View.*only/i').isVisible();
  expect(readOnly).toBe(true);
});

Then('system should prevent new entries', async function(this: CustomWorld) {
  const addButton = await this.page!.locator('button:has-text("Add"), button:has-text("Create")').isEnabled();
  expect(addButton).toBe(false);
});

// Template usage
Then('template should be used', async function(this: CustomWorld) {
  const templateApplied = await this.page!.locator('text=/Template.*applied|Using.*template/i').isVisible();
  expect(templateApplied).toBe(true);
});

// Text display
Then('text {string} should be shown', async function(this: CustomWorld, text: string) {
  const textVisible = await this.page!.locator(`text="${text}"`).isVisible();
  expect(textVisible).toBe(true);
});

Then('the agenda should update automatically', async function(this: CustomWorld) {
  // Check for auto-update indicator or new content
  const updated = await this.page!.locator('.auto-updated, text=/Updated.*automatically/i').isVisible();
  expect(updated).toBe(true);
});

Then('the amendment should be integrated', async function(this: CustomWorld) {
  const integrated = await this.page!.locator('text=/Amendment.*integrated|Merged.*changes/i').isVisible();
  expect(integrated).toBe(true);
});

Then('the chat should show {string} joined', async function(this: CustomWorld, userName: string) {
  const joinMessage = await this.page!.locator(`.chat-message:has-text("${userName} joined")`).isVisible();
  expect(joinMessage).toBe(true);
});

Then('the list should be empty', async function(this: CustomWorld) {
  const listEmpty = await this.page!.locator('.empty-list, text=/No.*items|Empty.*list/i').isVisible();
  expect(listEmpty).toBe(true);
});

Then('the list should be locked', async function(this: CustomWorld) {
  const locked = await this.page!.locator('.list-locked, mat-icon:has-text("lock")').isVisible();
  expect(locked).toBe(true);
});

Then('the meeting should be cancelled', async function(this: CustomWorld) {
  const cancelled = await this.page!.locator('.meeting-cancelled, text="Cancelled"').isVisible();
  expect(cancelled).toBe(true);
});

Then('the message should appear in chat', async function(this: CustomWorld) {
  const messageCount = await this.page!.locator('.chat-message').count();
  expect(messageCount).toBeGreaterThan(0);
});

Then('the motion should advance to state {string}', async function(this: CustomWorld, state: string) {
  const stateBadge = await this.page!.locator(`.state-badge:has-text("${state}")`).isVisible({ timeout: 3000 });
  expect(stateBadge).toBe(true);
});

Then('the motion should be created', async function(this: CustomWorld) {
  const created = await this.page!.locator('text=/Motion.*created|Created.*successfully/i').isVisible();
  expect(created).toBe(true);
});

Then('the participants should see the message', async function(this: CustomWorld) {
  const messageVisible = await this.page!.locator('.broadcast-message, .announcement').isVisible();
  expect(messageVisible).toBe(true);
});

Then('the poll should be removed', async function(this: CustomWorld) {
  const pollRemoved = await this.page!.locator('.poll-item').count();
  expect(pollRemoved).toBe(0);
});

// User-specific steps
Then('the selected users should be added to {string}', async function(this: CustomWorld, groupName: string) {
  const addedToGroup = await this.page!.locator(`text=/Added.*to.*${groupName}|Users.*assigned/i`).isVisible();
  expect(addedToGroup).toBe(true);
});

Then('the speaker should continue', async function(this: CustomWorld) {
  const speaking = await this.page!.locator('.speaker-active, .currently-speaking').isVisible();
  expect(speaking).toBe(true);
});

Then('the user should be created', async function(this: CustomWorld) {
  const userCreated = await this.page!.locator('text=/User.*created|Created.*successfully/i').isVisible();
  expect(userCreated).toBe(true);
});

Then('the users should be removed from {string}', async function(this: CustomWorld, groupName: string) {
  const removed = await this.page!.locator(`text=/Removed.*from.*${groupName}/i`).isVisible();
  expect(removed).toBe(true);
});

Then('the video stream should be stable', async function(this: CustomWorld) {
  const videoStable = await this.page!.locator('.video-stream.active, video').isVisible();
  expect(videoStable).toBe(true);
});

Then('the vote should close automatically', async function(this: CustomWorld) {
  // Wait for auto-close
  await this.page!.waitForTimeout(3000);
  const closed = await this.page!.locator('.vote-closed, text="Voting closed"').isVisible();
  expect(closed).toBe(true);
});

Then('their permissions should be combined', async function(this: CustomWorld) {
  const combinedPerms = await this.page!.locator('.combined-permissions, text=/Permissions.*merged/i').isVisible();
  expect(combinedPerms).toBe(true);
});

Then('their status should show as {string}', async function(this: CustomWorld, status: string) {
  const userStatus = await this.page!.locator(`.user-status:has-text("${status}")`).isVisible();
  expect(userStatus).toBe(true);
});

Then('they should remain in the queue', async function(this: CustomWorld) {
  const inQueue = await this.page!.locator('.speaker-queue .current-user').isVisible();
  expect(inQueue).toBe(true);
});

Then('timer should continue', async function(this: CustomWorld) {
  const timer = await this.page!.locator('.speaker-timer');
  const time1 = await timer.textContent();
  await this.page!.waitForTimeout(2000);
  const time2 = await timer.textContent();
  expect(time1).not.toBe(time2);
});

Then('user settings should be preserved', async function(this: CustomWorld) {
  const settings = await this.page!.locator('.user-settings, text=/Settings.*saved/i').isVisible();
  expect(settings).toBe(true);
});

Then('users can rejoin when ready', async function(this: CustomWorld) {
  const rejoinOption = await this.page!.locator('button:has-text("Rejoin"), button:has-text("Resume")').isVisible();
  expect(rejoinOption).toBe(true);
});

Then('vote results should show majority reached', async function(this: CustomWorld) {
  const majorityReached = await this.page!.locator('text=/Majority.*reached|Motion.*passed/i').isVisible();
  expect(majorityReached).toBe(true);
});

Then('voting interface should be disabled', async function(this: CustomWorld) {
  const voteButtons = await this.page!.locator('.vote-button:enabled').count();
  expect(voteButtons).toBe(0);
});

Then('voting should close', async function(this: CustomWorld) {
  const closed = await this.page!.locator('.voting-closed, text="Voting closed"').isVisible();
  expect(closed).toBe(true);
});

Then('voting should proceed', async function(this: CustomWorld) {
  const votingActive = await this.page!.locator('.voting-active, .voting-in-progress').isVisible();
  expect(votingActive).toBe(true);
});

Then('warning should appear before time expires', async function(this: CustomWorld) {
  const warning = await this.page!.locator('.time-warning, .countdown-warning').isVisible();
  expect(warning).toBe(true);
});