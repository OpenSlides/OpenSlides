# OpenSlides Meeting Settings Detailed Documentation

## Overview
The Meeting Settings system provides comprehensive configuration options organized into categorized sections, allowing administrators to customize all aspects of meeting behavior, appearance, and functionality.

## URL Routes
- Settings main: `/:meetingId/settings`
- General settings: `/:meetingId/settings/general`
- Agenda settings: `/:meetingId/settings/agenda`
- Motions settings: `/:meetingId/settings/motions`
- Elections settings: `/:meetingId/settings/elections`
- Participants settings: `/:meetingId/settings/participants`
- Livestream settings: `/:meetingId/settings/livestream`
- Export settings: `/:meetingId/settings/export`
- Custom translations: `/:meetingId/settings/translations`

## Settings Dashboard Layout
```
┌─────────────────────────────────────────────────┐
│  Settings                              [SAVE] [⋮]│
├─────────────────────────────────────────────────┤
│  Configuration Categories (3x3 Grid)            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   🏠    │ │   📅    │ │   🎤    │           │
│  │General  │ │ Agenda  │ │List of  │           │
│  │         │ │         │ │speakers │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   📄    │ │   🗳️    │ │   👥    │           │
│  │Motions  │ │Elections│ │Particip-│           │
│  │         │ │         │ │ants     │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   📺    │ │   📤    │ │   🌐    │           │
│  │Live-    │ │ Export  │ │Custom   │           │
│  │stream   │ │         │ │translat.│           │
│  └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────┘
```

## General Settings

### Meeting Information Configuration
```
┌─────────────────────────────────────────────────┐
│  ← General                              SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  Meeting information                            │
│                                                 │
│  Meeting title                                  │
│  [OpenSlides Demo_________________]             │
│                                                 │
│  Description                                    │
│  [Presentation and assembly system]             │
│                                                 │
│  Event location                                 │
│  [________________________________]            │
│                                                 │
│  Meeting date                            📅     │
│  [DD.MM.YYYY_____________]                      │
│                                                 │
│  External ID                                    │
│  [________________________________]            │
│                                                 │
│  System                                         │
│                                                 │
│  ☐ Activate closed meeting                      │
│  Access only possible for participants of this  │
│  meeting. All other accounts (including         │
│  organization and committee admins) may not     │
│  open the closed meeting. It is locked from     │
│  the inside.                                    │
│                                                 │
│  ☐ Activate public access                       │
│  Anonymous users can access the meeting without │
│  authentication. Permissions can be configured  │
│  in the participant settings.                   │
└─────────────────────────────────────────────────┘
```

### General Settings Features
- **Meeting Identity**: Title, description, location, and date
- **External Integration**: External ID for third-party system integration
- **Access Control**: 
  - Closed meeting mode (restricted to participants only)
  - Public access mode (anonymous users allowed)
- **System Configuration**: Global meeting behavior settings

## Agenda Settings

### Agenda Configuration Options
```
┌─────────────────────────────────────────────────┐
│  ← Agenda                               SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  Numbering                                      │
│                                                 │
│  Enable numbering for agenda items              │
│  ☑ Automatic numbering                         │
│                                                 │
│  Number prefix for agenda items                 │
│  [TOP_________________________]                │
│                                                 │
│  Numbering pattern                              │
│  ● Arabic numerals (1, 2, 3, ...)              │
│  ○ Roman numerals (I, II, III, ...)             │
│  ○ Letters (A, B, C, ...)                       │
│                                                 │
│  Visibility and Access                          │
│                                                 │
│  ☑ Show internal items in agenda                │
│  ☐ Show meta information box                   │
│  ☑ Show countdown                               │
│  ☐ Hide amount of speakers in subtitle         │
│                                                 │
│  Timing                                         │
│                                                 │
│  Default duration for agenda items (minutes)    │
│  [15_______]                                    │
│                                                 │
│  ☑ Enable speaking time tracking               │
│  ☐ Couple countdown with the list of speakers  │
└─────────────────────────────────────────────────┘
```

### Agenda Settings Categories
- **Numbering System**: Automatic numbering with configurable patterns
- **Visibility Controls**: What information is displayed publicly
- **Time Management**: Duration tracking and countdown features
- **Item Organization**: Hierarchical structure and categorization

## List of Speakers Settings

### Speaker Management Configuration
```
┌─────────────────────────────────────────────────┐
│  ← List of speakers                     SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  General                                        │
│                                                 │
│  ☑ Enable point of order speakers              │
│  ☑ Enable pro/contra speech                    │
│  ☐ Only present participants are allowed       │
│     to be added to the list of speakers        │
│                                                 │
│  Speaking time                                  │
│                                                 │
│  Predefined duration of speeches (seconds)      │
│  [180_____]                                     │
│                                                 │
│  ☑ Enable speaking time                        │
│  ☐ Couple countdown with speaking time         │
│                                                 │
│  Notifications                                  │
│                                                 │
│  ☑ Show hint of waiting speakers               │
│  ☑ Show speakers awaiting                      │
│  Speakers to show: [3___]                      │
│                                                 │
│  Closing                                        │
│                                                 │
│  ☐ Automatically close list when item is done  │
│  ☑ Enable speaker closing                      │
└─────────────────────────────────────────────────┘
```

