# OpenSlides UI Documentation

## Overview
This document provides a comprehensive guide to the OpenSlides user interface, including navigation, key features, and UI elements for testing purposes.

## Access Information

- **URL**: http://localhost:8080
- **Default Credentials**: 
  - Username: `admin`
  - Password: `admin`

## Login Page

### URL: `/login`

### Elements
- **Username Input**: `data-cy="loginUsernameInput"`
- **Password Input**: `data-cy="loginPasswordInput"`
- **Login Button**: `data-cy="loginButton"` (enabled only when both fields are filled)
- **Forgot Password Button**: Links to password reset
- **Organization Name**: Displayed as heading (e.g., "Test Organization")
- **Footer Links**: 
  - © Copyright by OpenSlides
  - Legal notice (`/login/legalnotice`)
  - Privacy policy (`/login/privacypolicy`)

### Screenshots
- ![Login Page](../screenshots/openslides-login-page.png)

## Dashboard (Calendar View)

### URL: `/`

### Description
The dashboard provides an overview of all meetings organized by their time status.

### Sections
1. **Today**: Meetings scheduled for the current day
2. **Future**: Upcoming meetings
3. **Ended**: Completed meetings
4. **Dateless**: Meetings without specific dates

### Navigation Elements
- **Search Button**: Located in the top-right header
- **User Profile**: Shows current user name and avatar
- **Menu Button**: Hamburger icon to access main navigation

### Screenshots
- ![Dashboard Calendar](../screenshots/openslides-dashboard-calendar.png)

## Main Navigation Menu (Organization Level)

### Menu Items
- **Dashboard** (`/`) - Calendar view of meetings
- **Meetings** - List of all meetings
- **Committees** (`/committees`) - Committee management
- **Accounts** - User account management
- **Tags** - Organization-wide tags
- **Files** - Global file management
- **Design** - Theme and branding settings
- **Settings** - Organization settings

### Screenshots
- ![Navigation Menu](../screenshots/openslides-navigation-menu.png)

## Meeting Interface

### URL Pattern: `/{meeting_id}`

### Meeting Home Page
- **Welcome Message**: Customizable welcome text
- **Edit Button**: Floating action button for editing content

### Meeting Navigation Menu

#### Core Features
1. **Home** - Meeting welcome page
2. **Autopilot** - Automated meeting progression
3. **Agenda** - Meeting agenda items and schedule
4. **Motions** - Motion management and voting
5. **Elections** - Election management
6. **Participants** - Attendee management
7. **Files** - Meeting-specific documents
8. **Projector** - Presentation control
9. **History** - Meeting action history
10. **Settings** - Meeting configuration
11. **Chat** - Real-time messaging

### Screenshots
- ![Meeting Home](../screenshots/openslides-meeting-home.png)
- ![Meeting Navigation](../screenshots/openslides-meeting-navigation.png)

## UI Components and Patterns

### Material Design
- Uses Angular Material components throughout
- Consistent use of Material icons
- Responsive design with mobile support

### Common UI Elements
- **Floating Action Buttons**: For primary actions (e.g., edit, add)
- **Cards**: For organizing content sections
- **Tables**: For listing items (uses Material table)
- **Dialogs**: For forms and confirmations
- **Snackbars**: For notifications
- **Progress Indicators**: For loading states

### Data Attributes for Testing
- `data-cy` attributes are used throughout for E2E testing
- Common patterns:
  - Inputs: `data-cy="{feature}{Field}Input"`
  - Buttons: `data-cy="{action}Button"`
  - Lists: `data-cy="{feature}List"`

## Real-time Features

### WebSocket Connections
- Autoupdate service provides real-time updates
- Active subscriptions for:
  - Organization details
  - Meeting data
  - User/operator information
  - Current agenda items

### Notification System
- Real-time notifications for meeting events
- Chat messages
- Voting updates
- Speaker list changes

## Accessibility Features

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast theme support

## Technical Architecture

### Frontend Stack
- **Framework**: Angular 19
- **UI Library**: Angular Material
- **State Management**: Reactive patterns with RxJS
- **Real-time**: WebSocket via autoupdate service
- **Routing**: Angular Router with lazy loading

### Service Communication
- REST API calls to backend services
- WebSocket for real-time updates
- Service worker for offline support
- HTTP interceptors for authentication

## Development Notes

### Key Directories
- `/client/src/app/site/` - Feature modules
- `/client/src/app/domain/` - Domain models
- `/client/src/app/gateways/` - API services
- `/client/src/app/ui/` - Shared UI components

### Testing Approach
- Unit tests with Karma
- E2E tests with Playwright
- Use `data-cy` attributes for test selectors
- Mock services for isolated testing

## Known Issues and Workarounds

1. **HTTPS Warning**: The application shows a warning when accessed over HTTP. This can be dismissed but HTTPS is recommended for production.

2. **Proxy Configuration**: In development, a custom nginx proxy is needed to route requests between services:
   - Client: Port 9001
   - Backend: Port 9002
   - Auth: Port 9004
   - Other services have their specific ports

3. **WebSocket Errors**: Some WebSocket connection errors appear in the console during development but don't affect functionality.

## Future Enhancements

Based on the codebase analysis, upcoming features may include:
- Enhanced video conferencing integration
- Improved offline capabilities
- Advanced voting mechanisms
- Extended customization options