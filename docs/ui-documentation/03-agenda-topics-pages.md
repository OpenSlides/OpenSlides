# OpenSlides Agenda/Topics Pages Documentation

## Overview
The Agenda module in OpenSlides provides comprehensive meeting agenda management with hierarchical items, speaker lists, and topic management. It supports various visibility levels, time tracking, and integration with other modules.

## URL Routes
- Main agenda list: `/:meetingId/agenda`
- Topic detail: `/:meetingId/agenda/topics/:sequential_number`
- Agenda sorting: `/:meetingId/agenda/sort`
- Topic import: `/:meetingId/agenda/topics/import`
- Speaker lists: `/:meetingId/agenda/speakers`
- Current speakers: `/:meetingId/agenda/speakers/:id`

## Main Agenda List Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Meeting Navigation Bar                         │
├─────────────────────────────────────────────────┤
│  Sidebar   │   Agenda List                      │
│  ┌───────┐ │  ┌────────────────────────────────┐│
│  │ Menu  │ │  │ Agenda     [+ New] [⋮ Menu]   ││
│  │       │ │  ├────────────────────────────────┤│
│  │       │ │  │ [Filter] [Sort] [Search____]  ││
│  │       │ │  ├────────────────────────────────┤│
│  │       │ │  │ □ | # | Item | Comment | Info ││
│  │       │ │  ├────────────────────────────────┤│
│  │       │ │  │ □ 1. First Topic              ││
│  │       │ │  │ □   1.1. Sub-topic            ││
│  │       │ │  │ □   1.2. Another sub-topic    ││
│  │       │ │  │ □ 2. Second Topic             ││
│  │       │ │  │ □ 3. Internal Item [👁️]       ││
│  └───────┘ │  └────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### List Columns
1. **Checkbox**: For multiselect operations
2. **Number**: Auto-generated agenda numbering
3. **Item**: Title with hierarchical indentation
4. **Comment**: Optional comment field
5. **Info**: Duration, tags, status icons

### Item Display Icons
- 👁️ = Internal item (only visible with permission)
- 🔒 = Hidden item
- ✓ = Closed/completed item
- 🏷️ = Tagged item
- ⏱️ = Has duration set
- 💬 = Has active speaker list

### Header Actions

#### New Topic Button (+)
Opens creation dialog with fields:
- **Title** (required)
- **Text** (rich text editor)
- **Attachments** (file upload)
- **Agenda item creation** checkbox
- When checked, additional fields:
  - Item type (Common/Internal/Hidden)
  - Parent item (for hierarchy)
  - Duration
  - Comment

#### Menu Actions (⋮)
- **Import topics**: Opens import dialog
- **Export as CSV**: Downloads agenda data
- **Export as PDF**: Generates PDF document
- **Project agenda**: Shows on projector
- **Numbering**: Auto-number items
- **Tags**: Manage agenda tags

### Multiselect Actions
When items are selected:
- **Done**: Mark items as closed
- **Reopen**: Mark items as open
- **Set visibility**: Change item type
- **Add/Remove tags**: Bulk tag management
- **Duplicate**: Copy selected topics
- **Move**: Change hierarchy position
- **Delete**: Remove items

### Filter Options
1. **Visibility**:
   - Public items
   - Internal items
   - Hidden items

2. **Status**:
   - Open items
   - Closed items

3. **Tags**: Filter by assigned tags

### Sort Options
- By agenda item number
- By title
- Manually (drag & drop)

## Topic Detail Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Topic Title                    [← →] [✏️] [⋮]  │
├─────────────────────────────────────────────────┤
│  Topic Content Area                             │
│  ┌─────────────────────────────────────────────┐│
│  │ [Rich text content displayed here]          ││
│  │                                             ││
│  │ Attachments:                                ││
│  │ 📎 document1.pdf                            ││
│  │ 📎 presentation.pptx                        ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ Agenda Information                          ││
│  │ Type: Common | Duration: 15 min            ││
│  │ Comment: Discussion needed                  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Manage Speaker List] [Create Poll]            │
└─────────────────────────────────────────────────┘
```

### Navigation
- **Previous/Next arrows**: Navigate between sequential topics
- **Edit button**: Enter edit mode (with permission)

### Menu Actions
- **Project**: Show topic on projector
- **Export as PDF**: Generate topic PDF
- **Add to favorites**: Bookmark topic
- **Delete**: Remove topic

### Edit Mode
```
┌─────────────────────────────────────────────────┐
│  Edit topic                     [💾 Save] [❌]  │
├─────────────────────────────────────────────────┤
│  Title *                                        │
│  [_____________________________________________]│
│                                                 │
│  Text                                           │
│  ┌─────────────────────────────────────────────┐│
│  │ [Rich Text Editor Toolbar]                  ││
│  │ [B] [I] [U] [Link] [List] [Image] ...      ││
│  ├─────────────────────────────────────────────┤│
│  │ [Content editing area]                      ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Attachments                    [+ Upload]      │
│  [x] document1.pdf                              │
│  [x] presentation.pptx                          │
│                                                 │
│  □ Create as agenda item                        │
│  [Additional agenda fields when checked]        │
└─────────────────────────────────────────────────┘
```

## Speaker List Management

### Speaker List View
```
┌─────────────────────────────────────────────────┐
│  List of speakers - [Topic Name]               │
├─────────────────────────────────────────────────┤
│  Current Speaker                                │
│  ┌─────────────────────────────────────────────┐│
│  │ 🎤 John Doe         [02:45] [⏸️] [⏹️]       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Waiting List                   [+ Add speaker] │
│  ┌─────────────────────────────────────────────┐│
│  │ 1. Jane Smith                    [↑] [↓] [x]││
│  │ 2. Bob Johnson                   [↑] [↓] [x]││
│  │ 3. Alice Brown (Point of Order)  [↑] [↓] [x]││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Finished Speakers                              │
│  ┌─────────────────────────────────────────────┐│
│  │ • Mike Wilson (03:12)                       ││
│  │ • Sarah Davis (02:45)                       ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Speaker Controls
- **Play/Pause**: Start/pause speaker timer
- **Stop**: End current speaker
- **Reorder**: Drag or use arrows
- **Remove**: Delete from list
- **Add**: Search and add participants

