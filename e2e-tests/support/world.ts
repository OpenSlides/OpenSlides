import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { BrowserContext, Page, Browser, chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MeetingsPage } from '../pages/MeetingsPage';
import { AgendaPage } from '../pages/meeting/AgendaPage';
import { MotionsPage } from '../pages/meeting/MotionsPage';
import { ParticipantsPage } from '../pages/meeting/ParticipantsPage';
import { APIHelper } from './api-helper';
import { HealthCheck } from './health-check';
import { browserManager } from './browser-manager';
import { AuthHelper } from './auth-helper';
import { SetupHelper } from './setup-helper';

export interface CustomWorld extends World {
  // Browser instances
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  
  // Additional browsers for multi-user scenarios
  browser2?: Browser;
  context2?: BrowserContext;
  page2?: Page;
  
  // Page Objects
  loginPage?: LoginPage;
  dashboardPage?: DashboardPage;
  meetingsPage?: MeetingsPage;
  agendaPage?: AgendaPage;
  motionsPage?: MotionsPage;
  participantsPage?: ParticipantsPage;
  
  // API Helper
  apiHelper?: APIHelper;
  
  // Auth Helper
  authHelper?: AuthHelper;
  
  // Setup Helper
  setupHelper?: SetupHelper;
  
  // Health Check
  healthCheck?: HealthCheck;
  
  // Test data
  testData: Map<string, any>;
  currentMeetingId?: string;
  baseUrl: string;
  
  // Real-time test data
  expectedNewItem?: string;
  expectedMotionState?: string;
  concurrentEditor?: string;
  initialVoteCount?: string;
  myUsername?: string;
  initialParticipantCount?: number;
  expectedNotification?: string;
  concurrentUpdates?: Array<{[key: string]: string}>;
  updateStartTime?: number;
  offlineActions?: Array<{[key: string]: string}>;
  steps?: any; // For reusing step definitions
  
  // Helper methods
  initBrowser(): Promise<void>;
  initSecondBrowser(): Promise<void>;
  closeBrowsers(): Promise<void>;
  screenshot(name: string): Promise<void>;
  loginViaAPI(username: string, password: string): Promise<void>;
}

class OpenSlidesWorld extends World implements CustomWorld {
  // Properties from CustomWorld interface
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  browser2?: Browser;
  context2?: BrowserContext;
  page2?: Page;
  loginPage?: LoginPage;
  dashboardPage?: DashboardPage;
  meetingsPage?: MeetingsPage;
  agendaPage?: AgendaPage;
  motionsPage?: MotionsPage;
  participantsPage?: ParticipantsPage;
  apiHelper?: APIHelper;
  authHelper?: AuthHelper;
  setupHelper?: SetupHelper;
  healthCheck?: HealthCheck;
  currentMeetingId?: string;
  
  // Real-time test data
  expectedNewItem?: string;
  expectedMotionState?: string;
  concurrentEditor?: string;
  initialVoteCount?: string;
  myUsername?: string;
  initialParticipantCount?: number;
  expectedNotification?: string;
  concurrentUpdates?: Array<{[key: string]: string}>;
  updateStartTime?: number;
  offlineActions?: Array<{[key: string]: string}>;
  steps?: any;
  
