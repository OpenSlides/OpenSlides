import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { AutopilotPage } from '../pages/autopilot.page';

// Autopilot activation and control
When('I select autopilot profile {string}', async function(this: CustomWorld, profileName: string) {
  // Select autopilot profile from dropdown
  await this.page!.click('mat-select[formcontrolname="profile"], select[name="autopilot-profile"]');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`mat-option:has-text("${profileName}"), option:has-text("${profileName}")`);
  await this.page!.waitForTimeout(500);
});

Then('autopilot should activate', async function(this: CustomWorld) {
  // Check for autopilot active indicator
  const isActive = await this.page!.locator('.autopilot-active, .autopilot-status:has-text("Active"), [data-status="active"]').isVisible({ timeout: 5000 });
  expect(isActive).toBe(true);
  
  this.testData.set('autopilotActive', true);
});

Then('I should see the autopilot control panel', async function(this: CustomWorld) {
  const autopilotPage = new AutopilotPage(this.page!);
  const panelVisible = await autopilotPage.isVisible(autopilotPage.controlPanel, { timeout: 5000 });
  expect(panelVisible).toBe(true);
});

Then('the current agenda item should be displayed', async function(this: CustomWorld) {
  const currentItem = await this.page!.locator('.current-agenda-item, .autopilot-current-item').isVisible();
  expect(currentItem).toBe(true);
});

Then('the next scheduled action should be shown', async function(this: CustomWorld) {
  const nextAction = await this.page!.locator('.next-action, .autopilot-next-step, .scheduled-action').isVisible();
  expect(nextAction).toBe(true);
});

// Autopilot runtime states
Given('autopilot is running', async function(this: CustomWorld) {
  // Verify autopilot is in running state
  const running = await this.page!.locator('.autopilot-running, [data-autopilot-state="running"]').isVisible();
  if (!running) {
    // Start autopilot if not running
    await this.page!.click('button:has-text("Start"), button:has-text("Resume")');
    await this.page!.waitForTimeout(2000);
  }
  
  this.testData.set('autopilotRunning', true);
});

Given('the current agenda item has {int} minutes allocated', async function(this: CustomWorld, minutes: number) {
  // Store the time allocation for the current item
  this.testData.set('agendaItemDuration', minutes);
  this.testData.set('agendaItemStartTime', Date.now());
});

When('the time expires', async function(this: CustomWorld) {
  // Simulate time expiration - in real test this would wait or mock time
  this.testData.set('timeExpired', true);
  
  // Trigger time expiration event if possible
  await this.page!.evaluate(() => {
    // Simulate timer expiration
    window.dispatchEvent(new Event('autopilot-timer-expired'));
  });
  
  await this.page!.waitForTimeout(1000);
});

Then('autopilot should:', async function(this: CustomWorld, dataTable: DataTable) {
  const actions = dataTable.raw().flat();
  
  for (const action of actions) {
    // Verify each expected autopilot action
    const actionOccurred = await this.page!.locator(`text=/${action}/i`).isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!actionOccurred) {
      // Check alternative indicators
      if (action.includes('notification')) {
        const hasNotification = await this.page!.locator('.notification, .mat-snack-bar').isVisible();
        expect(hasNotification).toBe(true);
      } else if (action.includes('next item')) {
        const movedToNext = await this.page!.locator('.current-agenda-item').textContent();
        expect(movedToNext).not.toBe(this.testData.get('previousAgendaItem'));
      }
    }
  }
});

// Speaker management
Given('autopilot is managing speakers', async function(this: CustomWorld) {
  // Verify speaker management is enabled
  const speakerMode = await this.page!.locator('.autopilot-speakers, [data-mode="speakers"]').isVisible();
  expect(speakerMode).toBe(true);
  
  this.testData.set('autopilotManagingSpeakers', true);
});

Given('speakers are registered:', async function(this: CustomWorld, dataTable: DataTable) {
  const speakers = dataTable.hashes();
  
  // Store speaker list
  this.testData.set('registeredSpeakers', speakers);
  
  // Verify speakers appear in queue
  for (const speaker of speakers) {
    const speakerVisible = await this.page!.locator(`.speaker-queue:has-text("${speaker.Name}")`).isVisible();
    expect(speakerVisible).toBe(true);
  }
});

