# Motions Page Documentation

## Overview
The Motions page manages formal proposals that require discussion and voting within the meeting. It provides tools for creating, editing, tracking, and voting on motions throughout their lifecycle.

## Navigation
- **URL Pattern**: `/{meeting_id}/motions`
- **Menu Access**: Meeting Navigation > Motions (icon: `assignment`)
- **Breadcrumb**: Meeting Name > Motions

## Page Layout

### Header Section
- **Title**: "Motions" (h2 heading)
- **Actions**:
  - Menu button (hamburger icon) - Opens meeting navigation
  - View toggle button (`view_module` icon) - Switch between list/grid views
  - More options button (`more_vert`) - Additional page actions
  - Add button (floating action button, `add` icon) - Creates new motion

### List View
- **Item Count**: Shows "X of Y" items at the top
- **Controls**:
  - Sort button (`sort` icon) - Sort options
  - Filter button (`filter_list` icon) - Filter motions
  - Search button (`manage_search` icon) - Advanced search

### Motion Display
Each motion shows:
- **Number**: Motion identifier (e.g., "1-1", "A1", "2")
- **Title**: Motion title text
- **Submitter**: "by [Name] ([Structure Level] · No. [ID])"
- **Sequential Number**: Internal numbering
- **Status Badge**: Current workflow state (e.g., "submitted", "permitted")
- **More Options**: Three-dot menu per motion

## Motion States

### Workflow States
Common states in Simple Workflow:
- **submitted** - Initial state after creation
- **permitted** - Allowed for discussion
- **accepted** - Motion passed
- **rejected** - Motion failed
- **withdrawn** - Removed by submitter
- **adjourned** - Postponed to later

## Create New Motion Form

### URL Pattern
`/{meeting_id}/motions/new`

### Form Sections

#### 1. Submitters
- **Type**: Multi-select dropdown
- **Purpose**: Assign motion authors/sponsors
- **Default**: Current user (if permitted)
- **Test Selector**: `[aria-label="Submitters"]`

#### 2. Title (Required)
- **Type**: Text input
- **Validation**: Required field (marked with *)
- **Purpose**: Brief motion description
- **Test Selector**: `[aria-label="Title"]`

#### 3. Motion Text (Required)
- **Label**: "The assembly may decide:"
- **Type**: Rich text editor (TipTap)
- **Features**:
  - Format options: Bold, Italic, Underline, Strikethrough
  - Text/background colors
  - Lists: Bulleted, Numbered
  - Links and images
  - Undo/Redo
  - HTML source view
- **Validation**: Required field
- **Test Selector**: First `.tiptap.ProseMirror`

#### 4. Reason
- **Type**: Rich text editor (TipTap)
- **Purpose**: Justification for the motion
- **Optional**: Not required
- **Test Selector**: Second `.tiptap.ProseMirror`

#### 5. Metadata Fields

##### Category
- **Type**: Dropdown select
- **Purpose**: Organize motions by topic
- **Optional**: Can be empty
- **Test Selector**: `[aria-label="Category"]`

##### Attachments
- **Type**: Multi-select dropdown
- **Features**:
  - Select existing files
  - Upload button (`cloud_upload` icon)
- **Test Selector**: `[aria-label="Attachments"]`

##### Agenda Integration
- **Type**: Checkbox
- **Label**: "Add to agenda"
- **Purpose**: Automatically create agenda item
- **Test Selector**: `[aria-label="Add to agenda"]`
- **Sub-options** (when checked):
  - **Agenda visibility**: public/internal/hidden
  - **Parent agenda item**: Hierarchical placement

##### Supporters
- **Type**: Multi-select dropdown
- **Purpose**: Additional endorsers
- **Note**: May require minimum supporters based on settings
- **Test Selector**: `[aria-label="Supporters"]`

##### Workflow
- **Type**: Dropdown select
- **Default**: "Simple Workflow"
- **Purpose**: Determines motion lifecycle states
- **Test Selector**: `[aria-label="Workflow"]`

