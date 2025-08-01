# OpenSlides History Pages Documentation

## Overview
The History module provides comprehensive tracking and auditing of all changes made within a meeting, allowing administrators and authorized users to review what happened, when, and by whom.

## URL Routes
- History main: `/:meetingId/history`
- Filtered history: `/:meetingId/history?module=motions&action=update`

## History Main Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  History                                        │
├─────────────────────────────────────────────────┤
│  Filter Controls                                │
│  ┌─────────────────────────────────────────────┐│
│  │ Module: [All ▼]  Action: [All ▼]  Search: □││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  History Table                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ Timestamp | Comment | Changed by            ││
│  ├─────────────────────────────────────────────┤│
│  │           |         |                       ││
│  │ [No history entries match filters]          ││
│  │                                             ││
│  │                                             ││
│  │                                             ││
│  │                                             ││
│  │                                             ││
│  │                                             ││
│  │                                             ││
│  │                                             ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Filter Controls

#### Module Filter
Dropdown to filter by module/section:
- **All**: Show all modules
- **Agenda**: Agenda item changes
- **Motions**: Motion-related changes
- **Elections**: Assignment/election changes
- **Participants**: User and group changes
- **Files**: Media file changes
- **Polls**: Voting changes
- **Chat**: Chat message changes
- **Settings**: Configuration changes
- **Projector**: Projection changes

#### Action Filter
Dropdown to filter by action type:
- **All**: Show all actions
- **Create**: New item creation
- **Update**: Item modifications
- **Delete**: Item removal
- **Import**: Bulk import operations
- **Export**: Data export operations
- **State Change**: Workflow state changes
- **Permission**: Permission modifications

#### Search Field
- **Text Search**: Search in comments and change descriptions
- **Real-time Filter**: Updates results as you type
- **Case Insensitive**: Searches regardless of case
- **Partial Matches**: Finds partial text matches

## History Table

### Table Columns

#### Timestamp
- **Format**: DD.MM.YYYY HH:MM:SS
- **Timezone**: Meeting local timezone
- **Sorting**: Chronological (newest first by default)
- **Precision**: Second-level accuracy

#### Comment
- **Change Description**: Human-readable description of what changed
- **Object Details**: Which specific item was affected
- **Field Changes**: What fields were modified
- **Values**: Old and new values (when appropriate)

#### Changed By
- **User Name**: Full name of the user who made the change
- **Username**: System username
- **Anonymous Changes**: System-generated changes
- **Automated Changes**: Changes from automated processes

### Table Features

#### Sorting
- **Click Headers**: Sort by any column
- **Multi-sort**: Secondary sorting options
- **Sort Indicators**: Visual arrows showing sort direction
- **Default Sort**: Timestamp descending (newest first)

#### Pagination
- **Page Size**: Configurable number of entries per page
- **Navigation**: Previous/Next page controls
- **Jump to Page**: Direct page number entry
- **Total Count**: Display total number of entries

#### Row Selection
- **Checkbox Selection**: Select individual entries
- **Select All**: Choose all visible entries
- **Bulk Actions**: Operations on selected entries
- **Export Selected**: Download selected history entries

## History Entry Types

### Motion Changes
```
┌─────────────────────────────────────────────────┐
│ 24.07.2024 14:30:15                            │
│ Motion A001 "Budget Approval" created          │
│ John Doe (admin)                                │
└─────────────────────────────────────────────────┘
```

### Agenda Changes
```
┌─────────────────────────────────────────────────┐
│ 24.07.2024 14:25:42                            │
│ Agenda item 3.1 "Budget Discussion" closed     │
│ Meeting Admin (admin)                           │
└─────────────────────────────────────────────────┘
```

### Participant Changes
```
┌─────────────────────────────────────────────────┐
│ 24.07.2024 14:20:18                            │
│ User "Jane Smith" added to group "Delegates"   │
│ System Administrator (admin)                    │
└─────────────────────────────────────────────────┘
```

### State Changes
```
┌─────────────────────────────────────────────────┐
│ 24.07.2024 14:35:55                            │
│ Motion A001 state changed from "Submitted"     │
│ to "Under Discussion"                           │
│ Committee Chair (admin)                         │
└─────────────────────────────────────────────────┘
```

### Poll/Voting Changes
```
┌─────────────────────────────────────────────────┐
│ 24.07.2024 14:40:12                            │
│ Poll "Motion A001 - Ballot 1" started          │
│ Meeting Moderator (admin)                       │
└─────────────────────────────────────────────────┘
```

### Bulk Operations
```
┌─────────────────────────────────────────────────┐
│ 24.07.2024 13:15:30                            │
│ Bulk import: 25 participants imported from CSV │
│ Data Manager (admin)                            │
└─────────────────────────────────────────────────┘
```

## Advanced History Features

### Detailed Change View
Click on history entry to see:
- **Before/After Values**: Detailed field comparisons
- **Related Changes**: Connected modifications
- **Impact Analysis**: What was affected by the change
- **Rollback Options**: Undo changes (if supported)

### Change Tracking

#### Automatic Tracking
- **All CRUD Operations**: Create, Read, Update, Delete
- **Workflow Changes**: State transitions
- **Permission Changes**: Group and user modifications
- **Bulk Operations**: Import/export activities
- **System Events**: Automated changes