  testData: Map<string, any> = new Map();
  baseUrl: string = 'https://localhost:8000';
  
  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = options.parameters.baseUrl || 'https://localhost:8000';
  }
  
  async initBrowser() {
    try {
      console.log('Initializing browser context...');
      
      // Close any existing context and page first
      if (this.page && !this.page.isClosed()) {
        console.log('Closing existing page...');
        await this.page.close().catch((err) => {
          console.warn('Error closing existing page:', err.message);
        });
        this.page = undefined;
      }
      if (this.context) {
        console.log('Closing existing context...');
        await this.context.close().catch((err) => {
          console.warn('Error closing existing context:', err.message);
        });
        this.context = undefined;
      }
      
      // Get the shared browser instance
      console.log('Getting shared browser instance...');
      this.browser = await browserManager.getBrowser();
      
      console.log('Creating new context...');
      
      this.context = await this.browser.newContext({
        ignoreHTTPSErrors: true,
        baseURL: this.baseUrl,
        viewport: { width: 1920, height: 1080 },
        recordVideo: this.parameters.video ? {
          dir: 'reports/videos',
          size: { width: 1920, height: 1080 }
        } : undefined,
        extraHTTPHeaders: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        locale: 'en-US',
        timezoneId: 'America/New_York'
      });
      
      // Set up context error handlers
      this.context.on('close', () => {
        console.warn('Browser context was closed unexpectedly');
      });
      
      this.context.on('page', page => {
        console.log('New page created in context');
      });
      
      console.log('Creating new page...');
      this.page = await this.context.newPage();
      
      // Set default timeout and navigation timeout
      this.page.setDefaultTimeout(30000);
      this.page.setDefaultNavigationTimeout(30000);
      
      // Set up page error handlers
      this.page.on('pageerror', error => {
        console.error('Page error:', error.message);
      });
      
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error('Console error:', msg.text());
        }
      });
      
      this.page.on('crash', () => {
        console.error('Page crashed! This usually indicates a browser issue.');
        // Mark page as unusable
        this.page = undefined;
      });
      
      this.page.on('close', () => {
        console.warn('Page was closed');
      });
      
      // Add page stability check
      this.page.on('framenavigated', frame => {
        if (frame === this.page?.mainFrame()) {
          console.log('Main frame navigated to:', frame.url());
        }
      });
      
      // Set up request/response logging for debugging
      this.page.on('requestfailed', request => {
        const url = request.url();
        const errorText = request.failure()?.errorText;
        
        // Don't log expected autoupdate failures
        if (!url.includes('/system/autoupdate') && !url.includes('icc') && !errorText?.includes('net::ERR_ABORTED')) {
          console.error(`Request failed: ${url} - ${errorText}`);
        }
      });
      
      this.page.on('response', response => {
        const url = response.url();
        const status = response.status();
        
        // Don't log expected failures
        if (status >= 400 && !url.includes('/system/autoupdate') && !url.includes('favicon') && !url.includes('icc')) {
          console.warn(`HTTP ${status} - ${url}`);
        }
      });
      
      console.log('Page created, initializing page objects...');
      
      // Initialize page objects
      this.loginPage = new LoginPage(this.page);
      this.dashboardPage = new DashboardPage(this.page);
      this.meetingsPage = new MeetingsPage(this.page);
      this.agendaPage = new AgendaPage(this.page);
      this.motionsPage = new MotionsPage(this.page);
      this.participantsPage = new ParticipantsPage(this.page);
      
      // Initialize API helper
      this.apiHelper = new APIHelper(this.page, this.baseUrl);
      
      // Initialize auth helper
      this.authHelper = new AuthHelper(this.baseUrl);
      
      // Initialize setup helper
      this.setupHelper = new SetupHelper(this.baseUrl);
      
      // Initialize health check
      this.healthCheck = new HealthCheck(this.page, this.baseUrl);
      
      console.log('Browser initialization complete');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      // Clean up on failure
      await this.closeBrowsers().catch(() => {});
      throw error;
    }
  }
  
  async initSecondBrowser() {
    try {
      console.log('Initializing second browser for concurrent scenarios...');
      
      // Close any existing second context first
      if (this.page2 && !this.page2.isClosed()) {
        await this.page2.close().catch(() => {});
      }
      if (this.context2) {
        await this.context2.close().catch(() => {});
      }
      
      // For second browser, we can use the shared browser too
      if (!this.browser2) {
        // Create a separate browser instance for concurrent testing
        this.browser2 = await chromium.launch({
          headless: this.parameters.headless !== false,
          args: [
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled'
          ],
          timeout: 60000
        });
      }
      
      this.context2 = await this.browser2.newContext({
        ignoreHTTPSErrors: true,
        baseURL: this.baseUrl,
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        locale: 'en-US',
        timezoneId: 'America/New_York'
      });
      
      this.page2 = await this.context2.newPage();
      this.page2.setDefaultTimeout(30000);
      this.page2.setDefaultNavigationTimeout(30000);
      
      console.log('Second browser initialization complete');
    } catch (error) {
      console.error('Failed to initialize second browser:', error);
      // Clean up on failure
      if (this.context2) await this.context2.close().catch(() => {});
      if (this.browser2) await this.browser2.close().catch(() => {});
      throw error;
    }
  }
  
  async closeBrowsers() {
    console.log('Closing browser contexts...');
    
    // Only close contexts and pages, not the browser itself
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close().catch(() => {});
      }
      if (this.context) {
        await this.context.close().catch(() => {});
      }
      // Don't close the shared browser instance - it's managed by browserManager
    } catch (error) {
      console.warn('Error closing primary context:', error);
    }
    
    // Close secondary browser (this one we do own)
    try {
      if (this.page2 && !this.page2.isClosed()) {
        await this.page2.close().catch(() => {});
      }
      if (this.context2) {
        await this.context2.close().catch(() => {});
      }
      if (this.browser2 && this.browser2.isConnected()) {
        await this.browser2.close().catch(() => {});
      }
    } catch (error) {
      console.warn('Error closing secondary browser:', error);
    }
    
    // Clear references
    this.page = undefined;
    this.context = undefined;
    // Keep browser reference as it's shared
    this.page2 = undefined;
    this.context2 = undefined;
    this.browser2 = undefined;
    
    console.log('Browser contexts closed');
  }
  
  async screenshot(name: string) {
    if (!this.page || this.page.isClosed()) {
      console.warn('Cannot take screenshot - page not available');
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `reports/screenshots/${timestamp}-${name}.png`;
    
    try {
      await this.page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      console.log(`Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      console.warn('Failed to take screenshot:', error);
    }
  }
  
  // Helper method for API-based login
  async loginViaAPI(username: string, password: string): Promise<void> {
    if (!this.authHelper || !this.page) {
      throw new Error('Auth helper or page not initialized');
    }
    
    try {
      await this.authHelper.authenticatePage(this.page, username, password);
      console.log(`Logged in as ${username} via API`);
    } catch (error) {
      console.error('API login failed:', error);
      throw error;
    }
  }
  
  // Helper method to ensure test meeting exists
  async ensureTestMeeting(meetingName: string = 'Board Meeting'): Promise<void> {
    console.log(`Ensuring test meeting "${meetingName}" exists`);
    
    if (!this.apiHelper) {
      console.warn('API helper not initialized, cannot create meeting');
      return;
    }
    
    try {
      // Check if meeting already exists
      const meetingsPage = this.meetingsPage;
      if (meetingsPage && this.page && !this.page.isClosed()) {
        await meetingsPage.goto();
        const exists = await meetingsPage.isMeetingVisible(meetingName);
        
        if (!exists) {
          console.log(`Meeting "${meetingName}" not found, creating it...`);
          // Create meeting using API with language field
          const meetingId = await this.apiHelper.createMeeting({
            name: meetingName,
            description: 'Test meeting for E2E tests',
            language: 'en'
          });
          this.currentMeetingId = meetingId.toString();
          console.log(`Created meeting with ID: ${meetingId}`);
        } else {
          console.log(`Meeting "${meetingName}" already exists`);
          this.currentMeetingId = '1'; // Default to ID 1 for existing meetings
        }
      }
    } catch (error) {
      console.warn('Failed to ensure test meeting exists:', error);
      // Use default meeting ID as fallback
      this.currentMeetingId = '1';
    }
  }
}

setWorldConstructor(OpenSlidesWorld);