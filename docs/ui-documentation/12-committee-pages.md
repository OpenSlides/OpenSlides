# OpenSlides Committee Pages Documentation

## Overview
The Committee module manages organizational committees at the organization level, providing structure for grouping meetings, managing committee memberships, and organizing governance structures.

## URL Routes
- Committee list: `/committees`
- Committee detail: `/committees/:id`
- Committee edit: `/committees/:id/edit`

## Committee List Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Committees               [+ New] [⋮ Menu]      │
├─────────────────────────────────────────────────┤
│  [🔍 Search] [SORT] [FILTER]                   │
├─────────────────────────────────────────────────┤
│  1 of 1                                         │
├─────────────────────────────────────────────────┤
│  Default committee                              │
│  Add description here                           │
│  🏷️ Orga Tag 1                                  │
│                                                 │
│  📅 1 meeting    👥 3 members                   │
│                                                 │
│                                        [⋮ Menu]│
└─────────────────────────────────────────────────┘
```

### Committee Card Display
Each committee shows:
- **Committee Name**: Primary identifier
- **Description**: Brief description or "Add description here" placeholder
- **Tags**: Organizational tags (🏷️)
- **Statistics**:
  - Meeting count (📅)
  - Member count (👥)
- **Actions Menu**: Individual committee actions

### Header Actions

#### New Committee Button (+)
Opens committee creation form

#### Menu Actions (⋮)
- **Import committees**: Bulk import from CSV
- **Export committees**: Download committee data
- **Manage tags**: Organizational tag management

### List Controls
- **Search**: Filter committees by name or description
- **Sort**: Order by name, creation date, or member count
- **Filter**: Filter by tags, meeting count, member count

## Committee Detail Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Default committee     [✏️ Edit] [⋮ Menu]       │
├─────────────────────────────────────────────────┤
│  General Information                            │
│  ┌─────────────────────────────────────────────┐│
│  │ Description: Add description here           ││
│  │ Tags: Orga Tag 1                            ││
│  │ External ID: (empty)                        ││
│  │ Forward to meetings: (none)                 ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Members (3)                    [+ Add member]  │
│  ┌─────────────────────────────────────────────┐│
│  │ Administrator                        [🗑️]   ││
│  │ a                                    [🗑️]   ││
│  │ b                                    [🗑️]   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Meetings (1)                  [+ Create meeting]│
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Demo                             ││
│  │ → Enter meeting                             ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### General Information Section
- **Description**: Committee purpose and details
- **Tags**: Associated organizational tags
- **External ID**: Integration identifier
- **Forward to meetings**: Meeting forwarding configuration

### Members Section
- **Member List**: All committee members
- **Add Member**: Search and add organization users
- **Remove Member**: Delete button for each member
- **Member Roles**: (If implemented) role assignments

### Meetings Section
- **Associated Meetings**: Meetings under this committee
- **Create Meeting**: New meeting creation
- **Enter Meeting**: Direct navigation to meeting
- **Meeting Management**: Edit meeting details

## Committee Creation/Edit Form

### Create Committee Dialog
```
┌─────────────────────────────────────────────────┐
│  Create new committee                   [x]     │
├─────────────────────────────────────────────────┤
│  Committee name *                               │
│  [Finance Committee___________]                 │
│                                                 │
│  Description                                    │
│  [Handles all financial matters...]            │
│                                                 │
│  External ID                                    │
│  [FIN-COMM-2024_______________]                 │
│                                                 │
│  Tags                                           │
│  [Select tags... ▼]                             │
│                                                 │
│  Initial members                                │
│  [Add members... ▼]                             │
│                                                 │
│  Meeting forwarding                             │
│  [Select meetings to forward to... ▼]          │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Edit Committee Form
```
┌─────────────────────────────────────────────────┐
│  Edit committee                 [💾 Save] [❌]  │
├─────────────────────────────────────────────────┤
│  Committee name *                               │
│  [Default committee___________]                 │
│                                                 │
│  Description                                    │
│  [Add description here________]                 │
│                                                 │
│  External ID                                    │
│  [____________________________]                 │
│                                                 │
│  Tags                          [+ Add tag]      │
│  [x] Orga Tag 1               [ ] Orga Tag 2    │
│                                                 │
│  Forward to meetings                            │
│  [ ] OpenSlides Demo                            │
│  [ ] Other Meeting                              │
│                                                 │
│  [Delete Committee]                             │
└─────────────────────────────────────────────────┘
```

