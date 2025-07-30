import { Given } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';

// Role-based authentication steps
const roleCredentials: Record<string, { username: string; password: string }> = {
  'administrator': { username: 'admin', password: 'admin' },
  'an administrator': { username: 'admin', password: 'admin' },
  'meeting chair': { username: 'chair', password: 'chair' },
  'a meeting chair': { username: 'chair', password: 'chair' },
  'meeting participant': { username: 'delegate', password: 'delegate' },
  'a meeting participant': { username: 'delegate', password: 'delegate' },
  'meeting operator': { username: 'operator', password: 'operator' },
  'a meeting operator': { username: 'operator', password: 'operator' },
  'meeting administrator': { username: 'meetingadmin', password: 'meetingadmin' },
  'a meeting administrator': { username: 'meetingadmin', password: 'meetingadmin' },
  'participant with voting rights': { username: 'voter', password: 'voter' },
  'a participant with voting rights': { username: 'voter', password: 'voter' },
  'user with projector control permissions': { username: 'projector', password: 'projector' },
  'projector control permissions': { username: 'projector', password: 'projector' }
};

Given('I am logged in as {string}', async function(this: CustomWorld, role: string) {
  // Check if this is a specific username or a role
  let username: string;
  let password: string;
  
  if (roleCredentials[role.toLowerCase()]) {
    ({ username, password } = roleCredentials[role.toLowerCase()]);
  } else {
    // If not a role, assume it's a username and use same as password
    username = role;
    password = role;
  }
  
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  
  // Verify login was successful
  const isLoggedIn = await loginPage.isLoggedIn();
  if (!isLoggedIn) {
    throw new Error(`Failed to login as ${role} (username: ${username})`);
  }
  
  // Store the current user role for later use
  this.testData.set('currentUserRole', role);
  this.testData.set('currentUsername', username);
});

Given('I am logged in as an administrator', async function(this: CustomWorld) {
  const { username, password } = roleCredentials['administrator'];
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  await this.page!.waitForTimeout(2000);
});

Given('I am logged in as a meeting chair', async function(this: CustomWorld) {
  const { username, password } = roleCredentials['meeting chair'];
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  await this.page!.waitForTimeout(2000);
});

Given('I am logged in as a meeting participant', async function(this: CustomWorld) {
  const { username, password } = roleCredentials['meeting participant'];
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  await this.page!.waitForTimeout(2000);
});

Given('I am logged in as a meeting operator', async function(this: CustomWorld) {
  const { username, password } = roleCredentials['meeting operator'];
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  await this.page!.waitForTimeout(2000);
});

Given('I am logged in as a meeting administrator', async function(this: CustomWorld) {
  // Use the existing login function with 'meeting administrator' role
  const { username, password } = roleCredentials['meeting administrator'];
  
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  
  await this.page!.waitForTimeout(2000);
});

Given('I am logged in as a participant with voting rights', async function(this: CustomWorld) {
  const { username, password } = roleCredentials['participant with voting rights'];
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  await this.page!.waitForTimeout(2000);
});

Given('I am logged in with projector control permissions', async function(this: CustomWorld) {
  const { username, password } = roleCredentials['user with projector control permissions'];
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login(username, password);
  await this.page!.waitForTimeout(2000);
});

Given('I am logged in as a user with view-only permissions', async function(this: CustomWorld) {
  // View-only user typically has limited permissions
  const loginPage = new LoginPage(this.page!);
  await loginPage.navigateToLogin();
  await loginPage.login('viewer', 'viewer');
  
  // Verify login was successful
  const isLoggedIn = await loginPage.isLoggedIn();
  if (!isLoggedIn) {
    throw new Error('Failed to login as view-only user');
  }
  
  // Store the current user role for later use
  this.testData.set('currentUserRole', 'viewer');
  this.testData.set('currentUsername', 'viewer');
  this.testData.set('hasViewOnlyPermissions', true);
});