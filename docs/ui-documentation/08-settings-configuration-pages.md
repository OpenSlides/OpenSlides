# OpenSlides Settings/Configuration Pages Documentation

## Overview
OpenSlides provides comprehensive configuration options at both the organization and meeting levels. Settings control everything from basic meeting information to advanced voting configurations and export formats.

## URL Routes
- Meeting settings: `/:meetingId/settings`
- Meeting settings group: `/:meetingId/settings/:group`
- Organization settings: `/settings`
- Design/themes: `/designs`

## Meeting Settings

### Settings Categories Page
```
┌─────────────────────────────────────────────────┐
│  Settings                                       │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ 🏠 General  │ │ 📅 Agenda   │ │ 🎤 Speakers │
│  │             │ │             │ │             │
│  └─────────────┘ └─────────────┘ └─────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ 📝 Motions  │ │ 🗳️ Elections│ │ 👥 Users    │
│  │             │ │             │ │             │
│  └─────────────┘ └─────────────┘ └─────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ 📡 Stream   │ │ 📤 Export   │ │ 🌐 Translate│
│  │             │ │             │ │             │
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘
```

### General Settings
```
┌─────────────────────────────────────────────────┐
│  General                       [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  Meeting information                            │
│                                                 │
│  Name *                                         │
│  [Annual General Meeting 2024]                  │
│                                                 │
│  Description                                    │
│  [Annual shareholder meeting...]                │
│                                                 │
│  Location                                       │
│  [Main Conference Hall_______]                  │
│                                                 │
│  Meeting time                                   │
│  Start: [07/24/2024] [09:00]                   │
│  End:   [07/24/2024] [17:00]                   │
│                                                 │
│  External ID                                    │
│  [AGM-2024-001______________]                   │
│                                                 │
│  Meeting Accessibility                          │
│                                                 │
│  □ Enable closed session                        │
│     Protects meeting from external access       │
│                                                 │
│  □ Allow public access                          │
│     Enable anonymous users                      │
│                                                 │
│  WiFi Settings                                  │
│                                                 │
│  SSID                                           │
│  [OpenSlides_Guest__________]                   │
│                                                 │
│  Password                                       │
│  [SecurePass123_____________]                   │
│                                                 │
│  Encryption                                     │
│  [WPA2/WPA3 ▼]                                  │
└─────────────────────────────────────────────────┘
```

### Agenda Settings
```
┌─────────────────────────────────────────────────┐
│  Agenda                        [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  Item Numbering                                 │
│                                                 │
│  □ Enable automatic numbering                   │
│                                                 │
│  Numbering prefix                               │
│  [TOP ________________________]                 │
│                                                 │
│  Numeral system                                 │
│  ● Arabic (1, 2, 3...)                         │
│  ○ Roman (I, II, III...)                       │
│  ○ Letters (A, B, C...)                        │
│                                                 │
│  Visibility                                     │
│                                                 │
│  □ Show internal items on projector             │
│     When restricted, only for authorized users  │
│                                                 │
│  New items default to                           │
│  [Public ▼]                                     │
│                                                 │
│  Speech Time                                    │
│                                                 │
│  Speaking time per participant                  │
│  [180_____] seconds                             │
│                                                 │
│  Minimum speaking time                          │
│  [60______] seconds                             │
└─────────────────────────────────────────────────┘
```

### List of Speakers Settings
```
┌─────────────────────────────────────────────────┐
│  List of speakers              [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  General                                        │
│                                                 │
│  □ Enable point of order                        │
│     Allow urgent interventions                  │
│                                                 │
│  □ Enable pro/contra speech                     │
│     Separate lists for positions                │
│                                                 │
│  Number of last speakers shown                  │
│  [3_______]                                     │
│                                                 │
│  □ Show first contribution hint                 │
│     Highlight first-time speakers               │
│                                                 │
│  Countdown Settings                             │
│                                                 │
│  Predefined seconds                             │
│  [60, 90, 120, 180, 240_____]                  │
│                                                 │
│  □ Couple countdown to speaker                  │
│     Auto-start when speaker begins              │
│                                                 │
│  Access Restrictions                            │
│                                                 │
│  □ Only present participants can be added       │
└─────────────────────────────────────────────────┘
```

