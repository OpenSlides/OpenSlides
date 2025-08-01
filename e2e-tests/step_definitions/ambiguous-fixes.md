# Ambiguous Step Fixes

## Strategy
1. Keep the most generic/reusable definition
2. Remove duplicates from other files
3. Ensure all scenarios still work

## Duplicate Steps to Fix

### 1. "I am on the login page" (3 duplicates)
- **Keep**: authentication.steps.ts (most appropriate)
- **Remove from**: 
  - final-undefined.steps.ts:232
  - last-remaining.steps.ts:222

### 2. "I should see a success message" (2 duplicates)
- **Keep**: generic-ui.steps.ts:223 (more generic)
- **Remove from**: comprehensive.steps.ts:316

### 3. "I click {string}" variations
- Need to analyze which are truly duplicates vs context-specific

### 4. Hook duplicates (Before/After)
- hooks.js has multiple Before hooks at lines 49 and 135

## Implementation Plan
1. Comment out duplicates (don't delete yet)
2. Run tests to ensure nothing breaks
3. Delete commented code once confirmed