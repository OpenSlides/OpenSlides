# Dashboard Page Documentation

## Overview
The Dashboard serves as the main entry point and navigation hub for OpenSlides, providing quick access to all major sections, organization overview, and recent activity monitoring.

## URL Route
- Dashboard: `/dashboard`

## Page Layout

### Main Dashboard Interface
```
┌─────────────────────────────────────────────────┐
│  OpenSlides - Test Organization        [🔍] [👤] │
├─────────────────────────────────────────────────┤
│  📊 Dashboard                                   │
│  📅 Meetings                                    │
│  🏛️ Committees                                  │
│  👥 Accounts                                    │
│  🏷️ Tags                                        │
│  📎 Files                                       │
│  🎨 Design                                      │
│  ⚙️ Settings                                    │
├─────────────────────────────────────────────────┤
│  Welcome to Test Organization                   │
│                                                 │
│  Quick Actions                                  │
│  [Create Meeting] [Add User] [View Analytics]   │
│                                                 │
│  Recent Activity                                │
│  • New meeting "Board Meeting" created          │
│  • User "John Doe" added to organization        │
│  • Committee "Finance" updated                  │
│                                                 │
│  System Status                                  │
│  🟢 All services operational                   │
│  📊 3 active meetings                          │
│  👥 25 total users                             │
└─────────────────────────────────────────────────┘
```

## Frontend Actions and Backend Mapping

### Navigation Actions
- **Action**: Click meeting navigation
- **Frontend**: Angular routing to `/meetings`
- **Backend**: `openslides-backend` - No direct API call, client-side routing

### Quick Actions
- **Create Meeting**: 
  - Frontend: Opens meeting creation dialog
  - Backend: `POST /system/action` - `meeting.create` action
  - Service: `openslides-backend/action/meeting/create.py`

- **Add User**:
  - Frontend: Opens user creation dialog  
  - Backend: `POST /system/action` - `user.create` action
  - Service: `openslides-backend/action/user/create.py`

### Data Loading
- **Organization Info**:
  - Frontend: Fetches organization data on load
  - Backend: `GET /system/presenter/get_organization`
  - Service: `openslides-backend/presenter/organization.py`

- **Recent Activity**:
  - Frontend: Loads activity feed
  - Backend: `GET /system/presenter/get_history`
  - Service: `openslides-backend/presenter/history.py`

## E2E Test Selectors
- Main dashboard: `.dashboard-container`
- Navigation menu: `.navigation-menu`
- Quick actions: `.quick-actions`
- Activity feed: `.activity-feed`
- Create meeting button: `[data-cy="create-meeting"]`

## Key Components
- Navigation sidebar
- Quick action buttons
- Activity monitoring
- System status display