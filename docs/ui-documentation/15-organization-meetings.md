# OpenSlides Organization Meetings Documentation

## Overview
The Organization Meetings page provides a centralized view of all meetings within an organization, allowing administrators to manage, organize, and oversee multiple meetings across different committees and time periods.

## URL Routes
- Organization Meetings: `/organizations/:orgId/meetings`

## Page Layout
```
┌─────────────────────────────────────────────────┐
│  Meetings                           [⋮]         │
├─────────────────────────────────────────────────┤
│  1 of 1    [≡ SORT] [⚲ FILTER] [🔍 Search___] │
├─────────────────────────────────────────────────┤
│  Meeting List                                   │
│  ┌─────────────────────────────────────────────┐│
│  │ OpenSlides Demo                       [⋮]   ││
│  │ ◆ Default committee                         ││
│  │ 🏷️ Orga Tag 1                              ││
│  │                            👥 3   📄 4     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Space for additional meetings]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Meeting List Interface

### Header Controls
- **Menu Button (⋮)**: Organization-level actions and settings
- **Result Counter**: Shows current results ("1 of 1")
- **Sort Button (≡ SORT)**: Meeting sorting options
- **Filter Button (⚲ FILTER)**: Advanced filtering controls
- **Search Field**: Real-time meeting search

### Meeting Card Display
Each meeting is displayed as a card containing:
- **Meeting Name**: "OpenSlides Demo" (clickable to enter meeting)
- **Committee Association**: "Default committee" with diamond icon (◆)
- **Tags**: "Orga Tag 1" with tag icon (🏷️) showing applied organization tags
- **Statistics**: 
  - **Participants (👥)**: Number of participants (3)
  - **Documents (📄)**: Number of files/documents (4)
- **Actions Menu (⋮)**: Individual meeting actions

## Meeting Management Features

### Sort Options
```
┌─────────────────────────────────────────────────┐
│  Sort meetings by                       [x]     │
├─────────────────────────────────────────────────┤
│  ○ Name (A-Z)                                   │
│  ● Name (Z-A)                                   │
│  ○ Creation date (newest first)                 │
│  ○ Creation date (oldest first)                 │
│  ○ Last activity (most recent)                  │
│  ○ Last activity (least recent)                 │
│  ○ Number of participants                       │
│  ○ Committee name                                │
│                                                 │
│  [Apply]                          [Cancel]      │
└─────────────────────────────────────────────────┘
```

### Filter Options
```
┌─────────────────────────────────────────────────┐
│  Filter meetings                        [x]     │
├─────────────────────────────────────────────────┤
│  Committee:                                     │
│  [All committees ▼]                             │
│                                                 │
│  Tags:                                          │
│  ☐ Orga Tag 1                                   │
│  ☐ Budget                                       │
│  ☐ Planning                                     │
│                                                 │
│  Status:                                        │
│  ☑ Active                                      │
│  ☑ Archived                                    │
│  ☐ Template                                     │
│                                                 │
│  Date range:                                    │
│  From: [______] To: [______]                    │
│                                                 │
│  [Clear all]                    [Apply filters] │
└─────────────────────────────────────────────────┘
```

## Meeting Actions and Operations

### Individual Meeting Actions
Available from the meeting card menu (⋮):
- **Enter Meeting**: Access meeting workspace
- **Edit Meeting**: Modify meeting properties
- **Clone Meeting**: Create copy with same structure
- **Archive Meeting**: Mark as archived
- **Export Data**: Download meeting information
- **Delete Meeting**: Permanently remove meeting

### Meeting Creation
```
┌─────────────────────────────────────────────────┐
│  Create new meeting                     [x]     │
├─────────────────────────────────────────────────┤
│  Meeting name *                                 │
│  [Annual General Assembly_____________]         │
│                                                 │
│  Committee *                                    │
│  [Select committee ▼]                           │
│                                                 │
│  Description                                    │
│  [Text area for meeting description]            │
│                                                 │
│  Tags                                           │
│  ☐ Budget                                       │
│  ☐ Planning                                     │
│  ☐ Special                                      │
│                                                 │
│  Template (optional)                            │
│  [Select template ▼]                            │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Bulk Operations
Select multiple meetings for bulk actions:
- **Archive Selected**: Archive multiple meetings
- **Delete Selected**: Remove multiple meetings
- **Export Selected**: Download data from multiple meetings
- **Tag Management**: Apply or remove tags from selected meetings
- **Committee Transfer**: Move meetings to different committee

## Meeting Information Display

### Meeting Metadata
Each meeting card shows:
- **Primary Information**:
  - Meeting name (title)
  - Associated committee
  - Applied organization tags