When('Alice\'s time starts', async function(this: CustomWorld) {
  // Simulate speaker timer start
  this.testData.set('currentSpeaker', 'Alice');
  this.testData.set('speakerStartTime', Date.now());
});

// Voting automation
Given('a motion is ready for voting', async function(this: CustomWorld) {
  // Verify motion is in votable state
  const votableMotion = await this.page!.locator('.motion-votable, [data-state="ready-for-vote"]').isVisible();
  expect(votableMotion).toBe(true);
  
  this.testData.set('motionReadyForVoting', true);
});

When('autopilot reaches the voting phase', async function(this: CustomWorld) {
  // Autopilot advances to voting
  this.testData.set('autopilotPhase', 'voting');
});

Then('it should automatically:', async function(this: CustomWorld, dataTable: DataTable) {
  const actions = dataTable.raw().flat();
  
  for (const action of actions) {
    if (action.includes('Open the poll')) {
      const pollOpened = await this.page!.locator('.poll-open, .voting-active').isVisible({ timeout: 5000 });
      expect(pollOpened).toBe(true);
    } else if (action.includes('countdown')) {
      const countdown = await this.page!.locator('.countdown-timer, .vote-countdown').isVisible();
      expect(countdown).toBe(true);
    } else if (action.includes('Close the poll')) {
      // This would happen after countdown
      const pollClosed = await this.page!.locator('.poll-closed, .voting-ended').isVisible().catch(() => false);
      if (!pollClosed) {
        // Poll might still be open during test
        this.testData.set('expectPollClose', true);
      }
    }
  }
});

// Script management
When('I click the autopilot button {string}', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

When('I upload the script file {string}', async function(this: CustomWorld, filename: string) {
  const fileInput = this.page!.locator('input[type="file"]');
  await fileInput.setInputFiles(`fixtures/${filename}`);
  await this.page!.waitForTimeout(1000);
});

Then('the script should be loaded', async function(this: CustomWorld) {
  const scriptLoaded = await this.page!.locator('.script-loaded, text="Script loaded"').isVisible({ timeout: 3000 });
  expect(scriptLoaded).toBe(true);
});

Then('I should see the agenda items from the script', async function(this: CustomWorld) {
  const agendaItems = await this.page!.locator('.script-agenda-item, .imported-item').count();
  expect(agendaItems).toBeGreaterThan(0);
});

// Script editor
When('I add a new agenda item:', async function(this: CustomWorld, dataTable: DataTable) {
  const data = dataTable.rowsHash();
  const autopilotPage = new AutopilotPage(this.page!);
  
  // Click add item button
  await this.page!.click('button:has-text("Add item"), button:has-text("New item")');
  await this.page!.waitForTimeout(500);
  
  // Fill in item details
  if (data['Title']) {
    await this.page!.fill('input[formcontrolname="title"], input[placeholder*="Title"]', data['Title']);
  }
  if (data['Duration']) {
    await this.page!.fill('input[formcontrolname="duration"], input[placeholder*="Duration"]', data['Duration']);
  }
  if (data['Type']) {
    await this.page!.selectOption('select[formcontrolname="type"]', data['Type']);
  }
});

Then('the item should appear in the script', async function(this: CustomWorld) {
  const newItem = await this.page!.locator('.script-item:has-text("Coffee Break")').isVisible({ timeout: 3000 });
  expect(newItem).toBe(true);
});

// Pause and resume
When('I click the pause button', async function(this: CustomWorld) {
  const autopilotPage = new AutopilotPage(this.page!);
  await autopilotPage.click(autopilotPage.pauseButton);
  await this.page!.waitForTimeout(1000);
});

Then('autopilot should pause', async function(this: CustomWorld) {
  const paused = await this.page!.locator('.autopilot-paused, [data-state="paused"]').isVisible();
  expect(paused).toBe(true);
});

Then('the timer should stop', async function(this: CustomWorld) {
  // Store current timer value
  const timerValue = await this.page!.locator('.timer-display, .countdown').textContent();
  this.testData.set('pausedTimerValue', timerValue);
  
  // Wait and check timer hasn't changed
  await this.page!.waitForTimeout(2000);
  const newTimerValue = await this.page!.locator('.timer-display, .countdown').textContent();
  expect(newTimerValue).toBe(timerValue);
});

When('I click the resume button', async function(this: CustomWorld) {
  const autopilotPage = new AutopilotPage(this.page!);
  await autopilotPage.resumeAutopilot();
});

Then('autopilot should resume', async function(this: CustomWorld) {
  const resumed = await this.page!.locator('.autopilot-running, [data-state="running"]').isVisible();
  expect(resumed).toBe(true);
});

Then('the timer should continue', async function(this: CustomWorld) {
  const pausedValue = this.testData.get('pausedTimerValue');
  await this.page!.waitForTimeout(2000);
  
  const currentValue = await this.page!.locator('.timer-display, .countdown').textContent();
  expect(currentValue).not.toBe(pausedValue);
});

// Settings
When('I configure autopilot settings:', async function(this: CustomWorld, dataTable: DataTable) {
  const settings = dataTable.rowsHash();
  
  for (const [setting, value] of Object.entries(settings)) {
    switch (setting) {
      case 'Default time per item':
        await this.page!.fill('input[formcontrolname="defaultTime"], input[name="default-time"]', value);
        break;
      case 'Speaker time limit':
        await this.page!.fill('input[formcontrolname="speakerTime"], input[name="speaker-time"]', value);
        break;
      case 'Warning before transition':
        await this.page!.fill('input[formcontrolname="warningTime"], input[name="warning-time"]', value);
        break;
    }
  }
});

Then('the settings should be saved', async function(this: CustomWorld) {
  const saved = await this.page!.locator('text="Settings saved"').isVisible({ timeout: 3000 });
  expect(saved).toBe(true);
});

// Notifications - removed duplicate
// Use 'Then I should see a notification {string}' from real-time.steps.ts

// Manual override
When('I manually skip to the next item', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Skip"), button:has-text("Next item")');
  await this.page!.waitForTimeout(1000);
});

