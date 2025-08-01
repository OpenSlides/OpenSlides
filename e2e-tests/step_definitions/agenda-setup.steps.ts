import { Given, When, Then, Before } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { expect } from '@playwright/test';

// Special setup for agenda tests - ensure committee permissions
Before({ tags: '@agenda' }, async function(this: CustomWorld) {
  console.log('=== Agenda feature setup: Ensuring committee permissions ===');
  
  if (!this.setupHelper) {
    throw new Error('Setup helper not initialized');
  }

  try {
    // Ensure we have a committee with proper permissions and a meeting
    const { committeeId, meetingId } = await this.setupHelper.ensureTestSetup();
    
    console.log(`Test setup complete - Committee: ${committeeId}, Meeting: ${meetingId}`);
    
    // Store the meeting ID for use in tests
    this.currentMeetingId = meetingId.toString();
    this.testData.set('committeeId', committeeId);
    this.testData.set('meetingId', meetingId);
    
  } catch (error) {
    console.error('Failed to setup agenda test environment:', error);
    throw error;
  }
});

Given('I am in the meeting {string}', async function(this: CustomWorld, meetingName: string) {
  console.log(`Entering meeting: ${meetingName}`);
  
  // Use the meeting ID from setup
  const meetingId = this.testData.get('meetingId') || this.currentMeetingId || '1';
  
  if (!this.page) {
    throw new Error('Page not initialized');
  }

  // Navigate directly to the meeting using ID
  const meetingUrl = `${this.baseUrl}/${meetingId}`;
  console.log(`Navigating to meeting URL: ${meetingUrl}`);
  
  try {
    await this.page.goto(meetingUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for meeting to load
    await this.page.waitForSelector('os-headbar', { timeout: 10000 });
    
    console.log('Successfully entered the meeting');
  } catch (error) {
    console.error('Failed to enter meeting:', error);
    throw error;
  }
});

Given('I am on the agenda page', async function(this: CustomWorld) {
  console.log('Navigating to agenda page');
  
  if (!this.page) {
    throw new Error('Page not initialized');
  }

  const meetingId = this.currentMeetingId || '1';
  const agendaUrl = `${this.baseUrl}/${meetingId}/agenda`;
  
  try {
    await this.page.goto(agendaUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for agenda page to load
    await this.page.waitForSelector('[data-test="agenda-list"], .agenda-container, os-agenda-list', { 
      timeout: 10000 
    });
    
    // Initialize agenda page object
    this.agendaPage = this.agendaPage || new (await import('../pages/meeting/AgendaPage')).AgendaPage(this.page);
    
    console.log('Successfully navigated to agenda page');
  } catch (error) {
    console.error('Failed to navigate to agenda page:', error);
    throw error;
  }
});

// Create agenda items via API for test scenarios
Given('an agenda item {string} exists', async function(this: CustomWorld, itemTitle: string) {
  console.log(`Ensuring agenda item exists: ${itemTitle}`);
  
  if (!this.setupHelper) {
    throw new Error('Setup helper not initialized');
  }

  const meetingId = parseInt(this.currentMeetingId || '1');
  
  try {
    const itemId = await this.setupHelper.createAgendaItem(meetingId, {
      title: itemTitle,
      type: 'common',
      duration: 15
    });
    
    this.testData.set(`agenda_item_${itemTitle}`, itemId);
    console.log(`Created agenda item "${itemTitle}" with ID: ${itemId}`);
    
    // Refresh the page to see the new item
    await this.page?.reload();
    await this.page?.waitForSelector('[data-test="agenda-list"], .agenda-container', { timeout: 5000 });
    
  } catch (error) {
    console.error(`Failed to create agenda item "${itemTitle}":`, error);
    throw error;
  }
});

Given('an agenda item {string} with speakers exists', async function(this: CustomWorld, itemTitle: string) {
  // First create the agenda item
  await this.setupHelper?.createAgendaItem(parseInt(this.currentMeetingId || '1'), {
    title: itemTitle,
    type: 'common',
    duration: 30
  });
  
  // TODO: Add speakers via API when the endpoint is available
  console.log(`Created agenda item "${itemTitle}" (speakers need to be added via UI)`);
  
  // Refresh the page
  await this.page?.reload();
});