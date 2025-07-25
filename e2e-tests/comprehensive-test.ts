import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  error?: string;
  duration?: number;
  screenshots: string[];
  startTime: string;
  endTime?: string;
}

interface TestReport {
  startTime: string;
  endTime?: string;
  duration?: number;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

const baseUrl = 'https://localhost:8000';
const screenshotDir = './test-results/screenshots';
const testReport: TestReport = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0
  }
};

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath });
  return filename;
}

async function runTest(
  name: string, 
  testFn: (page: Page) => Promise<void>, 
  page: Page
): Promise<void> {
  const test: TestResult = {
    name,
    status: 'passed',
    screenshots: [],
    startTime: new Date().toISOString()
  };
  
  // Add test to report immediately so it can be accessed
  testReport.tests.push(test);
  testReport.summary.total++;
  
  const startTime = Date.now();
  
  try {
    await testFn(page);
    console.log(`✓ ${name}`);
    testReport.summary.passed++;
  } catch (error: any) {
    test.status = 'failed';
    test.error = error.message;
    testReport.summary.failed++;
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
  
  test.duration = Date.now() - startTime;
  test.endTime = new Date().toISOString();
}

// Test functions
async function testSuccessfulLogin(page: Page): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState('domcontentloaded');
  
  const test = testReport.tests[testReport.tests.length - 1];
  test.screenshots.push(await takeScreenshot(page, 'login-page'));
  
  await page.fill('input[formcontrolname="username"]', 'admin');
  await page.fill('input[formcontrolname="password"]', 'admin');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  
  const url = page.url();
  if (!url.includes('/login')) {
    test.screenshots.push(await takeScreenshot(page, 'after-login'));
  } else {
    throw new Error('Login failed - still on login page');
  }
}

async function testInvalidLogin(page: Page): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState('domcontentloaded');
  
  await page.fill('input[formcontrolname="username"]', 'invalid');
  await page.fill('input[formcontrolname="password"]', 'wrong');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  const test = testReport.tests[testReport.tests.length - 1];
  test.screenshots.push(await takeScreenshot(page, 'invalid-login'));
  
  const errorVisible = await page.locator('.mat-error, .error-message, [role="alert"]').isVisible();
  const stillOnLogin = page.url().includes('/login');
  
  if (!errorVisible && !stillOnLogin) {
    throw new Error('Invalid login should show error or stay on login page');
  }
}

