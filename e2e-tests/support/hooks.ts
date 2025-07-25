import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import * as fs from 'fs';
import * as path from 'path';

// Create reports directory
BeforeAll(async function() {
  const dirs = ['reports', 'reports/screenshots', 'reports/videos'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

// Initialize browser before each scenario
Before({ timeout: 30000 }, async function(this: CustomWorld) {
  try {
    await this.initBrowser();
  } catch (error) {
    console.error('Failed to initialize browser:', error);
    throw error;
  }
});

// Take screenshot on failure
After({ timeout: 15000 }, async function(this: CustomWorld, { result, pickle }) {
  try {
    if (result?.status === Status.FAILED && this.page) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotName = `${pickle.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      
      // Create screenshots directory if it doesn't exist
      const screenshotDir = path.join('reports', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      await this.page.screenshot({
        path: path.join(screenshotDir, `${screenshotName}.png`),
        fullPage: true
      });
      
      // Attach screenshot to report
      const screenshot = await this.page.screenshot({ fullPage: true });
      await this.attach(screenshot, 'image/png');
    }
  } catch (error: any) {
    console.warn('Failed to take screenshot:', error?.message || error);
  } finally {
    // Always try to close browsers
    try {
      await this.closeBrowsers();
    } catch (error: any) {
      console.warn('Failed to close browsers:', error?.message || error);
    }
  }
});

// Tagged hooks for specific scenarios
Before({ tags: '@realtime' }, async function(this: CustomWorld) {
  // Initialize second browser for multi-user scenarios
  await this.initSecondBrowser();
});

Before({ tags: '@admin' }, async function(this: CustomWorld) {
  // Pre-login as admin
  if (this.loginPage) {
    await this.loginPage.navigateToLogin();
    await this.loginPage.login('admin', 'admin');
  }
});

Before({ tags: '@meeting' }, async function(this: CustomWorld, scenario) {
  // Ensure we have a test meeting
  if (!this.currentMeetingId && this.apiHelper) {
    try {
      // Check if meeting 1 exists, if not create one
      const meetingExists = await this.apiHelper.ensureMeetingExists(1);
      if (meetingExists) {
        this.currentMeetingId = '1';
        console.log('Using existing meeting ID: 1');
      } else {
        // Create a new meeting
        const meetingId = await this.apiHelper.createMeeting({
          name: `Test Meeting - ${scenario.pickle.name}`,
          description: 'Auto-created for e2e testing'
        });
        this.currentMeetingId = meetingId.toString();
        console.log(`Created meeting ID: ${meetingId}`);
      }
    } catch (error: any) {
      console.warn('Failed to ensure meeting exists:', error?.message || error);
      this.currentMeetingId = '1'; // Fallback
    }
  }
});

// Clean up test data
After({ tags: '@delete' }, async function(this: CustomWorld) {
  // Clean up any created test data
  // This could involve API calls to delete test entities
});

// Performance tracking
Before(async function(this: CustomWorld) {
  if (this.page) {
    // Start performance tracking
    await this.page.coverage.startJSCoverage();
    await this.page.coverage.startCSSCoverage();
  }
});

After(async function(this: CustomWorld) {
  if (this.page) {
    // Stop coverage and save if needed
    const jsCoverage = await this.page.coverage.stopJSCoverage();
    const cssCoverage = await this.page.coverage.stopCSSCoverage();
    
    // Could save coverage data here if needed
  }
});