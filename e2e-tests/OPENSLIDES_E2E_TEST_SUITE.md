# OpenSlides E2E Test Suite Documentation

## Overview
This document provides a comprehensive overview of the OpenSlides end-to-end test suite built with Playwright and Cucumber BDD.

## Test Architecture

### Technology Stack
- **Framework**: Playwright + Cucumber
- **Language**: TypeScript
- **Pattern**: Page Object Model (POM)
- **BDD**: Gherkin feature files

### Project Structure
```
e2e-tests/
├── features/                    # BDD feature files
│   ├── login.feature           # Authentication scenarios
│   ├── navigation.feature      # UI navigation tests
│   ├── meeting.feature         # Meeting management
│   ├── agenda.feature          # Agenda operations
│   ├── committee-management.feature  # Committee CRUD
│   ├── user-management.feature      # User/account management
│   ├── motion-workflow.feature      # Motion lifecycle
│   ├── voting-system.feature        # Electronic voting
│   ├── file-management.feature      # File operations
│   ├── real-time-updates.feature    # WebSocket sync
│   └── projector-control.feature    # Presentation control
├── pages/                      # Page Object classes
│   ├── login.page.ts          # Login page methods
│   ├── dashboard.page.ts      # Dashboard interactions
│   ├── meeting.page.ts        # Meeting operations
│   ├── agenda.page.ts         # Agenda management
│   ├── committee.page.ts      # Committee operations
│   ├── user.page.ts           # User management
│   ├── motion.page.ts         # Motion handling
│   ├── voting.page.ts         # Voting interface
│   └── file.page.ts           # File management
├── step-definitions/           # Step implementations
│   ├── common.steps.ts        # Shared steps
│   ├── login.steps.ts         # Login scenarios
│   ├── navigation.steps.ts    # Navigation steps
│   ├── meeting.steps.ts       # Meeting steps
│   ├── agenda.steps.ts        # Agenda steps
│   └── committee.steps.ts     # Committee steps
├── support/                    # Test infrastructure
│   ├── world.ts               # Test context
│   ├── hooks.ts               # Before/After hooks
│   └── api-helper.ts          # API utilities
├── fixtures/                   # Test data
│   └── test-data.json         # Sample data
└── comprehensive-test.ts       # Standalone test suite

```

## Feature Coverage

### 1. Core Features (Original)
- **Login/Authentication**: Valid/invalid login, session management
- **Navigation**: Menu navigation, breadcrumbs, routing
- **Meeting Management**: Create, access, configure meetings
- **Agenda Operations**: CRUD operations, item ordering

### 2. Organization Management (New)
- **Committee Management**
  - Create, edit, delete committees
  - Assign members and roles
  - Permission-based access
  
- **User & Account Management**
  - User CRUD operations
  - Password management
  - Group assignments
  - Bulk import/export
  - Profile self-service

### 3. Motion System (New)
- **Motion Workflow**
  - Create and edit motions
  - State transitions
  - Amendments and recommendations
  - Supporter management
  - Paragraph-based editing
  
- **Electronic Voting**
  - Motion voting (Yes/No/Abstain)
  - Election voting
  - Anonymous and named votes
  - Weighted voting
  - Proxy and delegation
  - Live results
  - Voting reports

### 4. Document Management (New)
- **File Operations**
  - Single and bulk upload
  - Folder organization
  - Version control
  - Permission management
  - File linking to agenda items
  - Preview functionality
  - Search and filtering

### 5. Real-time Features (New)
- **WebSocket Synchronization**
  - Live agenda updates
  - Motion state changes
  - Voting progress
  - Speaker list updates
  - Presence tracking
  - Offline queue sync

### 6. Presentation System (New)
- **Projector Control**
  - Multi-projector management
  - Custom slides
  - Presentation queue
  - Live editing
  - Countdown timers
  - Emergency messages
  - Templates

## Running the Tests

### Prerequisites
```bash
# Ensure OpenSlides is running
make run-dev

# Install dependencies
npm install
```

### Execution Commands
```bash
# Run all Cucumber tests
npm test

# Run specific feature
npm test -- features/committee-management.feature

# Run with tags
npm test -- --tags "@smoke"
npm test -- --tags "@committees and not @wip"

# Run comprehensive TypeScript tests
npm run test:comprehensive

# Run in parallel
npm run test:parallel
```

### Test Reports
- Results saved to `test-results/`
- Screenshots captured on failure
- JSON and HTML reports generated

## Test Data Management

### API Helper
The `api-helper.ts` provides methods for:
- Creating test meetings
- Setting up test users
- Preparing motion data
- Managing test fixtures

### Fixtures
Test data stored in `fixtures/test-data.json`:
```json
{
  "users": [...],
  "committees": [...],
  "meetings": [...],
  "motions": [...]
}
```

## Best Practices

### 1. Page Object Pattern
- One page object per major UI component
- Methods return void or simple types
- No assertions in page objects
- Clear, action-oriented method names

### 2. Step Definitions
- Reusable, atomic steps
- Parameter support for flexibility
- Clear Given/When/Then separation
- Proper error handling

### 3. Feature Files
- Business-readable scenarios
- Comprehensive background sections
- Tagged for organization
- Data tables for complex inputs

### 4. Test Stability
- Explicit waits over fixed timeouts
- Proper element locators
- Error recovery mechanisms
- Test data cleanup

## CI/CD Integration

### Docker Support
```bash
# Run tests in Docker
npm run test:docker
```

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npm run wait-and-test-comprehensive
```

## Troubleshooting

### Common Issues
1. **SSL Certificate Errors**: Tests handle self-signed certs
2. **Timing Issues**: Adjust timeouts in `cucumber.js`
3. **Missing Elements**: Check for UI changes
4. **WebSocket Failures**: Ensure autoupdate service running

### Debug Mode
```bash
# Run with headed browser
HEADLESS=false npm test

# Increase verbosity
DEBUG=pw:api npm test
```

## Future Enhancements
1. Visual regression testing
2. Performance benchmarks
3. Accessibility tests
4. API contract tests
5. Load testing scenarios

## Maintenance
- Regular dependency updates
- Selector updates as UI evolves
- New feature coverage
- Performance optimization