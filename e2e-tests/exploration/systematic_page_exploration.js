const { chromium } = require('playwright');
const fs = require('fs');

// Define all pages to explore systematically
const pagesToExplore = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    selectors: [
      '.dashboard-container',
      '.navigation-menu',
      '.quick-actions',
      '.activity-feed',
      '[data-cy="create-meeting"]'
    ]
  },
  {
    name: 'Meetings',
    path: '/meetings',
    selectors: [
      '.meeting-list',
      '.meeting-card',
      'button[matTooltip*="Create"]',
      '.meeting-filter',
      '.meeting-search'
    ]
  },
  {
    name: 'Committees', 
    path: '/committees',
    selectors: [
      '.committee-list',
      '.committee-card',
      'button[matTooltip*="Create"]',
      '.committee-name',
      '.committee-members'
    ]
  },
  {
    name: 'Accounts',
    path: '/accounts', 
    selectors: [
      '.account-list',
      '.account-card',
      'button[matTooltip*="Create"]',
      'button[matTooltip*="Import"]',
      '.user-name'
    ]
  },
  {
    name: 'Tags',
    path: '/tags',
    selectors: [
      '.tag-list',
      '.tag-item',
      'button[matTooltip*="Create"]',
      '.tag-name'
    ]
  },
  {
    name: 'Files',
    path: '/files',
    selectors: [
      '.file-list',
      '.file-item',
      'button[matTooltip*="Upload"]',
      '.file-name'
    ]
  },
  {
    name: 'Design',
    path: '/design',
    selectors: [
      '.design-list',
      '.design-theme',
      'button[matTooltip*="Create"]',
      '.theme-name'
    ]
  },
  {
    name: 'Settings',
    path: '/settings',
    selectors: [
      '.settings-container',
      '.settings-section',
      '.settings-form'
    ]
  }
];

const meetingPages = [
  {
    name: 'Meeting-Home',
    path: '/home',
    selectors: [
      '.meeting-home',
      '.meeting-info',
      '.meeting-status'
    ]
  },
  {
    name: 'Meeting-Autopilot',
    path: '/autopilot',
    selectors: [
      '.autopilot-container',
      '.autopilot-controls'
    ]
  },
  {
    name: 'Meeting-Agenda',
    path: '/agenda',
    selectors: [
      '.agenda-list',
      '.agenda-item',
      'button[matTooltip*="Create"]',
      '.speaker-list'
    ]
  },
  {
    name: 'Meeting-Motions',
    path: '/motions',
    selectors: [
      '.motion-list',
      '.motion-card',
      'button[matTooltip*="Create"]',
      '.motion-state'
    ]
  },
  {
    name: 'Meeting-Elections',
    path: '/elections',
    selectors: [
      '.election-list',
      '.election-card',
      'button[matTooltip*="Create"]',
      '.candidate-list'
    ]
  },
  {
    name: 'Meeting-Participants',
    path: '/participants',
    selectors: [
      '.participant-list',
      '.participant-card',
      'button[matTooltip*="Create"]',
      '.presence-indicator'
    ]
  },
  {
    name: 'Meeting-Files',
    path: '/files',
    selectors: [
      '.file-list',
      '.file-item',
      'button[matTooltip*="Upload"]',
      '.folder-tree'
    ]
  },
  {
    name: 'Meeting-Projector',
    path: '/projector',
    selectors: [
      '.projector-container',
      '.projector-controls',
      '.projection-list'
    ]
  },
  {
    name: 'Meeting-History',
    path: '/history',
    selectors: [
      '.history-list',
      '.history-item',
      '.history-filter'
    ]
  },
  {
    name: 'Meeting-Settings',
    path: '/settings',
    selectors: [
      '.settings-container',
      '.settings-tabs',
      '.settings-form'
    ]
  },
  {
    name: 'Meeting-Chat',
    path: '/chat',
    selectors: [
      '.chat-container',
      '.chat-messages',
      '.chat-input'
    ]
  }
];

