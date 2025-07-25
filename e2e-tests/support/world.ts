import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { BrowserContext, Page, Browser, chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MeetingsPage } from '../pages/MeetingsPage';
import { AgendaPage } from '../pages/meeting/AgendaPage';
import { MotionsPage } from '../pages/meeting/MotionsPage';
import { ParticipantsPage } from '../pages/meeting/ParticipantsPage';
import { APIHelper } from './api-helper';

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
  
  // Test data
  testData: Map<string, any>;
  currentMeetingId?: string;
  baseUrl: string;
  
  // Helper methods
  initBrowser(): Promise<void>;
  initSecondBrowser(): Promise<void>;
  closeBrowsers(): Promise<void>;
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
  currentMeetingId?: string;
  
  testData: Map<string, any> = new Map();
  baseUrl: string = 'https://localhost:8000';
  
  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = options.parameters.baseUrl || 'https://localhost:8000';
  }
  
  async initBrowser() {
    try {
      this.browser = await chromium.launch({
        headless: this.parameters.headless !== false,
        args: [
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--disable-web-security',
          '--no-sandbox',
          '--disable-dev-shm-usage'
        ],
        timeout: 30000
      });
      
      this.context = await this.browser.newContext({
        ignoreHTTPSErrors: true,
        baseURL: this.baseUrl,
        viewport: { width: 1920, height: 1080 },
        recordVideo: this.parameters.video ? {
          dir: 'reports/videos',
          size: { width: 1920, height: 1080 }
        } : undefined
      });
      
      this.page = await this.context.newPage();
      
      // Set default timeout
      this.page.setDefaultTimeout(30000);
      
      // Initialize page objects
      this.loginPage = new LoginPage(this.page);
      this.dashboardPage = new DashboardPage(this.page);
      this.meetingsPage = new MeetingsPage(this.page);
      this.agendaPage = new AgendaPage(this.page);
      this.motionsPage = new MotionsPage(this.page);
      this.participantsPage = new ParticipantsPage(this.page);
      
      // Initialize API helper
      this.apiHelper = new APIHelper(this.page, this.baseUrl);
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }
  
  async initSecondBrowser() {
    this.browser2 = await chromium.launch({
      headless: this.parameters.headless !== false,
      args: [
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--disable-web-security'
      ]
    });
    
    this.context2 = await this.browser2.newContext({
      ignoreHTTPSErrors: true,
      baseURL: this.baseUrl,
      viewport: { width: 1920, height: 1080 }
    });
    
    this.page2 = await this.context2.newPage();
  }
  
  async closeBrowsers() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    if (this.context2) await this.context2.close();
    if (this.browser2) await this.browser2.close();
  }
}

setWorldConstructor(OpenSlidesWorld);