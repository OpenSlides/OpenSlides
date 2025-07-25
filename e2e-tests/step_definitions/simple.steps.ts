import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Then('the page URL should contain {string}', async function(this: CustomWorld, expectedText: string) {
  const url = this.page!.url();
  expect(url).toContain(expectedText);
});