# Agenda Page Documentation

## Overview
The Agenda page manages the meeting's schedule and items. It provides a centralized view of all topics, motions, elections, and other items that need to be discussed during the meeting.

## Navigation
- **URL Pattern**: `/{meeting_id}/agenda`
- **Menu Access**: Meeting Navigation > Agenda (icon: `today`)
- **Breadcrumb**: Meeting Name > Agenda

## Page Layout

### Header Section
- **Title**: "Agenda" (h2 heading)
- **Actions**:
  - Menu button (hamburger icon) - Opens meeting navigation
  - More options button (`more_vert`) - Additional page actions
  - Add button (floating action button, `add` icon) - Creates new agenda item

### List View
- **Item Count**: Shows "X of Y" items at the top
- **Filtering Controls**:
  - Filter button (`filter_list` icon) - Opens filter options
  - Search button (`manage_search` icon) - Advanced search

### Agenda Items Display
Each agenda item shows:
- **Title**: Clickable link to item details
- **Type Indicators**: 
  - Topics: Simple text title
  - Motions: "Motion [number] · [title]"
  - Elections: "[number]. [title] (Election)"
  - Motion blocks: "[title] (Motion block)"
- **More Options**: Three-dot menu per item

## Item Types

### 1. Topics
- Simple agenda items for discussion
- URL pattern: `/agenda/topics/{id}`
- Can contain rich text content and attachments

### 2. Motions
- Formal proposals requiring votes
- URL pattern: `/motions/{id}`
- Include motion number and title

### 3. Elections/Assignments
- Voting for positions
- URL pattern: `/assignments/{id}`
- Marked with "(Election)" suffix

### 4. Motion Blocks
- Groups of related motions
- URL pattern: `/motions/blocks/{id}`
- Marked with "(Motion block)" suffix

## Context Menu Options

When clicking the three-dot menu on an item:

### Navigation Actions
- **Project** (`videocam` icon) - Send to projector
- **List of speakers** (`record_voice_over` icon) - View/manage speakers
  - Shows speaker count as badge

### Item Management
- **Done** (`check_box_outline_blank` icon) - Mark item as completed
- **Edit details** (`edit` icon) - Modify item properties
- **Create subitem** (`add_circle` icon) - Add child agenda item
- **Duplicate** (`file_copy` icon) - Copy the item
- **Delete** (`delete` icon) - Remove from agenda

## Create New Topic Form

### URL Pattern
`/{meeting_id}/agenda/topics/new`

### Form Fields

#### Title (Required)
- **Type**: Text input
- **Validation**: Required field (marked with *)
- **Test Selector**: `[aria-label="Title"]`

#### Text Content
- **Type**: Rich text editor (TipTap)
- **Features**:
  - Format options: Bold, Italic, Underline, Strikethrough
  - Text/background color pickers
  - Lists: Bulleted, Numbered
  - Links and images
  - Undo/Redo functionality
  - HTML source code view
- **Test Selector**: `.tiptap.ProseMirror`

#### Attachments
- **Type**: Multi-select dropdown
- **Features**:
  - Select existing files
  - Upload button (`cloud_upload` icon) for new files
- **Test Selector**: `[aria-label="Attachments"]`

#### Agenda Settings

##### Visibility
- **Type**: Dropdown select
- **Options**:
  - `public` - Visible to all participants
  - `internal` - Visible to authorized users only
  - `hidden` - Not shown on agenda
- **Default**: public
- **Test Selector**: `[aria-label="Agenda visibility"]`

##### Parent Agenda Item
- **Type**: Dropdown select
- **Purpose**: Create hierarchical agenda structure
- **Test Selector**: `[aria-label="Parent agenda item"]`

### Form Actions
- **Save**: Creates the topic (disabled until required fields filled)
- **Cancel**: Close button (X) returns to agenda list

## Sorting and Filtering

### Sort Options
- By agenda item number
- By creation date
- By type
- Custom order (drag and drop)

### Filter Options
- By item type (topics, motions, elections)
- By visibility (public, internal, hidden)
- By completion status
- By tags

## Permissions

### View Permissions
- Basic users can view public agenda items
- Internal items require additional permissions
- Hidden items visible only to managers

### Management Permissions
- `agenda.can_manage` - Create, edit, delete items
- `agenda.can_see_internal` - View internal items
- `agenda.can_manage_list_of_speakers` - Manage speakers

## Real-time Updates
- Agenda items update via WebSocket subscription
- New items appear automatically
- Status changes reflect immediately
- Speaker counts update in real-time

## Technical Implementation

### API Endpoints
- List: `GET /system/action/agenda.item/list`
- Create: `POST /system/action/agenda.item.create`
- Update: `POST /system/action/agenda.item.update`
- Delete: `POST /system/action/agenda.item.delete`

### State Management
- Uses `agenda_list:subscription` for real-time updates
- Items stored in ViewModelStore
- Filtered/sorted via RxJS operators

### Component Structure
```
AgendaListComponent
├── HeadBarComponent (header with actions)
├── ListComponent (item display)
│   ├── AgendaItemRow
│   └── ContextMenuComponent
└── FloatingActionButton (create new)
```

## Accessibility Features
- Keyboard navigation supported
- ARIA labels on all interactive elements
- Screen reader announcements for changes
- Focus management on modal open/close

## Related Features
- **Autopilot**: Automated progression through agenda
- **Projector**: Display current agenda item
- **Timer**: Track discussion time per item
- **Export**: Generate PDF agenda documents