### Motion Settings
```
┌─────────────────────────────────────────────────┐
│  Motions                       [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  Numbering                                      │
│                                                 │
│  Identifier                                     │
│  [A_____]                                       │
│                                                 │
│  □ Number motions within categories             │
│  □ Number amendments together                   │
│                                                 │
│  Supporters                                     │
│                                                 │
│  Minimum supporters required                    │
│  [3_____]                                       │
│                                                 │
│  □ Remove supporters on state change            │
│                                                 │
│  Amendments                                     │
│                                                 │
│  □ Allow amendments                             │
│  □ Show amendments together with motion         │
│  □ Prefix amendment identifier with motion      │
│  □ Allow multiple amendments per paragraph      │
│                                                 │
│  Export Settings                                │
│                                                 │
│  Line length                                    │
│  [80_____] characters                           │
│                                                 │
│  Line numbering                                 │
│  ● Outside  ○ Inline  ○ None                   │
└─────────────────────────────────────────────────┘
```

### Election Settings
```
┌─────────────────────────────────────────────────┐
│  Elections                     [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  Ballot Papers                                  │
│                                                 │
│  Number of ballot papers                        │
│  ● Number of participants                       │
│  ○ Number of present participants               │
│  ○ Custom number: [_____]                       │
│                                                 │
│  Default Groups                                 │
│                                                 │
│  Default groups for new elections               │
│  [x] Delegates                                  │
│  [x] Board Members                              │
│  [ ] Guests                                     │
│                                                 │
│  Voting                                         │
│                                                 │
│  Default poll method                            │
│  [Yes/No/Abstain ▼]                            │
│                                                 │
│  Default 100% base                              │
│  [Valid votes ▼]                                │
│                                                 │
│  Required majority                              │
│  [Simple majority ▼]                            │
└─────────────────────────────────────────────────┘
```

### Participant Settings
```
┌─────────────────────────────────────────────────┐
│  Participants                  [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  Presence                                       │
│                                                 │
│  □ Enable participant presence                  │
│  □ Allow self check-in                          │
│                                                 │
│  Email Settings                                 │
│                                                 │
│  Email subject                                  │
│  [Your OpenSlides access data]                  │
│                                                 │
│  Email body                                     │
│  [Welcome {name},                               │
│   Your login credentials...]                    │
│                                                 │
│  Available placeholders: {name}, {username},    │
│  {password}, {url}, {event_name}                │
│                                                 │
│  Vote Delegation                                │
│                                                 │
│  □ Enable vote delegation                       │
│  □ Forbid delegators from voting                │
│  □ Allow self-delegation                        │
└─────────────────────────────────────────────────┘
```

### Export Settings
```
┌─────────────────────────────────────────────────┐
│  Export                        [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  CSV Export                                     │
│                                                 │
│  Separator                                      │
│  [, ▼]                                          │
│                                                 │
│  Text encoding                                  │
│  ● UTF-8  ○ ISO-8859-15                        │
│                                                 │
│  PDF Export                                     │
│                                                 │
│  Page format                                    │
│  ● A4  ○ A5                                     │
│                                                 │
│  Font size                                      │
│  [11 ▼] pt                                      │
│                                                 │
│  Page margins (mm)                              │
│  Top: [25] Right: [20] Bottom: [25] Left: [20] │
│                                                 │
│  Header/Footer                                  │
│                                                 │
│  □ Include page numbers                         │
│  Page number alignment: [Right ▼]               │
│                                                 │
│  □ Include header image                         │
│  □ Include footer image                         │
└─────────────────────────────────────────────────┘
```

## Organization Settings

### Organization Settings Page
```
┌─────────────────────────────────────────────────┐
│  Organization Settings         [💾 Save] [↻]    │
├─────────────────────────────────────────────────┤
│  General Information                            │
│                                                 │
│  Organization name *                            │
│  [ACME Corporation__________]                   │
│                                                 │
│  Organization description                       │
│  [Leading provider of...]                       │
│                                                 │
│  Legal Notice                                   │
│  [Company registration...]                      │
│                                                 │
│  Privacy Policy                                 │
│  [Data protection policy...]                    │
│                                                 │
│  Login Page                                     │
│                                                 │
│  Welcome text                                   │
│  [Welcome to ACME meetings]                     │
│                                                 │
│  System Settings                                │
│                                                 │
│  Default language                               │
│  [English ▼]                                    │
│                                                 │
│  Require duplicate from template                │
│  [None ▼]                                       │
└─────────────────────────────────────────────────┘
```

### Superadmin Settings
```
┌─────────────────────────────────────────────────┐
│  ⚠️ Superadmin Settings                         │
├─────────────────────────────────────────────────┤
│  System Configuration                           │
│                                                 │
│  OpenSlides URL *                               │
│  [https://meetings.example.com]                 │
│                                                 │
│  Feature Toggles                                │
│                                                 │
│  □ Enable electronic voting                     │
│  □ Enable chat                                  │
│  □ Allow anonymous meetings                     │
│  □ Allow public meetings                        │
│                                                 │
│  System Limits                                  │
│                                                 │
│  Maximum active meetings                        │
│  [20_____] (0 = unlimited)                      │
│                                                 │
│  Maximum users                                  │
│  [500____] (0 = unlimited)                      │
│                                                 │
│  SAML Configuration                             │
│                                                 │
│  □ Enable SAML authentication                   │
│                                                 │
│  [Additional SAML fields when enabled...]       │
└─────────────────────────────────────────────────┘
```

