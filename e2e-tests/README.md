# OpenSlides E2E Tests

End-to-end tests for OpenSlides using Cucumber and Playwright.

## Setup

```bash
npm install
```

## Running Tests

All test commands automatically run system health checks before executing tests:

```bash
# Run all tests (with health check)
npm test

# Run smoke tests
npm run test:smoke

# Run development tests
npm run test:dev

# Run all tests except those marked @skip
npm run test:full

# Run tests in parallel (4 workers)
npm run test:parallel

# Run tests without health check (not recommended)
npm run test:nocheck

# Run system health check only
npm run system-check
```

## npm Scripts

- `pretest` - Automatically runs system health check before tests
- `test` - Run all feature tests
- `test:smoke` - Run only @smoke tagged tests
- `test:dev` - Run only @dev tagged tests
- `test:full` - Run all tests except @skip
- `test:parallel` - Run tests in parallel
- `test:nocheck` - Run tests without health check
- `system-check` - Run system health check only
- `clean` - Clean up reports and temporary files

## System Health Check

The `system-health-check.ts` script verifies:
- OpenSlides is accessible
- Authentication service works
- Meeting access is functional
- Autoupdate service is healthy

Tests will not run if the system health check fails.

## Project Structure

```
e2e-tests/
├── features/           # Cucumber feature files
├── step_definitions/   # Step implementation files
├── support/           # Test helpers and hooks
├── pages/             # Page object models
├── fixtures/          # Test data files
└── system-health-check.ts  # Pre-test health check
```

## Environment Variables

Create a `.env` file with:
```
BASE_URL=https://localhost:8000
HEADLESS=true
```

## Troubleshooting

If tests fail to run:
1. Ensure OpenSlides is running: `make run-dev` (from parent directory)
2. Wait for services to initialize (60-90 seconds)
3. Run `npm run system-check` to verify services are healthy
4. Check browser compatibility (Chromium is used by default)