# OpenSlides Organization-Level Settings and Configuration Documentation

## Overview
The Organization-Level Settings system provides comprehensive administrative control over the entire OpenSlides organization, including user management, committee structures, meeting coordination, branding, and system-wide configurations that affect all meetings and users within the organization.

## URL Routes
- Organization dashboard: `/dashboard`
- Accounts management: `/accounts`
- Meetings overview: `/meetings`
- Committees management: `/committees`
- Tags management: `/tags`
- Design and branding: `/design`
- Organization settings: `/settings`

## Organization Navigation Structure

### Main Organization Menu
```
┌─────────────────────────────────────────────────┐
│  OpenSlides - Test Organization                 │
├─────────────────────────────────────────────────┤
│  📊 Dashboard                                   │
│  📅 Meetings                                    │
│  🏛️ Committees                                  │
│  👥 Accounts                                    │
│  🏷️ Tags                                        │
│  📎 Files                                       │
│  🎨 Design                                      │
│  ⚙️ Settings                                    │
└─────────────────────────────────────────────────┘
```

## Organization Dashboard

### Dashboard Overview Interface
```
┌─────────────────────────────────────────────────┐
│  Organization Dashboard                         │
├─────────────────────────────────────────────────┤
│  Organization Summary                           │
│  Name: Test Organization                        │
│  Total Users: 15                                │
│  Active Meetings: 2                             │
│  Committees: 3                                  │
│  Created: 15.01.2024                            │
│                                                 │
│  Recent Activity                                │
│  ┌─────────────────────────────────────────────┐│
│  │ • John Doe joined meeting "Budget 2024"    ││
│  │   2 hours ago                               ││
│  │ • New motion submitted in "Board Meeting"   ││
│  │   4 hours ago                               ││
│  │ • Committee "Finance" created               ││
│  │   1 day ago                                 ││
│  │ • User "Mary Smith" added to organization   ││
│  │   2 days ago                                ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Quick Actions                                  │
│  [Create Meeting] [Add User] [Create Committee] │
│                                                 │
│  System Status                                  │
│  🟢 All services operational                   │
│  📊 Database: Healthy                          │
│  🔄 Last backup: 1 hour ago                    │
└─────────────────────────────────────────────────┘
```

## Organization Calendar System

### Calendar Overview
```
┌─────────────────────────────────────────────────┐
│  Organization Calendar                          │
├─────────────────────────────────────────────────┤
│  Meeting Schedule Overview                      │
│                                                 │
│  📅 Today                                       │
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
│  📋 Dateless                                    │
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Demo                      [⋮]   ││
│  │ Default committee • Org Tag 1               ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Calendar Actions                               │
│  [Schedule Meeting] [Import Calendar] [Export]  │
└─────────────────────────────────────────────────┘
```

## Meetings Management

### Organization Meetings Overview
```
┌─────────────────────────────────────────────────┐
│  Meetings                           [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  1 of 1    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  Meeting List                                   │
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Demo                             ││
│  │ 🏛️ Default committee                       ││
│  │ 🏷️ Org Tag 1                               ││
│  │ 👥 3 participants    📁 4 files            ││
│  │ Status: Active       Created: 20.07.2024   ││
│  │                              [Enter] [⋮]   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Meeting Statistics                             │
│  Total Meetings: 1                             │
│  Active: 1        Scheduled: 0                 │
│  Completed: 0     Archived: 0                 │
│                                                 │
│  Bulk Operations                                │
│  [Archive Selected] [Export Data] [Clone]       │
└─────────────────────────────────────────────────┘
```

### Create Meeting Dialog
```
┌─────────────────────────────────────────────────┐
│  Create meeting                         [x]     │
├─────────────────────────────────────────────────┤
│  Meeting Details                                │
│                                                 │
│  Meeting name *                                 │
│  [Annual General Assembly 2024___________]      │
│                                                 │
│  Description                                    │
│  [Annual meeting to discuss organization        │
│   budget, policies, and elect board members]   │
│                                                 │
│  Committee Assignment                           │
│  Committee: [Default committee ▼]               │
│  ☑ Inherit committee settings                  │
│                                                 │
│  Meeting Schedule                               │
│  Start date: [2024-08-15]                      │
│  Start time: [14:00]                           │
│  End date:   [2024-08-15]                      │
│  End time:   [17:00]                           │
│                                                 │
│  Location and Access                            │
│  Physical location: [Conference Room A]         │
│  Online access URL: [https://meeting.org/link] │
│  Meeting type: ● Hybrid ○ Physical ○ Online   │
│                                                 │
│  Participant Settings                           │
│  Auto-register committee members: ☑            │
│  Allow guest participants: ☑                  │
│  Require registration approval: ☐              │
│                                                 │
│  Meeting Configuration                          │
│  Default language: [English ▼]                 │
│  Timezone: [UTC+1 Central European Time ▼]     │
│  Template: [Standard Board Meeting ▼]          │
│                                                 │
│  Tags and Organization                          │
│  Tags: [Add tags...] Org Tag 1                 │
│  External ID: [AGM-2024] (optional)            │
│                                                 │
│  [Cancel]                      [Create Meeting]│
└─────────────────────────────────────────────────┘
```

