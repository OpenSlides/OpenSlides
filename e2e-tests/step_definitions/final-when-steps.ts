import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

// File and data operations
When('he uploads his presentation', async function(this: CustomWorld) {
  const fileInput = this.page!.locator('input[type="file"]');
  await fileInput.setInputFiles('/tmp/presentation.pdf');
  await this.page!.waitForTimeout(2000);
});

When('I accept the amendment', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Accept amendment"), button:has-text("Accept")');
  await this.page!.waitForTimeout(1500);
});

When('I accept the tie result', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Accept tie"), button:has-text("Confirm tie")');
  await this.page!.waitForTimeout(1000);
});

When('I activate read-only mode', async function(this: CustomWorld) {
  await this.page!.click('mat-checkbox:has-text("Read-only"), mat-slide-toggle:has-text("Read-only mode")');
  await this.page!.waitForTimeout(1000);
});

When('I add {string} to the list', async function(this: CustomWorld, name: string) {
  await this.page!.fill('input[placeholder*="Add speaker"], input[placeholder*="Name"]', name);
  await this.page!.click('button:has-text("Add"), button[aria-label="Add to list"]');
  await this.page!.waitForTimeout(1000);
});

When('I add myself to the list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Add me"), button:has-text("Join list")');
  await this.page!.waitForTimeout(1000);
});

When('I assign them to groups:', async function(this: CustomWorld, dataTable: any) {
  const groups = dataTable.raw().flat();
  
  for (const group of groups) {
    await this.page!.click(`mat-checkbox:has-text("${group}"), label:has-text("${group}") input[type="checkbox"]`);
    await this.page!.waitForTimeout(300);
  }
});

When('I broadcast a message {string}', async function(this: CustomWorld, message: string) {
  await this.page!.click('button:has-text("Broadcast"), button[aria-label="Send to all"]');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.fill('textarea[placeholder*="Message"], input[placeholder*="Broadcast"]', message);
  await this.page!.click('button:has-text("Send")');
  await this.page!.waitForTimeout(1500);
});

When('I cancel the vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Cancel vote"), button:has-text("Cancel voting")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('button:has-text("Confirm cancel")');
  await this.page!.waitForTimeout(1500);
});

When('I cancel the voting', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Cancel"), button[aria-label="Cancel voting"]');
  await this.page!.waitForTimeout(1500);
});

When('I clear the speaker list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Clear list"), button[aria-label="Clear all"]');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('button:has-text("Confirm clear")');
  await this.page!.waitForTimeout(1000);
});

When('I click cancel', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Cancel")');
  await this.page!.waitForTimeout(1000);
});

When('I click on motion {string}', async function(this: CustomWorld, motionId: string) {
  await this.page!.click(`text="Motion ${motionId}"`);
  await this.page!.waitForTimeout(1500);
});

When('I close the list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Close list"), mat-checkbox:has-text("Close speaker list")');
  await this.page!.waitForTimeout(1000);
});

When('I create a vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Create vote"), button:has-text("New vote")');
  await this.page!.waitForTimeout(1500);
});

When('I delete the vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Delete vote"), button[aria-label="Delete"]');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('button:has-text("Confirm delete")');
  await this.page!.waitForTimeout(1500);
});

When('I demote {string}', async function(this: CustomWorld, userName: string) {
  const userRow = this.page!.locator(`tr:has-text("${userName}")`);
  await userRow.locator('button[aria-label="Actions"]').click();
  await this.page!.click('button:has-text("Demote"), button:has-text("Remove role")');
  await this.page!.waitForTimeout(1500);
});

When('I download the protocol', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Download protocol"), button:has-text("Export protocol")');
  await this.page!.waitForTimeout(2000);
});

When('I enable live streaming', async function(this: CustomWorld) {
  await this.page!.click('mat-checkbox:has-text("Live stream"), mat-slide-toggle:has-text("Enable streaming")');
  await this.page!.waitForTimeout(1500);
});

When('I enable speaking time limits', async function(this: CustomWorld) {
  await this.page!.click('mat-checkbox:has-text("Time limits"), mat-slide-toggle:has-text("Enable time limit")');
  await this.page!.waitForTimeout(1000);
});

When('I enter meeting password {string}', async function(this: CustomWorld, password: string) {
  await this.page!.fill('input[type="password"], input[placeholder*="Password"]', password);
  await this.page!.waitForTimeout(500);
});

When('I export the speaker statistics', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Export statistics"), button:has-text("Download stats")');
  await this.page!.waitForTimeout(2000);
});

When('I initiate a revote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Revote"), button:has-text("Start new vote")');
  await this.page!.waitForTimeout(1500);
});

When('I lock the list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Lock list"), mat-checkbox:has-text("Lock")');
  await this.page!.waitForTimeout(1000);
});