(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    ignoreHTTPSErrors: true,
    args: ['--ignore-certificate-errors', '--ignore-ssl-errors']
  });
  const page = await browser.newPage();
  
  const explorationResults = {
    organizationPages: [],
    meetingPages: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  try {
    console.log('=== SYSTEMATIC PAGE EXPLORATION ===');
    
    // Login first
    console.log('Logging in...');
    await page.goto('https://localhost:8000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.fill('input[formControlName="username"]', 'admin');
    await page.fill('input[formControlName="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Explore organization-level pages
    console.log('=== EXPLORING ORGANIZATION PAGES ===');
    for (const pageInfo of pagesToExplore) {
      try {
        console.log(`Exploring ${pageInfo.name} page...`);
        await page.goto(`https://localhost:8000${pageInfo.path}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        await page.waitForTimeout(2000);
        
        const pageResult = {
          name: pageInfo.name,
          path: pageInfo.path,
          screenshot: `/tmp/systematic-${pageInfo.name.toLowerCase()}.png`,
          foundElements: [],
          missingElements: [],
          additionalElements: []
        };
        
        // Take screenshot
        await page.screenshot({ path: pageResult.screenshot });
        
        // Check for expected selectors
        for (const selector of pageInfo.selectors) {
          const element = await page.$(selector);
          if (element) {
            pageResult.foundElements.push(selector);
          } else {
            pageResult.missingElements.push(selector);
          }
        }
        
        // Find additional interactive elements
        const additionalSelectors = [
          'button',
          '[role="button"]',
          'a[href]',
          'input',
          'select',
          '[data-cy]',
          '[matTooltip]',
          '.mat-menu-trigger'
        ];
        
        for (const selector of additionalSelectors) {
          const elements = await page.$$(selector);
          for (let i = 0; i < Math.min(elements.length, 5); i++) {
            const text = await elements[i].textContent();
            const tooltip = await elements[i].getAttribute('matTooltip');
            const cy = await elements[i].getAttribute('data-cy');
            
            if (text || tooltip || cy) {
              pageResult.additionalElements.push({
                selector,
                text: text?.trim(),
                tooltip,
                dataCy: cy
              });
            }
          }
        }
        
        explorationResults.organizationPages.push(pageResult);
        console.log(`✓ ${pageInfo.name}: Found ${pageResult.foundElements.length}/${pageInfo.selectors.length} expected elements`);
        
      } catch (error) {
        console.error(`Error exploring ${pageInfo.name}:`, error.message);
        explorationResults.errors.push({
          page: pageInfo.name,
          error: error.message
        });
      }
    }

    // Navigate to a meeting for meeting-specific pages
    console.log('=== ENTERING MEETING FOR MEETING PAGES ===');
    await page.goto('https://localhost:8000/meetings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Try to enter the first meeting
    const enterButton = await page.$('button:has-text("Enter"), .enter-meeting, [data-cy="enter-meeting"]');
    if (enterButton) {
      await enterButton.click();
      await page.waitForTimeout(3000);
      
      // Get the meeting URL base
      const currentUrl = page.url();
      const meetingUrlMatch = currentUrl.match(/(https:\/\/localhost:8000\/\d+)/);
      const meetingBaseUrl = meetingUrlMatch ? meetingUrlMatch[1] : null;
      
      if (meetingBaseUrl) {
        console.log(`Using meeting base URL: ${meetingBaseUrl}`);
        
        // Explore meeting pages
        console.log('=== EXPLORING MEETING PAGES ===');
        for (const pageInfo of meetingPages) {
          try {
            console.log(`Exploring meeting ${pageInfo.name} page...`);
            await page.goto(`${meetingBaseUrl}${pageInfo.path}`, { 
              waitUntil: 'domcontentloaded',
              timeout: 15000 
            });
            await page.waitForTimeout(2000);
            
            const pageResult = {
              name: pageInfo.name,
              path: pageInfo.path,
              fullUrl: `${meetingBaseUrl}${pageInfo.path}`,
              screenshot: `/tmp/systematic-meeting-${pageInfo.name.toLowerCase().replace('meeting-', '')}.png`,
              foundElements: [],
              missingElements: [],
              additionalElements: []
            };
            
            // Take screenshot
            await page.screenshot({ path: pageResult.screenshot });
            
            // Check for expected selectors
            for (const selector of pageInfo.selectors) {
              const element = await page.$(selector);
              if (element) {
                pageResult.foundElements.push(selector);
              } else {
                pageResult.missingElements.push(selector);
              }
            }
            
            // Find additional interactive elements
            const additionalSelectors = [
              'button',
              '[role="button"]', 
              'a[href]',
              'input',
              'select',
              '[data-cy]',
              '[matTooltip]',
              '.mat-menu-trigger',
              '.tile',
              '.card'
            ];
            
            for (const selector of additionalSelectors) {
              const elements = await page.$$(selector);
              for (let i = 0; i < Math.min(elements.length, 5); i++) {
                const text = await elements[i].textContent();
                const tooltip = await elements[i].getAttribute('matTooltip');
                const cy = await elements[i].getAttribute('data-cy');
                
                if (text || tooltip || cy) {
                  pageResult.additionalElements.push({
                    selector,
                    text: text?.trim(),
                    tooltip,
                    dataCy: cy
                  });
                }
              }
            }
            
            explorationResults.meetingPages.push(pageResult);
            console.log(`✓ Meeting ${pageInfo.name}: Found ${pageResult.foundElements.length}/${pageInfo.selectors.length} expected elements`);
            
          } catch (error) {
            console.error(`Error exploring meeting ${pageInfo.name}:`, error.message);
            explorationResults.errors.push({
              page: `Meeting-${pageInfo.name}`,
              error: error.message
            });
          }
        }
      }
    } else {
      console.log('Could not find meeting to enter - skipping meeting pages');
    }

    // Save exploration results
    fs.writeFileSync('/tmp/systematic-exploration-results.json', JSON.stringify(explorationResults, null, 2));
    console.log('=== EXPLORATION COMPLETE ===');
    console.log(`Results saved to /tmp/systematic-exploration-results.json`);
    console.log(`Organization pages explored: ${explorationResults.organizationPages.length}`);
    console.log(`Meeting pages explored: ${explorationResults.meetingPages.length}`);
    console.log(`Errors encountered: ${explorationResults.errors.length}`);

  } catch (error) {
    console.error('Critical error during exploration:', error);
    explorationResults.errors.push({
      page: 'CRITICAL',
      error: error.message
    });
  } finally {
    await browser.close();
  }
})();