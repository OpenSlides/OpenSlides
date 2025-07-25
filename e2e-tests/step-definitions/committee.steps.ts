import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CommitteePage } from '../pages/committee.page';

Given('I navigate to the committees page', async function() {
  this.committeePage = new CommitteePage(this.page);
  await this.committeePage.navigate();
});

Given('a committee {string} exists', async function(committeeName: string) {
  // Navigate to committees if not already there
  if (!this.page.url().includes('/committees')) {
    await this.committeePage.navigate();
  }
  
  // Check if committee exists, create if not
  const exists = await this.committeePage.isCommitteeVisible(committeeName);
  if (!exists) {
    await this.committeePage.createCommittee(committeeName, 'Test committee created by e2e tests');
  }
});

When('I click the {string} button', async function(buttonText: string) {
  await this.page.locator(`button:has-text("${buttonText}")`).click();
  await this.page.waitForTimeout(1000);
});

When('I fill in the committee form with:', async function(dataTable) {
  const data = dataTable.rowsHash();
  
  if (data['Name']) {
    await this.committeePage.nameInput.fill(data['Name']);
  }
  
  if (data['Description']) {
    await this.committeePage.descriptionInput.fill(data['Description']);
  }
  
  if (data['Meeting prefix']) {
    await this.committeePage.prefixInput.fill(data['Meeting prefix']);
  }
});

When('I click on the committee {string}', async function(committeeName: string) {
  await this.committeePage.selectCommittee(committeeName);
});

When('I change the name to {string}', async function(newName: string) {
  await this.committeePage.nameInput.clear();
  await this.committeePage.nameInput.fill(newName);
});

When('I confirm the deletion', async function() {
  await this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').click();
  await this.page.waitForTimeout(2000);
});

When('I click the {string} tab', async function(tabName: string) {
  await this.page.locator(`mat-tab:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).click();
  await this.page.waitForTimeout(1000);
});

When('I add the following members:', async function(dataTable) {
  const members = dataTable.hashes();
  await this.committeePage.addMembers(members.map(row => ({
    user: row['User'],
    role: row['Role']
  })));
});

Then('I should see the committees list', async function() {
  const listVisible = await this.committeePage.committeeList.isVisible();
  expect(listVisible).toBeTruthy();
});

Then('I should see committee details including name and member count', async function() {
  const committeeItems = await this.page.locator('.committee-item, mat-card').count();
  expect(committeeItems).toBeGreaterThan(0);
  
  // Check if committee details are visible
  const nameVisible = await this.page.locator('.committee-name, h3').first().isVisible();
  expect(nameVisible).toBeTruthy();
});

Then('the committee {string} should appear in the list', async function(committeeName: string) {
  const isVisible = await this.committeePage.isCommitteeVisible(committeeName);
  expect(isVisible).toBeTruthy();
});

Then('the committee {string} should not appear in the list', async function(committeeName: string) {
  const isVisible = await this.committeePage.isCommitteeVisible(committeeName);
  expect(isVisible).toBeFalsy();
});

Then('the members should be visible in the committee member list', async function() {
  const memberList = await this.page.locator('.member-list, mat-list').isVisible();
  expect(memberList).toBeTruthy();
});

Then('I should not see the {string} button', async function(buttonText: string) {
  const buttonVisible = await this.page.locator(`button:has-text("${buttonText}")`).isVisible();
  expect(buttonVisible).toBeFalsy();
});

Then('I should not see any edit or delete options', async function() {
  const editVisible = await this.committeePage.editButton.isVisible();
  const deleteVisible = await this.committeePage.deleteButton.isVisible();
  
  expect(editVisible).toBeFalsy();
  expect(deleteVisible).toBeFalsy();
});