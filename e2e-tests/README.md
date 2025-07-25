# OpenSlides E2E Test Suite

This is a comprehensive end-to-end test suite for OpenSlides using Playwright and Cucumber BDD.

## Architecture

- **Playwright**: Browser automation framework
- **Cucumber**: BDD test framework
- **TypeScript**: Type-safe test code
- **Page Object Model**: Maintainable test structure
- **Docker Integration**: Automated service orchestration

## Structure

```
e2e-tests/
├── features/              # BDD feature files
├── step_definitions/      # Step implementations
├── pages/                 # Page Object Model classes
├── support/              # Test framework setup
├── fixtures/             # Test data files
├── reports/              # Test reports and screenshots
└── scripts/              # Utility scripts
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start OpenSlides services:
```bash
npm run docker:up
npm run wait-for-services
```

3. Run tests:
```bash
npm test
```

## Test Execution

### Run all tests
```bash
npm test
```

### Run smoke tests only
```bash
npm run test:smoke
```

### Run tests in development mode (headed browser)
```bash
npm run test:dev
```

### Run tests in parallel
```bash
npm run test:parallel
```

### Run with Docker orchestration
```bash
npm run test:docker
```

## Writing Tests

### Feature Files

Features are written in Gherkin syntax:

```gherkin
Feature: User Authentication
  As a user
  I want to log in to OpenSlides
  So that I can access the system

  Scenario: Successful login
    Given I am on the login page
    When I enter username "admin" and password "admin"
    And I click the login button
    Then I should be redirected to the dashboard
```

### Page Objects

Page objects encapsulate page-specific logic:

```typescript
export class LoginPage extends BasePage {
  async login(username: string, password: string) {
    await this.fillInput(this.usernameInput, username);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);
  }
}
```

### Step Definitions

Steps connect features to page objects:

```typescript
When('I enter username {string} and password {string}', 
  async function(username: string, password: string) {
    await this.loginPage.login(username, password);
  }
);
```

## Tags

- `@smoke` - Critical path tests
- `@critical` - Must-pass scenarios
- `@realtime` - WebSocket/real-time tests
- `@meeting` - Meeting-specific tests
- `@admin` - Admin-only features
- `@skip` - Skip in CI
- `@wip` - Work in progress

## Reports

After test execution, reports are available in:
- HTML Report: `reports/cucumber-report.html`
- JSON Report: `reports/cucumber-report.json`
- Screenshots: `reports/screenshots/`
- Videos: `reports/videos/`

## Debugging

1. Run in headed mode:
```bash
HEADLESS=false npm test
```

2. Add breakpoints in VS Code
3. Use Playwright Inspector:
```bash
PWDEBUG=1 npm test
```

## CI/CD Integration

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    npm run docker:up
    npm run wait-for-services
    npm test
    npm run docker:down
```

## Best Practices

1. **Page Objects**: Keep selectors and page logic in page objects
2. **Reusable Steps**: Write generic, reusable step definitions
3. **Test Data**: Use fixtures for test data
4. **Cleanup**: Always clean up test data
5. **Stability**: Use proper waits and assertions
6. **Naming**: Use descriptive scenario and step names

## Troubleshooting

### SSL Certificate Errors
The test suite is configured to ignore SSL errors for local development.

### Flaky Tests
- Increase timeouts in `.env`
- Add explicit waits
- Check for race conditions

### Docker Issues
- Ensure all services are running: `docker-compose ps`
- Check logs: `npm run docker:logs`
- Restart services: `npm run docker:down && npm run docker:up`