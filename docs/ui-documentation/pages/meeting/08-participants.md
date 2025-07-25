# Meeting Participants Page Documentation

## Overview
The Meeting Participants page manages participant presence, group assignments, permissions, and real-time attendance tracking within the meeting context.

## URL Route
- Meeting Participants: `/:meetingId/participants`

## Page Layout

### Participants List Interface
```
┌─────────────────────────────────────────────────┐
│  Participants                       [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  3 of 3    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │ a                                     [⋮]   ││
│  │ a                                           ││
│  │ 👥 Delegates                                ││
│  │ 🏢 Test structure level a                   ││
│  │ 🆔 12345-67891                              ││
│  │                            ☐ Present  [⋮]  ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ b                                     [⋮]   ││
│  │ b                                           ││
│  │ 👥 Delegates                                ││
│  │ 🏢 Test structure level b                   ││
│  │ 🆔 12345-67892                              ││
│  │                            ☐ Present  [⋮]  ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ Administrator                         [⋮]   ││
│  │ admin                                       ││
│  │ 👥 Admin                                    ││
│  │ 🏢 Test structure level                     ││
│  │ 🆔 12345-67890                              ││
│  │                            ☑ Present  [⋮]  ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Participant Card Components

### Display Elements
- **Display Name**: Full participant name ("Administrator", "a", "b")
- **Username**: System login identifier ("admin", "a", "b")
- **Group Membership**: 👥 Admin, 👥 Delegates role indicators
- **Structure Level**: 🏢 Organizational position
- **Participant Number**: 🆔 Unique identifier (12345-67890)
- **Presence Status**: ☑ Present (blue check) or ☐ Present (empty)
- **Actions Menu**: [⋮] Individual participant operations

### Presence Indicators
```
☑ Present    - Blue checkmark: Participant is in the meeting
☐ Present    - Empty checkbox: Participant is absent
🔄 Joining   - Participant is connecting to meeting
⏸️ Away      - Temporarily absent from meeting
```

## Frontend Actions and Backend Mapping

### Participant Management
- **Add Participant**:
  - Frontend: Click [+] button, opens participant selection dialog
  - Backend: `POST /system/action` - `meeting_user.create`
  - Service: `openslides-backend/action/meeting_user/create.py`

- **Edit Participant**:
  - Frontend: Participant menu [⋮] > Edit
  - Backend: `POST /system/action` - `meeting_user.update`
  - Service: `openslides-backend/action/meeting_user/update.py`

### Presence Management
- **Toggle Presence**:
  - Frontend: Click presence checkbox (☑/☐)
  - Backend: `POST /system/action` - `meeting_user.set_present`
  - Service: `openslides-backend/action/meeting_user/set_present.py`
  - Real-time: `openslides-autoupdate-service` broadcasts changes

- **Bulk Presence Actions**:
  - Frontend: Select multiple participants + bulk actions
  - Backend: `POST /system/action` - Multiple `meeting_user.set_present`
  - Service: Batch presence updates

### Data Loading
- **Participant List**:
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_meeting_users`
  - Service: `openslides-backend/presenter/meeting_user.py`

- **Group Information**:
  - Frontend: Group assignments display
  - Backend: `GET /system/presenter/get_groups`
  - Service: `openslides-backend/presenter/group.py`

## Add Participant Dialog

### Dialog Interface
```
┌─────────────────────────────────────────────────┐
│  Add participant to meeting            [x]     │
├─────────────────────────────────────────────────┤
│  Select participants                            │
│                                                 │
│  Search users:                                  │
│  [Search by name or username_______]            │
│                                                 │
│  Available participants:                        │
│  ┌─────────────────────────────────────────────┐│
│  │ ☐ John Doe (john.doe)                       ││
│  │   Finance Committee                         ││
│  │ ☐ Mary Smith (mary.smith)                   ││
│  │   Board Committee                           ││
│  │ ☐ Bob Johnson (bob.johnson)                 ││
│  │   No committee assignments                  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Default settings for selected participants:    │
│  Group assignment: [Delegates ▼]                │
│  ☑ Mark as present                             │
│  ☑ Send meeting invitation                     │
│                                                 │
│  [Cancel]                    [Add Participants] │
└─────────────────────────────────────────────────┘
```

### Dialog Actions
- **User Search**:
  - Frontend: Real-time search through organization users
  - Backend: `GET /system/presenter/search_users`
  - Service: User search with committee context