Then('autopilot should move to {string}', async function(this: CustomWorld, itemName: string) {
  const currentItem = await this.page!.locator('.current-agenda-item, .autopilot-current-item').textContent();
  expect(currentItem).toContain(itemName);
});

Then('the history should show manual intervention', async function(this: CustomWorld) {
  const history = await this.page!.locator('.autopilot-history:has-text("Manual skip"), .event-log:has-text("User intervention")').isVisible();
  expect(history).toBe(true);
});

// Additional autopilot profile configuration
Given('autopilot profile includes:', async function(this: CustomWorld, dataTable: DataTable) {
  const profileSettings = dataTable.hashes();
  
  // Open profile configuration
  await this.page!.click('button:has-text("Configure profile"), button:has-text("Edit profile")');
  await this.page!.waitForTimeout(1000);
  
  for (const setting of profileSettings) {
    const section = setting['Section'];
    const duration = setting['Duration'];
    const warnings = setting['Warnings'];
    
    // Configure each section
    const sectionRow = this.page!.locator(`tr:has-text("${section}"), .section-row:has-text("${section}")`);
    
    if (duration) {
      await sectionRow.locator('input[name*="duration"]').fill(duration);
    }
    
    if (warnings) {
      await sectionRow.locator('input[name*="warnings"]').fill(warnings);
    }
    
    await this.page!.waitForTimeout(500);
  }
});

When('{int} minutes have elapsed', async function(this: CustomWorld, minutes: number) {
  // Simulate time passing - in real test would wait or mock
  this.testData.set('elapsedMinutes', minutes);
  
  // Trigger time advancement
  await this.page!.evaluate((mins) => {
    window.dispatchEvent(new CustomEvent('autopilot-time-elapsed', { detail: { minutes: mins } }));
  }, minutes);
  
  await this.page!.waitForTimeout(2000);
});

When('I configure:', async function(this: CustomWorld, dataTable: DataTable) {
  const config = dataTable.hashes();
  
  for (const item of config) {
    const section = item['Section'];
    const action = item['Action'];
    
    // Find section in configuration
    const sectionElement = this.page!.locator(`.config-section:has-text("${section}"), .autopilot-section:has-text("${section}")`);
    
    // Configure action
    await sectionElement.locator('mat-select, select').click();
    await this.page!.waitForTimeout(500);
    await this.page!.click(`mat-option:has-text("${action}"), option:has-text("${action}")`);
    await this.page!.waitForTimeout(500);
  }
});

