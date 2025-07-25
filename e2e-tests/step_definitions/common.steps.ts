import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Common navigation steps
Given('I am in the meeting {string}', async function(this: CustomWorld, meetingName: string) {
  // Navigate to meetings page
  await this.page!.goto('/meetings');
  
  // Enter the meeting
  await this.meetingsPage!.enterMeeting(meetingName);
  
  // Store current meeting ID
  const url = this.page!.url();
  const match = url.match(/\/(\d+)\//);
  if (match) {
    this.currentMeetingId = match[1];
  }
});

Given('I am on the {word} page within the meeting', async function(this: CustomWorld, pageName: string) {
  const meetingId = this.currentMeetingId || '1';
  
  switch (pageName.toLowerCase()) {
    case 'agenda':
      await this.agendaPage!.navigateToAgenda(meetingId);
      break;
    case 'motions':
      await this.motionsPage!.navigateToMotions(meetingId);
      break;
    case 'participants':
      await this.participantsPage!.navigateToParticipants(meetingId);
      break;
    case 'dashboard':
      await this.dashboardPage!.navigateToDashboard();
      break;
    case 'meetings':
      await this.meetingsPage!.navigateToMeetings();
      break;
    default:
      await this.page!.goto(`/${meetingId}/${pageName.toLowerCase()}`);
  }
});

// Common form interactions
When('I fill in {string} with {string}', async function(this: CustomWorld, field: string, value: string) {
  const input = await this.page!.locator(`input[placeholder*="${field}"], input[formcontrolname="${field.toLowerCase().replace(/\s+/g, '_')}"]`);
  await input.fill(value);
});

When('I select {string} from {string}', async function(this: CustomWorld, option: string, dropdown: string) {
  const select = await this.page!.locator(`mat-select[formcontrolname="${dropdown.toLowerCase().replace(/\s+/g, '_')}"]`);
  await select.click();
  await this.page!.click(`mat-option:has-text("${option}")`);
});

When('I click the {string} button', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
});

When('I wait for {int} seconds', async function(this: CustomWorld, seconds: number) {
  await this.page!.waitForTimeout(seconds * 1000);
});

// Common assertions
Then('I should see {string}', async function(this: CustomWorld, text: string) {
  const element = await this.page!.locator(`text="${text}"`);
  await element.waitFor({ state: 'visible' });
  expect(await element.isVisible()).toBe(true);
});

Then('I should not see {string}', async function(this: CustomWorld, text: string) {
  const element = await this.page!.locator(`text="${text}"`);
  expect(await element.isVisible()).toBe(false);
});

Then('the {string} field should contain {string}', async function(this: CustomWorld, field: string, value: string) {
  const input = await this.page!.locator(`input[placeholder*="${field}"], input[formcontrolname="${field.toLowerCase().replace(/\s+/g, '_')}"]`);
  const actualValue = await input.inputValue();
  expect(actualValue).toBe(value);
});

Then('I should be on the {word} page', async function(this: CustomWorld, pageName: string) {
  const url = this.page!.url();
  expect(url).toContain(`/${pageName.toLowerCase()}`);
});

// Dialog handling
When('I confirm the action', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")');
});

When('I cancel the action', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Cancel"), button:has-text("No")');
});

// File handling
When('I upload the file {string}', async function(this: CustomWorld, filename: string) {
  const fileInput = await this.page!.locator('input[type="file"]');
  await fileInput.setInputFiles(`./fixtures/${filename}`);
});

// Multi-browser support for real-time scenarios
Given('I am logged in as {string} in browser {int}', async function(this: CustomWorld, username: string, browserNumber: number) {
  const page = browserNumber === 1 ? this.page! : this.page2!;
  const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
  
  await loginPage.navigateToLogin();
  const password = username === 'admin' ? 'admin' : 'password';
  await loginPage.login(username, password);
});

Given('both users are in the meeting {string}', async function(this: CustomWorld, meetingName: string) {
  // User 1
  await this.page!.goto('/meetings');
  await this.meetingsPage!.enterMeeting(meetingName);
  
  // User 2
  const meetingsPage2 = new (await import('../pages/MeetingsPage')).MeetingsPage(this.page2!);
  await this.page2!.goto('/meetings');
  await meetingsPage2.enterMeeting(meetingName);
});