## Motions Settings

### Motion Workflow Configuration
```
┌─────────────────────────────────────────────────┐
│  ← Motions                              SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  General                                        │
│                                                 │
│  Workflow for new motions                       │
│  [Simple Workflow ▼]                            │
│                                                 │
│  ☑ Allow to disable versioning                 │
│  ☑ Allow submitter edit                        │
│  ☐ Set submitter to first author               │
│                                                 │
│  Numbering                                      │
│                                                 │
│  Motion identifier                              │
│  [Manually ▼]                                   │
│                                                 │
│  Motion number prefix                           │
│  [A_________________________]                  │
│                                                 │
│  Amendments                                     │
│                                                 │
│  ☑ Activate amendments                         │
│  ☐ Hide referring motions                      │
│  Amendment prefix for the motion identifier     │
│  [Ä_________________________]                  │
│                                                 │
│  Line numbering                                 │
│                                                 │
│  ☑ Line numbering in motion text               │
│  Line length [80____] characters                │
│                                                 │
│  Recommendations                                │
│                                                 │
│  ☑ Show motion recommendations                  │
│  Default recommendation: [None ▼]               │
└─────────────────────────────────────────────────┘
```

### Motion Configuration Categories
- **Workflow Management**: State transitions and approval processes
- **Numbering System**: Automatic or manual motion numbering
- **Amendment Support**: Amendment creation and management
- **Text Processing**: Line numbering and formatting options
- **Recommendations**: Default recommendation handling

## Elections Settings

### Election Process Configuration
```
┌─────────────────────────────────────────────────┐
│  ← Elections                            SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  General                                        │
│                                                 │
│  ☑ Present candidates only                     │
│  ☑ Sort candidates by first name               │
│  ☐ Put all candidates on the same list         │
│                                                 │
│  Default election method                        │
│  [votes ▼]                                      │
│                                                 │
│  Election methods                               │
│  ☑ Automatic                                   │
│  ☑ votes                                       │
│  ☑ yn (Yes/No)                                 │
│  ☑ yna (Yes/No/Abstain)                        │
│                                                 │
│  Ballot papers                                  │
│                                                 │
│  ☑ Number of ballot papers                     │
│  ☑ Number of all delegates                     │
│  ☑ Number of all participants                  │
│  ☐ Use the following custom number             │
│  Custom number: [____]                         │
│                                                 │
│  Required majority                              │
│  ☑ Simple majority                             │
│  ☑ Two-thirds majority                         │
│  ☑ Three-quarters majority                     │
│  ☑ Disabled                                    │
│                                                 │
│  100% base of an election result               │
│  ● Valid ballots cast                          │
│  ○ All ballots cast                            │
│  ○ All entitled to vote                        │
└─────────────────────────────────────────────────┘
```

## Participants Settings

### User and Group Management Configuration
```
┌─────────────────────────────────────────────────┐
│  ← Participants                         SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  General                                        │
│                                                 │
│  ☑ Enable participant presence view            │
│  ☐ Enable gender on personal note              │
│  ☑ Allow self set present                      │
│                                                 │
│  PDF export                                     │
│                                                 │
│  ☑ Show title on participants list             │
│  ☑ Show first name on participants list        │
│  ☑ Show last name on participants list         │
│  ☑ Show structure level on participants list   │
│  ☑ Show number on participants list            │
│  ☐ Show groups on participants list            │
│  ☐ Show comment on participants list           │
│                                                 │
│  Default groups for new participants            │
│  ☑ Default                                     │
│  ☐ Admin                                       │
│  ☐ Delegates                                   │
│                                                 │
│  Email settings                                 │
│                                                 │
│  Sender name: [OpenSlides__________]            │
│  Reply address: [noreply@example.com___]        │
│  Subject: [OpenSlides access data___]           │
│                                                 │
│  Email text                                     │
│  [Dear {name},                                  │
│   Your access data for OpenSlides:             │
│   Username: {username}                          │
│   Password: {password}                          │
│   URL: {url}]                                   │
└─────────────────────────────────────────────────┘
```

## Livestream Settings

### Streaming Configuration
```
┌─────────────────────────────────────────────────┐
│  ← Livestream                           SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  Livestream configuration                        │
│                                                 │
│  ☑ Enable livestream                           │
│                                                 │
│  Livestream URL                                 │
│  [https://stream.example.com/live____]          │
│                                                 │
│  Show livestream on                             │
│  ☑ Projector                                   │
│  ☑ Autopilot                                   │
│  ☐ Current list of speakers slide              │
│                                                 │
│  Poster image (JPG or PNG, max 1MB)            │
│  [Choose file...] No file selected             │
│                                                 │
│  Stream delay (seconds)                         │
│  [0____]                                        │
│                                                 │
│  Auto-play                                      │
│  ☐ Enable auto-play                            │
│  Note: Auto-play may not work on all browsers   │
│  due to browser policies                        │
│                                                 │
│  Quality settings                               │
│  Default quality: [Auto ▼]                     │
│  Available qualities:                           │
│  ☑ 240p   ☑ 360p   ☑ 480p                      │
│  ☑ 720p   ☑ 1080p  ☐ 4K                        │
└─────────────────────────────────────────────────┘
```

