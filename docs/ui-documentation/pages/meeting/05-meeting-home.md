# Meeting Home (Calendar) Page Documentation

## Overview
The Meeting Home page serves as the main landing page when entering a meeting, displaying a calendar view of meeting schedules and providing quick navigation to meeting activities.

## URL Route
- Meeting Home: `/:meetingId/home`
- Also accessible as default meeting route: `/:meetingId`

## Page Layout

### Calendar Interface
```
┌─────────────────────────────────────────────────┐
│  OpenSlides Demo                        [🔍] [👤]│
├─────────────────────────────────────────────────┤
│  Calendar                                       │
├─────────────────────────────────────────────────┤
│  🕐 Today                                       │
│  ┌─────────────────────────────────────────────┐│
│  │ No meetings available                       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  🔄 Future                                      │
│  ┌─────────────────────────────────────────────┐│
│  │ No meetings available                       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ⏰ Ended                                       │
│  ┌─────────────────────────────────────────────┐│
│  │ No meetings available                       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  📅 Dateless                                    │
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Demo                      [⋮]   ││
│  │ Current meeting displayed                   ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Frontend Actions and Backend Mapping

### Data Loading
- **Calendar Data**:
  - Frontend: Loads meeting calendar information
  - Backend: `GET /system/presenter/get_meeting_calendar`
  - Service: `openslides-backend/presenter/meeting.py`

- **Meeting Information**:
  - Frontend: Displays current meeting details
  - Backend: `GET /system/presenter/get_meeting`
  - Service: `openslides-backend/presenter/meeting.py`

### Navigation Actions
- **Meeting Navigation**:
  - Frontend: Angular routing within meeting context
  - Backend: No direct API calls for navigation
  - Service: Client-side routing

### Meeting Controls (if available)
- **Meeting Status Changes**:
  - Frontend: Meeting start/end controls
  - Backend: `POST /system/action` - `meeting.update`
  - Service: `openslides-backend/action/meeting/update.py`

## Calendar Time Sections

### Time-based Organization
- **Today**: Meetings scheduled for current date
- **Future**: Upcoming meetings
- **Ended**: Completed meetings
- **Dateless**: Meetings without specific scheduling

### Meeting Entry Points
Each calendar entry provides:
- Meeting title and description
- Meeting time information
- Quick access menu [⋮]
- Direct navigation to meeting

## Quick Actions (Context Menu)
```
┌─────────────────────────────────────────────────┐
│  Meeting actions                        [x]     │
├─────────────────────────────────────────────────┤
│  📋 View agenda                                 │
│  📄 View motions                                │
│  👥 View participants                           │
│  📊 Meeting statistics                          │
│  ⚙️ Meeting settings                            │
│  📺 Project meeting info                        │
│                                                 │
│  [Enter Meeting] [Export Data]                  │
└─────────────────────────────────────────────────┘
```

### Context Menu Actions
- **View Agenda**:
  - Frontend: Navigate to agenda page
  - Backend: Agenda data loading
  - Service: `openslides-backend/presenter/agenda_item.py`

- **View Motions**:
  - Frontend: Navigate to motions page
  - Backend: Motion data loading
  - Service: `openslides-backend/presenter/motion.py`

- **Meeting Statistics**:
  - Frontend: Display meeting analytics
  - Backend: `GET /system/presenter/get_meeting_stats`
  - Service: Meeting statistics presenter

## Navigation Integration

### Meeting Navigation Sidebar
The page includes the meeting navigation menu:
- 🏠 Home (current page)
- 🔄 Autopilot
- 📋 Agenda
- 📄 Motions
- 🗳️ Elections
- 👥 Participants
- 📎 Files
- 📺 Projector
- 📊 History
- ⚙️ Settings
- 💬 Chat

### Navigation Actions
Each navigation item:
- **Frontend**: Angular routing to respective meeting page
- **Backend**: No direct API calls for navigation
- **Data Loading**: Each page loads its specific data when accessed

## E2E Test Selectors
- Calendar container: `.calendar-container`
- Time section: `.time-section`
- Meeting entry: `.meeting-entry`
- Context menu: `.meeting-context-menu`
- Navigation sidebar: `.meeting-navigation`

## Backend Integration Points

### Primary Services
1. **Meeting Data**: `openslides-backend/presenter/meeting.py`
2. **Calendar Data**: Meeting scheduling information
3. **Navigation**: Client-side Angular routing

### Key Data Loading
- `meeting.get` - Current meeting information
- `meeting.get_calendar` - Calendar view data
- `meeting.get_statistics` - Meeting analytics

### Real-time Updates
- **Autoupdate Service**: `openslides-autoupdate-service`
  - Real-time meeting status updates
  - Calendar changes from other users
  - Meeting information modifications

## Accessibility Features
- **Screen Reader Support**: Calendar structure navigation
- **Keyboard Navigation**: Full keyboard access to calendar
- **Focus Management**: Clear focus indicators
- **Time-based Grouping**: Logical calendar organization