#### Manual Tracking
- **Admin Comments**: Manual history annotations
- **Meeting Notes**: Important milestone markers
- **Custom Events**: User-defined tracking points

## Export and Reporting

### Export Options
```
┌─────────────────────────────────────────────────┐
│  Export history                         [x]     │
├─────────────────────────────────────────────────┤
│  Export format:                                 │
│  ● CSV (Excel compatible)                       │
│  ○ JSON (technical format)                      │
│  ○ PDF (formatted report)                       │
│                                                 │
│  Date range:                                    │
│  From: [DD.MM.YYYY] To: [DD.MM.YYYY]          │
│                                                 │
│  Include:                                       │
│  ☑ Timestamps                                  │
│  ☑ User information                            │
│  ☑ Change details                              │
│  ☑ Object references                           │
│                                                 │
│  [Cancel]                      [Download]       │
└─────────────────────────────────────────────────┘
```

### Report Generation
- **Summary Reports**: High-level activity overview
- **User Activity**: Individual user change tracking
- **Module Reports**: Changes by functional area
- **Time-based Reports**: Activity in specific periods
- **Compliance Reports**: Audit trail documentation

## Search and Discovery

### Advanced Search
```
┌─────────────────────────────────────────────────┐
│  Advanced search                        [x]     │
├─────────────────────────────────────────────────┤
│  Text search:                                   │
│  [budget approval_____________]                 │
│                                                 │
│  Changed by:                                    │
│  [Select user... ▼]                             │
│                                                 │
│  Date range:                                    │
│  From: [______] To: [______]                    │
│                                                 │
│  Object type:                                   │
│  ☐ Motions      ☐ Agenda items                  │
│  ☐ Users        ☐ Elections                     │
│  ☐ Files        ☐ Polls                         │
│                                                 │
│  [Clear]                        [Search]        │
└─────────────────────────────────────────────────┘
```

### Saved Searches
- **Bookmark Filters**: Save commonly used filter combinations
- **Quick Access**: One-click access to saved searches
- **Shared Filters**: Team-wide search templates
- **Recent Searches**: History of recent search terms

## Technical Details

### Data Models

**History Entry Model**:
```typescript
{
  id: number;
  element_id: string;
  fqid: string;
  type: HistoryEventType;
  user_id?: number;
  information: any;
  timestamp: number;
  meeting_id: number;
}
```

**History Information Types**:
```typescript
{
  // Creation events
  created?: {
    collection: string;
    id: number;
  };
  
  // Update events
  updated?: {
    collection: string;
    id: number;
    fields: string[];
  };
  
  // Deletion events
  deleted?: {
    collection: string;
    id: number;
    name?: string;
  };
}
```

### Services
- `HistoryService`: History data management
- `HistoryRepositoryService`: Data access layer
- `HistoryExportService`: Export functionality
- `HistoryFilterService`: Search and filtering

### Event Types
- `EVENT_TYPE.CREATE`: Object creation
- `EVENT_TYPE.UPDATE`: Object modification
- `EVENT_TYPE.DELETE`: Object removal
- `EVENT_TYPE.RESTORE`: Object restoration

## Permissions and Access Control

### History Permissions
- `meeting.can_see_history`: View history entries
- `meeting.can_manage_history`: Export and manage history
- `meeting.can_see_sensitive_data`: View detailed change information

### Data Privacy
- **Sensitive Information**: Masked for unauthorized users
- **Personal Data**: Protected according to privacy settings
- **Audit Compliance**: Meets regulatory requirements
- **Data Retention**: Configurable retention policies

## E2E Test Selectors

### Filter Controls
- Module filter: `mat-select[formControlName="module"]`
- Action filter: `mat-select[formControlName="action"]`
- Search input: `input[placeholder="Search"]`
- Clear filters: `button.clear-filters`

### History Table
- Table container: `.history-table`
- Table rows: `.history-row`
- Timestamp column: `.timestamp-column`
- Comment column: `.comment-column`
- User column: `.user-column`
- Sort headers: `.sort-header`

### Export Features
- Export button: `button[matTooltip="Export"]`
- Format selector: `mat-radio-button[value="csv"]`
- Date inputs: `input[type="date"]`
- Download button: `button.download-button`

### Pagination
- Page selector: `mat-paginator`
- Previous page: `button[aria-label="Previous page"]`
- Next page: `button[aria-label="Next page"]`
- Page size: `mat-select.page-size`

## Keyboard Shortcuts
- `Ctrl+F`: Focus search field
- `Ctrl+E`: Open export dialog
- `Escape`: Clear current search
- `Enter`: Apply search/filters
- `Tab`: Navigate between filter controls

## Accessibility Features
- **Screen Reader**: ARIA labels for all controls
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Compatible with accessibility themes
- **Focus Indicators**: Clear focus highlighting
- **Semantic HTML**: Proper table markup
- **Alternative Text**: Descriptive button labels

## Performance Features

### Optimization
- **Lazy Loading**: Load entries on demand
- **Virtual Scrolling**: Handle large datasets
- **Server-side Filtering**: Efficient search
- **Caching**: Cache frequently accessed data
- **Debounced Search**: Reduce server requests

### Scalability
- **Index Support**: Database indexing for fast queries
- **Compression**: Efficient data storage
- **Archiving**: Old data archival
- **Cleanup**: Automated old entry removal