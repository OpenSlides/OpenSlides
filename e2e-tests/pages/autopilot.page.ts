import { Page, Locator } from '@playwright/test';

export class AutopilotPage {
  readonly page: Page;
  readonly startButton: Locator;
  readonly pauseButton: Locator;
  readonly stopButton: Locator;
  readonly profileSelect: Locator;
  readonly controlPanel: Locator;
  readonly currentItemDisplay: Locator;
  readonly timerDisplay: Locator;
  readonly speakerQueue: Locator;
  readonly nextActionDisplay: Locator;
  readonly createProfileButton: Locator;
  readonly settingsButton: Locator;
  readonly emergencyStopButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startButton = page.locator('button:has-text("Start Autopilot"), [data-cy="start-autopilot"]');
    this.pauseButton = page.locator('button:has-text("Pause"), [data-cy="pause-autopilot"]');
    this.stopButton = page.locator('button:has-text("Stop Autopilot"), [data-cy="stop-autopilot"]');
    this.profileSelect = page.locator('mat-select[formcontrolname="autopilot_profile"], select[name="profile"]');
    this.controlPanel = page.locator('.autopilot-control-panel, [data-cy="autopilot-controls"]');
    this.currentItemDisplay = page.locator('.current-agenda-item, [data-cy="current-item"]');
    this.timerDisplay = page.locator('.autopilot-timer, [data-cy="timer-display"]');
    this.speakerQueue = page.locator('.speaker-queue, [data-cy="speaker-list"]');
    this.nextActionDisplay = page.locator('.next-action, [data-cy="next-action"]');
    this.createProfileButton = page.locator('button:has-text("Create profile"), [data-cy="create-profile"]');
    this.settingsButton = page.locator('button:has-text("Autopilot settings"), [mat-icon="settings"]');
    this.emergencyStopButton = page.locator('.emergency-stop, button[color="warn"]:has-text("STOP")');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/autopilot');
    await this.page.waitForLoadState('networkidle');
  }

  async startAutopilot(profileName?: string): Promise<void> {
    if (profileName) {
      await this.profileSelect.click();
      await this.page.locator(`mat-option:has-text("${profileName}")`).click();
    }
    
    await this.startButton.click();
    await this.page.waitForTimeout(1000);
  }

  async pauseAutopilot(): Promise<void> {
    await this.pauseButton.click();
    await this.page.waitForTimeout(500);
  }

  async resumeAutopilot(): Promise<void> {
    await this.page.locator('button:has-text("Resume")').click();
    await this.page.waitForTimeout(500);
  }

  async stopAutopilot(): Promise<void> {
    await this.stopButton.click();
    await this.page.locator('button:has-text("Confirm stop")').click();
    await this.page.waitForTimeout(1000);
  }

  async emergencyStop(): Promise<void> {
    await this.emergencyStopButton.click();
    await this.page.waitForTimeout(500);
  }

  async createCustomProfile(profileData: {
    name: string;
    agendaTiming: string;
    speakerWarnings: string[];
    votingDuration: number;
    breakFrequency: string;
  }): Promise<void> {
    await this.createProfileButton.click();
    await this.page.waitForTimeout(1000);
    
    await this.page.fill('input[formcontrolname="profile_name"]', profileData.name);
    
    await this.page.locator('mat-select[formcontrolname="agenda_timing"]').click();
    await this.page.locator(`mat-option:has-text("${profileData.agendaTiming}")`).click();
    
    // Add speaker warnings
    for (const warning of profileData.speakerWarnings) {
      await this.page.locator('button:has-text("Add warning")').click();
      await this.page.fill('input[formcontrolname="warning_time"]', warning);
    }
    
    await this.page.fill('input[formcontrolname="voting_duration"]', profileData.votingDuration.toString());
    await this.page.fill('input[formcontrolname="break_frequency"]', profileData.breakFrequency);
    
    await this.page.locator('button:has-text("Save profile")').click();
    await this.page.waitForTimeout(2000);
  }

  async getCurrentAgendaItem(): Promise<string> {
    return await this.currentItemDisplay.textContent() || '';
  }

  async getTimerValue(): Promise<string> {
    return await this.timerDisplay.textContent() || '00:00';
  }

  async getNextAction(): Promise<string> {
    return await this.nextActionDisplay.textContent() || '';
  }

  async getSpeakerQueueCount(): Promise<number> {
    const speakers = await this.speakerQueue.locator('.speaker-item').count();
    return speakers;
  }

  async isAutopilotRunning(): Promise<boolean> {
    return await this.pauseButton.isVisible();
  }

  async handlePointOfOrder(): Promise<void> {
    const pointOfOrderButton = this.page.locator('button:has-text("Handle point of order")');
    if (await pointOfOrderButton.isVisible()) {
      await pointOfOrderButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async skipToNextItem(): Promise<void> {
    await this.page.locator('button:has-text("Skip to next")').click();
    await this.page.locator('button:has-text("Confirm skip")').click();
    await this.page.waitForTimeout(1000);
  }

  async extendCurrentTime(minutes: number): Promise<void> {
    await this.page.locator('button:has-text("Extend time")').click();
    await this.page.fill('input[type="number"]', minutes.toString());
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(500);
  }

  async viewAutopilotReport(): Promise<void> {
    await this.page.locator('button:has-text("View report")').click();
    await this.page.waitForTimeout(1000);
  }

  async configureBreaks(breaks: Array<{time: string, duration: number}>): Promise<void> {
    await this.settingsButton.click();
    await this.page.locator('mat-tab:has-text("Breaks")').click();
    
    for (const breakConfig of breaks) {
      await this.page.locator('button:has-text("Add break")').click();
      await this.page.fill('input[formcontrolname="break_time"]', breakConfig.time);
      await this.page.fill('input[formcontrolname="break_duration"]', breakConfig.duration.toString());
    }
    
    await this.page.locator('button:has-text("Save")').click();
    await this.page.waitForTimeout(1000);
  }

  async getAutopilotStatus(): Promise<{
    state: string;
    currentItem: string;
    timeRemaining: string;
    upcomingAction: string;
  }> {
    return {
      state: await this.page.locator('.autopilot-state').textContent() || 'stopped',
      currentItem: await this.getCurrentAgendaItem(),
      timeRemaining: await this.getTimerValue(),
      upcomingAction: await this.getNextAction()
    };
  }
}