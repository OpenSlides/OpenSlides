import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Autopilot startup - removed specific click handlers, use generic 'When I click {string}' from generic-ui.steps.ts
// The generic handler already searches for buttons with the specified text

// Autopilot controls - removed specific click handlers, use generic 'When I click {string}' from generic-ui.steps.ts

// Autopilot configuration
When('I configure autopilot settings:', async function(this: CustomWorld, dataTable: any) {
  const settings = dataTable.hashes();
  
  for (const setting of settings) {
    const settingName = setting['Setting'];
    const value = setting['Value'];
    
    switch (settingName) {
      case 'Speaker time limit':
        await this.page!.fill('input[formcontrolname="speakerTimeLimit"], input[placeholder*="time limit"]', value);
        break;
      case 'Auto-advance':
        if (value === 'Yes') {
          await this.page!.click('mat-checkbox:has-text("Auto-advance"), label:has-text("Auto-advance")');
        }
        break;
      case 'Break duration':
        await this.page!.fill('input[formcontrolname="breakDuration"], input[placeholder*="Break"]', value);
        break;
    }
    await this.page!.waitForTimeout(500);
  }
});

// Autopilot templates
When('I select autopilot template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click(`mat-radio-button:has-text("${templateName}"), .template-option:has-text("${templateName}")`);
  await this.page!.waitForTimeout(500);
});

Then('autopilot should be configured for {string}', async function(this: CustomWorld, meetingType: string) {
  const config = await this.page!.locator(`.autopilot-config:has-text("${meetingType}"), text=/Configured.*${meetingType}/i`).isVisible();
  expect(config).toBe(true);
});

// Autopilot monitoring
Then('I should see autopilot status panel', async function(this: CustomWorld) {
  const statusPanel = await this.page!.locator('.autopilot-status, .autopilot-panel').isVisible();
  expect(statusPanel).toBe(true);
});

Then('current agenda item should be highlighted', async function(this: CustomWorld) {
  const currentItem = await this.page!.locator('.current-agenda-item, .agenda-item.active').isVisible();
  expect(currentItem).toBe(true);
});

// Autopilot interventions
When('I manually advance to next item', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Next item"), button[aria-label="Skip to next"]');
  await this.page!.waitForTimeout(1500);
});

Then('autopilot should adapt to manual change', async function(this: CustomWorld) {
  const adapted = await this.page!.locator('text=/Autopilot.*adjusted|Manual.*intervention.*recorded/i').isVisible();
  expect(adapted).toBe(true);
});

// Autopilot scheduling
When('I schedule autopilot to start at {string}', async function(this: CustomWorld, time: string) {
  await this.page!.click('button:has-text("Schedule"), mat-checkbox:has-text("Schedule start")');
  await this.page!.waitForTimeout(500);
  
  await this.page!.fill('input[type="time"], input[placeholder*="Start time"]', time);
  await this.page!.waitForTimeout(500);
});

Then('autopilot should show as scheduled', async function(this: CustomWorld) {
  const scheduled = await this.page!.locator('.autopilot-scheduled, text=/Scheduled.*start/i').isVisible();
  expect(scheduled).toBe(true);
});

// Autopilot analytics
Then('I should see autopilot analytics', async function(this: CustomWorld) {
  const analytics = await this.page!.locator('.autopilot-analytics, .meeting-statistics').isVisible();
  expect(analytics).toBe(true);
});

When('I export autopilot report', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Export report"), button:has-text("Download analytics")');
  await this.page!.waitForTimeout(2000);
});

// Autopilot rules
When('I add custom rule {string}', async function(this: CustomWorld, ruleName: string) {
  await this.page!.click('button:has-text("Add rule"), button:has-text("New rule")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('input[placeholder*="Rule name"]', ruleName);
  await this.page!.waitForTimeout(500);
});

When('I set condition {string} action {string}', async function(this: CustomWorld, condition: string, action: string) {
  // Select condition
  await this.page!.click('mat-select[formcontrolname="condition"]');
  await this.page!.click(`mat-option:has-text("${condition}")`);
  await this.page!.waitForTimeout(500);
  
  // Select action
  await this.page!.click('mat-select[formcontrolname="action"]');
  await this.page!.click(`mat-option:has-text("${action}")`);
  await this.page!.waitForTimeout(500);
});

// Autopilot voting integration
Given('autopilot manages voting automatically', async function(this: CustomWorld) {
  this.testData.set('autopilotVoting', true);
  
  const votingEnabled = await this.page!.locator('.autopilot-voting, mat-checkbox[formcontrolname="autoVoting"]:checked').isVisible();
  expect(votingEnabled).toBe(true);
});

Then('voting should open when motion is reached', async function(this: CustomWorld) {
  // Wait for motion item
  await this.page!.waitForTimeout(2000);
  
  const votingOpen = await this.page!.locator('.voting-open, text=/Voting.*started.*automatically/i').isVisible();
  expect(votingOpen).toBe(true);
});

Then('voting should close after time limit', async function(this: CustomWorld) {
  // Wait for time limit
  await this.page!.waitForTimeout(5000);
  
  const votingClosed = await this.page!.locator('.voting-closed, text=/Voting.*ended.*automatically/i').isVisible();
  expect(votingClosed).toBe(true);
});

// Autopilot speaker management
Given('autopilot manages speaker queue', async function(this: CustomWorld) {
  this.testData.set('autopilotSpeakers', true);
  
  const speakerManagement = await this.page!.locator('.autopilot-speakers, mat-checkbox[formcontrolname="autoSpeakers"]:checked').isVisible();
  expect(speakerManagement).toBe(true);
});

Then('speakers should be called automatically', async function(this: CustomWorld) {
  const speakerCalled = await this.page!.locator('text=/Next.*speaker.*called|Speaker.*started.*automatically/i').isVisible({ timeout: 5000 });
  expect(speakerCalled).toBe(true);
});

// Autopilot emergency stop - removed specific click handler
// Use generic 'When I click {string}' from generic-ui.steps.ts

Then('autopilot should stop immediately', async function(this: CustomWorld) {
  const stopped = await this.page!.locator('.autopilot-stopped, text=/Autopilot.*stopped|Emergency.*stop.*activated/i').isVisible();
  expect(stopped).toBe(true);
});

Then('all automatic actions should halt', async function(this: CustomWorld) {
  // Verify no automatic actions are happening
  const autoActions = await this.page!.locator('.auto-action-indicator').isVisible({ timeout: 1000 }).catch(() => false);
  expect(autoActions).toBe(false);
});

// Autopilot profiles
When('I save autopilot profile as {string}', async function(this: CustomWorld, profileName: string) {
  await this.page!.click('button:has-text("Save profile"), button:has-text("Save as profile")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('input[placeholder*="Profile name"]', profileName);
  await this.page!.click('button:has-text("Save")');
  await this.page!.waitForTimeout(1000);
});

Then('profile {string} should be available', async function(this: CustomWorld, profileName: string) {
  const profile = await this.page!.locator(`.profile-item:has-text("${profileName}")`).isVisible();
  expect(profile).toBe(true);
});

// Autopilot logs
When('I view autopilot logs', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("View logs"), button[aria-label="Autopilot logs"]');
  await this.page!.waitForTimeout(1000);
});

Then('I should see detailed autopilot actions', async function(this: CustomWorld) {
  const logs = await this.page!.locator('.autopilot-logs, .action-log').isVisible();
  expect(logs).toBe(true);
  
  const logEntries = await this.page!.locator('.log-entry').count();
  expect(logEntries).toBeGreaterThan(0);
});