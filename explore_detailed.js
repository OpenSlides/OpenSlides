const { chromium } = require('playwright');

async function exploreDetailed() {
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
    
    // Go to demo meeting
    const demoMeeting = page.locator('text=OpenSlides Demo').first();
    await demoMeeting.click();
    await page.waitForTimeout(3000);
    
    console.log('=== EXPLORING AUTOPILOT ===');
    try {
      await page.click('text=Autopilot');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/autopilot.png' });
      console.log('Autopilot URL:', page.url());
      console.log('Autopilot Title:', await page.title());
    } catch (e) {
      console.log('Could not access Autopilot:', e.message);
    }
    
    console.log('=== EXPLORING POLLS INTERFACE ===');
    try {
      // Go to motions first to find polls
      await page.click('text=Motions');
      await page.waitForTimeout(2000);
      
      // Look for poll-related elements
      const pollElements = await page.locator('[href*="poll"], [routerLink*="poll"], text*="poll"').all();
      console.log(`Found ${pollElements.length} poll-related elements`);
      
      // Check if there are any actual polls
      const pollLinks = await page.locator('a[href*="/polls/"]').all();
      if (pollLinks.length > 0) {
        await pollLinks[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/poll-detail.png' });
        console.log('Poll Detail URL:', page.url());
      }
    } catch (e) {
      console.log('Could not explore polls:', e.message);
    }
    
    console.log('=== CHECKING FOR SUB-PAGES IN MAIN SECTIONS ===');
    
    // Check agenda sub-pages
    try {
      await page.click('text=Agenda');
      await page.waitForTimeout(2000);
      
      // Look for any sub-navigation or additional features
      const agendaElements = await page.locator('mat-tab, .tab-header, [role="tab"], .nav-tab').all();
      console.log(`Agenda sub-elements: ${agendaElements.length}`);
      
      for (let i = 0; i < Math.min(agendaElements.length, 3); i++) {
        const text = await agendaElements[i].textContent();
        console.log(`  Agenda tab ${i+1}: ${text?.trim()}`);
      }
    } catch (e) {
      console.log('Could not explore agenda details:', e.message);
    }
    
    // Check motions sub-pages
    try {
      await page.click('text=Motions');
      await page.waitForTimeout(2000);
      
      const motionElements = await page.locator('mat-tab, .tab-header, [role="tab"], .nav-tab').all();
      console.log(`Motion sub-elements: ${motionElements.length}`);
      
      // Check for categories, blocks, workflows
      const motionSubPages = ['Categories', 'Blocks', 'Workflows', 'Call list'];
      for (const subPage of motionSubPages) {
        const element = page.locator(`text=${subPage}`).first();
        if (await element.count() > 0) {
          console.log(`Found motion sub-page: ${subPage}`);
        }
      }
    } catch (e) {
      console.log('Could not explore motion details:', e.message);
    }
    
    // Check elections sub-pages
    try {
      await page.click('text=Elections');
      await page.waitForTimeout(2000);
      
      const electionElements = await page.locator('mat-tab, .tab-header, [role="tab"], .nav-tab').all();
      console.log(`Election sub-elements: ${electionElements.length}`);
    } catch (e) {
      console.log('Could not explore election details:', e.message);
    }
    
    // Check participants sub-pages
    try {
      await page.click('text=Participants');
      await page.waitForTimeout(2000);
      
      const participantElements = await page.locator('mat-tab, .tab-header, [role="tab"], .nav-tab').all();
      console.log(`Participant sub-elements: ${participantElements.length}`);
      
      // Look for Groups, Structure levels, etc.
      const participantSubPages = ['Groups', 'Structure levels', 'Presence', 'Import'];
      for (const subPage of participantSubPages) {
        const element = page.locator(`text=${subPage}`).first();
        if (await element.count() > 0) {
          console.log(`Found participant sub-page: ${subPage}`);
        }
      }
    } catch (e) {
      console.log('Could not explore participant details:', e.message);
    }
    
    console.log('=== CHECKING ORGANIZATION LEVEL FEATURES ===');
    
    // Go back to organization level
    await page.click('text=Dashboard');
    await page.waitForTimeout(2000);
    
    // Explore organization tags
    try {
      await page.click('a[href="/organization-tags"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/org-tags-detailed.png' });
      console.log('Org Tags features:', page.url());
    } catch (e) {
      console.log('Could not explore org tags:', e.message);
    }
    
    // Explore organization accounts
    try {
      await page.click('a[href="/accounts"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/org-accounts-detailed.png' });
      console.log('Org Accounts features:', page.url());
    } catch (e) {
      console.log('Could not explore org accounts:', e.message);
    }
    
    // Explore meetings management
    try {
      await page.click('a[href="/meetings"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/org-meetings-detailed.png' });
      console.log('Org Meetings features:', page.url());
    } catch (e) {
      console.log('Could not explore org meetings:', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

exploreDetailed();