### Form Actions
- **Save**: Creates the motion (disabled until required fields filled)
- **Cancel**: Close button (X) returns to motion list

## Motion Detail View

### URL Pattern
`/{meeting_id}/motions/{id}`

### Sections
1. **Header**: Number, title, submitters
2. **Content**: Motion text and reason
3. **Metadata**: Category, tags, supporters
4. **State Management**: Current state and available transitions
5. **Voting**: Poll creation and results
6. **History**: Change log and versions
7. **Comments**: Internal/public discussion
8. **Amendments**: Child motions

## Context Menu Options

When clicking the three-dot menu on a motion:

### Actions
- **Project** - Send to projector
- **Edit** - Modify motion details
- **Delete** - Remove motion (if permitted)
- **Create amendment** - Spawn child motion
- **Export** - Generate PDF

### State Changes
- Dynamic based on current state and permissions
- Examples: "Set as permitted", "Accept", "Reject"

## Amendments

### Creating Amendments
- Parent motion must allow amendments
- Inherits certain properties from parent
- Shows relationship in UI

### Amendment Display
- Numbered as "[parent]-[number]" (e.g., "1-1")
- Shows "Amendment to [parent]" subtitle
- Can have own amendments (if configured)

## Motion Blocks

### Purpose
- Group related motions
- Enable bulk operations
- Shared voting sessions

### Features
- Create from motion list
- Drag motions into blocks
- Single vote for entire block

## Filtering and Search

### Filter Options
- **State**: By workflow state
- **Category**: By assigned category
- **Submitter**: By motion author
- **Has amendments**: Parent motions only
- **Tags**: By assigned tags

### Sort Options
- By number
- By title
- By creation date
- By state
- Custom order (drag and drop)

## Permissions

### Basic Permissions
- `motion.can_see` - View motions
- `motion.can_create` - Create new motions
- `motion.can_support` - Add as supporter
- `motion.can_manage` - Full editing rights

### State-based Permissions
- `motion.can_manage_metadata` - Edit in certain states
- `motion.can_create_amendments` - Spawn amendments
- `motion.can_see_internal` - View internal fields

## Real-time Updates
- Motion list updates via WebSocket
- State changes reflect immediately
- New comments appear live
- Vote results update in real-time

## Export Options
- **PDF**: Individual motion or full book
- **CSV**: Motion list with metadata
- **DOCX**: Formatted for external editing

## Technical Implementation

### API Endpoints
- List: `GET /system/action/motion/list`
- Create: `POST /system/action/motion.create`
- Update: `POST /system/action/motion.update`
- Delete: `POST /system/action/motion.delete`
- State change: `POST /system/action/motion.set_state`

### Subscriptions
- `motion_list:subscription` - All motions
- `motion_block_list:subscription` - Motion blocks
- `motion_workflow_list:subscription` - Available workflows
- `motion_submodel_list:subscription` - Related data

### Component Structure
```
MotionListComponent
├── HeadBarComponent
├── ListComponent
│   ├── MotionRowComponent
│   └── ContextMenuComponent
├── FloatingActionButton
└── FilterMenuComponent

MotionDetailComponent
├── MotionHeaderComponent
├── MotionContentComponent
├── MotionMetaComponent
├── MotionPollComponent
├── MotionCommentComponent
└── AmendmentListComponent
```

## Workflow Configuration

### State Properties
- **Name**: Display label
- **Restrictions**: Editing permissions
- **Next states**: Allowed transitions
- **CSS class**: Visual styling

### Workflow Types
- **Simple**: Basic submitted → accepted/rejected
- **Complex**: Multiple review stages
- **Custom**: Organization-specific flows

## Integration Points
- **Agenda**: Auto-create items, manage speakers
- **Projector**: Display motion content
- **Voting**: Create polls, track results
- **PDF**: Generate formatted documents
- **Email**: Notifications on state changes