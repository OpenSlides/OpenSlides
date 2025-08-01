import { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { browserManager } from './browser-manager';
import * as fs from 'fs';
import * as path from 'path';

// Set global default timeout
setDefaultTimeout(30 * 1000); // 30 seconds

// Track if health check has been performed
let healthCheckPerformed = false;

// Create reports directory and perform global setup
BeforeAll({ timeout: 60000 }, async function() {
  console.log('=== BeforeAll: Global setup starting ===');
  
  const dirs = ['reports', 'reports/screenshots', 'reports/videos', 'reports/logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Log test environment info
  console.log('Test environment:', {
    baseUrl: process.env.BASE_URL || 'https://localhost:8000',
    headless: process.env.HEADLESS !== 'false',
    nodeVersion: process.version
  });
  
  // Initialize the global browser instance
  console.log('Starting global browser instance...');
  try {
    await browserManager.getBrowser();
    console.log('Global browser instance ready');
  } catch (error) {
    console.error('Failed to start global browser:', error);
    throw error;
  }
  
  console.log('=== BeforeAll: Global setup complete ===');
});

// Initialize browser before each scenario
Before({ timeout: 60000 }, async function(this: CustomWorld, scenario) {
  console.log(`\n=== Before hook: Starting scenario "${scenario.pickle.name}" ===`);
  
  try {
    // Initialize test data map
    this.testData = new Map();
    
    // Initialize browser with retry logic
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        await this.initBrowser();
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        retries--;
        console.warn(`Browser initialization failed, ${retries} retries left:`, error);
        
        if (retries > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (retries === 0 && lastError) {
      throw new Error(`Failed to initialize browser after 3 attempts: ${lastError}`);
    }
    
    // Verify browser is ready
    if (!this.page) {
      throw new Error('Page not initialized after browser setup');
    }
    
    // Set page event handlers already configured in world.ts
    console.log('Browser initialized successfully');
    
    // Perform health check once per test run
    if (!healthCheckPerformed && this.healthCheck) {
      console.log('Performing initial health check...');
      const healthResult = await this.healthCheck.checkHealth();
      console.log(this.healthCheck.generateReport(healthResult));
      
      if (!healthResult.overall) {
        console.warn('WARNING: Some services are unhealthy, tests may fail');
        
        // In CI, wait for services to become healthy
        if (process.env.CI === 'true') {
          console.log('CI environment detected, waiting for services...');
          const healthy = await this.healthCheck.waitForHealthy({ maxWaitTime: 180000 });
          if (!healthy) {
            throw new Error('Services did not become healthy in CI environment');
          }
        }
      }
      
      healthCheckPerformed = true;
    }
    
  } catch (error) {
    console.error('Failed in Before hook:', error);
    // Try to capture any diagnostic info
    if (this.page && !this.page.isClosed()) {
      await this.screenshot(`before-hook-failure-${Date.now()}`).catch(() => {});
    }
    throw error;
  }
});

// Clean up after each scenario
After({ timeout: 30000 }, async function(this: CustomWorld, { result, pickle }) {
  console.log(`\n=== After hook: Finishing scenario "${pickle.name}" ===`);
  console.log(`Result: ${result?.status || 'unknown'}`);
  
  try {
    // Take screenshot on failure
    if (result?.status === Status.FAILED && this.page && !this.page.isClosed()) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotName = `${pickle.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      
      // Create screenshots directory if it doesn't exist
      const screenshotDir = path.join('reports', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      // Save screenshot to file
      const screenshotPath = path.join(screenshotDir, `${screenshotName}.png`);
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`Screenshot saved: ${screenshotPath}`);
      
      // Also attach to report
      const screenshot = await this.page.screenshot({ fullPage: true });
      await this.attach(screenshot, 'image/png');
      
      // Save page content for debugging
      const htmlPath = path.join('reports', 'logs', `${screenshotName}.html`);
      const pageContent = await this.page.content();
      fs.writeFileSync(htmlPath, pageContent);
      console.log(`Page HTML saved: ${htmlPath}`);
    }
  } catch (error: any) {
    console.warn('Failed to capture failure artifacts:', error?.message || error);
  }
  
  // Clean up test data
  this.testData?.clear();
  this.currentMeetingId = undefined;
  
  // Only close contexts, not the browser itself
  try {
    await this.closeBrowsers();
  } catch (error: any) {
    console.warn('Failed to close contexts:', error?.message || error);
  }
});

// Tagged hooks for specific scenarios
Before({ tags: '@realtime', timeout: 45000 }, async function(this: CustomWorld) {
  console.log('Initializing second browser for real-time scenario');
  try {
    await this.initSecondBrowser();
  } catch (error) {
    console.error('Failed to initialize second browser:', error);
    throw error;
  }
});

Before({ tags: '@admin', timeout: 45000 }, async function(this: CustomWorld) {
  console.log('Pre-authenticating as admin user');
  
  if (!this.loginPage || !this.apiHelper) {
    throw new Error('Login page or API helper not initialized');
  }
  
  try {
    // Try API login first for speed
    await this.apiHelper.login('admin', 'admin');
    console.log('Admin authenticated via API');
  } catch (apiError) {
    console.warn('API login failed, trying UI login:', apiError);
    // Fallback to UI login
    await this.loginPage.navigateToLogin();
    await this.loginPage.login('admin', 'admin');
    console.log('Admin authenticated via UI');
  }
});

Before({ tags: '@meeting', timeout: 45000 }, async function(this: CustomWorld, scenario) {
  console.log('Ensuring test meeting exists');
  
  if (!this.apiHelper) {
    throw new Error('API helper not initialized');
  }
  
  // Always ensure we have a valid meeting
  if (!this.currentMeetingId) {
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
          description: 'Auto-created for e2e testing',
          language: 'en'
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

// Clean up test data after scenarios marked for deletion
After({ tags: '@cleanup', timeout: 30000 }, async function(this: CustomWorld) {
  console.log('Cleaning up test data');
  
  if (this.apiHelper) {
    await this.apiHelper.cleanup();
  }
});

// Global teardown
AfterAll({ timeout: 30000 }, async function() {
  console.log('\n=== AfterAll: Global teardown ===');
  
  // Generate test summary if needed
  const timestamp = new Date().toISOString();
  console.log(`Test run completed at: ${timestamp}`);
  
  // Close the global browser instance
  console.log('Closing global browser instance...');
  try {
    await browserManager.closeBrowser();
    console.log('Global browser closed successfully');
  } catch (error) {
    console.warn('Error closing global browser:', error);
  }
  
  // Could aggregate and save test metrics here
  console.log('=== AfterAll: Teardown complete ===');
});

// Health check before critical operations
Before({ tags: '@critical' }, async function(this: CustomWorld) {
  console.log('Performing health check for critical scenario');
  
  if (!this.page) {
    throw new Error('Page not initialized');
  }
  
  try {
    // Check if the application is responsive
    const response = await this.page.request.get(this.baseUrl, {
      timeout: 10000,
      ignoreHTTPSErrors: true
    });
    
    if (!response.ok()) {
      throw new Error(`Application not responding: ${response.status()}`);
    }
    
    console.log('Health check passed');
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error('Application health check failed - cannot proceed with critical scenario');
  }
});