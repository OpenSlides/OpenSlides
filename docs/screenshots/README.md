# Screenshots Directory

This directory contains screenshots of the OpenSlides UI for documentation purposes.

## Screenshot List

1. **openslides-login-page.png** - The login page with username and password fields
2. **openslides-dashboard-calendar.png** - The main dashboard showing the calendar view of meetings
3. **openslides-navigation-menu.png** - The organization-level navigation menu
4. **openslides-meeting-home.png** - The home page of a meeting
5. **openslides-meeting-navigation.png** - The navigation menu within a meeting

## Notes

The actual screenshots were captured using Playwright and are stored in the temporary directory:
`/tmp/playwright-mcp-output/2025-07-24T08-40-55.941Z/`

To use these screenshots in documentation:
1. Copy them from the temporary location to this directory
2. Reference them in markdown files using relative paths

## Capturing New Screenshots

To capture new screenshots, use the Playwright MCP tools:
```javascript
// Navigate to the page
mcp__playwright__browser_navigate({ url: "http://localhost:8080" })

// Take a screenshot
mcp__playwright__browser_take_screenshot({ filename: "screenshot-name.png" })
```