## Member Management

### Add Members Dialog
```
┌─────────────────────────────────────────────────┐
│  Add committee members                  [x]     │
├─────────────────────────────────────────────────┤
│  Search users:                                  │
│  [Type to search users________]                 │
│                                                 │
│  Available users:                               │
│  ┌─────────────────────────────────────────────┐│
│  │ ☐ John Doe (john.doe@example.com)          ││
│  │ ☐ Jane Smith (jane.smith@example.com)      ││
│  │ ☐ Bob Johnson (bob.johnson@example.com)    ││
│  │ ☐ Alice Brown (alice.brown@example.com)    ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Selected: 0 users                              │
│                                                 │
│  [Cancel]                    [Add members]      │
└─────────────────────────────────────────────────┘
```

### Member Roles (Advanced)
If role management is enabled:
- **Chair**: Committee leadership
- **Vice Chair**: Deputy leadership
- **Secretary**: Administrative role
- **Member**: Regular member
- **Observer**: Limited participation

## Meeting Integration

### Create Meeting from Committee
```
┌─────────────────────────────────────────────────┐
│  Create meeting for Default committee   [x]     │
├─────────────────────────────────────────────────┤
│  Meeting name *                                 │
│  [Committee Meeting March 2024]                │
│                                                 │
│  Description                                    │
│  [Monthly committee meeting...]                 │
│                                                 │
│  Start time                                     │
│  [24.03.2024] [14:00]                          │
│                                                 │
│  End time                                       │
│  [24.03.2024] [16:00]                          │
│                                                 │
│  Location                                       │
│  [Conference Room A___________]                 │
│                                                 │
│  □ Copy committee members as participants       │
│  □ Create welcome message                       │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Meeting Forwarding
- **Forward motions**: Send motions to other meetings
- **Forward participants**: Copy member lists
- **Forward files**: Share committee documents
- **Forward agenda**: Template agenda items

## Committee Templates

### Template System
- **Committee Templates**: Predefined committee structures
- **Member Templates**: Standard member groups
- **Meeting Templates**: Default meeting configurations
- **Document Templates**: Standard committee documents

### Template Creation
```
┌─────────────────────────────────────────────────┐
│  Create committee template              [x]     │
├─────────────────────────────────────────────────┤
│  Template name *                                │
│  [Board Committee Template]                     │
│                                                 │
│  Default description                            │
│  [Governance and oversight committee...]        │
│                                                 │
│  Default member roles                           │
│  ☑ Chair                                       │
│  ☑ Vice Chair                                  │
│  ☑ Secretary                                   │
│  ☐ Treasurer                                   │
│                                                 │
│  Default meeting schedule                       │
│  Frequency: [Monthly ▼]                         │
│  Duration: [2 hours]                            │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

## Import/Export

### Committee Import
CSV format support:
```csv
name,description,external_id,tags,members
Finance Committee,Financial oversight,FIN-2024,"finance,oversight","john.doe,jane.smith"
HR Committee,Human resources,HR-2024,"hr,personnel","alice.brown,bob.johnson"
```

### Committee Export
- **CSV Format**: Spreadsheet compatible
- **JSON Format**: Technical integration
- **PDF Format**: Formatted reports

### Export Options
```
┌─────────────────────────────────────────────────┐
│  Export committees                      [x]     │
├─────────────────────────────────────────────────┤
│  Export format:                                 │
│  ● CSV (Excel compatible)                       │
│  ○ JSON (technical format)                      │
│  ○ PDF (formatted report)                       │
│                                                 │
│  Include:                                       │
│  ☑ Committee details                           │
│  ☑ Member information                          │
│  ☑ Meeting associations                        │
│  ☑ Tag information                             │
│                                                 │
│  [Cancel]                      [Download]       │
└─────────────────────────────────────────────────┘
```

