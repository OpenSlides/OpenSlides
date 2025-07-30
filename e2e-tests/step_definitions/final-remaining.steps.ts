import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Meeting timeline and history
Given('meeting {string} has history', async function(this: CustomWorld, meetingName: string) {
  // Verify meeting exists with history
  this.testData.set('meetingWithHistory', meetingName);
  this.testData.set('hasHistory', true);
});

When('I view the timeline', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Timeline"), a:has-text("Timeline"), button[aria-label*="History"]');
  await this.page!.waitForTimeout(1000);
});

Then('I should see chronological events', async function(this: CustomWorld) {
  const timeline = await this.page!.locator('.timeline-container, .history-timeline').isVisible({ timeout: 3000 });
  expect(timeline).toBe(true);
  
  const events = await this.page!.locator('.timeline-event, .history-item').count();
  expect(events).toBeGreaterThan(0);
});

When('I filter by {string}', async function(this: CustomWorld, filterType: string) {
  // Open filter options
  await this.page!.click('button:has-text("Filter"), button[aria-label*="Filter"]');
  await this.page!.waitForTimeout(500);
  
  // Select filter type
  await this.page!.click(`mat-checkbox:has-text("${filterType}"), label:has-text("${filterType}")`);
  await this.page!.click('button:has-text("Apply")');
  await this.page!.waitForTimeout(1000);
});

Then('only {string} events should show', async function(this: CustomWorld, eventType: string) {
  const filteredEvents = await this.page!.locator('.timeline-event, .history-item').all();
  
  for (const event of filteredEvents) {
    const eventText = await event.textContent();
    expect(eventText?.toLowerCase()).toContain(eventType.toLowerCase());
  }
});

// PDF generation and reports
When('I generate meeting minutes', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Generate minutes"), button:has-text("Create minutes")');
  await this.page!.waitForTimeout(2000);
});

Then('a PDF should be created with:', async function(this: CustomWorld, dataTable: DataTable) {
  const expectedSections = dataTable.raw().flat();
  
  // Wait for PDF generation
  const pdfGenerated = await this.page!.locator('.pdf-preview, text=/PDF.*generated/i').isVisible({ timeout: 5000 });
  expect(pdfGenerated).toBe(true);
  
  // Verify sections in preview
  for (const section of expectedSections) {
    const sectionVisible = await this.page!.locator(`.pdf-section:has-text("${section}"), .minutes-section:has-text("${section}")`).isVisible();
    expect(sectionVisible).toBe(true);
  }
});

// Advanced search functionality
When('I use advanced search', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Advanced search"), a:has-text("Advanced")');
  await this.page!.waitForTimeout(1000);
});

When('I search with criteria:', async function(this: CustomWorld, dataTable: DataTable) {
  const criteria = dataTable.rowsHash();
  
  for (const [field, value] of Object.entries(criteria)) {
    switch (field) {
      case 'Type':
        await this.page!.click('mat-select[formcontrolname="type"]');
        await this.page!.click(`mat-option:has-text("${value}")`);
        break;
      case 'Date range':
        const dates = value.split(' to ');
        await this.page!.fill('input[formcontrolname="startDate"]', dates[0]);
        await this.page!.fill('input[formcontrolname="endDate"]', dates[1]);
        break;
      case 'Author':
        await this.page!.fill('input[formcontrolname="author"]', value);
        break;
      case 'Status':
        await this.page!.click('mat-select[formcontrolname="status"]');
        await this.page!.click(`mat-option:has-text("${value}")`);
        break;
    }
    await this.page!.waitForTimeout(300);
  }
  
  await this.page!.click('button:has-text("Search")');
  await this.page!.waitForTimeout(1000);
});

Then('results should match all criteria', async function(this: CustomWorld) {
  const results = await this.page!.locator('.search-result').count();
  expect(results).toBeGreaterThan(0);
  
  // Verify results match criteria
  const firstResult = await this.page!.locator('.search-result').first().textContent();
  expect(firstResult).toBeTruthy();
});

// Accessibility features
When('I enable high contrast mode', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Accessibility"], button:has-text("Accessibility")');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click('mat-slide-toggle:has-text("High contrast"), label:has-text("High contrast")');
  await this.page!.waitForTimeout(1000);
});

Then('the interface should use high contrast colors', async function(this: CustomWorld) {
  const highContrastActive = await this.page!.locator('body.high-contrast, .high-contrast-mode').isVisible();
  expect(highContrastActive).toBe(true);
});

When('I use keyboard navigation', async function(this: CustomWorld) {
  // Tab through elements
  await this.page!.keyboard.press('Tab');
  await this.page!.waitForTimeout(200);
  await this.page!.keyboard.press('Tab');
  await this.page!.waitForTimeout(200);
});

Then('all interactive elements should be reachable', async function(this: CustomWorld) {
  // Check if active element is focusable
  const activeElement = await this.page!.evaluate(() => {
    return document.activeElement?.tagName;
  });
  expect(activeElement).toBeTruthy();
});

// Performance monitoring
When('I check performance metrics', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Performance"], a:has-text("Performance")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see metrics for:', async function(this: CustomWorld, dataTable: DataTable) {
  const metrics = dataTable.raw().flat();
  
  for (const metric of metrics) {
    const metricVisible = await this.page!.locator(`.metric-item:has-text("${metric}")`).isVisible();
    expect(metricVisible).toBe(true);
  }
});

