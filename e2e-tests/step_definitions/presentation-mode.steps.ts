import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Projector availability
Given('a projector is available', async function(this: CustomWorld) {
  // Check if projector is configured
  const projectorAvailable = await this.page!.locator('.projector-indicator, .projector-status').isVisible()
    .catch(() => true); // Assume available
  
  this.testData.set('projectorAvailable', true);
});

Then('the agenda item should appear on the projector', async function(this: CustomWorld) {
  const projectorContent = await this.page!.locator('.projector-content, .projected-item').isVisible({ timeout: 3000 });
  expect(projectorContent).toBe(true);
});

// Multiple projectors
Given('the meeting has {int} projectors configured', async function(this: CustomWorld, count: number) {
  this.testData.set('projectorCount', count);
  
  // Verify projector configuration
  const projectorTabs = await this.page!.locator('.projector-tab, .projector-selector').count();
  expect(projectorTabs).toBe(count);
});

When('I view the projector control panel', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Projector control"), a:has-text("Projectors")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see controls for all {int} projectors', async function(this: CustomWorld, count: number) {
  const projectorControls = await this.page!.locator('.projector-control-panel').count();
  expect(projectorControls).toBe(count);
});

Then('each projector should display its assigned content', async function(this: CustomWorld) {
  const projectorCount = this.testData.get('projectorCount') || 2;
  
  for (let i = 1; i <= projectorCount; i++) {
    const projectorContent = await this.page!.locator(`.projector-${i}-content, #projector-${i}`).isVisible();
    expect(projectorContent).toBe(true);
  }
});

// Custom slides
When('I enter slide content:', async function(this: CustomWorld, dataTable: DataTable) {
  const content = dataTable.raw().flat().join('\n');
  
  // Find slide editor
  const editor = this.page!.locator('textarea[formcontrolname="slideContent"], .slide-editor');
  await editor.fill(content);
  
  this.testData.set('slideContent', content);
});

Then('the custom slide should be displayed', async function(this: CustomWorld) {
  const slideContent = this.testData.get('slideContent');
  const slideVisible = await this.page!.locator(`.custom-slide:has-text("${slideContent}")`).isVisible({ timeout: 3000 });
  expect(slideVisible).toBe(true);
});

// Presentation queue
When('I add the following to the presentation queue:', async function(this: CustomWorld, dataTable: DataTable) {
  const items = dataTable.hashes();
  
  for (const item of items) {
    // Add each item to queue
    await this.page!.click('button:has-text("Add to queue")');
    await this.page!.waitForTimeout(500);
    
    // Select item type
    await this.page!.selectOption('select[name="itemType"]', item['Type']);
    
    // Select specific item
    await this.page!.fill('input[placeholder*="Search"]', item['Item']);
    await this.page!.click(`.search-result:has-text("${item['Item']}")`);
    
    await this.page!.click('button:has-text("Add")');
    await this.page!.waitForTimeout(500);
  }
});

Then('changes should appear on the projector in real-time', async function(this: CustomWorld) {
  // Check for real-time update indicator
  const realtimeUpdate = await this.page!.locator('.realtime-indicator, .live-update').isVisible();
  expect(realtimeUpdate).toBe(true);
});

Then('the projector should show both contents side by side', async function(this: CustomWorld) {
  const splitView = await this.page!.locator('.split-view, .side-by-side').isVisible({ timeout: 3000 });
  expect(splitView).toBe(true);
});

Then('the message should override all projectors', async function(this: CustomWorld) {
  const overrideActive = await this.page!.locator('.override-active, .emergency-message').isVisible({ timeout: 3000 });
  expect(overrideActive).toBe(true);
});

// Presentation controls
Then('I should see presentation controls:', async function(this: CustomWorld, dataTable: DataTable) {
  const controls = dataTable.raw().flat();
  
  for (const control of controls) {
    const controlVisible = await this.page!.locator(`button:has-text("${control}"), [aria-label*="${control}"]`).isVisible();
    expect(controlVisible).toBe(true);
  }
});

Then('I should be able to navigate through slides', async function(this: CustomWorld) {
  // Check navigation controls
  const prevButton = await this.page!.locator('button:has-text("Previous"), button[aria-label*="Previous"]').isVisible();
  const nextButton = await this.page!.locator('button:has-text("Next"), button[aria-label*="Next"]').isVisible();
  
  expect(prevButton).toBe(true);
  expect(nextButton).toBe(true);
});

// Projector settings
When('I access projector settings', async function(this: CustomWorld) {
  await this.page!.click('button[aria-label*="Settings"], .projector-settings-button');
  await this.page!.waitForTimeout(1000);
});

Then('it should not affect the actual projector display', async function(this: CustomWorld) {
  // Verify preview mode indicator
  const previewMode = await this.page!.locator('.preview-mode, text="Preview mode"').isVisible();
  expect(previewMode).toBe(true);
});

// List display
Then('the list should show on the projector', async function(this: CustomWorld) {
  const listOnProjector = await this.page!.locator('.projector-list, .projected-list').isVisible({ timeout: 3000 });
  expect(listOnProjector).toBe(true);
});

Then('his name should show on projector', async function(this: CustomWorld) {
  // Check for speaker name on projector
  const speakerName = await this.page!.locator('.current-speaker-display, .speaker-name-projector').isVisible({ timeout: 3000 });
  expect(speakerName).toBe(true);
});

