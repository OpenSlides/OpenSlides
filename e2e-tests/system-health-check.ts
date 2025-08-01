import { chromium } from '@playwright/test';
import { AuthHelper } from './support/auth-helper';

async function checkSystemHealth(): Promise<void> {
  console.log('🏥 Running System Health Checks...\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  let allHealthy = true;
  
  try {
    // 1. Check if we can reach the main page
    console.log('1️⃣  Checking main application...');
    const response = await page.goto('https://localhost:8000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    if (response?.status() === 200) {
      console.log('   ✅ Main application is reachable');
    } else {
      console.log(`   ❌ Main application returned status: ${response?.status()}`);
      allHealthy = false;
    }
    
    // 2. Check authentication service
    console.log('\n2️⃣  Checking authentication service...');
    const authHelper = new AuthHelper('https://localhost:8000');
    try {
      await authHelper.authenticatePage(page, 'admin', 'admin');
      console.log('   ✅ Authentication service is working');
    } catch (error) {
      console.log('   ❌ Authentication service failed:', error.message);
      allHealthy = false;
    }
    
    // 3. Check if we can access a meeting
    console.log('\n3️⃣  Checking meeting access...');
    await page.goto('https://localhost:8000/1', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    // Check for error states
    const hasError = await page.locator('text="Error talking to autoupdate"').isVisible({ timeout: 1000 }).catch(() => false);
    const hasLoading = await page.locator('text="Loading data"').isVisible({ timeout: 1000 }).catch(() => false);
    const hasContent = await page.locator('mat-toolbar, os-headbar, .mat-sidenav').isVisible({ timeout: 1000 }).catch(() => false);
    
    if (hasError) {
      console.log('   ❌ Autoupdate service error detected');
      allHealthy = false;
    } else if (hasLoading && !hasContent) {
      console.log('   ❌ Application stuck in loading state');
      allHealthy = false;
    } else if (hasContent) {
      console.log('   ✅ Meeting content is accessible');
    } else {
      console.log('   ⚠️  Unable to verify meeting content');
    }
    
    // 4. Check autoupdate service directly
    console.log('\n4️⃣  Checking autoupdate service...');
    const autoupdateResponse = await page.request.get('https://localhost:8000/system/autoupdate/health');
    if (autoupdateResponse.ok()) {
      console.log('   ✅ Autoupdate service is healthy');
    } else {
      console.log(`   ❌ Autoupdate service returned: ${autoupdateResponse.status()}`);
      allHealthy = false;
    }
    
  } catch (error) {
    console.error('\n❌ System health check failed:', error.message);
    allHealthy = false;
  } finally {
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (!allHealthy) {
    console.error('❌ System health checks FAILED!');
    console.error('\nPossible solutions:');
    console.error('1. Restart services: make stop-dev && make run-dev');
    console.error('2. Wait longer for services to initialize');
    console.error('3. Check docker logs for errors\n');
    process.exit(1);
  }
  
  console.log('✅ All system health checks PASSED!\n');
}

// Run if called directly
if (require.main === module) {
  checkSystemHealth().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { checkSystemHealth };