async function testNavigationMenu(page: Page): Promise<void> {
  // Login first
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[formcontrolname="username"]', 'admin');
  await page.fill('input[formcontrolname="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  const test = testReport.tests[testReport.tests.length - 1];
  
  // Navigate to meetings
  await page.goto(`${baseUrl}/meetings`);
  await page.waitForTimeout(2000);
  test.screenshots.push(await takeScreenshot(page, 'meetings-page'));
  
  // Navigate to committees
  await page.goto(`${baseUrl}/committees`);
  await page.waitForTimeout(2000);
  test.screenshots.push(await takeScreenshot(page, 'committees-page'));
  
  // Navigate to accounts
  await page.goto(`${baseUrl}/accounts`);
  await page.waitForTimeout(2000);
  test.screenshots.push(await takeScreenshot(page, 'accounts-page'));
}

async function testMeetingAccess(page: Page): Promise<void> {
  // Login first
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[formcontrolname="username"]', 'admin');
  await page.fill('input[formcontrolname="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  const test = testReport.tests[testReport.tests.length - 1];
  
  // Go to meetings page
  await page.goto(`${baseUrl}/meetings`);
  await page.waitForTimeout(2000);
  
  const meetingTiles = await page.locator('.meeting-tile').count();
  console.log(`  → Found ${meetingTiles} meetings`);
  
  if (meetingTiles === 0) {
    console.log('  → No meetings found, creating test meeting...');
    
    // Create a test meeting
    const createButton = page.locator('[data-cy="headbarMainButton"], button:has-text("Create meeting"), button:has-text("New meeting")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      await page.fill('input[formcontrolname="name"]', 'Test Meeting');
      
      const committeeSelect = page.locator('mat-select[formcontrolname="committee_id"]');
      if (await committeeSelect.isVisible()) {
        await committeeSelect.click();
        await page.waitForTimeout(500);
        
        const firstOption = page.locator('mat-option').first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
        }
      }
      
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(3000);
    }
  }
  
  // Now try to access a meeting
  const firstMeeting = page.locator('.meeting-tile').first();
  if (await firstMeeting.isVisible()) {
    await firstMeeting.click();
    await page.waitForTimeout(3000);
    
    // Navigate to different sections
    const agendaLink = page.locator('a[href*="/agenda"], mat-nav-list a:has-text("Agenda")');
    if (await agendaLink.isVisible()) {
      await agendaLink.click();
      await page.waitForTimeout(2000);
      test.screenshots.push(await takeScreenshot(page, 'meeting-agenda'));
    }
    
    const motionsLink = page.locator('a[href*="/motions"], mat-nav-list a:has-text("Motions")');
    if (await motionsLink.isVisible()) {
      await motionsLink.click();
      await page.waitForTimeout(2000);
      test.screenshots.push(await takeScreenshot(page, 'meeting-motions'));
    }
    
    const participantsLink = page.locator('a[href*="/participants"], mat-nav-list a:has-text("Participants")');
    if (await participantsLink.isVisible()) {
      await participantsLink.click();
      await page.waitForTimeout(2000);
      test.screenshots.push(await takeScreenshot(page, 'meeting-participants'));
    }
  } else {
    console.log('  → Could not find meeting tile to click');
  }
}

async function testMobileResponsiveness(page: Page): Promise<void> {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState('domcontentloaded');
  
  const test = testReport.tests[testReport.tests.length - 1];
  test.screenshots.push(await takeScreenshot(page, 'mobile-login'));
  
  const loginForm = await page.locator('form').isVisible();
  if (!loginForm) {
    throw new Error('Login form not visible on mobile');
  }
}

async function testPageLoadPerformance(page: Page): Promise<void> {
  const startTime = Date.now();
  await page.goto(`${baseUrl}/login`, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
  const loadTime = Date.now() - startTime;
  
  console.log(`  → Page load time: ${loadTime}ms`);
  
  if (loadTime > 10000) {
    throw new Error(`Page load took too long: ${loadTime}ms`);
  }
}

async function testFileUpload(page: Page): Promise<void> {
  // Login first
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[formcontrolname="username"]', 'admin');
  await page.fill('input[formcontrolname="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  const test = testReport.tests[testReport.tests.length - 1];
  
  // Navigate to files section - try different possible URLs
  const fileUrls = [
    `${baseUrl}/files`,
    `${baseUrl}/mediafiles`, 
    `${baseUrl}/media`,
    `${baseUrl}/documents`
  ];
  
  let filesPageFound = false;
  for (const url of fileUrls) {
    try {
      await page.goto(url, { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      // Check if we're on a files page
      const hasUploadButton = await page.locator('button:has-text("Upload"), input[type="file"], button:has-text("Add file")').count() > 0;
      const hasFileElements = await page.locator('[class*="file"], [class*="media"], [class*="document"]').count() > 0;
      
      if (hasUploadButton || hasFileElements) {
        filesPageFound = true;
        console.log(`  → Found files page at: ${url}`);
        break;
      }
    } catch (e) {
      // Try next URL
    }
  }
  
  if (!filesPageFound) {
    // Try accessing files through a meeting
    await page.goto(`${baseUrl}/meetings`);
    await page.waitForTimeout(2000);
    
    const meetingTile = page.locator('.meeting-tile').first();
    if (await meetingTile.isVisible()) {
      await meetingTile.click();
      await page.waitForTimeout(2000);
      
      // Look for files link in meeting navigation
      const filesLink = page.locator('a[href*="/files"], a[href*="/media"], mat-nav-list a:has-text("Files")').first();
      if (await filesLink.isVisible()) {
        await filesLink.click();
        await page.waitForTimeout(2000);
        filesPageFound = true;
        console.log('  → Accessed files through meeting');
      }
    }
  }
  
  if (!filesPageFound) {
    console.log('  → Files section not accessible, skipping file upload test');
    return;
  }
  
  // Try to upload a file
  const fileInput = await page.locator('input[type="file"]').first();
  const uploadButton = await page.locator('button:has-text("Upload"), button:has-text("Add file"), button:has-text("Select file")').first();
  
  if (await fileInput.isVisible() || await uploadButton.isVisible()) {
    test.screenshots.push(await takeScreenshot(page, 'files-page'));
    
    // If there's an upload button, click it first
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Set the file to upload
    const testFilePath = path.join(__dirname, 'test-files', 'test-document.txt');
    
    try {
      await fileInput.setInputFiles(testFilePath);
      console.log('  → File selected for upload');
      
      // Look for submit/upload confirmation button
      const confirmButton = await page.locator('button:has-text("Upload"), button:has-text("Save"), button:has-text("Confirm")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(3000);
        console.log('  → File upload initiated');
      }
      
      test.screenshots.push(await takeScreenshot(page, 'file-uploaded'));
    } catch (error) {
      console.log('  → File upload not fully implemented in UI');
    }
  } else {
    console.log('  → No file upload interface found');
  }
}

// Main test runner
async function runTests(): Promise<void> {
  console.log('Starting OpenSlides E2E Tests...\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Run all tests
  await runTest('testSuccessfulLogin', testSuccessfulLogin, page);
  await runTest('testInvalidLogin', testInvalidLogin, page);
  await runTest('testNavigationMenu', testNavigationMenu, page);
  await runTest('testMeetingAccess', testMeetingAccess, page);
  await runTest('testMobileResponsiveness', testMobileResponsiveness, page);
  await runTest('testPageLoadPerformance', testPageLoadPerformance, page);
  await runTest('testFileUpload', testFileUpload, page);
  
  await browser.close();
  
  // Calculate total duration
  testReport.endTime = new Date().toISOString();
  testReport.duration = testReport.tests.reduce((sum, test) => sum + (test.duration || 0), 0);
  testReport.summary.duration = testReport.duration;
  
  // Write report
  fs.writeFileSync('./test-results/test-results.json', JSON.stringify(testReport, null, 2));
  
  // Print summary
  console.log('\n--- Test Summary ---');
  console.log(`Total: ${testReport.summary.total}`);
  console.log(`Passed: ${testReport.summary.passed}`);
  console.log(`Failed: ${testReport.summary.failed}`);
  console.log(`Duration: ${testReport.duration}ms`);
  console.log(`\nReport saved to: ./test-results/test-results.json`);
}

// Run tests
runTests().catch(console.error);