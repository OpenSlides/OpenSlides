import { Page } from '@playwright/test';
import { EnhancedBasePage, WaitOptions } from './EnhancedBasePage';

export class AutopilotPage extends EnhancedBasePage {
  // Selectors
  readonly startButton = 'button:has-text("Start Autopilot"), [data-cy="start-autopilot"]';
  readonly pauseButton = 'button:has-text("Pause"), [data-cy="pause-autopilot"]';
  readonly stopButton = 'button:has-text("Stop Autopilot"), [data-cy="stop-autopilot"]';
  readonly profileSelect = 'mat-select[formcontrolname="autopilot_profile"], select[name="profile"]';
  readonly controlPanel = '.autopilot-control-panel, [data-cy="autopilot-controls"]';
  readonly currentItemDisplay = '.current-agenda-item, [data-cy="current-item"]';
  readonly timerDisplay = '.autopilot-timer, [data-cy="timer-display"]';
  readonly speakerQueue = '.speaker-queue, [data-cy="speaker-list"]';
  readonly nextActionDisplay = '.next-action, [data-cy="next-action"]';
  readonly createProfileButton = 'button:has-text("Create profile"), [data-cy="create-profile"]';
  readonly settingsButton = 'button:has-text("Autopilot settings"), [mat-icon="settings"]';
  readonly emergencyStopButton = '.emergency-stop, button[color="warn"]:has-text("STOP")';

  constructor(page: Page) {
    super(page);
  }

  async navigate(options?: WaitOptions): Promise<void> {
    await this.goto('/autopilot', {
      waitForNetworkIdle: true,
      waitForSelector: this.controlPanel,
      ...options
    });
  }

  async startAutopilot(profileName?: string, options?: WaitOptions): Promise<void> {
    if (profileName) {
      await this.click(this.profileSelect, options);
      await this.click(`mat-option:has-text("${profileName}")`, options);
    }
    
    await this.click(this.startButton, {
      waitForSelector: this.pauseButton,
      ...options
    });
  }

  async pauseAutopilot(options?: WaitOptions): Promise<void> {
    await this.click(this.pauseButton, options);
  }

  async resumeAutopilot(options?: WaitOptions): Promise<void> {
    await this.click('button:has-text("Resume")', options);
  }

  async stopAutopilot(options?: WaitOptions): Promise<void> {
    await this.click(this.stopButton, options);
    await this.click('button:has-text("Confirm stop")', {
      waitForSelector: this.startButton,
      ...options
    });
  }

  async emergencyStop(options?: WaitOptions): Promise<void> {
    await this.click(this.emergencyStopButton, options);
  }

  async createCustomProfile(profileData: {
    name: string;
    agendaTiming: string;
    speakerWarnings: string[];
    votingDuration: number;
    breakFrequency: string;
  }, options?: WaitOptions): Promise<void> {
    await this.click(this.createProfileButton, {
      waitForSelector: 'input[formcontrolname="profile_name"]',
      ...options
    });
    
    await this.fill('input[formcontrolname="profile_name"]', profileData.name, options);
    
    await this.click('mat-select[formcontrolname="agenda_timing"]', options);
    await this.click(`mat-option:has-text("${profileData.agendaTiming}")`, options);
    
    // Add speaker warnings
    for (const warning of profileData.speakerWarnings) {
      await this.click('button:has-text("Add warning")', options);
      await this.fill('input[formcontrolname="warning_time"]', warning, options);
    }
    
    await this.fill('input[formcontrolname="voting_duration"]', profileData.votingDuration.toString(), options);
    await this.fill('input[formcontrolname="break_frequency"]', profileData.breakFrequency, options);
    
    await this.click('button:has-text("Save profile")', {
      waitForNetworkIdle: true,
      ...options
    });
  }

  async getCurrentAgendaItem(options?: WaitOptions): Promise<string> {
    return await this.getText(this.currentItemDisplay, options);
  }

  async getTimerValue(options?: WaitOptions): Promise<string> {
    const text = await this.getText(this.timerDisplay, options);
    return text || '00:00';
  }

  async getNextAction(options?: WaitOptions): Promise<string> {
    return await this.getText(this.nextActionDisplay, options);
  }

  async getSpeakerQueueCount(options?: WaitOptions): Promise<number> {
    await this.waitForElementStable(this.speakerQueue, options?.timeout);
    const speakers = await this.page.locator(this.speakerQueue).locator('.speaker-item').count();
    return speakers;
  }

  async isAutopilotRunning(options?: WaitOptions): Promise<boolean> {
    return await this.isVisible(this.pauseButton, { timeout: 1000, ...options });
  }

  async handlePointOfOrder(options?: WaitOptions): Promise<void> {
    const pointOfOrderButton = 'button:has-text("Handle point of order")';
    if (await this.isVisible(pointOfOrderButton, { timeout: 1000 })) {
      await this.click(pointOfOrderButton, options);
    }
  }

  async skipToNextItem(options?: WaitOptions): Promise<void> {
    await this.click('button:has-text("Skip to next")', options);
    await this.click('button:has-text("Confirm skip")', options);
  }

  async extendCurrentTime(minutes: number, options?: WaitOptions): Promise<void> {
    await this.click('button:has-text("Extend time")', options);
    await this.fill('input[type="number"]', minutes.toString(), options);
    await this.click('button:has-text("Apply")', options);
  }

  async viewAutopilotReport(options?: WaitOptions): Promise<void> {
    await this.click('button:has-text("View report")', {
      waitForLoadState: true,
      ...options
    });
  }

  async configureBreaks(breaks: Array<{time: string, duration: number}>, options?: WaitOptions): Promise<void> {
    await this.click(this.settingsButton, options);
    await this.click('mat-tab:has-text("Breaks")', options);
    
    for (const breakConfig of breaks) {
      await this.click('button:has-text("Add break")', options);
      await this.fill('input[formcontrolname="break_time"]', breakConfig.time, options);
      await this.fill('input[formcontrolname="break_duration"]', breakConfig.duration.toString(), options);
    }
    
    await this.click('button:has-text("Save")', options);
  }

  async getAutopilotStatus(options?: WaitOptions): Promise<{
    state: string;
    currentItem: string;
    timeRemaining: string;
    upcomingAction: string;
  }> {
    const state = await this.getText('.autopilot-state', options);
    return {
      state: state || 'stopped',
      currentItem: await this.getCurrentAgendaItem(options),
      timeRemaining: await this.getTimerValue(options),
      upcomingAction: await this.getNextAction(options)
    };
  }
}