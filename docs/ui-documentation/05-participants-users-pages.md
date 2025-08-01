# OpenSlides Participants/Users Pages Documentation

## Overview
The Participants module manages users within a meeting context, including their roles, permissions, presence, and voting rights. It distinguishes between global user accounts and meeting-specific participant data.

## URL Routes
- Participant list: `/:meetingId/participants`
- Participant detail: `/:meetingId/participants/:id`
- Participant edit: `/:meetingId/participants/:id/edit`
- Groups management: `/:meetingId/participants/groups`
- Group edit: `/:meetingId/participants/groups/:id`
- Structure levels: `/:meetingId/participants/structure-levels`
- Presence: `/:meetingId/participants/presence`
- Import: `/:meetingId/participants/import`
- Password management: `/:meetingId/participants/password/:id`

## Participant List Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Participants (125)             [+ New] [⋮ Menu]│
├─────────────────────────────────────────────────┤
│  [Filter] [Sort] [Search_____________]          │
├─────────────────────────────────────────────────┤
│  □ | Name | Groups | Info | Present | Weight |⋮│
├─────────────────────────────────────────────────┤
│  □ John Doe      Admin    #42  ✓     1.0    [⋮]│
│  □ Jane Smith    Delegate #43  ✓     1.0    [⋮]│
│  □ Bob Johnson   Guest    #44  ✗     0.0    [⋮]│
│  └─ → Alice (delegated)                         │
└─────────────────────────────────────────────────┘
```

### List Columns
1. **Checkbox**: For multiselect operations
2. **Name**: Full name with structure level color
3. **Groups**: Assigned permission groups
4. **Info**: Participant number, icons for:
   - 🔒 = Locked out
   - 📧 = No email
   - 👤 = Not a natural person
   - ⚡ = External participant
5. **Present**: Attendance status (✓/✗)
6. **Vote Weight**: For weighted voting
7. **Menu**: Individual actions

### Header Actions

#### New Participant Button (+)
Opens participant creation form

#### Menu Actions (⋮)
- **Import**: Bulk import participants
- **Export**: Export to CSV/PDF
- **Send invitations**: Email credentials
- **Generate passwords**: Bulk password generation
- **Print credentials**: PDF with access data
- **Presence**: Quick presence management
- **Structure levels**: Manage hierarchy
- **Groups**: Permission groups

### Multiselect Actions
When participants are selected:
- **Set groups**: Bulk group assignment
- **Set present**: Mark as present/absent
- **Set structure level**: Assign hierarchy
- **Activate/Deactivate**: Enable/disable accounts
- **Send invitations**: Email selected
- **Generate passwords**: For selected
- **Delete**: Remove from meeting

### Filters
1. **Groups**: Filter by permission groups
2. **Structure levels**: By hierarchy
3. **Presence**: Present/absent
4. **Vote weight**: Has/no vote weight
5. **Delegation**: Has delegations
6. **Committee**: By home committee
7. **Active**: Active/inactive accounts

## Participant Detail/Edit Page

### View Mode
```
┌─────────────────────────────────────────────────┐
│  John Doe                      [✏️ Edit] [⋮]    │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│  ┌─────────────────────────────────────────────┐│
│  │ Username: jdoe                              ││
│  │ Email: john.doe@example.com                 ││
│  │ Pronoun: he/him                             ││
│  │ About me: Long-time member...               ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Meeting Information                            │
│  ┌─────────────────────────────────────────────┐│
│  │ Number: 42                                  ││
│  │ Groups: Admin, Delegate                     ││
│  │ Structure level: Board Members              ││
│  │ Vote weight: 1.0                            ││
│  │ Present: ✓ Yes                              ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Vote Delegation                                │
│  ┌─────────────────────────────────────────────┐│
│  │ Delegated to: ---                           ││
│  │ Received from: Alice Brown (#45)            ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Edit Mode Form
```
┌─────────────────────────────────────────────────┐
│  Edit participant              [💾 Save] [❌]   │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│                                                 │
│  Username *                                     │
│  [jdoe________________________]                 │
│                                                 │
│  Email                                          │
│  [john.doe@example.com________]                 │
│                                                 │
│  First name                                     │
│  [John________________________]                 │
│                                                 │
│  Last name                                      │
│  [Doe_________________________]                 │
│                                                 │
│  Pronoun                                        │
│  [he/him______________________]                 │
│                                                 │
│  About me                                       │
│  [Multiline text area_________]                 │
│                                                 │
│  Meeting Settings                               │
│                                                 │
│  Number                                         │
│  [42__________________________]                 │
│                                                 │
│  Groups                        [+ Add]          │
│  [x] Admin  [x] Delegate                        │
│                                                 │
│  Structure level                                │
│  [Board Members ▼]                              │
│                                                 │
│  Vote weight                                    │
│  [1.0_________________________]                 │
│                                                 │
│  □ Present                                      │
│  □ Locked out                                   │
│                                                 │
│  Vote Delegation                                │
│                                                 │
│  Delegate vote to                               │
│  [Select participant ▼]                         │
│                                                 │
│  Comment (internal)                             │
│  [Internal notes______________]                 │
└─────────────────────────────────────────────────┘
```

### Form Fields

#### Personal Information
- **Username**: Required, unique identifier
- **Email**: Email address for invitations
- **First/Last name**: Display name
- **Title**: Academic/professional title
- **Pronoun**: Personal pronoun
- **Gender**: For statistics
- **About me**: Bio/description

#### Meeting Settings
- **Number**: Unique participant number
- **Groups**: Permission groups (multi-select)
- **Structure level**: Organizational hierarchy
- **Vote weight**: For weighted voting
- **Home committee**: Default committee
- **Present**: Attendance status
- **Locked out**: Prevent access

#### Advanced Settings
- **Is active**: Account enabled
- **Is physical person**: Natural vs. organization
- **Is external**: External participant flag
- **Member number**: Organization member ID
- **SAML ID**: SSO identifier

## Groups Management

### Groups List
```
┌─────────────────────────────────────────────────┐
│  Groups                          [+ New Group]  │
├─────────────────────────────────────────────────┤
│  Admin (3 members)              [✏️] [Cannot delete]│
│  Default (120 members)          [✏️] [Cannot delete]│
│  Delegate (85 members)          [✏️] [🗑️]      │
│  Guest (15 members)             [✏️] [🗑️]      │
│  Staff (8 members)              [✏️] [🗑️]      │
└─────────────────────────────────────────────────┘
```

### Group Edit Page
```
┌─────────────────────────────────────────────────┐
│  Edit group: Delegate          [💾 Save] [❌]   │
├─────────────────────────────────────────────────┤
│  Name *                                         │
│  [Delegate____________________]                 │
│                                                 │
│  External ID                                    │
│  [delegate-2024_______________]                 │
│                                                 │
│  Permissions                                    │
│  ┌─────────────────────────────────────────────┐│
│  │ Agenda                                      ││
│  │ □ Can see agenda                           ││
│  │ □ Can see internal items                   ││
│  │ ☑ Can see list of speakers                 ││
│  │ □ Can manage agenda                        ││
│  │                                             ││
│  │ Motions                                     ││
│  │ ☑ Can see motions                          ││
│  │ ☑ Can create motions                       ││
│  │ □ Can manage motions                       ││
│  │                                             ││
│  │ [Additional permission categories...]       ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Permission Categories
1. **Agenda**: View, manage items, speaker lists
2. **Motions**: Create, view, manage, support
3. **Elections**: Nominate, vote, manage
4. **Participants**: View, manage, see sensitive data
5. **Files**: Upload, view, manage
6. **Projector**: View, manage
7. **General**: Meeting settings, chat, history

## Structure Levels

### Structure Level Management
```
┌─────────────────────────────────────────────────┐
│  Structure levels               [+ New Level]   │
├─────────────────────────────────────────────────┤
│  Board Members        [●] Blue    (5)    [✏️][🗑️]│
│  Committee Chairs     [●] Green   (12)   [✏️][🗑️]│
│  Regular Members      [●] Default (98)   [✏️][🗑️]│
│  Guests              [●] Gray     (10)   [✏️][🗑️]│
└─────────────────────────────────────────────────┘
```

### Structure Level Form
```
┌─────────────────────────────────────────────────┐
│  Create structure level        [💾 Save] [❌]   │
├─────────────────────────────────────────────────┤
│  Name *                                         │
│  [_____________________________]                │
│                                                 │
│  Color                                          │
│  [Select color ▼]                               │
└─────────────────────────────────────────────────┘
```

## Presence Management

### Quick Presence Entry
```
┌─────────────────────────────────────────────────┐
│  Presence                                       │
├─────────────────────────────────────────────────┤
│  Enter participant number:                      │
│  ┌─────────────────────────────────────────────┐│
│  │ [42_____________________] [✓ Enter]         ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Status message:                                │
│  "Participant #42 (John Doe) is now present"   │
│                                                 │
│  Recent entries:                                │
│  #42 - John Doe - Present ✓                    │
│  #38 - Mary Wilson - Present ✓                 │
│  #45 - Alice Brown - Absent ✗                  │
└─────────────────────────────────────────────────┘
```

## Import Participants

### Import Dialog
```
┌─────────────────────────────────────────────────┐
│  Import participants                    [x]     │
├─────────────────────────────────────────────────┤
│  Select CSV file: [Choose file]                │
│                                                 │
│  CSV Format Requirements:                       │
│  • First row must contain column headers        │
│  • Supported columns: username, email,          │
│    first_name, last_name, title, number,       │
│    groups, structure_level, vote_weight...     │
│  • Groups separated by commas                   │
│                                                 │
│  Preview:                                       │
│  ┌─────────────────────────────────────────────┐│
│  │ username | first_name | last_name | groups ││
│  │ jsmith   | John       | Smith     | Delegate││
│  │ mdoe     | Mary       | Doe       | Guest  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Cancel]                        [Import]       │
└─────────────────────────────────────────────────┘
```

## Password Management

### Change Password Dialog
```
┌─────────────────────────────────────────────────┐
│  Change password for John Doe          [x]     │
├─────────────────────────────────────────────────┤
│  New password                                   │
│  [_____________________________] [👁️]           │
│                                                 │
│  □ Generate random password                     │
│                                                 │
│  Generated: "Xk9#mP2$qR"                       │
│  [Copy to clipboard]                            │
│                                                 │
│  [Cancel]                    [Set password]     │
└─────────────────────────────────────────────────┘
```

## Vote Delegation

### Delegation View
```
┌─────────────────────────────────────────────────┐
│  Vote Delegation for John Doe                  │
├─────────────────────────────────────────────────┤
│  Current Status:                                │
│  • Voting weight: 3.0 (1.0 + 2 delegations)    │
│  • Can vote for: Self + 2 others               │
│                                                 │
│  Delegations received from:                     │
│  1. Alice Brown (#45) - Weight: 1.0            │
│  2. Bob Wilson (#67) - Weight: 1.0             │
│                                                 │
│  Delegate my vote to:                           │
│  [Select participant ▼]        [Delegate]       │
└─────────────────────────────────────────────────┘
```

## Technical Details

### Services
- `ParticipantControllerService`: CRUD operations
- `ParticipantRepositoryService`: Data access
- `GroupControllerService`: Group management
- `StructureLevelService`: Hierarchy management
- `PresenceService`: Attendance tracking
- `ParticipantPdfService`: PDF generation
- `ParticipantCsvExportService`: Data export

### Data Models

**Participant Model**:
```typescript
{
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  pronoun?: string;
  number?: string;
  group_ids: number[];
  structure_level_id?: number;
  vote_weight: number;
  is_present: boolean;
  locked_out: boolean;
  vote_delegated_to_id?: number;
  vote_delegations_from_ids: number[];
}
```

**Group Model**:
```typescript
{
  id: number;
  name: string;
  external_id?: string;
  permissions: string[];
  user_ids: number[];
  admin_group_for_meeting: boolean;
  default_group_for_meeting: boolean;
}
```

### Permissions
- `user.can_see`: View participants
- `user.can_see_sensitive_data`: View emails, comments
- `user.can_update`: Edit participants
- `user.can_manage`: Full management
- `user.can_change_own_password`: Self-service password
- `user.can_see_extra_data`: View additional fields

## E2E Test Selectors

### List Page
- New button: `button[matTooltip="New participant"]`
- Search input: `input[placeholder="Search"]`
- Participant rows: `.participant-row`
- Multiselect checkbox: `mat-checkbox.selection-checkbox`
- Presence indicator: `.presence-indicator`

### Detail/Edit Page
- Edit button: `button[matTooltip="Edit"]`
- Username input: `input[formControlName="username"]`
- Email input: `input[formControlName="email"]`
- Groups selector: `os-search-selector[formControlName="group_ids"]`
- Save button: `button.save-button`

### Groups Page
- Group rows: `.group-row`
- Permission checkboxes: `mat-checkbox.permission-checkbox`
- Name input: `input[formControlName="name"]`

### Import
- File input: `input[type="file"]`
- Import button: `button.import-button`
- Preview table: `.import-preview`

## Keyboard Shortcuts
- `Ctrl+Shift+P`: Open participant search
- `Enter`: Submit presence number
- `Escape`: Close dialogs
- `Tab`: Navigate form fields

## Accessibility Features
- Semantic table markup
- ARIA labels for status icons
- Keyboard navigation
- Screen reader announcements
- Color indicators with text alternatives
- Focus management in dialogs
- Form validation messages