## Committee Management System

### Committees Overview
```
┌─────────────────────────────────────────────────┐
│  Committees                         [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  1 of 1    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  Committee List                                 │
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
│  Total Committees: 1                           │
│  Active: 1        Archived: 0                 │
│  Average Members: 3                            │
│                                                 │
│  Committee Templates                            │
│  [Board Committee] [Finance Committee]          │
│  [Audit Committee] [Custom Template]           │
└─────────────────────────────────────────────────┘
```

### Create Committee Dialog
```
┌─────────────────────────────────────────────────┐
│  Create committee                       [x]     │
├─────────────────────────────────────────────────┤
│  Committee Information                          │
│                                                 │
│  Committee name *                               │
│  [Finance Committee__________________]          │
│                                                 │
│  Description                                    │
│  [Responsible for financial oversight,          │
│   budget planning, and audit coordination]     │
│                                                 │
│  Committee Structure                            │
│  Committee type:                                │
│  ● Standing committee                           │
│  ○ Ad-hoc committee                             │
│  ○ Subcommittee                                │
│                                                 │
│  Parent committee: [None ▼]                    │
│  (only for subcommittees)                      │
│                                                 │
│  Membership Settings                            │
│  Maximum members: [12] (0 = unlimited)         │
│  Minimum required: [3]                         │
│  Term duration: [2] years                      │
│                                                 │
│  Committee Permissions                          │
│  ☑ Can create meetings                         │
│  ☑ Can manage own members                      │
│  ☑ Can create sub-committees                   │
│  ☐ Can access all organization meetings        │
│                                                 │
│  Meeting Defaults                               │
│  Default meeting duration: [2] hours           │
│  Default meeting location: [Room B]            │
│  Auto-create agenda template: ☑                │
│                                                 │
│  Tags and Categorization                        │
│  Tags: [Add tags...] Finance, Budget           │
│  Committee code: [FIN] (for reports)           │
│                                                 │
│  [Cancel]                    [Create Committee]│
└─────────────────────────────────────────────────┘
```

## User Account Management

### Organization Accounts Overview
```
┌─────────────────────────────────────────────────┐
│  Accounts                           [+] [📤] [⋮]│
├─────────────────────────────────────────────────┤
│  3 of 3    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  User Account List                              │
│  ┌─────────────────────────────────────────────┐│
│  │ a                                     [⋮]   ││
│  │ a                                           ││
│  │ 📅 1 meeting(s)                             ││
│  │ Last login: Never                           ││
│  │ Status: Active                              ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ b                                     [⋮]   ││
│  │ b                                           ││
│  │ 📅 1 meeting(s)                             ││
│  │ Last login: Never                           ││
│  │ Status: Active                              ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ Administrator                         [⋮]   ││
│  │ admin                                       ││
│  │ 👑 Superadmin                               ││
│  │ 📅 1 meeting(s)                             ││
│  │ Last login: 24.07.2024 14:20               ││
│  │ Status: Active                              ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Account Statistics                             │
│  Total Users: 3                                │
│  Active: 3        Inactive: 0                  │
│  Superadmins: 1   Regular Users: 2             │
│  Never logged in: 2                            │
└─────────────────────────────────────────────────┘
```

