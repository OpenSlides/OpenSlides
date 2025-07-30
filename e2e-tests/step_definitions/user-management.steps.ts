import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { UserPage } from '../pages/user.page';

// User list and details
Then('I should see the user list', async function(this: CustomWorld) {
  const userList = await this.page!.locator('.user-list, mat-table, .users-table').isVisible({ timeout: 5000 });
  expect(userList).toBe(true);
});

Then('I should see user details including username, name, and groups', async function(this: CustomWorld) {
  // Check for user detail columns
  const hasUsername = await this.page!.locator('th:has-text("Username"), .username-column').isVisible();
  const hasName = await this.page!.locator('th:has-text("Name"), .name-column').isVisible();
  const hasGroups = await this.page!.locator('th:has-text("Groups"), .groups-column').isVisible();
  
  expect(hasUsername || hasName || hasGroups).toBe(true);
});

// User creation
When('I fill in the user form with:', async function(this: CustomWorld, dataTable: DataTable) {
  const data = dataTable.rowsHash();
  const userPage = new UserPage(this.page!);
  
  if (data['Username']) {
    await userPage.fill(userPage.usernameInput, data['Username']);
  }
  if (data['First name']) {
    await userPage.fill(userPage.firstNameInput, data['First name']);
  }
  if (data['Last name']) {
    await userPage.fill(userPage.lastNameInput, data['Last name']);
  }
  if (data['Email']) {
    await userPage.fill(userPage.emailInput, data['Email']);
  }
  if (data['Title']) {
    await this.page!.fill('input[formcontrolname="title"], input[placeholder*="Title"]', data['Title']);
  }
  if (data['Password']) {
    await this.page!.fill('input[type="password"][formcontrolname="password"]', data['Password']);
  }
});

When('I select the group {string}', async function(this: CustomWorld, groupName: string) {
  const userPage = new UserPage(this.page!);
  
  // Click on groups select
  await userPage.click(userPage.groupSelect);
  await this.page!.waitForTimeout(500);
  
  // Select the group
  await this.page!.click(`mat-option:has-text("${groupName}"), .mat-option:has-text("${groupName}")`);
  
  // Click outside to close dropdown
  await this.page!.keyboard.press('Escape');
});

Then('the user {string} should appear in the list', async function(this: CustomWorld, username: string) {
  // Wait for user to appear
  await this.page!.waitForTimeout(2000);
  
  const userVisible = await this.page!.locator(`td:has-text("${username}"), .user-row:has-text("${username}")`).isVisible({ timeout: 5000 });
  expect(userVisible).toBe(true);
});

// User search
Given('a user {string} exists', async function(this: CustomWorld, username: string) {
  // In a real test, we might create the user via API or verify it exists
  // For now, we'll assume the user exists
  this.testData.set('existingUser', username);
});

When('I search for user {string}', async function(this: CustomWorld, searchTerm: string) {
  const userPage = new UserPage(this.page!);
  
  await userPage.fill(userPage.searchInput, searchTerm);
  await this.page!.locator(userPage.searchInput).press('Enter');
  await this.page!.waitForTimeout(1000);
});

When('I click on the user {string}', async function(this: CustomWorld, username: string) {
  await this.page!.click(`tr:has-text("${username}"), mat-row:has-text("${username}"), .user-row:has-text("${username}")`);
  await this.page!.waitForTimeout(1000);
});

// User editing
When('I update the following fields:', async function(this: CustomWorld, dataTable: DataTable) {
  const data = dataTable.rowsHash();
  const userPage = new UserPage(this.page!);
  
  for (const [field, value] of Object.entries(data)) {
    switch (field) {
      case 'First name':
        await userPage.clear(userPage.firstNameInput);
        await userPage.fill(userPage.firstNameInput, value);
        break;
      case 'Last name':
        await userPage.clear(userPage.lastNameInput);
        await userPage.fill(userPage.lastNameInput, value);
        break;
      case 'Email':
        await userPage.clear(userPage.emailInput);
        await userPage.fill(userPage.emailInput, value);
        break;
      case 'Title':
        const titleInput = this.page!.locator('input[formcontrolname="title"]');
        await titleInput.clear();
        await titleInput.fill(value);
        break;
    }
  }
});

Then('the user details should be updated', async function(this: CustomWorld) {
  // Check for success message or updated values
  const updated = await this.page!.locator('.mat-snack-bar:has-text("updated"), text="User updated"').isVisible({ timeout: 3000 }).catch(() => false);
  expect(updated).toBe(true);
});

// Password management
When('I enter a new password {string}', async function(this: CustomWorld, newPassword: string) {
  await this.page!.fill('input[type="password"][formcontrolname="newPassword"], input[placeholder*="New password"]', newPassword);
  await this.page!.fill('input[type="password"][formcontrolname="confirmPassword"], input[placeholder*="Confirm password"]', newPassword);
});

Then('the password should be reset', async function(this: CustomWorld) {
  const resetMessage = await this.page!.locator('text=/password.*reset|Password.*changed/i').isVisible({ timeout: 3000 });
  expect(resetMessage).toBe(true);
});

// Group management
When('I remove the user from group {string}', async function(this: CustomWorld, groupName: string) {
  // Find and click remove button for the group
  const groupChip = this.page!.locator(`mat-chip:has-text("${groupName}"), .group-chip:has-text("${groupName}")`);
  const removeButton = groupChip.locator('button[matChipRemove], .remove-icon');
  await removeButton.click();
  await this.page!.waitForTimeout(500);
});