## Export Settings

### Data Export Configuration
```
┌─────────────────────────────────────────────────┐
│  ← Export                              SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  PDF settings                                   │
│                                                 │
│  Page format                                    │
│  ● A4        ○ Letter                           │
│  ● Portrait  ○ Landscape                        │
│                                                 │
│  Font                                           │
│  Font: [Liberation Sans ▼]                     │
│  Font size: [10__]                              │
│                                                 │
│  Page margins (mm)                              │
│  Top: [20__] Bottom: [20__]                     │
│  Left: [20__] Right: [20__]                     │
│                                                 │
│  Logo and branding                              │
│  Logo (PDF header): [Choose file...]            │
│  Footer text: [Generated by OpenSlides]         │
│                                                 │
│  Motion exports                                 │
│  ☑ Include motion text                         │
│  ☑ Include motion reason                       │
│  ☑ Include motion recommendations              │
│  ☑ Include amendments                          │
│  ☑ Include supporters                          │
│  ☑ Include submitters                          │
│                                                 │
│  Agenda exports                                 │
│  ☑ Include page numbers                        │
│  ☑ Include TOC (Table of Contents)             │
│  ☑ Include internal items                      │
│  ☑ Include duration                            │
└─────────────────────────────────────────────────┘
```

## Custom Translations Settings

### Language Customization
```
┌─────────────────────────────────────────────────┐
│  ← Custom translations                  SAVE [⋮]│
├─────────────────────────────────────────────────┤
│  Translation overrides                          │
│                                                 │
│  Language: [English ▼]                          │
│                                                 │
│  Search for term to override:                   │
│  [🔍 Search existing translations___]           │
│                                                 │
│  Current overrides (12):                        │
│  ┌─────────────────────────────────────────────┐│
│  │ Original: "Motion"                          ││
│  │ Override: "Proposal"              [Edit]    ││
│  ├─────────────────────────────────────────────┤│
│  │ Original: "Election"                        ││
│  │ Override: "Vote"                  [Edit]    ││
│  ├─────────────────────────────────────────────┤│
│  │ Original: "Participants"                    ││
│  │ Override: "Members"               [Edit]    ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Add new override]                             │
│                                                 │
│  Import/Export                                  │
│  [Import translations] [Export overrides]       │
│                                                 │
│  Reset                                          │
│  [Reset all overrides]                          │
└─────────────────────────────────────────────────┘
```

## Settings Management Features

### Global Settings Actions
- **Save Button**: Apply all configuration changes
- **Menu (⋮)**: Additional settings operations
  - Import/Export settings
  - Reset to defaults
  - Copy settings from template
  - Settings history and versioning

### Settings Validation
- **Real-time Validation**: Check configuration validity
- **Dependency Checking**: Ensure compatible settings
- **Warning Messages**: Alert for potential conflicts
- **Preview Mode**: Test settings before applying

### Settings Templates
- **Meeting Templates**: Predefined setting configurations
- **Organization Defaults**: Inherit organization-level settings
- **Custom Templates**: Save custom configurations for reuse
- **Template Management**: Create, edit, and share templates

## Advanced Configuration

### Permission Integration
- **Role-based Settings**: Different settings per user group
- **Permission Dependencies**: Settings that affect permissions
- **Access Control**: Who can modify settings
- **Audit Trail**: Track all settings changes

### API and Integration
- **Settings API**: Programmatic access to configurations
- **Webhook Integration**: Notify external systems of changes
- **Backup and Restore**: Settings data management
- **Migration Tools**: Upgrade and migrate settings

## E2E Test Selectors

### Settings Navigation
- Settings dashboard: `.settings-dashboard`
- Settings category: `.settings-category`
- Category card: `.category-card`
- Back button: `button[aria-label="Back"]`
- Save button: `button.save-settings`

### Configuration Forms
- Form section: `.settings-section`
- Text input: `input[formControlName]`
- Checkbox: `mat-checkbox.setting-checkbox`
- Select dropdown: `mat-select.setting-select`
- File upload: `input[type="file"].setting-file`

### Action Buttons
- Save changes: `button.save-settings`
- Reset settings: `button.reset-settings`
- Import settings: `button.import-settings`
- Export settings: `button.export-settings`

## Keyboard Shortcuts
- `Ctrl+S`: Save current settings
- `Ctrl+Z`: Undo last change
- `Ctrl+R`: Reset current section
- `Escape`: Cancel without saving
- `Tab`: Navigate between form fields
- `Enter`: Submit form/save changes

## Accessibility Features
- **Screen Reader Support**: Full ARIA labeling
- **Keyboard Navigation**: Complete keyboard control
- **High Contrast**: Compatible with accessibility themes
- **Focus Management**: Clear focus indicators
- **Form Validation**: Accessible error messages
- **Help Text**: Contextual assistance for complex settings