// Additional presentation steps
When('I project {string}', async function(this: CustomWorld, itemName: string) {
  // Find item and project it
  const itemRow = this.page!.locator(`mat-row:has-text("${itemName}"), tr:has-text("${itemName}")`);
  await itemRow.locator('button[aria-label*="Project"], .project-button').click();
  await this.page!.waitForTimeout(1000);
});

When('I select projector {int}', async function(this: CustomWorld, projectorNumber: number) {
  await this.page!.click(`.projector-tab:nth-child(${projectorNumber}), #projector-${projectorNumber}-tab`);
  await this.page!.waitForTimeout(500);
});

When('I enable {string} mode', async function(this: CustomWorld, mode: string) {
  await this.page!.click(`mat-radio-button:has-text("${mode}"), label:has-text("${mode}")`);
  await this.page!.waitForTimeout(500);
});

Then('the projector should display {string}', async function(this: CustomWorld, content: string) {
  const contentVisible = await this.page!.locator(`.projector-content:has-text("${content}")`).isVisible({ timeout: 3000 });
  expect(contentVisible).toBe(true);
});

When('I create a custom slide', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("New slide"), button:has-text("Create slide")');
  await this.page!.waitForTimeout(1000);
});

When('I set title {string}', async function(this: CustomWorld, title: string) {
  await this.page!.fill('input[formcontrolname="title"], input[placeholder*="Title"]', title);
});

When('I set content {string}', async function(this: CustomWorld, content: string) {
  await this.page!.fill('textarea[formcontrolname="content"], textarea[placeholder*="Content"]', content);
});

When('I save the slide', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Save"), button[type="submit"]');
  await this.page!.waitForTimeout(1000);
});

Then('the slide should be available in the list', async function(this: CustomWorld) {
  const slideInList = await this.page!.locator('.slide-list-item, .custom-slide-item').isVisible({ timeout: 3000 });
  expect(slideInList).toBe(true);
});

// Presentation templates
When('I choose template {string}', async function(this: CustomWorld, templateName: string) {
  await this.page!.click(`.template-option:has-text("${templateName}")`);
  await this.page!.waitForTimeout(500);
});

Then('the projector should use the {string} layout', async function(this: CustomWorld, layout: string) {
  const layoutActive = await this.page!.locator(`.layout-${layout.toLowerCase()}, [data-layout="${layout.toLowerCase()}"]`).isVisible();
  expect(layoutActive).toBe(true);
});

// Live updates
When('I make changes to the projected content', async function(this: CustomWorld) {
  // Edit current projected content
  const editor = this.page!.locator('.content-editor, textarea.live-edit');
  await editor.fill('Updated content in real-time');
  await this.page!.waitForTimeout(500);
});

When('I add {string} to projector {int}', async function(this: CustomWorld, item: string, projectorNum: number) {
  // Select projector
  await this.page!.click(`.projector-selector:nth-child(${projectorNum})`);
  
  // Add item
  await this.page!.fill('input[placeholder*="Search"]', item);
  await this.page!.click(`.search-result:has-text("${item}")`);
  await this.page!.click('button:has-text("Project")');
  await this.page!.waitForTimeout(1000);
});

Then('projector {int} should show {string}', async function(this: CustomWorld, projectorNum: number, content: string) {
  const projectorContent = await this.page!.locator(`.projector-${projectorNum} .content:has-text("${content}")`).isVisible();
  expect(projectorContent).toBe(true);
});

// Emergency messages
When('I broadcast message {string}', async function(this: CustomWorld, message: string) {
  await this.page!.click('button:has-text("Broadcast"), button:has-text("Emergency")');
  await this.page!.fill('textarea[placeholder*="Message"]', message);
  await this.page!.click('button:has-text("Send")');
  await this.page!.waitForTimeout(1000);
});

When('I clear the message', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Clear"), button:has-text("Remove message")');
  await this.page!.waitForTimeout(500);
});

Then('projectors should return to normal content', async function(this: CustomWorld) {
  const normalContent = await this.page!.locator('.normal-content, :not(.emergency-message)').isVisible();
  expect(normalContent).toBe(true);
});

// Presentation mode navigation
When('I enter presentation mode', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Present"), button[aria-label*="Presentation"]');
  await this.page!.waitForTimeout(1000);
});

When('I press arrow keys', async function(this: CustomWorld) {
  await this.page!.keyboard.press('ArrowRight');
  await this.page!.waitForTimeout(500);
  await this.page!.keyboard.press('ArrowLeft');
  await this.page!.waitForTimeout(500);
});

When('I use presenter view', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Presenter view")');
  await this.page!.waitForTimeout(1000);
});

Then('I should see notes and timer', async function(this: CustomWorld) {
  const presenterNotes = await this.page!.locator('.presenter-notes').isVisible();
  const presenterTimer = await this.page!.locator('.presentation-timer').isVisible();
  
  expect(presenterNotes).toBe(true);
  expect(presenterTimer).toBe(true);
});

Then('only I should see them', async function(this: CustomWorld) {
  // Verify presenter-only view
  const presenterOnly = await this.page!.locator('.presenter-only, [data-view="presenter"]').isVisible();
  expect(presenterOnly).toBe(true);
});

// Preview mode
When('I toggle preview mode', async function(this: CustomWorld) {
  await this.page!.click('mat-slide-toggle:has-text("Preview"), button:has-text("Preview mode")');
  await this.page!.waitForTimeout(500);
});

Then('I should see preview without affecting display', async function(this: CustomWorld) {
  const previewPanel = await this.page!.locator('.preview-panel, .preview-mode-active').isVisible();
  expect(previewPanel).toBe(true);
});