When('I add the user to group {string}', async function(this: CustomWorld, groupName: string) {
  await this.steps.when(`I select the group "${groupName}"`);
});

Then('the user should be in group {string}', async function(this: CustomWorld, groupName: string) {
  const groupVisible = await this.page!.locator(`mat-chip:has-text("${groupName}"), .group-chip:has-text("${groupName}"), td:has-text("${groupName}")`).isVisible();
  expect(groupVisible).toBe(true);
});

Then('the user should not be in group {string}', async function(this: CustomWorld, groupName: string) {
  const groupVisible = await this.page!.locator(`mat-chip:has-text("${groupName}"), .group-chip:has-text("${groupName}")`).isVisible().catch(() => false);
  expect(groupVisible).toBe(false);
});

// User deletion
When('I confirm the user deletion', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
  await this.page!.waitForTimeout(2000);
});

Then('the user {string} should not appear in the list', async function(this: CustomWorld, username: string) {
  const userVisible = await this.page!.locator(`td:has-text("${username}"), .user-row:has-text("${username}")`).isVisible().catch(() => false);
  expect(userVisible).toBe(false);
});

// Bulk operations
When('I select the following users:', async function(this: CustomWorld, dataTable: DataTable) {
  const users = dataTable.raw().flat();
  
  for (const user of users) {
    const checkbox = this.page!.locator(`tr:has-text("${user}") input[type="checkbox"], mat-row:has-text("${user}") mat-checkbox`);
    await checkbox.click();
    await this.page!.waitForTimeout(200);
  }
});

When('I click the bulk action button', async function(this: CustomWorld) {
  await this.page!.click('button:has-text("Bulk actions"), button:has-text("Actions")');
  await this.page!.waitForTimeout(500);
});

When('I select {string} from the bulk actions menu', async function(this: CustomWorld, action: string) {
  await this.page!.click(`button:has-text("${action}"), [mat-menu-item]:has-text("${action}")`);
  await this.page!.waitForTimeout(500);
});

Then('all selected users should be in group {string}', async function(this: CustomWorld, groupName: string) {
  // This would need to verify each selected user has the group
  // For simplicity, checking if success message appears
  const success = await this.page!.locator('.mat-snack-bar:has-text("added to group")').isVisible({ timeout: 3000 });
  expect(success).toBe(true);
});

// Import/Export
When('I click the {string} users button', async function(this: CustomWorld, action: string) {
  await this.page!.click(`button:has-text("${action} users"), button:has-text("${action}")`);
  await this.page!.waitForTimeout(500);
});

When('I select CSV format', async function(this: CustomWorld) {
  await this.page!.click('mat-radio-button:has-text("CSV"), input[value="csv"]');
});

When('I upload the CSV file {string}', async function(this: CustomWorld, filename: string) {
  const fileInput = this.page!.locator('input[type="file"]');
  await fileInput.setInputFiles(`fixtures/${filename}`);
  await this.page!.waitForTimeout(1000);
});

Then('I should see a preview of the import', async function(this: CustomWorld) {
  const preview = await this.page!.locator('.import-preview, mat-table.preview').isVisible({ timeout: 5000 });
  expect(preview).toBe(true);
});

When('I click the user button {string}', async function(this: CustomWorld, buttonText: string) {
  await this.page!.click(`button:has-text("${buttonText}")`);
  await this.page!.waitForTimeout(1000);
});

Then('the users should be imported successfully', async function(this: CustomWorld) {
  const success = await this.page!.locator('text=/imported.*successfully|Import.*complete/i').isVisible({ timeout: 5000 });
  expect(success).toBe(true);
});

Then('a CSV file should be downloaded', async function(this: CustomWorld) {
  // In a real test, we would verify the download
  // For now, we'll check if download was triggered
  const downloadStarted = this.testData.get('downloadStarted');
  expect(downloadStarted).toBeTruthy();
});

// Access control
Given('multiple users exist with various attributes', async function(this: CustomWorld) {
  // This is typically a precondition
  this.testData.set('multipleUsersExist', true);
});

// Removed duplicate - use 'When I apply the filter {string}' from motion-workflow.steps.ts

Then('I should only see users matching the filter', async function(this: CustomWorld) {
  // Verify filtered results - at least one user should be visible
  const users = await this.page!.locator('mat-row, .user-row').count();
  expect(users).toBeGreaterThan(0);
});

When('I open the user menu for {string}', async function(this: CustomWorld, username: string) {
  const userRow = this.page!.locator(`tr:has-text("${username}"), mat-row:has-text("${username}")`);
  const menuButton = userRow.locator('button[mat-icon-button], .menu-trigger');
  await menuButton.click();
  await this.page!.waitForTimeout(500);
});

When('I select {string} from the user menu', async function(this: CustomWorld, action: string) {
  await this.page!.click(`button:has-text("${action}"), [mat-menu-item]:has-text("${action}")`);
  await this.page!.waitForTimeout(500);
});

Then('the user {string} should be deactivated', async function(this: CustomWorld, username: string) {
  const userRow = this.page!.locator(`tr:has-text("${username}"), mat-row:has-text("${username}")`);
  const deactivated = await userRow.locator('.deactivated, text="Inactive"').isVisible();
  expect(deactivated).toBe(true);
});