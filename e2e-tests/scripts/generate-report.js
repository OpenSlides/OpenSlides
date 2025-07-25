#!/usr/bin/env node

const reporter = require('multiple-cucumber-html-reporter');
const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '..', 'reports');
const jsonFile = path.join(reportDir, 'cucumber-report.json');

// Check if JSON report exists
if (!fs.existsSync(jsonFile)) {
  console.log('No cucumber report JSON found. Skipping report generation.');
  process.exit(0);
}

// Generate HTML report
reporter.generate({
  jsonDir: reportDir,
  reportPath: reportDir,
  metadata: {
    browser: {
      name: 'chrome',
      version: 'latest'
    },
    device: 'Local test machine',
    platform: {
      name: process.platform,
      version: process.version
    }
  },
  customData: {
    title: 'OpenSlides E2E Test Report',
    data: [
      { label: 'Project', value: 'OpenSlides' },
      { label: 'Release', value: '4.2.18-dev' },
      { label: 'Test Framework', value: 'Playwright + Cucumber' },
      { label: 'Execution Time', value: new Date().toLocaleString() }
    ]
  },
  openReportInBrowser: false,
  disableLog: false,
  displayDuration: true,
  durationInMS: true,
  hideMetadata: false,
  pageTitle: 'OpenSlides E2E Test Report',
  reportName: 'OpenSlides E2E Test Report',
  pageFooter: '<div style="text-align:center">OpenSlides E2E Test Suite</div>'
});

console.log(`HTML report generated at: ${path.join(reportDir, 'index.html')}`);