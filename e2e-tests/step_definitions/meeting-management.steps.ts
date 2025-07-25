import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am on the meetings page', async function(this: CustomWorld) {
  await this.meetingsPage!.navigateToMeetings();
});

Given('a meeting {string} exists', async function(this: CustomWorld, meetingName: string) {
  // Check if meeting exists, create if not
  await this.meetingsPage!.navigateToMeetings();
  const exists = await this.meetingsPage!.isMeetingVisible(meetingName);
  
  if (!exists) {
    await this.meetingsPage!.createMeeting({ name: meetingName });
  }
  
  this.testData.set('testMeeting', meetingName);
});

Given('the following meetings exist:', async function(this: CustomWorld, dataTable) {
  const meetings = dataTable.hashes();
  
  for (const meeting of meetings) {
    const exists = await this.meetingsPage!.isMeetingVisible(meeting.Name);
    if (!exists) {
      await this.meetingsPage!.createMeeting({
        name: meeting.Name,
        committee: meeting.Committee,
        startDate: meeting.Date
      });
    }
  }
});

Given('an active meeting {string} exists', async function(this: CustomWorld, meetingName: string) {
  await this.meetingsPage!.navigateToMeetings();
  const exists = await this.meetingsPage!.isMeetingVisible(meetingName);
  
  if (!exists) {
    await this.meetingsPage!.createMeeting({ name: meetingName });
  }
});

When('I click the create meeting button', async function(this: CustomWorld) {
  await this.page!.click('[data-cy="headbarMainButton"]');
  await this.page!.waitForSelector('mat-dialog-container');
});

When('I fill in the meeting form with:', async function(this: CustomWorld, dataTable) {
  const data = dataTable.rowsHash();
  
  if (data.Name) {
    await this.page!.fill('input[formcontrolname="name"]', data.Name);
  }
  
  if (data.Committee) {
    await this.page!.click('mat-select[formcontrolname="committee_id"]');
    await this.page!.click(`mat-option:has-text("${data.Committee}")`);
  }
  
  if (data['Start Date']) {
    await this.page!.fill('input[formcontrolname="start_time"]', data['Start Date']);
  }
  
  if (data.Description) {
    await this.page!.fill('textarea[formcontrolname="description"]', data.Description);
  }
});

When('I click the create button', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Create")');
});

When('I click on the meeting {string}', async function(this: CustomWorld, meetingName: string) {
  await this.meetingsPage!.enterMeeting(meetingName);
});

When('I search for {string}', async function(this: CustomWorld, searchTerm: string) {
  await this.meetingsPage!.searchMeetings(searchTerm);
});

When('I click the menu for meeting {string}', async function(this: CustomWorld, meetingName: string) {
  const meetingTile = this.page!.locator('.meeting-tile', { hasText: meetingName });
  await meetingTile.locator('button[mattooltip="More options"]').click();
});

When('I select {string}', async function(this: CustomWorld, action: string) {
  await this.page!.click(`button:has-text("${action}")`);
});

When('I confirm the deletion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Confirm")');
});

Then('I should see a success notification {string}', async function(this: CustomWorld, message: string) {
  const notification = this.page!.locator('.mat-snack-bar', { hasText: message });
  await notification.waitFor({ state: 'visible' });
  expect(await notification.isVisible()).toBe(true);
});

Then('the meeting {string} should appear in the list', async function(this: CustomWorld, meetingName: string) {
  await this.page!.waitForTimeout(1000); // Wait for list to update
  const isVisible = await this.meetingsPage!.isMeetingVisible(meetingName);
  expect(isVisible).toBe(true);
});

Then('I should be redirected to the meeting home page', async function(this: CustomWorld) {
  await this.page!.waitForURL(/.*\/\d+\/home/);
  expect(this.page!.url()).toMatch(/\/\d+\/home/);
});

Then('I should see the meeting navigation menu', async function(this: CustomWorld) {
  const navMenu = await this.page!.isVisible('.meeting-navigation');
  expect(navMenu).toBe(true);
});

Then('I should see only {string} in the results', async function(this: CustomWorld, meetingName: string) {
  await this.page!.waitForTimeout(500); // Wait for search to complete
  
  const visibleMeetings = await this.page!.locator('.meeting-tile').count();
  expect(visibleMeetings).toBe(1);
  
  const isVisible = await this.meetingsPage!.isMeetingVisible(meetingName);
  expect(isVisible).toBe(true);
});

Then('I should see {string} in the list', async function(this: CustomWorld, meetingName: string) {
  const isVisible = await this.meetingsPage!.isMeetingVisible(meetingName);
  expect(isVisible).toBe(true);
});

Then('the meeting {string} should not appear in the list', async function(this: CustomWorld, meetingName: string) {
  await this.page!.waitForTimeout(1000); // Wait for deletion
  const isVisible = await this.meetingsPage!.isMeetingVisible(meetingName);
  expect(isVisible).toBe(false);
});

Then('the meeting should appear in the archived section', async function(this: CustomWorld) {
  // Switch to archived view
  await this.page!.click('mat-tab-header:has-text("Archived")');
  
  const meetingName = this.testData.get('testMeeting');
  const isVisible = await this.meetingsPage!.isMeetingVisible(meetingName);
  expect(isVisible).toBe(true);
});