## Theme/Design Settings

### Design Management Page
```
┌─────────────────────────────────────────────────┐
│  Design                         [+ New Theme]   │
├─────────────────────────────────────────────────┤
│  Active Theme: Corporate Blue                   │
├─────────────────────────────────────────────────┤
│  Available Themes                               │
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ Corporate Blue          [✓] [✏️] [🗑️]      ││
│  │ Primary: #1976d2                            ││
│  │ Accent: #ff5722                             ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ Dark Theme              [ ] [✏️] [🗑️]      ││
│  │ Primary: #424242                            ││
│  │ Accent: #ffab00                             ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Theme Editor
```
┌─────────────────────────────────────────────────┐
│  Edit theme                    [💾 Save] [❌]   │
├─────────────────────────────────────────────────┤
│  Theme name *                                   │
│  [Corporate Blue____________]                   │
│                                                 │
│  Main Colors                                    │
│                                                 │
│  Primary color                 [🎨]             │
│  [#1976d2___________________]                   │
│                                                 │
│  Accent color                  [🎨]             │
│  [#ff5722___________________]                   │
│                                                 │
│  Warn color                    [🎨]             │
│  [#f44336___________________]                   │
│                                                 │
│  Header Colors                                  │
│                                                 │
│  Global headbar color          [🎨]             │
│  [#303030___________________]                   │
│                                                 │
│  Voting Colors                                  │
│                                                 │
│  Yes                           [🎨]             │
│  [#4caf50___________________]                   │
│                                                 │
│  No                            [🎨]             │
│  [#f44336___________________]                   │
│                                                 │
│  Abstain                       [🎨]             │
│  [#ff9800___________________]                   │
└─────────────────────────────────────────────────┘
```

## Technical Details

### Settings Structure

**Setting Field Types**:
- `string`: Text input
- `text`: Textarea
- `markupText`: Rich text editor
- `email`: Email input with validation
- `integer`: Number input
- `boolean`: Checkbox
- `choice`: Dropdown select
- `date`: Date picker
- `datetime`: Date and time picker
- `daterange`: Start/end date range
- `groups`: Multi-select groups
- `translations`: Custom translations

### Setting Model
```typescript
{
  key: string;
  label: string;
  type: SettingsType;
  default?: any;
  choices?: SelectChoice[];
  validators?: Validators[];
  helpText?: string;
  restricted?: boolean;
  weight: number;
}
```

### Services
- `MeetingSettingsService`: Meeting configuration
- `OrganizationSettingsService`: Org configuration
- `MeetingSettingsDefinitionService`: Setting schemas
- `SettingsService`: Base settings operations

### Permissions
- Meeting settings: `meeting.can_manage_settings`
- Organization settings: Open to org members
- Superadmin settings: `OML.superadmin`
- Theme management: `organization.can_manage_organization`

## E2E Test Selectors

### Settings Navigation
- Category cards: `.settings-group-card`
- Category titles: `.settings-group-title`
- Back button: `button.back-button`

### Settings Forms
- Input fields: `input[formControlName="{key}"]`
- Textareas: `textarea[formControlName="{key}"]`
- Checkboxes: `mat-checkbox[formControlName="{key}"]`
- Dropdowns: `mat-select[formControlName="{key}"]`
- Save button: `button.save-button`
- Reset button: `button.reset-button`

### Theme/Design
- New theme button: `button[matTooltip="New theme"]`
- Theme cards: `.theme-card`
- Color pickers: `input[type="color"]`
- Activate button: `button.activate-theme`

### Validation
- Error messages: `mat-error`
- Warning messages: `.warning-text`
- Required indicators: `.required-indicator`

## Form Features

### Validation Rules
- Required fields marked with *
- Email validation for email fields
- Number ranges for numeric inputs
- Custom validators per field
- Cross-field validation

### User Experience
- Dirty checking (unsaved changes warning)
- Reset to defaults functionality
- Grouped settings for organization
- Real-time validation feedback
- Disabled fields with explanations
- Contextual help text

## Keyboard Shortcuts
- `Ctrl+S`: Save settings
- `Escape`: Cancel/close dialogs
- `Tab`: Navigate between fields
- `Enter`: Submit forms

## Accessibility Features
- Semantic form markup
- Label associations
- Error announcements
- Keyboard navigation
- Screen reader descriptions
- High contrast support
- Focus indicators