### Create Organization User Dialog
```
┌─────────────────────────────────────────────────┐
│  Create organization user               [x]     │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│                                                 │
│  Title                                          │
│  [Mr./Ms./Dr.____]                              │
│                                                 │
│  First name *                                   │
│  [John_________________________]               │
│                                                 │
│  Last name *                                    │
│  [Smith________________________]               │
│                                                 │
│  Username *                                     │
│  [john.smith___________________]                │
│                                                 │
│  Email address                                  │
│  [john.smith@organization.org__]                │
│                                                 │
│  Organization Role                              │
│  Role level:                                    │
│  ● Organization user                            │
│  ○ Organization administrator                   │
│  ○ Superadmin (full system access)             │
│                                                 │
│  Committee Assignments                          │
│  ☑ Finance Committee (Member)                  │
│  ☐ Board Committee (Observer)                  │
│  ☐ Audit Committee (Chair)                     │
│                                                 │
│  Account Settings                               │
│  ☑ Account is active                           │
│  ☑ Can change own password                     │
│  ☑ Send welcome email with login credentials   │
│  ☐ Force password change on first login        │
│                                                 │
│  Default Settings                               │
│  Default language: [English ▼]                 │
│  Timezone: [User's local timezone ▼]           │
│                                                 │
│  Additional Information                         │
│  Phone: [+1-555-0123__________]                 │
│  Department: [Finance Department]               │
│  Notes: [Internal notes about user]            │
│                                                 │
│  [Cancel]                        [Create User] │
└─────────────────────────────────────────────────┘
```

## Organization Tags System

### Tags Management Interface
```
┌─────────────────────────────────────────────────┐
│  Tags                               [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  1 of 1                         [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  Organization Tags                              │
│  ┌─────────────────────────────────────────────┐│
│  │ 🏷️ Org Tag 1                         [✏️][🗑️]││
│  │    Used in: 2 meetings, 1 committee        ││
│  │    Color: Blue                              ││
│  │    Created: 15.01.2024                     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Tag Categories                                 │
│  Priority Tags:                                 │
│  • 🔴 High Priority                            │
│  • 🟡 Medium Priority                          │
│  • 🟢 Low Priority                             │
│                                                 │
│  Type Tags:                                     │
│  • 📋 Committee Meeting                        │
│  • 🏛️ Board Meeting                            │
│  • 👥 General Assembly                         │
│                                                 │
│  Status Tags:                                   │
│  • ✅ Completed                                │
│  • ⏳ In Progress                              │
│  • 📅 Scheduled                                │
│                                                 │
│  Tag Usage Statistics                           │
│  Most used: Org Tag 1 (3 items)               │
│  Least used: Priority tags (0 items)          │
│  Unused tags: 5                               │
└─────────────────────────────────────────────────┘
```

### Create Tag Dialog
```
┌─────────────────────────────────────────────────┐
│  Create tag                             [x]     │
├─────────────────────────────────────────────────┤
│  Tag Information                                │
│                                                 │
│  Tag name *                                     │
│  [Budget Related__________________]             │
│                                                 │
│  Color selection                                │
│  🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪                          │
│  Selected: 🟢 Green                             │
│                                                 │
│  Tag category                                   │
│  [Select category ▼]                           │
│  ● General                                     │
│  ○ Priority                                    │
│  ○ Type                                        │
│  ○ Status                                      │
│  ○ Department                                  │
│                                                 │
│  Usage scope                                    │
│  ☑ Available for meetings                      │
│  ☑ Available for committees                    │
│  ☑ Available for motions                       │
│  ☑ Available for agenda items                  │
│  ☐ Available for users                         │
│                                                 │
│  Tag description                                │
│  [Optional description for tag usage]          │
│                                                 │
│  Access control                                 │
│  Who can use this tag:                         │
│  ● All organization users                      │
│  ○ Administrators only                         │
│  ○ Specific committees                         │
│                                                 │
│  [Cancel]                         [Create Tag] │
└─────────────────────────────────────────────────┘
```

## Design and Branding System

### Organization Design Management
```
┌─────────────────────────────────────────────────┐
│  Design                             [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  3 of 3                         [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  Design Themes                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Blue                       ☑️    ││
│  │ █████████████████████████████████████       ││
│  │ Primary   Secondary   Accent   Background   ││
│  │ Active theme for organization               ││
│  │                                      [⋮]   ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Red                        ☐     ││
│  │ █████████████████████████████████████       ││
│  │ Primary   Secondary   Accent   Background   ││
│  │ Alternative color scheme                    ││
│  │                                      [⋮]   ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Green                      ☐     ││
│  │ █████████████████████████████████████       ││
│  │ Primary   Secondary   Accent   Background   ││
│  │ Nature-inspired theme                       ││
│  │                                      [⋮]   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Branding Elements                              │
│  Organization Logo: [Upload logo...]           │
│  Current: openslides-logo.svg                  │
│  Favicon: [Upload favicon...]                  │
│  Background Image: [Upload image...]           │
│                                                 │
│  Typography Settings                            │
│  Header Font: [Roboto ▼]                       │
│  Body Font: [Open Sans ▼]                      │
│  Size Scale: [Medium ▼]                        │
│                                                 │
│  Custom CSS                                     │
│  [Advanced styling options...]                 │
└─────────────────────────────────────────────────┘
```