- **Statistics**:
  - Participant count
  - Document/file count
  - Last activity timestamp
  - Meeting status (active, archived, template)

### Visual Indicators
- **Committee Icon (◆)**: Shows committee association
- **Tag Icon (🏷️)**: Indicates applied tags
- **People Icon (👥)**: Participant count
- **Document Icon (📄)**: File count
- **Status Badges**: Visual meeting status indicators

## Advanced Features

### Meeting Templates
- **Template Creation**: Save meetings as reusable templates
- **Template Library**: Access organization-wide templates
- **Quick Setup**: Create meetings from templates
- **Template Management**: Edit and organize templates

### Meeting Analytics
- **Usage Statistics**: Meeting activity metrics
- **Participation Analysis**: Attendee engagement data
- **Content Metrics**: Document and agenda statistics
- **Trend Analysis**: Meeting patterns over time

### Search and Discovery
- **Global Search**: Search across all meeting content
- **Advanced Filters**: Multi-criteria filtering
- **Saved Searches**: Bookmark common search patterns
- **Recent Activity**: Quick access to recently modified meetings

## Integration Features

### Committee Integration
- **Committee Association**: Link meetings to committees
- **Committee Hierarchy**: Respect organizational structure
- **Permission Inheritance**: Use committee-based permissions
- **Committee Templates**: Committee-specific meeting templates

### Tag Integration
- **Organization Tags**: Apply system-wide tags
- **Tag-based Filtering**: Filter meetings by tags
- **Tag Analytics**: Usage statistics and trends
- **Tag Management**: Centralized tag administration

### User Management
- **Participant Overview**: Cross-meeting participant analysis
- **Role Management**: Consistent roles across meetings
- **Permission Templates**: Standardized permission sets
- **User Activity**: Track user engagement across meetings

## Data Models

### Meeting Model
```typescript
{
  id: number;
  name: string;
  description?: string;
  committee_id: number;
  organization_id: number;
  start_time?: number;
  end_time?: number;
  location?: string;
  is_active_in_organization_id?: number;
  is_archived_in_organization_id?: number;
  enable_anonymous: boolean;
  created_at: number;
  updated_at: number;
  participant_count: number;
  file_count: number;
  tag_ids: number[];
}
```

### Meeting Statistics Model
```typescript
{
  meeting_id: number;
  total_participants: number;
  active_participants: number;
  total_motions: number;
  total_agenda_items: number;
  total_files: number;
  last_activity: number;
  creation_date: number;
}
```

## Permissions and Access Control

### Meeting Permissions
- `organization.can_see_meetings`: View meeting list
- `organization.can_create_meetings`: Create new meetings
- `organization.can_manage_meetings`: Edit/delete meetings
- `committee.can_manage`: Committee-specific meeting management

### Access Levels
- **Organization Admin**: Full access to all meetings
- **Committee Manager**: Access to committee meetings
- **Meeting Admin**: Individual meeting administration
- **Participant**: Basic meeting access

## E2E Test Selectors

### Meeting List
- Meetings container: `.meetings-list`
- Meeting card: `.meeting-card`
- Meeting name: `.meeting-name`
- Committee info: `.committee-info`
- Tag list: `.meeting-tags`
- Statistics: `.meeting-stats`
- Meeting actions: `.meeting-actions`

### Controls
- Sort button: `button[matTooltip="Sort"]`
- Filter button: `button[matTooltip="Filter"]`
- Search input: `input[placeholder="Search"]`
- Create button: `button[matTooltip="Create meeting"]`
- Bulk actions: `.bulk-actions`

### Dialogs
- Meeting name input: `input[formControlName="name"]`
- Committee select: `mat-select[formControlName="committee"]`
- Description field: `textarea[formControlName="description"]`
- Tag checkboxes: `mat-checkbox.tag-option`

## Keyboard Shortcuts
- `Ctrl+N`: Create new meeting
- `Ctrl+F`: Focus search field
- `Enter`: Open selected meeting
- `Delete`: Delete selected meetings
- `Ctrl+A`: Select all meetings
- `Escape`: Clear selection/close dialogs

## Accessibility Features
- **Screen Reader Support**: ARIA labels for all elements
- **Keyboard Navigation**: Full keyboard control
- **High Contrast**: Compatible with accessibility themes
- **Focus Management**: Clear focus indicators
- **Semantic Structure**: Proper heading hierarchy
- **Alternative Text**: Descriptive labels for icons

## Performance Features
- **Lazy Loading**: Load meetings on demand
- **Virtual Scrolling**: Handle large meeting lists
- **Caching**: Cache meeting metadata
- **Optimized Search**: Debounced search with server-side filtering
- **Progressive Enhancement**: Core functionality without JavaScript