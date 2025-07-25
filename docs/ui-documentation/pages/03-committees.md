# Committees Page Documentation

## Overview
The Committees page manages organizational committee structures, membership, and committee-specific settings across the entire organization.

## URL Route
- Committees: `/committees`

## Page Layout

### Committees List Interface
```
┌─────────────────────────────────────────────────┐
│  Committees                         [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  1 of 1    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │ Default committee                     [⋮]   ││
│  │ Add description here                        ││
│  │ 🏷️ Org Tag 1                               ││
│  │ 📅 1 meeting    👥 3 members               ││
│  │ 📊 1 motion     🗳️ 0 elections             ││
│  │ Created: 15.01.2024                        ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Committee Statistics                           │
│  Total: 1    Active: 1    Archived: 0         │
│  Average Members: 3                            │
└─────────────────────────────────────────────────┘
```

## Frontend Actions and Backend Mapping

### Committee Management
- **Create Committee**:
  - Frontend: Click [+] button, opens creation dialog
  - Backend: `POST /system/action` - `committee.create`
  - Service: `openslides-backend/action/committee/create.py`

- **Edit Committee**:
  - Frontend: Click [⋮] menu, select edit
  - Backend: `POST /system/action` - `committee.update`
  - Service: `openslides-backend/action/committee/update.py`

- **Delete Committee**:
  - Frontend: Committee menu > Delete
  - Backend: `POST /system/action` - `committee.delete`
  - Service: `openslides-backend/action/committee/delete.py`

### Data Loading
- **Committee List**:
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_committees`
  - Service: `openslides-backend/presenter/committee.py`

- **Committee Statistics**:
  - Frontend: Calculated from committee data
  - Backend: Aggregated committee information
  - Service: Committee presenter with member counts

## Create Committee Dialog

### Dialog Interface
```
┌─────────────────────────────────────────────────┐
│  Create committee                       [x]     │
├─────────────────────────────────────────────────┤
│  Committee name *                               │
│  [Finance Committee__________________]          │
│                                                 │
│  Description                                    │
│  [Committee responsible for financial           │
│   oversight and budget management]             │
│                                                 │
│  Committee managers                             │
│  [Select users...] 👥                          │
│                                                 │
│  Tags                                           │
│  [Add tags...] 🏷️                              │
│                                                 │
│  [Cancel]                    [Create Committee] │
└─────────────────────────────────────────────────┘
```

### Dialog Actions
- **User Selection for Managers**:
  - Frontend: Multi-select dropdown
  - Backend: `GET /system/presenter/get_users`
  - Service: `openslides-backend/presenter/user.py`

- **Tag Selection**:
  - Frontend: Tag picker component
  - Backend: `GET /system/presenter/get_organization_tags`
  - Service: `openslides-backend/presenter/organization_tag.py`

## Committee Detail View

### Detailed Committee Interface
```
┌─────────────────────────────────────────────────┐
│  Committee: Finance Committee          [✏️] [⋮] │
├─────────────────────────────────────────────────┤
│  Committee Information                          │
│  Description: Financial oversight committee     │
│  Created: 15.01.2024                           │
│  Members: 5    Managers: 2                     │
│                                                 │
│  Committee Members                              │
│  ┌─────────────────────────────────────────────┐│
│  │ 👤 John Doe (Manager)              [⋮]     ││
│  │ 👤 Mary Smith (Manager)            [⋮]     ││
│  │ 👤 Bob Johnson (Member)            [⋮]     ││
│  │ 👤 Alice Wilson (Member)           [⋮]     ││
│  │ 👤 Tom Brown (Member)              [⋮]     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Committee Meetings                             │
│  ┌─────────────────────────────────────────────┐│
│  │ • Budget Review 2024 (Active)              ││
│  │ • Q1 Financial Report (Completed)          ││
│  │ • Annual Budget Planning (Scheduled)       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Add Members] [Create Meeting] [Settings]      │
└─────────────────────────────────────────────────┘
```

### Member Management Actions
- **Add Members**:
  - Frontend: Opens member selection dialog
  - Backend: `POST /system/action` - `committee.add_user`
  - Service: `openslides-backend/action/committee/`

- **Remove Members**:
  - Frontend: Member menu > Remove
  - Backend: `POST /system/action` - `committee.remove_user`
  - Service: `openslides-backend/action/committee/`

- **Set Manager Role**:
  - Frontend: Member menu > Set as Manager
  - Backend: `POST /system/action` - `committee.set_manager`
  - Service: `openslides-backend/action/committee/`

## E2E Test Selectors
- Committee list: `.committee-list`
- Committee card: `.committee-card`
- Create committee: `button[matTooltip="Create committee"]`
- Committee name: `.committee-name`
- Committee members: `.committee-members`
- Add members: `.add-members-button`

## Backend Integration Points

### Primary Services
1. **Committee Management**: `openslides-backend/action/committee/`
2. **Committee Data**: `openslides-backend/presenter/committee.py`
3. **User Management**: `openslides-backend/action/user/`

### Key Actions
- `committee.create` - Creates new committee
- `committee.update` - Updates committee information
- `committee.delete` - Deletes committee
- `committee.add_user` - Adds user to committee
- `committee.remove_user` - Removes user from committee
- `committee.set_manager` - Sets/unsets manager role