### Create Custom Design Theme
```
┌─────────────────────────────────────────────────┐
│  Create design theme                    [x]     │
├─────────────────────────────────────────────────┤
│  Theme Information                              │
│                                                 │
│  Theme name *                                   │
│  [Corporate Blue__________________]             │
│                                                 │
│  Based on existing theme                        │
│  [OpenSlides Blue ▼]                           │
│                                                 │
│  Color Palette                                  │
│  Primary color:   [#1976d2] █████               │
│  Secondary color: [#424242] █████               │
│  Accent color:    [#ff5722] █████               │
│  Background:      [#fafafa] █████               │
│  Text color:      [#212121] █████               │
│  Link color:      [#1976d2] █████               │
│                                                 │
│  Logo and Branding                              │
│  Logo file: [Upload logo...] corp-logo.png     │
│  Logo position: [Top left ▼]                   │
│  Show organization name: ☑                     │
│                                                 │
│  Typography                                     │
│  Header font: [Montserrat ▼]                   │
│  Body font: [Source Sans Pro ▼]                │
│  Font weights: ☑ Light ☑ Regular ☑ Bold       │
│                                                 │
│  Layout Options                                 │
│  Header style: [Fixed ▼]                       │
│  Sidebar style: [Collapsible ▼]                │
│  Content width: [Full width ▼]                 │
│                                                 │
│  Preview                                        │
│  [Live preview of theme will appear here]      │
│                                                 │
│  [Cancel]                    [Create Theme]     │
└─────────────────────────────────────────────────┘
```

## Organization-Level Settings

### System Configuration Interface
```
┌─────────────────────────────────────────────────┐
│  Organization Settings                          │
├─────────────────────────────────────────────────┤
│  Organization Information                       │
│  Name: [Test Organization_____________]         │
│  Legal name: [Test Organization Ltd.]          │
│  Website: [https://testorg.com]                │
│  Contact email: [admin@testorg.com]            │
│                                                 │
│  Default Settings                               │
│  Default language: [English ▼]                 │
│  Default timezone: [UTC+1 CET ▼]                │
│  Date format: [DD.MM.YYYY ▼]                   │
│  Time format: [24 hour ▼]                      │
│                                                 │
│  User Account Defaults                          │
│  Auto-activate new users: ☑                    │
│  Require email verification: ☑                 │
│  Password complexity: [Strong ▼]               │
│  Session timeout: [8] hours                    │
│                                                 │
│  Meeting Defaults                               │
│  Default meeting duration: [2] hours           │
│  Auto-create agenda: ☑                         │
│  Allow guest participants: ☐                   │
│  Default projection mode: [Presenter view ▼]   │
│                                                 │
│  System Limits                                  │
│  Maximum users: [100] (0 = unlimited)          │
│  Maximum meetings per committee: [50]          │
│  File upload limit: [10] MB                    │
│  Meeting recording storage: [30] days          │
│                                                 │
│  Data Retention                                 │
│  Archive meetings after: [1] year              │
│  Delete archived data after: [5] years         │
│  Backup frequency: [Daily ▼]                   │
│  Export format: [JSON ▼]                       │
│                                                 │
│  Integration Settings                           │
│  LDAP authentication: ☐                        │
│  Single Sign-On (SSO): ☐                       │
│  Email service: [SMTP ▼]                       │
│  Calendar integration: ☐                       │
│                                                 │
│  [Save Changes] [Reset to Defaults]             │
└─────────────────────────────────────────────────┘
```

## Advanced Organization Features

### Multi-Committee Coordination
```
┌─────────────────────────────────────────────────┐
│  Inter-Committee Coordination                   │
├─────────────────────────────────────────────────┤
│  Committee Relationships                        │
│                                                 │
│  Board Committee (Parent)                       │
│  ├── Finance Committee                          │
│  │   ├── Budget Subcommittee                   │
│  │   └── Audit Subcommittee                    │
│  ├── Operations Committee                       │
│  │   ├── HR Subcommittee                       │
│  │   └── IT Subcommittee                       │
│  └── Governance Committee                       │
│      ├── Policy Subcommittee                   │
│      └── Ethics Subcommittee                   │
│                                                 │
│  Shared Resources                               │
│  • Common document library                     │
│  • Shared member pool                          │
│  • Cross-committee meeting scheduling          │
│  • Integrated reporting                        │
│                                                 │
│  Coordination Rules                             │
│  ☑ Parent committee can override decisions     │
│  ☑ Subcommittees report to parent             │
│  ☑ Shared members across committees            │
│  ☐ Automatic meeting conflict detection        │
│                                                 │
│  Committee Communication                        │
│  • Inter-committee messages                    │
│  • Shared announcement system                  │
│  • Cross-committee voting on joint issues      │
│  • Committee liaison assignments               │
└─────────────────────────────────────────────────┘
```

