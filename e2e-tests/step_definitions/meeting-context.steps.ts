import { Given, When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { MeetingsPage } from '../pages/MeetingsPage';

// Meeting feature context steps
Given('I am in a meeting with {word} enabled', async function(this: CustomWorld, feature: string) {
  // Navigate to the meeting if not already there
  if (!this.currentMeetingId) {
    this.currentMeetingId = '1';
  }
  
  const currentUrl = this.page!.url();
  if (!currentUrl.includes(`/${this.currentMeetingId}`)) {
    await this.page!.goto(`https://localhost:8000/${this.currentMeetingId}`);
    await this.page!.waitForTimeout(2000);
  }
  
  // Store the enabled feature for later verification
  this.testData.set(`${feature}Enabled`, true);
  
  // For some features, we might need to verify they're actually enabled
  switch (feature.toLowerCase()) {
    case 'autopilot':
      // Autopilot feature indicator would be visible
      this.testData.set('autopilotEnabled', true);
      break;
    case 'chat':
      // Chat icon/panel would be visible
      this.testData.set('chatEnabled', true);
      break;
    case 'history':
      // History tracking is enabled
      this.testData.set('historyEnabled', true);
      break;
    case 'projector':
      // Projector controls would be available
      this.testData.set('projectorEnabled', true);
      break;
  }
});

Given('the chat feature is enabled', async function(this: CustomWorld) {
  await this.steps.given('I am in a meeting with chat enabled');
});

Given('I have appropriate export/import permissions', async function(this: CustomWorld) {
  // This assumes the logged-in user has export/import permissions
  // In a real implementation, we might need to verify this through UI or API
  const currentRole = this.testData.get('currentUserRole');
  const hasPermission = ['administrator', 'meeting administrator', 'meeting chair'].includes(currentRole?.toLowerCase() || '');
  
  if (!hasPermission) {
    throw new Error(`Current user role "${currentRole}" does not have export/import permissions`);
  }
  
  this.testData.set('hasExportImportPermissions', true);
});

When('I navigate to the accounts page', async function(this: CustomWorld) {
  await this.page!.click('a[href*="accounts"], a[href*="users"], nav >> text="Accounts"');
  await this.page!.waitForLoadState('networkidle');
});

When('I navigate to the projector control panel', async function(this: CustomWorld) {
  const meetingId = this.currentMeetingId || '1';
  
  // Try clicking projector link in navigation
  try {
    await this.page!.click('a[href*="projector"], nav >> text="Projector"', { timeout: 3000 });
  } catch {
    // If not found in nav, navigate directly
    await this.page!.goto(`https://localhost:8000/${meetingId}/projector`);
  }
  
  await this.page!.waitForLoadState('networkidle');
});

// Meeting navigation with feature context
Given('I am in a meeting', async function(this: CustomWorld) {
  const meetingId = this.currentMeetingId || '1';
  const currentUrl = this.page!.url();
  
  if (!currentUrl.includes(`/${meetingId}`)) {
    await this.page!.goto(`https://localhost:8000/${meetingId}`);
    await this.page!.waitForTimeout(2000);
  }
  
  // Verify we're in a meeting context
  const inMeeting = currentUrl.includes(`/${meetingId}`) || this.page!.url().includes(`/${meetingId}`);
  if (!inMeeting) {
    throw new Error('Failed to enter meeting');
  }
});

Given('I am viewing an agenda item with discussion', async function(this: CustomWorld) {
  // Navigate to agenda if not already there
  const currentUrl = this.page!.url();
  const meetingId = this.currentMeetingId || '1';
  
  if (!currentUrl.includes('/agenda')) {
    await this.page!.goto(`https://localhost:8000/${meetingId}/agenda`);
    await this.page!.waitForTimeout(2000);
  }
  
  // Click on first agenda item that has discussion enabled
  const agendaItems = await this.page!.locator('.agenda-item, mat-list-item').all();
  if (agendaItems.length > 0) {
    await agendaItems[0].click();
    await this.page!.waitForTimeout(1000);
  }
  
  // Store current agenda item context
  this.testData.set('viewingAgendaItemWithDiscussion', true);
});