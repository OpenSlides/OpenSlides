import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';

const baseUrl = 'https://localhost:8000';

async function exploreApplication(): Promise<void> {
  console.log('Starting OpenSlides Application Exploration...\n');
  
  const browser = await chromium.launch({
    headless: true, // Run headless
    args: ['--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  const discoveredFeatures: string[] = [];
  
  try {
    // Login
    console.log('1. Logging in...');
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[formcontrolname="username"]', 'admin');
    await page.fill('input[formcontrolname="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Get main navigation items
    console.log('\n2. Exploring main navigation...');
    const mainNavItems = await page.locator('mat-nav-list a, .nav-item, [routerlink]').all();
    console.log(`Found ${mainNavItems.length} navigation items`);
    
    // Dashboard
    console.log('\n3. Exploring Dashboard...');
    await page.goto(`${baseUrl}/`);
    await page.waitForTimeout(2000);
    const dashboardFeatures = await page.locator('.tile, .dashboard-card, .widget').all();
    console.log(`  - Dashboard has ${dashboardFeatures.length} widgets/tiles`);
    discoveredFeatures.push('Dashboard with widgets');
    
    // Meetings
    console.log('\n4. Exploring Meetings...');
    await page.goto(`${baseUrl}/meetings`);
    await page.waitForTimeout(2000);
    
    // Check for meeting management features
    const meetingActions = await page.locator('button, [mat-button], [mat-icon-button]').all();
    for (const action of meetingActions) {
      const text = await action.textContent();
      if (text) console.log(`  - Meeting action: ${text.trim()}`);
    }
    
    // Access a meeting if available
    const meetingTile = page.locator('.meeting-tile').first();
    if (await meetingTile.isVisible()) {
      await meetingTile.click();
      await page.waitForTimeout(2000);
      
      console.log('\n5. Exploring Meeting Features...');
      
      // Get meeting navigation
      const meetingNav = await page.locator('mat-nav-list a, .sidenav-link').all();
      for (const nav of meetingNav) {
        const text = await nav.textContent();
        if (text) {
          console.log(`  - ${text.trim()}`);
          discoveredFeatures.push(`Meeting: ${text.trim()}`);
        }
      }
      
      // Explore Agenda
      console.log('\n6. Exploring Agenda...');
      const agendaLink = page.locator('a[href*="/agenda"]').first();
      if (await agendaLink.isVisible()) {
        await agendaLink.click();
        await page.waitForTimeout(2000);
        const agendaFeatures = await page.locator('[data-cy*="agenda"], .agenda-item').count();
        console.log(`  - Found ${agendaFeatures} agenda-related elements`);
        
        // Check for agenda item actions
        const agendaActions = await page.locator('.agenda-item button, .agenda-item [mat-icon-button]').all();
        discoveredFeatures.push('Agenda management with item actions');
      }
      
      // Explore Motions
      console.log('\n7. Exploring Motions...');
      const motionsLink = page.locator('a[href*="/motions"]').first();
      if (await motionsLink.isVisible()) {
        await motionsLink.click();
        await page.waitForTimeout(2000);
        
        // Check motion features
        const motionCards = await page.locator('.motion-card, [class*="motion"]').count();
        console.log(`  - Found ${motionCards} motion elements`);
        
        // Check for workflow states
        const workflowStates = await page.locator('.state-badge, .workflow-state').all();
        if (workflowStates.length > 0) {
          discoveredFeatures.push('Motion workflow management');
        }
        
        // Check for voting
        const voteButtons = await page.locator('button:has-text("vote"), [class*="voting"]').count();
        if (voteButtons > 0) {
          discoveredFeatures.push('Electronic voting system');
        }
      }
      
      // Explore Elections
      console.log('\n8. Exploring Elections...');
      const electionsLink = page.locator('a[href*="/elections"]').first();
      if (await electionsLink.isVisible()) {
        await electionsLink.click();
        await page.waitForTimeout(2000);
        discoveredFeatures.push('Election management');
      }
      
      // Explore Participants
      console.log('\n9. Exploring Participants...');
      const participantsLink = page.locator('a[href*="/participants"]').first();
      if (await participantsLink.isVisible()) {
        await participantsLink.click();
        await page.waitForTimeout(2000);
        
        // Check for presence management
        const presenceCheckboxes = await page.locator('input[type="checkbox"][formcontrolname*="present"]').count();
        if (presenceCheckboxes > 0) {
          discoveredFeatures.push('Participant presence management');
        }
        
        // Check for groups/roles
        const groupElements = await page.locator('[class*="group"], [class*="role"]').count();
        if (groupElements > 0) {
          discoveredFeatures.push('User groups and roles');
        }
      }
      
      // Explore Files
      console.log('\n10. Exploring Files...');
      const filesLink = page.locator('a[href*="/files"]').first();
      if (await filesLink.isVisible()) {
        await filesLink.click();
        await page.waitForTimeout(2000);
        discoveredFeatures.push('File management system');
        
        // Check for upload
        const uploadButton = await page.locator('button:has-text("upload"), input[type="file"]').count();
        if (uploadButton > 0) {
          discoveredFeatures.push('File upload functionality');
        }
      }
      
      // Explore Projector
      console.log('\n11. Exploring Projector...');
      const projectorLink = page.locator('a[href*="/projector"]').first();
      if (await projectorLink.isVisible()) {
        await projectorLink.click();
        await page.waitForTimeout(2000);
        discoveredFeatures.push('Projector/presentation system');
      }
      
      // Explore Settings
      console.log('\n12. Exploring Settings...');
      const settingsLink = page.locator('a[href*="/settings"]').first();
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(2000);
        
        // Check for different setting categories
        const settingCategories = await page.locator('.settings-category, mat-expansion-panel').all();
        console.log(`  - Found ${settingCategories.length} setting categories`);
        discoveredFeatures.push('Comprehensive settings management');
      }
    }
    
    // Explore Organization level features
    console.log('\n13. Exploring Organization Features...');
    await page.goto(`${baseUrl}/committees`);
    await page.waitForTimeout(2000);
    discoveredFeatures.push('Committee management');
    
    await page.goto(`${baseUrl}/accounts`);
    await page.waitForTimeout(2000);
    discoveredFeatures.push('User account management');
    
    // Check for additional features
    console.log('\n14. Checking Additional Features...');
    
    // Search functionality
    const searchInput = await page.locator('input[type="search"], input[placeholder*="search"], [class*="search"]').count();
    if (searchInput > 0) {
      discoveredFeatures.push('Global search functionality');
    }
    
    // Export/Import
    const exportButtons = await page.locator('button:has-text("export"), button:has-text("import")').count();
    if (exportButtons > 0) {
      discoveredFeatures.push('Data export/import capabilities');
    }
    
    // Real-time updates
    const websocketIndicator = await page.locator('[class*="connection"], [class*="online"]').count();
    if (websocketIndicator > 0) {
      discoveredFeatures.push('Real-time updates via WebSocket');
    }
    
    // Chat functionality
    const chatElements = await page.locator('[class*="chat"], a[href*="/chat"]').count();
    if (chatElements > 0) {
      discoveredFeatures.push('Chat/messaging system');
    }
    
    // History/Audit log
    const historyElements = await page.locator('a[href*="/history"], [class*="history"]').count();
    if (historyElements > 0) {
      discoveredFeatures.push('History/audit log tracking');
    }
    
  } catch (error: any) {
    console.error('Error during exploration:', error.message);
  }
  
  // Save discovered features
  console.log('\n\n=== DISCOVERED FEATURES ===');
  discoveredFeatures.forEach((feature, index) => {
    console.log(`${index + 1}. ${feature}`);
  });
  
  // Save to file
  const explorationReport = {
    timestamp: new Date().toISOString(),
    discoveredFeatures,
    recommendedTests: [
      'Committee CRUD operations',
      'User management and permissions',
      'Motion workflow states',
      'Voting on motions',
      'Election creation and voting',
      'File upload and management',
      'Projector control',
      'Real-time updates',
      'Search functionality',
      'Export/Import data',
      'Chat messaging',
      'History tracking',
      'Meeting templates',
      'Bulk operations',
      'Permission-based access control'
    ]
  };
  
  fs.writeFileSync('./EXPLORATION_REPORT.json', JSON.stringify(explorationReport, null, 2));
  console.log('\nExploration report saved to: ./EXPLORATION_REPORT.json');
  
  await browser.close();
}

// Run exploration
exploreApplication().catch(console.error);