When('I manually advance to {string}', async function(this: CustomWorld, speakerName: string) {
  const speaker = this.page!.locator(`.speaker-item:has-text("${speakerName}")`);
  await speaker.locator('button:has-text("Start"), button[aria-label="Make current"]').click();
  await this.page!.waitForTimeout(1500);
});

When('I move {string} up in the queue', async function(this: CustomWorld, speakerName: string) {
  const speaker = this.page!.locator(`.speaker-item:has-text("${speakerName}")`);
  await speaker.locator('button[aria-label="Move up"], button:has-text("↑")').click();
  await this.page!.waitForTimeout(1000);
});

When('I pause the queue', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Pause queue"), button[aria-label="Pause"]');
  await this.page!.waitForTimeout(1000);
});

When('I reopen the list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Reopen list"), button:has-text("Open list")');
  await this.page!.waitForTimeout(1000);
});

When('I request to speak', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Request to speak"), button:has-text("Join queue")');
  await this.page!.waitForTimeout(1000);
});

When('I reset the vote', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Reset vote"), button:has-text("Clear votes")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click('button:has-text("Confirm reset")');
  await this.page!.waitForTimeout(1500);
});

When('I resume autopilot', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Resume"), button[aria-label="Resume autopilot"]');
  await this.page!.waitForTimeout(1000);
});

When('I resume the queue', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Resume queue"), button[aria-label="Resume"]');
  await this.page!.waitForTimeout(1000);
});

When('I revoke voting rights from {string}', async function(this: CustomWorld, userName: string) {
  const userRow = this.page!.locator(`tr:has-text("${userName}")`);
  await userRow.locator('mat-checkbox:has-text("Voting rights")').click();
  await this.page!.waitForTimeout(1000);
});

When('I save speaker list as template', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Save as template"), button[aria-label="Save template"]');
  await this.page!.waitForTimeout(1000);
});

When('I set maximum speakers to {int}', async function(this: CustomWorld, maxSpeakers: number) {
  await this.page!.fill('input[formcontrolname="maxSpeakers"], input[type="number"]', maxSpeakers.toString());
  await this.page!.waitForTimeout(500);
});

When('I start from existing template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click(`button:has-text("${templateName}"), .template-item:has-text("${templateName}")`);
  await this.page!.waitForTimeout(1500);
});

When('I start the discussion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start discussion"), button:has-text("Begin debate")');
  await this.page!.waitForTimeout(1500);
});

When('I start the list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start list"), button:has-text("Begin speakers")');
  await this.page!.waitForTimeout(1000);
});

When('I stop voting', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Stop voting"), button:has-text("End vote")');
  await this.page!.waitForTimeout(1500);
});

When('I test the projector connection', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Test connection"), button:has-text("Test projector")');
  await this.page!.waitForTimeout(2000);
});

When('I unlock the list', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Unlock list"), mat-checkbox:has-text("Lock"):checked');
  await this.page!.waitForTimeout(1000);
});

When('I use ranked choice voting', async function(this: CustomWorld) {
  await this.page!.click('mat-checkbox:has-text("Ranked choice"), label:has-text("Ranked voting")');
  await this.page!.waitForTimeout(500);
});

When('I view the voting history', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Voting history"), mat-tab-label:has-text("History")');
  await this.page!.waitForTimeout(1500);
});

When('I vote on behalf of {string}', async function(this: CustomWorld, userName: string) {
  await this.page!.click(`button:has-text("Vote for ${userName}")`);
  await this.page!.waitForTimeout(1000);
});

When('she finishes speaking', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("End speech"), button:has-text("Finish")');
  await this.page!.waitForTimeout(1000);
});

When('she starts speaking', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Start speaking"), button:has-text("Begin")');
  await this.page!.waitForTimeout(1000);
});

When('the administrator leaves', async function(this: CustomWorld) {
  // Simulate admin logout
  await this.page!.click('button[aria-label="User menu"]');
  await this.page!.click('button:has-text("Logout")');
  await this.page!.waitForTimeout(2000);
});

When('the internet connection is restored', async function(this: CustomWorld) {
  await this.page!.context().setOffline(false);
  await this.page!.waitForTimeout(2000);
});

When('the list is exhausted', async function(this: CustomWorld) {
  // This is a state check - ensure no speakers remain
  const speakerCount = await this.page!.locator('.speaker-queue .speaker-item').count();
  if (speakerCount === 0) {
    this.testData.set('listExhausted', true);
  }
});

When('the time limit is reached', async function(this: CustomWorld) {
  // Wait for time limit
  await this.page!.waitForTimeout(5000);
});

When('time runs out', async function(this: CustomWorld) {
  // Wait for timer to expire
  await this.page!.waitForTimeout(10000);
});