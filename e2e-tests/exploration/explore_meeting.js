const { chromium } = require('playwright');

async function exploreMeeting() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--ignore-certificate-errors', '--ignore-ssl-errors', '--disable-web-security']
  });
  
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  try {
    // Login
    await page.goto('https://localhost:8000', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.fill('input[formControlName="username"]', 'admin');
    await page.fill('input[formControlName="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('=== EXPLORING ORGANIZATION LEVEL ===');
    
    // Click on Meetings
    console.log('1. Checking Meetings page...');
    await page.click('a[href="/meetings"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/meetings-page.png' });
    console.log('Meetings page URL:', page.url());
    
    // Click on Committees
    console.log('2. Checking Committees page...');
    await page.click('a[href="/committees"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/committees-page.png' });
    console.log('Committees page URL:', page.url());
    
    // Click on Accounts
    console.log('3. Checking Accounts page...');
    await page.click('a[href="/accounts"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/accounts-page.png' });
    console.log('Accounts page URL:', page.url());
    
    // Click on Tags
    console.log('4. Checking Tags page...');
    await page.click('a[href="/organization-tags"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/tags-page.png' });
    console.log('Tags page URL:', page.url());
    
    // Click on Design
    console.log('5. Checking Design page...');
    await page.click('a[href="/designs"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/designs-page.png' });
    console.log('Design page URL:', page.url());
    
    console.log('=== ENTERING DEMO MEETING ===');
    
    // Go back to dashboard and enter the demo meeting
    await page.click('a[href="/"]');
    await page.waitForTimeout(2000);
    
    // Click on OpenSlides Demo meeting
    const demoMeeting = page.locator('text=OpenSlides Demo').first();
    await demoMeeting.click();
    await page.waitForTimeout(3000);
    
    console.log('Meeting URL:', page.url());
    console.log('Meeting Title:', await page.title());
    
    // Take screenshot of meeting dashboard
    await page.screenshot({ path: '/tmp/meeting-home.png' });
    
    // Find all navigation items in the meeting
    console.log('=== MEETING NAVIGATION ===');
    const meetingNav = await page.locator('mat-nav-list a, .nav-item a').all();
    
    for (let i = 0; i < meetingNav.length; i++) {
      try {
        const text = await meetingNav[i].textContent();
        const href = await meetingNav[i].getAttribute('href');
        if (text && text.trim()) {
          console.log(`Meeting Nav ${i+1}: ${text.trim()} -> ${href}`);
        }
      } catch (e) {
        // Skip problematic elements
      }
    }
    
    // Explore each meeting section
    const sectionsToExplore = [
      { name: 'Agenda', selector: 'text=Agenda' },
      { name: 'Motions', selector: 'text=Motions' },
      { name: 'Elections', selector: 'text=Elections' },
      { name: 'Participants', selector: 'text=Participants' },
      { name: 'Files', selector: 'text=Files' },
      { name: 'Projector', selector: 'text=Projector' },
      { name: 'Chat', selector: 'text=Chat' },
      { name: 'History', selector: 'text=History' },
      { name: 'Settings', selector: 'text=Settings' }
    ];
    
    for (const section of sectionsToExplore) {
      try {
        console.log(`=== EXPLORING ${section.name.toUpperCase()} ===`);
        const navLink = page.locator(section.selector).first();
        if (await navLink.count() > 0) {
          await navLink.click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          const currentTitle = await page.title();
          console.log(`${section.name} URL: ${currentUrl}`);
          console.log(`${section.name} Title: ${currentTitle}`);
          
          // Take screenshot
          await page.screenshot({ path: `/tmp/meeting-${section.name.toLowerCase()}.png` });
          
          // Look for sub-navigation or special elements
          const subNav = await page.locator('mat-tab-group mat-tab, .tab-header, [role="tab"]').all();
          if (subNav.length > 0) {
            console.log(`${section.name} has ${subNav.length} tabs/sub-sections`);
            for (let j = 0; j < Math.min(subNav.length, 5); j++) {
              const tabText = await subNav[j].textContent();
              console.log(`  Tab ${j+1}: ${tabText?.trim()}`);
            }
          }
        }
      } catch (e) {
        console.log(`Could not explore ${section.name}: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

exploreMeeting();