### Point of Order
Special speaker category for urgent interventions:
- Highlighted differently
- Can jump queue based on settings
- Configurable categories

## Import Topics Dialog

### Import Options
```
┌─────────────────────────────────────────────────┐
│  Import topics                           [x]    │
├─────────────────────────────────────────────────┤
│  Select file: [Choose file]                     │
│                                                 │
│  File format:                                   │
│  ○ CSV with topics                              │
│  ● Text with one topic per line                 │
│                                                 │
│  Preview:                                       │
│  ┌─────────────────────────────────────────────┐│
│  │ 1. Budget Discussion                        ││
│  │ 2. Election Results                         ││
│  │ 3. Future Planning                          ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Cancel]                          [Import]     │
└─────────────────────────────────────────────────┘
```

### CSV Import Fields
- Title (required)
- Text
- Duration
- Comment
- Type (Common/Internal/Hidden)

## Agenda Settings

### Available Settings
1. **General**:
   - Enable numbering
   - Number prefix
   - Numeral system

2. **Visibility**:
   - Show internal items to authorized users
   - Default visibility for new items

3. **Speaker Lists**:
   - Enable point of order
   - Speaker time limits
   - Number of last speakers to show

## Technical Details

### Data Models

**Agenda Item Model**:
```typescript
{
  id: number;
  item_number: string;
  title_information: object;
  comment: string;
  closed: boolean;
  type: AgendaItemType; // COMMON, INTERNAL, HIDDEN
  duration: number; // seconds
  weight: number;
  level: number;
  parent_id: number;
  child_ids: number[];
  tag_ids: number[];
  content_object_id: string;
  is_internal: boolean;
  is_hidden: boolean;
}
```

**Topic Model**:
```typescript
{
  id: number;
  title: string;
  text: string;
  sequential_number: number;
  agenda_item_id: number;
  attachment_ids: number[];
  poll_ids: number[];
  list_of_speakers_id: number;
}
```

### Permissions

**Agenda Permissions**:
- `agendaItemCanManage`: Create, edit, delete items
- `agendaItemCanSee`: View public items
- `agendaItemCanSeeInternal`: View internal items
- `agendaItemCanSeeModeratorNotes`: View moderator notes

**Speaker List Permissions**:
- `listOfSpeakersCanBeSpeaker`: Add self to list
- `listOfSpeakersCanManage`: Manage all speakers
- `listOfSpeakersCanSee`: View speaker lists
- `listOfSpeakersCanSeeAllTimes`: View speaking times

### Services

**Core Services**:
- `AgendaItemControllerService`: CRUD operations
- `TopicControllerService`: Topic management
- `AgendaItemRepositoryService`: Data access
- `ListOfSpeakersControllerService`: Speaker management

**Utility Services**:
- `DurationService`: Time calculations
- `AgendaItemFilterService`: List filtering
- `AgendaItemCsvExportService`: Export functionality
- `TopicPdfService`: PDF generation

## E2E Test Selectors

### Agenda List
- List container: `os-agenda-item-list`
- New button: `button[matTooltip="New topic"]`
- Menu button: `button[matTooltip="Menu"]`
- Search input: `input[placeholder="Search"]`
- Item rows: `mat-row.agenda-item-row`
- Multiselect checkbox: `mat-checkbox.selection-checkbox`

### Topic Detail
- Title element: `h1.topic-title`
- Edit button: `button[matTooltip="Edit"]`
- Content area: `.topic-content`
- Attachment list: `.attachment-list`
- Navigation arrows: `button.nav-arrow`

### Forms
- Title input: `input[formControlName="title"]`
- Text editor: `editor[formControlName="text"]`
- Type select: `mat-select[formControlName="type"]`
- Duration input: `input[formControlName="duration"]`
- Save button: `button.save-button`

### Speaker List
- Add speaker: `button.add-speaker`
- Speaker entries: `.speaker-entry`
- Start button: `button.start-speaker`
- Stop button: `button.stop-speaker`
- Reorder handles: `.drag-handle`

## Keyboard Shortcuts
- `Space`: Play/pause current speaker
- `Ctrl+Shift+Enter`: Add self to speaker list
- `Escape`: Close dialogs
- `Arrow keys`: Navigate in lists
- `Enter`: Open selected item

## Accessibility Features
- Proper heading structure
- ARIA labels for all controls
- Keyboard navigation support
- Screen reader announcements
- High contrast support
- Focus management in dialogs