# OpenSlides Participant Management Detailed Documentation

## Overview
The Participant Management system provides comprehensive user administration, presence tracking, group management, and permission control within meetings, enabling efficient organization of attendees, delegates, administrators, and other stakeholders.

## URL Routes
- Participants main: `/:meetingId/participants`
- Participant detail: `/:meetingId/participants/:participantId`
- Groups management: `/:meetingId/participants/groups`
- Presence overview: `/:meetingId/participants/presence`
- Import participants: `/:meetingId/participants/import`

## Participant List Interface

### Participant Overview Layout
```
┌─────────────────────────────────────────────────┐
│  Participants                   [+] [📤] [⋮]    │
├─────────────────────────────────────────────────┤
│  3 of 3    [≡ SORT] [⚲ FILTER] [🔍 Search___] │
├─────────────────────────────────────────────────┤
│  Participant List                               │
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

### Participant Management Controls
- **Create Button (+)**: Add new participant
- **Import Button (📤)**: Bulk import participants
- **Menu (⋮)**: Additional operations and settings
- **Sort Options**: Organize by name, group, presence
- **Filter Options**: Filter by group, presence, structure level
- **Search**: Real-time participant search

## Participant Information Display

### Participant Card Components
Each participant card displays:
- **Display Name**: Full participant name ("Administrator", "a", "b")
- **Username**: System login identifier ("admin", "a", "b")
- **Group Membership**: Role indicators (👥 Admin, 👥 Delegates)
- **Structure Level**: Organizational position (🏢 Test structure level)
- **Participant Number**: Unique identifier (🆔 12345-67890)
- **Presence Status**: Current attendance (☑ Present, ☐ Present)
- **Actions Menu (⋮)**: Individual participant operations

### Presence Tracking System
```
┌─────────────────────────────────────────────────┐
│  Presence Status Indicators                     │
├─────────────────────────────────────────────────┤
│  ☑ Present    - Participant is in the meeting   │
│  ☐ Present    - Participant is absent           │
│  🔄 Connecting - Participant joining/leaving     │
│  ⏸️ Paused     - Temporarily away               │
│  🚫 Excluded   - Removed from meeting           │
└─────────────────────────────────────────────────┘
```

#### Presence Management Features
- **Self-Service**: Participants can mark themselves present/absent
- **Administrative Control**: Admins can manage all presence status
- **Bulk Operations**: Set presence for multiple participants
- **Time Tracking**: Track arrival and departure times
- **Attendance Reports**: Generate presence summaries

## Group Management System

### Group Overview Interface
```
┌─────────────────────────────────────────────────┐
│  Groups                         [+] [📋] [⋮]    │
├─────────────────────────────────────────────────┤
│  Group List                                     │
│  ┌─────────────────────────────────────────────┐│
│  │ 👥 Admin                              [⋮]   ││
│  │    System administrators              3 👤  ││
│  │    Full meeting management access           ││
│  │    Permissions: All                         ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 👥 Delegates                           [⋮]   ││
│  │    Voting members                     15 👤  ││
│  │    Can vote and participate actively         ││
│  │    Permissions: Vote, Speak, Submit          ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 👥 Observers                           [⋮]   ││
│  │    Non-voting attendees                5 👤  ││
│  │    Can observe but cannot participate        ││
│  │    Permissions: View only                    ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 👥 Staff                               [⋮]   ││
│  │    Meeting support personnel           2 👤  ││
│  │    Technical and organizational support      ││
│  │    Permissions: Manage, Support              ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Create Group Dialog
```
┌─────────────────────────────────────────────────┐
│  Create group                           [x]     │
├─────────────────────────────────────────────────┤
│  Group details                                  │
│                                                 │
│  Group name *                                   │
│  [Board Members___________________]             │
│                                                 │
│  Description                                    │
│  [Elected board members responsible for         │
│   strategic decisions and oversight]            │
│                                                 │
│  Group color                                    │
│  [🔵] Blue                                      │
│                                                 │
│  Weight (display order)                         │
│  [100____]                                      │
│                                                 │
│  Permissions                                    │
│  ┌─────────────────────────────────────────────┐│
│  │ General                                     ││
│  │ ☑ Can see meeting                          ││
│  │ ☑ Can manage metadata                      ││
│  │ ☐ Can manage logos and fonts               ││
│  │                                             ││
│  │ Agenda                                      ││
│  │ ☑ Can see agenda                           ││
│  │ ☑ Can manage agenda                        ││
│  │ ☑ Can see internal items                   ││
│  │                                             ││
│  │ Motions                                     ││
│  │ ☑ Can see motions                          ││
│  │ ☑ Can create motions                       ││
│  │ ☑ Can support motions                      ││
│  │ ☑ Can manage motions                       ││
│  │                                             ││
│  │ Elections                                   ││
│  │ ☑ Can see elections                        ││
│  │ ☑ Can nominate                             ││
│  │ ☑ Can manage elections                     ││
│  │                                             ││
│  │ Polls                                       ││
│  │ ☑ Can see polls                            ││
│  │ ☑ Can manage polls                         ││
│  │                                             ││
│  │ Participants                                ││
│  │ ☑ Can see participants                     ││
│  │ ☑ Can manage participants                  ││
│  │                                             ││
│  │ Chat                                        ││
│  │ ☑ Can see chat                             ││
│  │ ☐ Can manage chat                          ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Permission Categories

#### General Permissions
- `meeting.can_see_frontpage`: View meeting home page
- `meeting.can_see_history`: Access meeting history
- `meeting.can_manage_metadata`: Edit meeting information
- `meeting.can_manage_logos_and_fonts`: Upload branding materials

#### Agenda Permissions
- `agenda_item.can_see`: View agenda items
- `agenda_item.can_manage`: Create, edit, delete agenda items
- `agenda_item.can_see_internal`: View internal/hidden items
- `agenda_item.can_manage_moderator_notes`: Add moderator notes

#### Motion Permissions
- `motion.can_see`: View motions
- `motion.can_create`: Submit new motions
- `motion.can_support`: Support motions
- `motion.can_manage`: Edit, delete, manage workflow
- `motion.can_see_amendments`: View amendments
- `motion.can_create_amendments`: Create amendments

#### Election Permissions
- `assignment.can_see`: View elections
- `assignment.can_nominate_other`: Nominate candidates
- `assignment.can_nominate_self`: Self-nomination
- `assignment.can_manage`: Manage election process

#### Poll Permissions
- `poll.can_see`: View polls and results
- `poll.can_manage`: Create, edit, delete polls

#### Participant Permissions
- `user.can_see`: View participant list
- `user.can_manage`: Create, edit, delete participants
- `user.can_change_password`: Reset user passwords

#### Chat Permissions
- `chat.can_see`: View chat messages
- `chat.can_manage`: Manage chat groups and messages

## Participant Detail View

### Detailed Participant Information
```
┌─────────────────────────────────────────────────┐
│  Participant: Administrator             [✏️] [⋮]│
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│  Name: Administrator                            │
│  Username: admin                                │
│  Email: admin@openslides.demo                   │
│  Structure Level: Test structure level          │
│  Participant Number: 12345-67890                │
│                                                 │
│  Groups and Permissions                         │
│  👥 Admin (Primary)                             │
│  • Full administrative access                   │
│  • Can manage all meeting aspects               │
│  • Voting weight: 1.0                          │
│                                                 │
│  Meeting Status                                 │
│  Presence: ☑ Present (Since 24.07.2024 14:25)  │
│  Vote Weight: 1.0                               │
│  Is Physical Person: Yes                        │
│                                                 │
│  Activity Summary                               │
│  • Motions submitted: 4                        │
│  • Amendments created: 1                       │
│  • Votes cast: 12                              │
│  • Speaking time: 15 minutes                   │
│  • Last activity: 24.07.2024 16:45             │
│                                                 │
│  Account Information                            │
│  Created: 15.06.2024 09:15                     │
│  Last login: 24.07.2024 14:20                  │
│  Login count: 23                               │
│  Password last changed: 01.07.2024             │
│                                                 │
│  Comments                                       │
│  [Administrative notes about this participant]  │
│                                                 │
│  [Edit Participant] [Reset Password] [Delete]   │
└─────────────────────────────────────────────────┘
```

### Edit Participant Dialog
```
┌─────────────────────────────────────────────────┐
│  Edit participant                       [x]     │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│                                                 │
│  Title                                          │
│  [Dr._______]                                   │
│                                                 │
│  First name                                     │
│  [Administrator_____________]                   │
│                                                 │
│  Last name                                      │
│  [________________________]                    │
│                                                 │
│  Username                                       │
│  [admin____________________]                    │
│                                                 │
│  Email                                          │
│  [admin@openslides.demo_____]                   │
│                                                 │
│  Structure level                                │
│  [Test structure level______]                   │
│                                                 │
│  Participant number                             │
│  [12345-67890______________]                    │
│                                                 │
│  Groups                                         │
│  ☑ Admin                                       │
│  ☐ Delegates                                   │
│  ☐ Staff                                       │
│  ☐ Observers                                   │
│                                                 │
│  Meeting Settings                               │
│  Vote weight: [1.0____]                        │
│  ☑ Is present in meeting                       │
│  ☑ Is physical person                          │
│                                                 │
│  Additional Information                         │
│  Gender: [Not specified ▼]                     │
│  Comment: [Administrative user account]         │
│                                                 │
│  Account Status                                 │
│  ☑ Account is active                           │
│  ☐ Password must be changed at next login      │
│  ☐ Send password reset email                   │
│                                                 │
│  [Cancel]                           [Save]      │
└─────────────────────────────────────────────────┘
```

## Bulk Operations

### Bulk Import Interface
```
┌─────────────────────────────────────────────────┐
│  Import participants                    [x]     │
├─────────────────────────────────────────────────┤
│  Upload Method                                  │
│  ● Upload CSV file                              │
│  ○ Copy/paste data                              │
│  ○ Connect to external system                   │
│                                                 │
│  File Upload                                    │
│  [Choose CSV file...] participants.csv (2.3KB) │
│                                                 │
│  Column Mapping                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ CSV Column      → OpenSlides Field          ││
│  │ First Name      → first_name                ││
│  │ Last Name       → last_name                 ││
│  │ Email           → email                     ││
│  │ Department      → structure_level           ││
│  │ Role            → groups                    ││
│  │ Employee ID     → number                    ││
│  │ Notes           → comment                   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Import Options                                 │
│  ☑ Create usernames from email addresses       │
│  ☑ Generate random passwords                   │
│  ☑ Send welcome emails with login info         │
│  ☐ Mark all as present                         │
│  ☐ Skip participants with existing usernames   │
│                                                 │
│  Default Group Assignment                       │
│  [Delegates ▼]                                  │
│                                                 │
│  Preview (First 5 rows)                        │
│  [Table showing parsed CSV data]               │
│                                                 │
│  [Cancel]                        [Import (47)]  │
└─────────────────────────────────────────────────┘
```

### Bulk Actions Menu
```
┌─────────────────────────────────────────────────┐
│  Bulk actions (5 selected)             [x]     │
├─────────────────────────────────────────────────┤
│  Group Operations                               │
│  [Assign to group ▼]                            │
│  [Remove from group ▼]                          │
│                                                 │
│  Presence Management                            │
│  [Mark as present]    [Mark as absent]          │
│                                                 │
│  Communication                                  │
│  [Send email...]      [Generate credentials]    │
│                                                 │
│  Account Management                             │
│  [Activate accounts]  [Deactivate accounts]     │
│  [Reset passwords]    [Force password change]   │
│                                                 │
│  Data Operations                                │
│  [Export selected]    [Duplicate participants]  │
│                                                 │
│  Advanced                                       │
│  [Delete participants] [Merge participants]     │
│                                                 │
│  [Cancel]                                       │
└─────────────────────────────────────────────────┘
```

## Presence Management

### Presence Overview Dashboard
```
┌─────────────────────────────────────────────────┐
│  Presence Overview                              │
├─────────────────────────────────────────────────┤
│  Meeting Statistics                             │
│  Total Participants: 48                        │
│  Present: 32 (67%)    Absent: 16 (33%)         │
│  Delegates Present: 24/30 (80%)                │
│  Quorum Status: ✅ Met (Required: 25)          │
│                                                 │
│  Real-time Presence                             │
│  ┌─────────────────────────────────────────────┐│
│  │ 📊 Live Attendance Chart                   ││
│  │                                             ││
│  │ Present ████████████████████▒▒              ││
│  │ Absent  ▒▒▒▒▒▒▒▒                           ││
│  │                                             ││
│  │ Recent Changes:                             ││
│  │ • John Doe joined (16:42)                  ││
│  │ • Mary Smith left (16:40)                  ││
│  │ • Alex Brown joined (16:38)                ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Group Breakdown                                │
│  Admin:      3/3  (100%) ●●●                   │
│  Delegates: 24/30 (80%)  ●●●●●●●●○○              │
│  Staff:      2/3  (67%)  ●●○                    │
│  Observers:  3/12 (25%)  ●○○○                   │
│                                                 │
│  Quick Actions                                  │
│  [Mark All Present] [Send Reminder Email]       │
│  [Export Attendance] [Generate Report]          │
└─────────────────────────────────────────────────┘
```

### Check-in/Check-out System
```
┌─────────────────────────────────────────────────┐
│  Participant Check-in                   [x]     │
├─────────────────────────────────────────────────┤
│  Welcome to the meeting!                        │
│                                                 │
│  Participant: John Doe                          │
│  Email: john.doe@example.com                    │
│  Group: Delegates                               │
│                                                 │
│  Check-in Time: 24.07.2024 16:45:32            │
│                                                 │
│  Meeting Information                            │
│  Meeting: Annual General Assembly               │
│  Location: Conference Room A                    │
│  Expected Duration: 3 hours                     │
│                                                 │
│  Additional Information                         │
│  ☐ I need hearing assistance                    │
│  ☐ I have dietary restrictions for catering     │
│  ☐ I need accessibility accommodations          │
│                                                 │
│  Contact Information (optional update)          │
│  Mobile: [+1-555-0123_____________]             │
│  Emergency Contact: [Jane Doe - Wife___]        │
│                                                 │
│  [Check In] [Not Attending Today]               │
└─────────────────────────────────────────────────┘
```

## Permission Management

### Advanced Permission Editor
```
┌─────────────────────────────────────────────────┐
│  Advanced permissions: Board Members    [x]     │
├─────────────────────────────────────────────────┤
│  Permission Categories                          │
│                                                 │
│  📋 Meeting Management                          │
│  ☑ meeting.can_see_frontpage                   │
│  ☑ meeting.can_see_history                     │
│  ☑ meeting.can_manage_metadata                 │
│  ☐ meeting.can_manage_logos_and_fonts          │
│                                                 │
│  📅 Agenda Management                           │
│  ☑ agenda_item.can_see                         │
│  ☑ agenda_item.can_manage                      │
│  ☑ agenda_item.can_see_internal                │
│  ☐ agenda_item.can_manage_moderator_notes      │
│                                                 │
│  📄 Motion Management                           │
│  ☑ motion.can_see                              │
│  ☑ motion.can_create                           │
│  ☑ motion.can_support                          │
│  ☑ motion.can_manage                           │
│  ☑ motion.can_see_amendments                   │
│  ☑ motion.can_create_amendments                │
│                                                 │
│  🗳️ Election Management                         │
│  ☑ assignment.can_see                          │
│  ☑ assignment.can_nominate_other               │
│  ☑ assignment.can_nominate_self                │
│  ☑ assignment.can_manage                       │
│                                                 │
│  📊 Poll Management                             │
│  ☑ poll.can_see                                │
│  ☑ poll.can_manage                             │
│                                                 │
│  👥 Participant Management                      │
│  ☑ user.can_see                                │
│  ☑ user.can_manage                             │
│  ☐ user.can_change_password                    │
│                                                 │
│  💬 Chat Management                             │
│  ☑ chat.can_see                                │
│  ☐ chat.can_manage                             │
│                                                 │
│  📁 File Management                             │
│  ☑ mediafile.can_see                           │
│  ☑ mediafile.can_manage                        │
│                                                 │
│  📺 Projector Management                        │
│  ☑ projector.can_see                           │
│  ☐ projector.can_manage                        │
│                                                 │
│  [Reset to Default] [Copy from Group...]        │
│  [Cancel]                           [Save]      │
└─────────────────────────────────────────────────┘
```

## Data Models

### Participant Model
```typescript
{
  id: number;
  username: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_physical_person: boolean;
  default_password?: string;
  can_change_own_password: boolean;
  gender?: string;
  email?: string;
  last_email_send?: number;
  comment?: string;
  number?: string;
  structure_level?: string;
  about_me?: string;
  vote_weight: number;
  is_present_in_meeting_ids: number[];
  group_ids: number[];
  speaker_ids: number[];
  personal_note_ids: number[];
  supported_motion_ids: number[];
  submitted_motion_ids: number[];
  poll_voted_ids: number[];
  option_ids: number[];
  vote_ids: number[];
  delegated_vote_ids: number[];
  assignment_candidate_ids: number[];
  projection_ids: number[];
  meeting_user_ids: number[];
}
```

### Group Model
```typescript
{
  id: number;
  name: string;
  permissions: string[];
  user_ids: number[];
  default_group_for_meeting_id?: number;
  admin_group_for_meeting_id?: number;
  moderator_group_for_meeting_id?: number;
  meeting_id: number;
  weight: number;
  external_id?: string;
}
```

### Presence Tracking Model
```typescript
{
  participant_id: number;
  meeting_id: number;
  is_present: boolean;
  presence_start?: number;
  presence_end?: number;
  total_presence_time: number;
  check_in_time?: number;
  check_out_time?: number;
  last_activity: number;
}
```

## E2E Test Selectors

### Participant List
- Participant list: `.participant-list`
- Participant card: `.participant-card`
- Participant name: `.participant-name`
- Participant groups: `.participant-groups`
- Presence checkbox: `.presence-checkbox`
- Participant actions: `.participant-actions`

### Group Management
- Group list: `.group-list`
- Group card: `.group-card`
- Group name: `.group-name`
- Group permissions: `.group-permissions`
- Create group: `button[matTooltip="Create group"]`
- Edit group: `button[matTooltip="Edit group"]`

### Presence Management
- Presence dashboard: `.presence-dashboard`
- Presence stats: `.presence-statistics`
- Check-in button: `.check-in-button`
- Presence indicator: `.presence-indicator`
- Quorum status: `.quorum-status`

## Keyboard Shortcuts
- `Ctrl+N`: Create new participant
- `Ctrl+I`: Import participants
- `Ctrl+G`: Manage groups
- `Ctrl+P`: Toggle presence
- `Ctrl+F`: Focus search
- `Ctrl+A`: Select all participants
- `Escape`: Clear selection

## Accessibility Features
- **Screen Reader Support**: Full ARIA labeling for participant information
- **Keyboard Navigation**: Complete keyboard control
- **High Contrast**: Compatible with accessibility themes
- **Focus Management**: Clear focus indicators
- **Presence Announcements**: Audio cues for presence changes
- **Large Text Support**: Scalable interface elements