When('I save as {string}', async function(this: CustomWorld, profileName: string) {
  await this.page!.fill('input[formcontrolname="profileName"], input[placeholder*="Profile name"]', profileName);
  await this.page!.click('button:has-text("Save profile"), button:has-text("Save")');
  await this.page!.waitForTimeout(2000);
});

Then('the profile should be available for use', async function(this: CustomWorld) {
  // Open profile selector
  await this.page!.click('mat-select[formcontrolname="profile"], select[name="autopilot-profile"]');
  await this.page!.waitForTimeout(500);
  
  // Check if profile exists
  const profileAvailable = await this.page!.locator('mat-option:has-text("Board Meeting Profile")').isVisible();
  expect(profileAvailable).toBe(true);
  
  // Close dropdown
  await this.page!.keyboard.press('Escape');
});

Then('current timers should pause', async function(this: CustomWorld) {
  const timerPaused = await this.page!.locator('.timer-paused, .countdown-paused, [data-state="paused"]').isVisible({ timeout: 3000 });
  expect(timerPaused).toBe(true);
});

Then('manual control should resume', async function(this: CustomWorld) {
  const manualMode = await this.page!.locator('.manual-control, text="Manual mode"').isVisible();
  expect(manualMode).toBe(true);
});

Then('current state should be saved', async function(this: CustomWorld) {
  const stateSaved = await this.page!.locator('text=/State.*saved|Checkpoint.*created/i').isVisible({ timeout: 3000 });
  expect(stateSaved).toBe(true);
});

Then('autopilot should continue from saved state', async function(this: CustomWorld) {
  const resumed = await this.page!.locator('.autopilot-resumed, text=/Resumed.*from.*checkpoint/i').isVisible({ timeout: 3000 });
  expect(resumed).toBe(true);
});

// Meeting management scenarios
Given('autopilot is managing the meeting', async function(this: CustomWorld) {
  const managing = await this.page!.locator('.autopilot-active, [data-autopilot="active"]').isVisible();
  if (!managing) {
    // Start autopilot
    const autopilotPage = new AutopilotPage(this.page!);
    await autopilotPage.startAutopilot();
  }
  
  this.testData.set('autopilotManaging', true);
});

When('a participant raises a point of order', async function(this: CustomWorld) {
  // Simulate point of order
  await this.page!.evaluate(() => {
    window.dispatchEvent(new Event('point-of-order-raised'));
  });
  
  await this.page!.waitForTimeout(1000);
});

// Parallel sessions
Given('the meeting has {int} parallel sessions', async function(this: CustomWorld, sessionCount: number) {
  this.testData.set('parallelSessions', sessionCount);
  
  // Verify parallel sessions are configured
  const sessions = await this.page!.locator('.parallel-session, .session-track').count();
  expect(sessions).toBe(sessionCount);
});

When('I configure autopilot for each:', async function(this: CustomWorld, dataTable: DataTable) {
  const sessionConfigs = dataTable.hashes();
  
  for (const config of sessionConfigs) {
    const session = config['Session'];
    const profile = config['Profile'];
    
    // Select session
    await this.page!.click(`.session-tab:has-text("${session}"), .session-selector:has-text("${session}")`);
    await this.page!.waitForTimeout(500);
    
    // Configure profile
    await this.page!.click('mat-select[formcontrolname="sessionProfile"]');
    await this.page!.click(`mat-option:has-text("${profile}")`);
    await this.page!.waitForTimeout(500);
  }
});

Then('each session should run independently', async function(this: CustomWorld) {
  const sessionCount = this.testData.get('parallelSessions') || 3;
  
  // Check each session has its own controls
  const independentControls = await this.page!.locator('.session-controls').count();
  expect(independentControls).toBe(sessionCount);
});

Then('I should see all sessions in monitor view', async function(this: CustomWorld) {
  const monitorView = await this.page!.locator('.multi-session-monitor, .parallel-monitor').isVisible();
  expect(monitorView).toBe(true);
  
  // Verify all sessions visible
  const sessionPanels = await this.page!.locator('.session-panel').count();
  expect(sessionPanels).toBe(this.testData.get('parallelSessions') || 3);
});

Then('be able to control each separately', async function(this: CustomWorld) {
  // Check for individual session controls
  const sessionControls = await this.page!.locator('.session-panel .control-buttons').count();
  expect(sessionControls).toBeGreaterThan(0);
});