## Technical Details

### Data Models

**Committee Model**:
```typescript
{
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  user_ids: number[];
  meeting_ids: number[];
  default_meeting_id?: number;
  organization_tag_ids: number[];
  external_id?: string;
  forward_to_committee_ids: number[];
}
```

**Committee Membership**:
```typescript
{
  committee_id: number;
  user_id: number;
  role?: string;
  joined_date: string;
  active: boolean;
}
```

### Services
- `CommitteeControllerService`: CRUD operations
- `CommitteeRepositoryService`: Data access
- `CommitteeMemberService`: Membership management
- `CommitteeTemplateService`: Template handling

### Permissions
- `committee.can_see`: View committees
- `committee.can_manage`: Create/edit/delete committees
- `organization.can_manage_organization`: Full organization control

## E2E Test Selectors

### Committee List
- New button: `button[matTooltip="New committee"]`
- Committee cards: `.committee-card`
- Search input: `input[placeholder="Search"]`
- Committee name: `.committee-name`
- Committee description: `.committee-description`

### Committee Detail
- Edit button: `button[matTooltip="Edit"]`
- Member list: `.member-list`
- Add member: `button[matTooltip="Add member"]`
- Meeting list: `.meeting-list`
- Create meeting: `button[matTooltip="Create meeting"]`

### Forms
- Name input: `input[formControlName="name"]`
- Description textarea: `textarea[formControlName="description"]`
- External ID: `input[formControlName="external_id"]`
- Tag selector: `os-list-search-selector[formControlName="organization_tag_ids"]`
- Member selector: `os-search-selector`

### Member Management
- Member search: `input.member-search`
- Member checkbox: `mat-checkbox.member-select`
- Remove member: `button.remove-member`
- Role selector: `mat-select.member-role`

## Keyboard Shortcuts
- `Ctrl+N`: New committee
- `Ctrl+E`: Edit committee
- `Enter`: Confirm dialog actions
- `Escape`: Cancel/close dialogs
- `Tab`: Navigate form fields

## Accessibility Features

### Screen Reader Support
- ARIA labels for all interactive elements
- Semantic HTML structure
- Alternative text for icons
- Form field descriptions

### Keyboard Navigation
- Full keyboard accessibility
- Tab order management
- Focus indicators
- Keyboard shortcuts

### Visual Accessibility
- High contrast support
- Scalable text and icons
- Color-blind friendly design
- Clear visual hierarchy

## Integration Features

### External Systems
- **LDAP Integration**: Sync committee structure
- **Calendar Integration**: Committee meeting scheduling
- **Document Management**: Shared document systems
- **Email Integration**: Committee communications

### API Access
- **REST API**: Full CRUD operations
- **Webhook Support**: Change notifications
- **Bulk Operations**: Mass updates
- **Data Synchronization**: External system sync

## Workflow Features

### Committee Lifecycle
1. **Creation**: New committee setup
2. **Member Addition**: Building committee roster
3. **Meeting Association**: Linking meetings
4. **Active Period**: Regular committee work
5. **Archive/Dissolution**: Committee end-of-life

### Approval Workflows
- **Committee Creation**: Approval required
- **Membership Changes**: Review process
- **Meeting Authorization**: Committee approval
- **Document Approval**: Committee sign-off

## Reporting and Analytics

### Committee Reports
- **Membership Reports**: Current and historical membership
- **Activity Reports**: Meeting frequency and participation
- **Performance Metrics**: Committee effectiveness measures
- **Compliance Reports**: Governance compliance tracking

### Dashboard Integration
- **Committee Overview**: Key statistics
- **Recent Activity**: Latest committee actions
- **Upcoming Meetings**: Committee meeting schedule
- **Action Items**: Outstanding committee tasks