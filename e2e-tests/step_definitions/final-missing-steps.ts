import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// These steps have exact text matches that weren't being caught by parameterized steps

When('I drag Bob White to position {int}', async function(this: CustomWorld, position: number) {
  const source = this.page!.locator('.speaker-item:has-text("Bob White")');
  const target = this.page!.locator(`.speaker-position-${position}, .speaker-item`).nth(position - 1);
  
  await source.dragTo(target);
  await this.page!.waitForTimeout(1000);
});

When('I mark Alice as {string}', async function(this: CustomWorld, marking: string) {
  const speakerRow = this.page!.locator('.speaker-item:has-text("Alice")');
  await speakerRow.locator(`button:has-text("${marking}")`).click();
  await this.page!.waitForTimeout(500);
});

// This step was causing issues - it's already defined in complex-conditions.steps.ts

When('Tom requests {string}', async function(this: CustomWorld, request: string) {
  this.testData.set('speakerRequest', { speaker: 'Tom', request });
  
  // Simulate request
  await this.page!.click(`button:has-text("${request}")`);
});

When('Sarah opens the voting interface', async function(this: CustomWorld) {
  // This would typically be in a second browser context
  this.testData.set('currentVoter', 'Sarah');
  await this.page!.goto(`${this.baseUrl}/voting`);
  await this.page!.waitForTimeout(1500);
});