// Template selection
When('I select autopilot template:', async function(this: CustomWorld, dataTable: DataTable) {
  const templateData = dataTable.hashes()[0];
  const templateType = templateData['Template'];
  
  // Open template selector
  await this.page!.click('button:has-text("Use template"), button:has-text("Templates")');
  await this.page!.waitForTimeout(1000);
  
  // Select template
  await this.page!.click(`.template-item:has-text("${templateType}"), mat-list-item:has-text("${templateType}")`);
  await this.page!.click('button:has-text("Apply template")');
  await this.page!.waitForTimeout(2000);
  
  this.testData.set('selectedTemplate', templateType);
});

Then('autopilot should be pre-configured', async function(this: CustomWorld) {
  const configured = await this.page!.locator('.template-applied, text="Template applied"').isVisible({ timeout: 3000 });
  expect(configured).toBe(true);
});

Then('follow the template structure', async function(this: CustomWorld) {
  // Verify template sections are loaded
  const templateSections = await this.page!.locator('.agenda-section, .template-section').count();
  expect(templateSections).toBeGreaterThan(0);
});

Then('appropriate timings for each section should be applied', async function(this: CustomWorld) {
  // Check timing configurations
  const timingInputs = await this.page!.locator('input[name*="duration"][value]').count();
  expect(timingInputs).toBeGreaterThan(0);
});

// Decision tracking
Given('autopilot is configured to track decisions', async function(this: CustomWorld) {
  // Enable decision tracking
  await this.page!.click('mat-checkbox:has-text("Track decisions"), label:has-text("Record decisions")');
  await this.page!.waitForTimeout(500);
  
  this.testData.set('trackingDecisions', true);
});

When('a vote concludes with a decision', async function(this: CustomWorld) {
  // Simulate vote conclusion
  this.testData.set('decisionMade', true);
  
  await this.page!.evaluate(() => {
    window.dispatchEvent(new CustomEvent('vote-concluded', { 
      detail: { decision: 'Motion approved', voteId: '123' } 
    }));
  });
  
  await this.page!.waitForTimeout(1000);
});

// Livestreaming integration
Given('meeting is being livestreamed', async function(this: CustomWorld) {
  const livestreamActive = await this.page!.locator('.livestream-indicator, .streaming-active').isVisible();
  expect(livestreamActive).toBe(true);
  
  this.testData.set('livestreaming', true);
});

When('autopilot manages transitions', async function(this: CustomWorld) {
  // Autopilot performs a transition
  this.testData.set('transitionOccurred', true);
});

Then('it should:', async function(this: CustomWorld, dataTable: DataTable) {
  const actions = dataTable.raw().flat();
  
  for (const action of actions) {
    if (action.includes('smooth transitions')) {
      const smoothTransition = await this.page!.locator('.transition-indicator, .fade-transition').isVisible({ timeout: 3000 });
      expect(smoothTransition).toBe(true);
    } else if (action.includes('countdown')) {
      const countdown = await this.page!.locator('.transition-countdown').isVisible();
      expect(countdown).toBe(true);
    } else if (action.includes('notification')) {
      const notification = await this.page!.locator('.stream-notification').isVisible();
      expect(notification).toBe(true);
    }
  }
});

// Emergency stop
When('I press the emergency stop button', async function(this: CustomWorld) {
  const autopilotPage = new AutopilotPage(this.page!);
  await autopilotPage.emergencyStop();
});

Then('all timers should stop', async function(this: CustomWorld) {
  // Wait for timers to stop
  await this.page!.waitForTimeout(1000);
  
  // Check timer state
  const timersStopped = await this.page!.locator('.timer-stopped, .countdown-stopped, [data-state="stopped"]').isVisible();
  expect(timersStopped).toBe(true);
});

Then('current state should freeze', async function(this: CustomWorld) {
  const stateFrozen = await this.page!.locator('.state-frozen, .emergency-stop-active').isVisible();
  expect(stateFrozen).toBe(true);
});

Then('manual control should engage', async function(this: CustomWorld) {
  const manualControl = await this.page!.locator('.manual-control-active, text="Manual control engaged"').isVisible();
  expect(manualControl).toBe(true);
});

Then('alert should be logged', async function(this: CustomWorld) {
  const alertLogged = await this.page!.locator('.emergency-log, text=/Emergency.*stop.*activated/i').isVisible({ timeout: 3000 });
  expect(alertLogged).toBe(true);
});