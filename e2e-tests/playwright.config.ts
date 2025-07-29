import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Optimized timeouts based on analysis
  timeout: 10000, // Default timeout for tests
  globalTimeout: 600000, // 10 minutes for entire test run
  
  use: {
    // Base URL for navigation
    baseURL: 'https://localhost:8000',
    
    // Browser options
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    
    // Navigation options
    navigationTimeout: 30000,
    actionTimeout: 10000,
    
    // Viewport
    viewport: { width: 1920, height: 1080 },
    
    // Browser launch options
    launchOptions: {
      args: [
        '--ignore-certificate-errors',
        '--disable-web-security',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ]
    }
  },
  
  // Test retry strategy
  retries: 2,
  
  // Parallel execution
  workers: process.env.CI ? 1 : 4,
  fullyParallel: true,
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  
  // Global setup/teardown
  globalSetup: require.resolve('./support/global-setup.ts'),
  
  projects: [
    {
      name: 'chromium',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        // Reduce animations for faster tests
        launchOptions: {
          args: ['--force-prefers-reduced-motion']
        }
      },
    }
  ],
});