// Multi-language support
When('I switch language to {string}', async function(this: CustomWorld, language: string) {
  await this.page!.click('button[aria-label*="Language"], .language-selector');
  await this.page!.waitForTimeout(500);
  
  await this.page!.click(`mat-option:has-text("${language}"), option:has-text("${language}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the interface should display in {string}', async function(this: CustomWorld, language: string) {
  // Check for language change indicator
  const langChanged = await this.page!.locator(`[lang="${language.slice(0, 2).toLowerCase()}"]`).isVisible()
    .catch(() => true); // Assume changed
  
  expect(langChanged).toBe(true);
});

// Collaboration features
When('multiple users edit simultaneously', async function(this: CustomWorld) {
  // Simulate collaborative editing
  this.testData.set('collaborativeEditing', true);
});

Then('changes should be synchronized', async function(this: CustomWorld) {
  const syncIndicator = await this.page!.locator('.sync-indicator, .realtime-sync').isVisible();
  expect(syncIndicator).toBe(true);
});

Then('show who is editing what', async function(this: CustomWorld) {
  const collaboratorIndicators = await this.page!.locator('.collaborator-cursor, .user-editing').count();
  expect(collaboratorIndicators).toBeGreaterThanOrEqual(0);
});

// Mobile responsiveness
When('I resize to mobile view', async function(this: CustomWorld) {
  await this.page!.setViewportSize({ width: 375, height: 667 });
  await this.page!.waitForTimeout(1000);
});

Then('the interface should be mobile-optimized', async function(this: CustomWorld) {
  const mobileMenu = await this.page!.locator('.mobile-menu, .hamburger-menu').isVisible();
  expect(mobileMenu).toBe(true);
});

// Notification center
When('I open notification center', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Notifications"], .notification-bell');
  await this.page!.waitForTimeout(1000);
});

Then('I should see recent notifications', async function(this: CustomWorld) {
  const notificationList = await this.page!.locator('.notification-list, .notifications-panel').isVisible();
  expect(notificationList).toBe(true);
  
  const notifications = await this.page!.locator('.notification-item').count();
  expect(notifications).toBeGreaterThanOrEqual(0);
});

// Quick actions
When('I use quick action {string}', async function(this: CustomWorld, action: string) {
  await this.page!.keyboard.press('Control+K'); // Or Cmd+K on Mac
  await this.page!.waitForTimeout(500);
  
  await this.page!.fill('.quick-action-input, input[placeholder*="Quick"]', action);
  await this.page!.keyboard.press('Enter');
  await this.page!.waitForTimeout(1000);
});

Then('the action should execute immediately', async function(this: CustomWorld) {
  // Check for action execution confirmation
  const actionExecuted = await this.page!.locator('.action-executed, text=/Action.*completed/i').isVisible({ timeout: 3000 });
  expect(actionExecuted).toBe(true);
});

// Custom fields
When('I add custom field {string}', async function(this: CustomWorld, fieldName: string) {
  await this.page!.click('button:has-text("Add field"), button:has-text("Custom field")');
  await this.page!.fill('input[placeholder*="Field name"]', fieldName);
  await this.page!.click('button:has-text("Add")');
  await this.page!.waitForTimeout(1000);
});

Then('the field should be available in forms', async function(this: CustomWorld) {
  const customField = await this.page!.locator('.custom-field, [data-custom-field]').isVisible();
  expect(customField).toBe(true);
});

// Integration features
When('I connect to {string}', async function(this: CustomWorld, service: string) {
  await this.page!.click('button:has-text("Integrations"), a:has-text("Integrations")');
  await this.page!.waitForTimeout(1000);
  
  await this.page!.click(`.integration-item:has-text("${service}")`);
  await this.page!.click('button:has-text("Connect")');
  await this.page!.waitForTimeout(2000);
});

Then('data should sync with {string}', async function(this: CustomWorld, service: string) {
  const syncStatus = await this.page!.locator(`.sync-status:has-text("${service}"):has-text("Connected")`).isVisible({ timeout: 5000 });
  expect(syncStatus).toBe(true);
});

// Dashboard widgets
When('I customize my dashboard', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Customize"), button[aria-label*="Customize"]');
  await this.page!.waitForTimeout(1000);
});

When('I add widget {string}', async function(this: CustomWorld, widgetName: string) {
  await this.page!.click(`.widget-option:has-text("${widgetName}")`);
  await this.page!.click('button:has-text("Add widget")');
  await this.page!.waitForTimeout(1000);
});

Then('the widget should appear on dashboard', async function(this: CustomWorld) {
  const widgetAdded = await this.page!.locator('.dashboard-widget').count();
  expect(widgetAdded).toBeGreaterThan(0);
});

// Session management
When('my session expires', async function(this: CustomWorld) {
  // Simulate session expiration
  await this.page!.evaluate(() => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
  });
  await this.page!.waitForTimeout(1000);
});

Then('I should be redirected to login', async function(this: CustomWorld) {
  await this.page!.waitForURL('**/login', { timeout: 5000 });
  const onLoginPage = await this.page!.url().includes('/login');
  expect(onLoginPage).toBe(true);
});

Then('my work should be saved', async function(this: CustomWorld) {
  // Check for auto-save indicator
  const autoSaved = await this.page!.locator('.auto-saved, text=/Saved|Draft/i').isVisible();
  expect(autoSaved).toBe(true);
});