# OpenSlides Agenda Item Detailed Management Documentation

## Overview
The Agenda Item Management system provides comprehensive control over meeting agendas, including item organization, time management, visibility controls, content management, and speaker assignment, enabling efficient meeting orchestration and parliamentary procedure management.

## URL Routes
- Agenda main: `/:meetingId/agenda`
- Agenda item detail: `/:meetingId/agenda/items/:itemId`
- Agenda item edit: `/:meetingId/agenda/items/:itemId/edit`
- Speaker list: `/:meetingId/agenda/items/:itemId/speakers`
- Content management: `/:meetingId/agenda/items/:itemId/content`

## Agenda Overview Interface

### Main Agenda Layout
```
┌─────────────────────────────────────────────────┐
│  Agenda                         [+] [📤] [⋮]    │
├─────────────────────────────────────────────────┤
│  8 items   [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  Agenda Structure                               │
│  ┌─────────────────────────────────────────────┐│
│  │ 1.   Opening of Meeting            [⋮]     ││
│  │      🏛️ Public                             ││
│  │      ⏱️ 5 min    👥 0 speakers             ││
│  │      📋 No content assigned                 ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 2.   Budget Presentation            [⋮]     ││
│  │      👁️ Internal                           ││
│  │      ⏱️ 30 min   👥 3 speakers             ││
│  │      📄 Motion 1: Budget Approval          ││
│  │      📊 Finance Report attached             ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 2.1  Budget Q&A Session            [⋮]     ││
│  │      🏛️ Public                             ││
│  │      ⏱️ 15 min   👥 0 speakers             ││
│  │      🔗 Sub-item of Budget Presentation     ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 3.   New Business                   [⋮]     ││
│  │      🔒 Hidden                              ││
│  │      ⏱️ 45 min   👥 2 speakers             ││
│  │      📄 Motion 2: Policy Changes           ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Agenda Item States and Visibility
- **Public (🏛️)**: Visible to all participants and observers
- **Internal (👁️)**: Visible only to authorized participants
- **Hidden (🔒)**: Visible only to administrators and chairs

## Agenda Item Detail View

### Detailed Item Interface
```
┌─────────────────────────────────────────────────┐
│  Agenda Item: Budget Presentation      [✏️] [⋮]│
├─────────────────────────────────────────────────┤
│  Item Information                               │
│  Number: 2                                      │
│  Title: Budget Presentation                     │
│  Type: Item with content                        │
│  Visibility: 👁️ Internal                       │
│  Created: 20.07.2024 09:15                     │
│                                                 │
│  Time Management                                │
│  Planned Duration: ⏱️ 30 minutes                │
│  Start Time: 14:30                              │
│  End Time: 15:00                                │
│  Actual Duration: -- (not started)             │
│                                                 │
│  Content Assignment                             │
│  ┌─────────────────────────────────────────────┐│
│  │ 📄 Motion 1: Budget Approval               ││
│  │    Submitted by Administrator               ││
│  │    State: [submitted]                       ││
│  │    ─────────────────────────                ││
│  │ 📊 Finance Report (budget-2024.pdf)        ││
│  │    Uploaded: 18.07.2024                    ││
│  │    Size: 2.1 MB                            ││
│  │    ─────────────────────────                ││
│  │ 🗳️ Budget Approval Poll                    ││
│  │    Type: Yes/No/Abstain                    ││
│  │    Status: Created                          ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Speaker Management                             │
│  Current Speaker: None                          │
│  Next Speaker: John Doe (Delegates)            │
│  Speakers in Queue: 3                          │
│  ┌─────────────────────────────────────────────┐│
│  │ 1. John Doe (Delegates)        [⏹️] [⋮]   ││
│  │    Signed up: 24.07.2024 14:15             ││
│  │    Estimated time: 5 minutes               ││
│  │                                             ││
│  │ 2. Mary Smith (Committee)      [⏹️] [⋮]   ││
│  │    Signed up: 24.07.2024 14:18             ││
│  │    Estimated time: 3 minutes               ││
│  │                                             ││
│  │ 3. Alex Brown (Observers)      [⏹️] [⋮]   ││
│  │    Signed up: 24.07.2024 14:22             ││
│  │    Estimated time: 2 minutes               ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Agenda Controls                                │
│  [Start Item] [Close Item] [Set Current]        │
│  [Manage Speakers] [Add Content] [Edit Item]    │
└─────────────────────────────────────────────────┘
```

## Agenda Item Creation Dialog

### Create New Agenda Item
```
┌─────────────────────────────────────────────────┐
│  Create agenda item                     [x]     │
├─────────────────────────────────────────────────┤
│  Item Details                                   │
│                                                 │
│  Title *                                        │
│  [Strategic Planning Session_____________]      │
│                                                 │
│  Item number                                    │
│  [4] (auto-generated)                           │
│                                                 │
│  Item type                                      │
│  ● Common item                                  │
│  ○ Hidden item                                  │
│  ○ Internal item                                │
│                                                 │
│  Visibility                                     │
│  ● Public - visible to all participants        │
│  ○ Internal - visible to authorized users only │
│  ○ Hidden - visible to administrators only     │
│                                                 │
│  Time Planning                                  │
│  Planned duration: [45] minutes                 │
│  Start time: [15:30] (optional)                 │
│                                                 │
│  Hierarchy                                      │
│  Parent item: [Select parent ▼]                │
│  ☐ Create as sub-item                          │
│                                                 │
│  Content Association                            │
│  Associated motion: [Select motion ▼]          │
│  Associated election: [Select election ▼]      │
│  Attachments: [Add files...]                   │
│                                                 │
│  Additional Settings                            │
│  Weight (sort order): [10]                     │
│  ☑ Allow speakers list                         │
│  ☑ Show on projector                           │
│  ☐ Closed item (no further discussion)         │
│                                                 │
│  Moderator Notes                                │
│  [Internal notes for meeting moderator]        │
│                                                 │
│  [Cancel]                        [Create Item]  │
└─────────────────────────────────────────────────┘
```

## Speaker Management System

### Speaker List Interface
```
┌─────────────────────────────────────────────────┐
│  Speakers: Budget Presentation          [x]     │
├─────────────────────────────────────────────────┤
│  Speaker Controls                               │
│  Current Speaker: John Doe                      │
│  Time Running: ⏱️ 02:34 / 05:00 minutes       │
│  [⏸️ Pause] [⏹️ Stop] [⏭️ Next Speaker]        │
│                                                 │
│  Speaker Queue (3 waiting)                     │
│  ┌─────────────────────────────────────────────┐│
│  │ 🎤 John Doe (Speaking)             [⏹️]    ││
│  │    Delegates • Started: 14:45              ││
│  │    Planned: 5 min • Actual: 2:34           ││
│  │    ━━━━━━━━▒▒▒▒▒▒▒▒▒▒ 52%                  ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 2. Mary Smith                      [⏹️][⋮] ││
│  │    Committee • Signed up: 14:18            ││
│  │    Planned: 3 minutes                      ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 3. Alex Brown                      [⏹️][⋮] ││
│  │    Observers • Signed up: 14:22            ││
│  │    Planned: 2 minutes                      ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Add Speaker                                    │
│  Participant: [Select participant ▼]           │
│  Speaking time: [3] minutes                     │
│  [Add to Queue]                                 │
│                                                 │
│  Speaking Statistics                            │
│  Total time allocated: 10 minutes              │
│  Time used so far: 2:34 minutes                │
│  Remaining time: 7:26 minutes                  │
│                                                 │
│  Speaker Options                                │
│  ☑ Enforce time limits                         │
│  ☑ Show countdown timer                        │
│  ☑ Audio signal at time limit                  │
│  ☐ Allow speaker time extensions               │
│                                                 │
│  [Close Speakers] [Export List] [Clear Queue]   │
└─────────────────────────────────────────────────┘
```

### Add Speaker Dialog
```
┌─────────────────────────────────────────────────┐
│  Add speaker to agenda item             [x]     │
├─────────────────────────────────────────────────┤
│  Speaker Selection                              │
│                                                 │
│  Participant *                                  │
│  [Mary Smith (Committee) ▼]                     │
│                                                 │
│  Speaking details                               │
│  Planned speaking time: [3] minutes             │
│  Speaking order: [Next in queue]               │
│                                                 │
│  Speaker type                                   │
│  ● Regular speaker                              │
│  ○ Point of order                               │
│  ○ Point of information                         │
│  ○ Question to presenter                        │
│                                                 │
│  Additional notes                               │
│  [Optional notes about speaking topic]         │
│                                                 │
│  Speaker restrictions                           │
│  ☐ Speaking time cannot be extended            │
│  ☐ Must speak before item closure              │
│  ☑ Can be interrupted for points of order      │
│                                                 │
│  [Cancel]                        [Add Speaker]  │
└─────────────────────────────────────────────────┘
```

## Agenda Item Content Management

### Content Assignment Interface
```
┌─────────────────────────────────────────────────┐
│  Manage agenda item content            [x]     │
├─────────────────────────────────────────────────┤
│  Item: Strategic Planning Session               │
│                                                 │
│  Associated Content Types                       │
│                                                 │
│  Motions                                        │
│  ┌─────────────────────────────────────────────┐│
│  │ Available Motions:                          ││
│  │ ☐ Motion 1: Budget Approval                ││
│  │ ☐ Motion 2: Policy Changes                 ││
│  │ ☑ Motion 3: Strategic Plan                 ││
│  │ ☐ Motion 4: Membership Fees                ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Elections                                      │
│  ┌─────────────────────────────────────────────┐│
│  │ Available Elections:                        ││
│  │ ☐ Election 1: Board Chairman                ││
│  │ ☐ Election 2: Treasury Position             ││
│  │ ☐ Election 3: Committee Members             ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Files and Documents                            │
│  ┌─────────────────────────────────────────────┐│
│  │ Attached Files:                             ││
│  │ ✓ strategic-plan-draft.pdf (1.8 MB)        ││
│  │ ✓ budget-overview.xlsx (956 KB)            ││
│  │ [Upload additional files...]                ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Polls                                          │
│  ┌─────────────────────────────────────────────┐│
│  │ Associated Polls:                           ││
│  │ ☑ Strategic Plan Approval Poll              ││
│  │   Type: Yes/No/Abstain                     ││
│  │   Status: Draft                             ││
│  │ [Create new poll...]                        ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Content Order                                  │
│  1. 📄 Motion 3: Strategic Plan                │
│  2. 📊 strategic-plan-draft.pdf                │
│  3. 🗳️ Strategic Plan Approval Poll           │
│                                                 │
│  [Save Changes] [Cancel]                        │
└─────────────────────────────────────────────────┘
```

## Agenda Hierarchy and Organization

### Sub-item Management
```
┌─────────────────────────────────────────────────┐
│  Agenda Structure Management                    │
├─────────────────────────────────────────────────┤
│  Main Items and Sub-items                      │
│                                                 │
│  1.   Opening of Meeting                        │
│                                                 │
│  2.   Budget Presentation                       │
│  │    2.1  Budget Overview                     │
│  │    2.2  Revenue Analysis                    │
│  │    2.3  Expenditure Review                  │
│  │    2.4  Q&A Session                         │
│                                                 │
│  3.   New Business                              │
│  │    3.1  Policy Changes                      │
│  │    │    3.1.1  Membership Policy            │
│  │    │    3.1.2  Meeting Procedures           │
│  │    3.2  Strategic Planning                  │
│                                                 │
│  4.   Elections                                 │
│  │    4.1  Board Positions                     │
│  │    4.2  Committee Assignments               │
│                                                 │
│  5.   Closing Remarks                           │
│                                                 │
│  Hierarchy Actions                              │
│  [Create Sub-item] [Move Up] [Move Down]        │
│  [Indent Item] [Outdent Item] [Delete Item]     │
└─────────────────────────────────────────────────┘
```

### Bulk Agenda Operations
```
┌─────────────────────────────────────────────────┐
│  Bulk agenda operations (3 selected)   [x]     │
├─────────────────────────────────────────────────┤
│  Visibility Management                          │
│  [Set as Public] [Set as Internal] [Set Hidden]│
│                                                 │
│  Content Management                             │
│  [Add Motion] [Add Election] [Add Files]        │
│                                                 │
│  Time Management                                │
│  [Set Duration] [Set Start Times] [Clear Times]│
│                                                 │
│  Structure Operations                           │
│  [Create Sub-items] [Change Parent] [Reorder]   │
│                                                 │
│  Advanced Operations                            │
│  [Export Items] [Duplicate Items] [Delete Items]│
│                                                 │
│  Template Actions                               │
│  [Save as Template] [Apply Template]            │
│                                                 │
│  [Cancel]                         [Apply]       │
└─────────────────────────────────────────────────┘
```

## Agenda Item Status Management

### Item State Controls
- **Open**: Item is available for discussion
- **Closed**: Item discussion is finished
- **Current**: Item is currently being discussed
- **Skipped**: Item was not discussed in this meeting
- **Postponed**: Item moved to future meeting

### Item Transition Dialog
```
┌─────────────────────────────────────────────────┐
│  Change agenda item status             [x]     │
├─────────────────────────────────────────────────┤
│  Current status: Open                           │
│                                                 │
│  Available transitions:                         │
│  ● Set as current item                          │
│    → Item becomes active discussion topic      │
│                                                 │
│  ○ Close item                                   │
│    → Mark discussion as completed               │
│                                                 │
│  ○ Skip item                                    │
│    → Item not discussed in this meeting        │
│                                                 │
│  ○ Postpone item                                │
│    → Move to future meeting                     │
│    Target meeting: [Select meeting ▼]          │
│                                                 │
│  Status change reason:                          │
│  [Optional explanation for status change]       │
│                                                 │
│  Notifications:                                 │
│  ☑ Notify speakers of status change            │
│  ☑ Update projector display                    │
│  ☐ Send email to interested participants       │
│                                                 │
│  [Cancel]                     [Change Status]   │
└─────────────────────────────────────────────────┘
```

## Time Management and Planning

### Meeting Time Tracking
```
┌─────────────────────────────────────────────────┐
│  Meeting Time Overview                          │
├─────────────────────────────────────────────────┤
│  Total Meeting Time                             │
│  Planned: 3 hours 15 minutes                   │
│  Actual: 1 hour 45 minutes (running)           │
│  Remaining: 1 hour 30 minutes                  │
│                                                 │
│  Current Schedule Status                        │
│  We are 15 minutes behind schedule             │
│  ⚠️ Next items may need time adjustment         │
│                                                 │
│  Item Time Breakdown                            │
│  ┌─────────────────────────────────────────────┐│
│  │ Item                   Planned   Actual     ││
│  │ 1. Opening              5 min    3 min ✓   ││
│  │ 2. Budget              30 min   35 min ⚠️  ││
│  │ 3. New Business        45 min   -- min     ││
│  │ 4. Elections           60 min   -- min     ││
│  │ 5. Closing             15 min   -- min     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Time Adjustment Suggestions                    │
│  • Reduce New Business to 35 minutes           │
│  • Start Elections 10 minutes early            │
│  • Extend meeting by 15 minutes                │
│                                                 │
│  [Apply Suggestions] [Manual Adjustment]        │
└─────────────────────────────────────────────────┘
```

## Projector Integration

### Agenda Item Projection
```
┌─────────────────────────────────────────────────┐
│  Project agenda item                    [x]     │
├─────────────────────────────────────────────────┤
│  Item: Budget Presentation                      │
│                                                 │
│  Projection options:                            │
│  ☑ Show item title and description             │
│  ☑ Display current speaker                     │
│  ☑ Show speaker queue                          │
│  ☐ Display time remaining                       │
│  ☑ Show associated content                     │
│                                                 │
│  Projector selection:                           │
│  ☑ Main Projector (Participants)               │
│  ☐ Secondary Projector (Public)                │
│  ☐ Online Stream                                │
│                                                 │
│  Display format:                                │
│  ● Full agenda item view                        │
│  ○ Title and speaker only                       │
│  ○ Custom template                              │
│                                                 │
│  Additional elements:                           │
│  ☑ Meeting logo                                │
│  ☑ Meeting title                               │
│  ☑ Current time                                │
│  ☐ Organization branding                       │
│                                                 │
│  [Cancel]                        [Start Projection]│
└─────────────────────────────────────────────────┘
```

## Advanced Features

### Agenda Templates
```
┌─────────────────────────────────────────────────┐
│  Agenda Templates                               │
├─────────────────────────────────────────────────┤
│  Available Templates                            │
│                                                 │
│  📋 Standard Board Meeting                      │
│  • Opening, Reports, New Business, Elections   │
│  • Estimated time: 2.5 hours                   │
│                                                 │
│  📋 Annual General Assembly                     │
│  • Full formal meeting structure               │
│  • Estimated time: 4 hours                     │
│                                                 │
│  📋 Committee Meeting                           │
│  • Focused discussion format                   │
│  • Estimated time: 1.5 hours                   │
│                                                 │
│  📋 Emergency Meeting                           │
│  • Streamlined urgent decisions                │
│  • Estimated time: 45 minutes                  │
│                                                 │
│  Template Actions                               │
│  [Apply Template] [Create Custom] [Import]       │
│                                                 │
│  Custom Template Creation                       │
│  Template name: [____________________]          │
│  Base on current agenda: ☑                     │
│  Include time estimates: ☑                     │
│  Include speaker settings: ☑                   │
│                                                 │
│  [Save Template] [Cancel]                       │
└─────────────────────────────────────────────────┘
```

### Import/Export Options
```
┌─────────────────────────────────────────────────┐
│  Import/Export Agenda                   [x]     │
├─────────────────────────────────────────────────┤
│  Import Options                                 │
│  ● Import from CSV file                         │
│  ○ Import from previous meeting                 │
│  ○ Import from template                         │
│  ○ Copy from another meeting                    │
│                                                 │
│  CSV Format Requirements                        │
│  • Title, Duration, Visibility, Parent Item    │
│  • Sample file: [Download template.csv]        │
│                                                 │
│  Export Options                                 │
│  ☑ Export agenda structure                     │
│  ☑ Include speaker lists                       │
│  ☑ Include time information                    │
│  ☑ Include associated content                  │
│  ☐ Include moderator notes                     │
│                                                 │
│  Export Format                                  │
│  ● PDF document                                 │
│  ○ CSV spreadsheet                              │
│  ○ Word document                                │
│  ○ JSON data                                    │
│                                                 │
│  [Import] [Export] [Cancel]                     │
└─────────────────────────────────────────────────┘
```

## Data Models

### Agenda Item Model
```typescript
{
  id: number;
  item_number: string;
  title: string;
  content_object_id?: string;
  comment?: string;
  closed: boolean;
  type: number;
  is_internal: boolean;
  is_hidden: boolean;
  duration?: number;
  weight: number;
  level: number;
  parent_id?: number;
  child_ids: number[];
  projection_ids: number[];
  current_projector_ids: number[];
  meeting_id: number;
  moderator_notes?: string;
  created: number;
  last_modified: number;
}
```

### Speaker Model
```typescript
{
  id: number;
  user_id: number;
  list_of_speakers_id: number;
  begin_time?: number;
  end_time?: number;
  weight: number;
  marked: boolean;
  point_of_order: boolean;
  note?: string;
  speech_state?: string;
  structure_level_list_of_speakers_id?: number;
}
```

### List of Speakers Model
```typescript
{
  id: number;
  closed: boolean;
  content_object_id: string;
  speaker_ids: number[];
  projection_ids: number[];
  current_projector_ids: number[];
  meeting_id: number;
  structure_level_countdown_enabled: boolean;
  initial_time?: number;
  countdown_time?: number;
}
```

## E2E Test Selectors

### Agenda List
- Agenda list: `.agenda-list`
- Agenda item: `.agenda-item`
- Item number: `.item-number`
- Item title: `.item-title`
- Item visibility: `.item-visibility`
- Item duration: `.item-duration`

### Agenda Item Detail
- Item detail: `.agenda-item-detail`
- Content section: `.item-content`
- Speaker list: `.speaker-list`
- Time controls: `.time-controls`
- Status controls: `.status-controls`

### Speaker Management
- Speaker queue: `.speaker-queue` 
- Current speaker: `.current-speaker`
- Add speaker: `.add-speaker`
- Speaker controls: `.speaker-controls`
- Time display: `.speaking-time`

## Keyboard Shortcuts
- `Ctrl+N`: Create new agenda item
- `Ctrl+E`: Edit current item
- `Ctrl+S`: Start/stop current speaker
- `Ctrl+P`: Project current item
- `Space`: Next speaker
- `Ctrl+O`: Open/close item
- `Escape`: Cancel current action

## Accessibility Features
- **Screen Reader Support**: Full agenda structure navigation
- **Keyboard Navigation**: Complete keyboard control
- **High Contrast**: Speaker status and time indicators
- **Focus Management**: Clear focus in speaker management
- **Time Announcements**: Audio cues for time limits
- **Structure Navigation**: Hierarchical agenda browsing