### Organization Analytics Dashboard
```
┌─────────────────────────────────────────────────┐
│  Organization Analytics                         │
├─────────────────────────────────────────────────┤
│  Activity Overview (Last 30 Days)              │
│                                                 │
│  📊 Meeting Activity                            │
│  Total meetings: 15                            │
│  Average duration: 2.3 hours                   │
│  Attendance rate: 87%                          │
│  Most active committee: Finance (6 meetings)   │
│                                                 │
│  👥 User Engagement                             │
│  Active users: 42/50 (84%)                     │
│  New registrations: 3                          │
│  Average login frequency: 2.1 per week         │
│  Most engaged users: Top 5 by participation    │
│                                                 │
│  📋 Content Statistics                          │
│  Motions submitted: 23                         │
│  Motions approved: 18                          │
│  Elections held: 4                             │
│  Files uploaded: 45 (156 MB)                   │
│                                                 │
│  🗳️ Voting Patterns                            │
│  Total votes cast: 342                         │
│  Average participation: 78%                    │
│  Most contested motion: Budget Amendment       │
│  Consensus rate: 65%                           │
│                                                 │
│  System Performance                             │
│  Average response time: 245ms                  │
│  Uptime: 99.7%                                 │
│  Storage used: 2.1 GB / 10 GB                  │
│  Bandwidth usage: 450 MB/day                   │
│                                                 │
│  [Export Report] [Schedule Email] [Details]     │
└─────────────────────────────────────────────────┘
```

## Data Models

### Organization Model
```typescript
{
  id: number;
  name: string;
  description?: string;
  legal_name?: string;
  url?: string;
  login_text?: string;
  theme_id?: number;
  default_language: string;
  superadmin_ids: number[];
  user_ids: number[];
  committee_ids: number[];
  active_meeting_ids: number[];
  limit_of_meetings: number;
  limit_of_users: number;
  enable_electronic_voting: boolean;
  reset_password_verbose_errors: boolean;
  enable_chat: boolean;
  created: number;
  last_modified: number;
}
```

### Committee Model
```typescript
{
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  user_ids: number[];
  manager_ids: number[];
  forward_to_committee_ids: number[];
  receive_forwardings_from_committee_ids: number[];
  meeting_ids: number[];
  default_meeting_id?: number;
  organization_tag_ids: number[];
  external_id?: string;
  created: number;
  last_modified: number;
}
```

### Organization Tag Model
```typescript
{
  id: number;
  name: string;
  color: string;
  organization_id: number;
  tagged_ids: string[];
  created: number;
  last_modified: number;
}
```

## E2E Test Selectors

### Organization Navigation
- Organization menu: `.organization-menu`
- Dashboard link: `[data-cy="dashboard"]`
- Meetings link: `[data-cy="meetings"]`
- Committees link: `[data-cy="committees"]`
- Accounts link: `[data-cy="accounts"]`

### Committee Management
- Committee list: `.committee-list` 
- Committee card: `.committee-card`
- Create committee: `button[matTooltip="Create committee"]`
- Committee name: `.committee-name`
- Committee members: `.committee-members`

### User Management
- User list: `.user-list`
- User card: `.user-card`
- Create user: `button[matTooltip="Create user"]`
- User role: `.user-role`
- User status: `.user-status`

## Keyboard Shortcuts
- `Ctrl+N`: Create new item (context-dependent)
- `Ctrl+H`: Return to dashboard
- `Ctrl+M`: Open meetings overview
- `Ctrl+U`: Open accounts/users
- `Ctrl+C`: Open committees
- `Ctrl+T`: Open tags management
- `Alt+S`: Open organization settings

## Accessibility Features
- **Screen Reader Support**: Full organization structure navigation
- **Keyboard Navigation**: Complete keyboard control across all sections
- **High Contrast**: Committee and user status indicators
- **Focus Management**: Clear focus in management interfaces
- **Large Text Support**: Scalable organization interface
- **Language Support**: Multi-language organization interface