# Meetings Page Documentation

## Overview
The Meetings page provides organization-wide meeting management, displaying all meetings across committees with filtering, creation, and management capabilities.

## URL Route
- Meetings: `/meetings`

## Page Layout

### Meetings List Interface
```
┌─────────────────────────────────────────────────┐
│  Meetings                           [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  1 of 1    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Demo                       [⋮]   ││
│  │ 🏛️ Default committee                       ││
│  │ 🏷️ Org Tag 1                               ││
│  │ 👥 3 participants    📁 4 files            ││
│  │ Status: Active       Created: 20.07.2024   ││
│  │                              [Enter] [⋮]   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Meeting Statistics                             │
│  Total: 1    Active: 1    Scheduled: 0         │
│  Completed: 0    Archived: 0                   │
└─────────────────────────────────────────────────┘
```

## Frontend Actions and Backend Mapping

### Meeting Management
- **Create Meeting**:
  - Frontend: Click [+] button, opens creation dialog
  - Backend: `POST /system/action` - `meeting.create`
  - Service: `openslides-backend/action/meeting/create.py`

- **Enter Meeting**:
  - Frontend: Click [Enter] button
  - Backend: Navigation to meeting, loads meeting data
  - Service: `GET /system/presenter/get_meeting` 
  - Service: `openslides-backend/presenter/meeting.py`

- **Filter/Sort Meetings**:
  - Frontend: Client-side filtering and sorting
  - Backend: Initial data from `meeting.list` presenter
  - Service: `openslides-backend/presenter/meeting.py`

### Data Loading
- **Meeting List**:
  - Frontend: Component loads on page initialization
  - Backend: `GET /system/presenter/get_meetings`
  - Service: `openslides-backend/presenter/meeting.py`

- **Meeting Statistics**:
  - Frontend: Calculated from meeting data
  - Backend: Meeting data with status information
  - Service: Aggregated from meeting presenter data

## Create Meeting Dialog

### Dialog Interface
```
┌─────────────────────────────────────────────────┐
│  Create meeting                         [x]     │
├─────────────────────────────────────────────────┤
│  Meeting name *                                 │
│  [Annual Board Meeting________________]         │
│                                                 │
│  Committee: [Default committee ▼]               │
│  Template: [Standard meeting ▼]                │
│                                                 │
│  [Cancel]                    [Create Meeting]   │
└─────────────────────────────────────────────────┘
```

### Dialog Actions
- **Committee Selection**:
  - Frontend: Dropdown populated with user's committees
  - Backend: `GET /system/presenter/get_committees`
  - Service: `openslides-backend/presenter/committee.py`

- **Template Selection**:
  - Frontend: Dropdown with meeting templates
  - Backend: Templates from organization settings
  - Service: Organization presenter or meeting templates

## E2E Test Selectors
- Meeting list: `.meeting-list`
- Meeting card: `.meeting-card`
- Create meeting: `button[matTooltip="Create meeting"]`
- Enter meeting: `.enter-meeting-button`
- Meeting filter: `.meeting-filter`
- Meeting search: `.meeting-search`

## Backend Integration Points

### Primary Services
1. **Meeting Management**: `openslides-backend/action/meeting/`
2. **Meeting Data**: `openslides-backend/presenter/meeting.py`
3. **Committee Data**: `openslides-backend/presenter/committee.py`

### Key Actions
- `meeting.create` - Creates new meeting
- `meeting.update` - Updates meeting information
- `meeting.delete` - Archives/deletes meeting
- `meeting.set_as_template` - Saves meeting as template