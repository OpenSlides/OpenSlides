#!/bin/bash

# Clean up any previous runs
rm -rf reports/*

# Create directories
mkdir -p reports/screenshots reports/videos

echo "Running single test scenario..."

# Run just one specific test with explicit configuration
npx cucumber-js \
  features/00-simple-test.feature \
  --require-module ts-node/register \
  --require 'support/**/*.ts' \
  --require 'step_definitions/**/*.ts' \
  --format json:reports/test-result.json \
  --format summary \
  --format progress \
  --parallel 1 \
  --retry 0 \
  --fail-fast

echo "Test completed. Exit code: $?"

# Show results
if [ -f reports/test-result.json ]; then
  echo "Test results saved to reports/test-result.json"
  cat reports/test-result.json | jq '.' 2>/dev/null || cat reports/test-result.json
fi