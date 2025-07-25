#!/bin/bash

echo "🥒 Running Cucumber BDD Tests"
echo "============================="

# Set timeout
export CUCUMBER_TIMEOUT=120000

# Run only smoke tests first
echo "Running smoke tests..."
timeout 60s npx cucumber-js \
  features/00-simple-test.feature \
  --format json:test-results/cucumber-results.json \
  --format summary \
  --exit \
  2>&1 | tee test-results/cucumber-output.log

EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
  echo "⚠️ Tests timed out after 60 seconds"
elif [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Tests completed successfully"
else
  echo "❌ Tests failed with exit code: $EXIT_CODE"
fi

# Show summary if JSON exists
if [ -f test-results/cucumber-results.json ]; then
  echo -e "\n📊 Cucumber Test Results:"
  cat test-results/cucumber-results.json | jq -r '
    . as $results |
    "Total Scenarios: \(.[0].elements | length)" |
    . as $total |
    $results[0].elements |
    map(select(.steps[].result.status == "failed")) |
    "Failed Scenarios: \(length)"
  ' 2>/dev/null || echo "Could not parse results"
fi

exit $EXIT_CODE