- **Group Assignment**:
  - Frontend: Default group selection for new participants
  - Backend: Group assignment during participant creation
  - Service: Meeting-specific group management

## Participant Detail View

### Detail Interface
```
┌─────────────────────────────────────────────────┐
│  Participant: Administrator            [✏️] [⋮] │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│  Name: Administrator                            │
│  Username: admin                                │
│  Email: admin@openslides.demo                   │
│  Structure Level: Test structure level          │
│  Number: 12345-67890                           │
│                                                 │
│  Meeting Participation                          │
│  Groups: 👥 Admin                               │
│  Presence: ☑ Present (Since 24.07.2024 14:25) │
│  Vote Weight: 1.0                               │
│                                                 │
│  Activity Summary                               │
│  📋 Agenda speeches: 3                         │
│  📄 Motions submitted: 2                       │
│  🗳️ Polls voted: 8                             │
│  ⏱️ Total speaking time: 12 minutes            │
│                                                 │
│  Permissions                                    │
│  ✓ Can see motions                             │
│  ✓ Can create motions                          │
│  ✓ Can manage meeting                          │
│                                                 │
│  [Edit Participant] [Change Groups]             │
└─────────────────────────────────────────────────┘
```

### Detail Actions
- **Edit Participant**:
  - Frontend: Opens participant editing dialog
  - Backend: `POST /system/action` - `meeting_user.update`
  - Service: Updates meeting-specific participant data

- **Change Groups**:
  - Frontend: Group assignment interface
  - Backend: `POST /system/action` - `meeting_user.update` (group_ids)
  - Service: Updates group memberships within meeting

## Participant Context Menu

### Actions Menu
```
┌─────────────────────────────────────────────────┐
│  Participant actions                    [x]     │
├─────────────────────────────────────────────────┤
│  👤 View details                                │
│  ✏️ Edit participant                            │
│  ☑️ Toggle presence                             │
│  👥 Change groups                               │
│  🎤 Add to speakers                             │
│  🗳️ Vote delegation                             │
│  📊 Participation report                        │
│  📤 Send invitation                             │
│  🚫 Remove from meeting                         │
└─────────────────────────────────────────────────┘
```

### Advanced Actions
- **Add to Speakers**:
  - Frontend: Quick add to current agenda item speakers
  - Backend: `POST /system/action` - `speaker.create`
  - Service: `openslides-backend/action/speaker/create.py`

- **Vote Delegation**:
  - Frontend: Vote delegation interface
  - Backend: `POST /system/action` - `meeting_user.delegate_vote`
  - Service: Vote delegation management

## Group Management Integration

### Group Display
Participants show their meeting-specific group assignments:
- **Admin**: Full meeting management permissions
- **Delegates**: Voting members with full participation rights
- **Staff**: Support personnel with limited permissions
- **Observers**: View-only access to meeting content

### Group-based Features
- **Permission Inheritance**: Groups determine participant capabilities
- **Bulk Operations**: Group-based bulk actions
- **Voting Rights**: Group determines voting eligibility
- **Content Access**: Visibility based on group permissions

## Real-time Features

### Autoupdate Integration
- **Presence Changes**: Live presence status updates
- **Group Changes**: Real-time group assignment updates
- **Participant Additions**: Dynamic participant list updates
- **Activity Updates**: Live activity counters

### WebSocket Events
- `meeting_user_updated` - Participant data changes
- `presence_changed` - Presence status updates
- `group_assignment_changed` - Group membership updates
- `participant_activity` - Activity counters

## E2E Test Selectors
- Participant list: `.participant-list`
- Participant card: `.participant-card`
- Add participant: `[data-cy="headbarMainButton"]`
- Presence checkbox: `.presence-checkbox`
- Participant menu: `.participant-menu`
- Group indicator: `.group-indicator`

## Backend Integration Points

### Primary Services
1. **Meeting Users**: `openslides-backend/action/meeting_user/`
2. **Group Management**: `openslides-backend/action/group/`
3. **Presence Tracking**: Meeting user presence system
4. **Real-time**: `openslides-autoupdate-service`

### Key Actions
- `meeting_user.create` - Adds participant to meeting
- `meeting_user.update` - Updates participant information
- `meeting_user.delete` - Removes participant from meeting
- `meeting_user.set_present` - Updates presence status
- `group.add_user` - Assigns participant to group
- `group.remove_user` - Removes from group

### Data Presenters
- `meeting_user` - Meeting participant data
- `group` - Group information and permissions
- `user` - Base user account information
- `participant_activity` - Activity statistics