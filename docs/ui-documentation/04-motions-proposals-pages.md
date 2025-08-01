# OpenSlides Motions/Proposals Pages Documentation

## Overview
The Motions module is one of the most complex features in OpenSlides, providing comprehensive proposal management with workflows, amendments, voting, and change recommendations. It supports various organizational procedures and parliamentary rules.

## URL Routes
- Motion list: `/:meetingId/motions`
- Motion detail: `/:meetingId/motions/:sequential_number`
- Motion creation: `/:meetingId/motions/new`
- Motion edit: `/:meetingId/motions/:sequential_number/edit`
- Amendment list: `/:meetingId/motions/amendments`
- Motion blocks: `/:meetingId/motions/blocks`
- Categories: `/:meetingId/motions/categories`
- Workflows: `/:meetingId/motions/workflows`
- Import: `/:meetingId/motions/import`
- Call list: `/:meetingId/motions/call-list`

## Motion List Page

### View Modes

#### Tile View (Default)
```
┌─────────────────────────────────────────────────┐
│  Motions                    [+ New] [⋮ Menu]    │
├─────────────────────────────────────────────────┤
│  [List] [Tiles]  [Filter] [Sort] [Search____]  │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ ⭐ Favs  │ │ 📝 Notes │ │ No Cat.  │        │
│  │    12    │ │     5    │ │    23    │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Finance  │ │ Rules    │ │ General  │        │
│  │    15    │ │     8    │ │    31    │        │
│  └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────┘
```

#### List View
```
┌─────────────────────────────────────────────────┐
│  □ | # | Title | State | Recommendation | Menu  │
├─────────────────────────────────────────────────┤
│  □ A001 Budget 2024  Permitted  Accept    [⋮]  │
│  □ A002 New Bylaws   Discussion Reject    [⋮]  │
│  □ A003 Election...  Voting     ---       [⋮]  │
└─────────────────────────────────────────────────┘
```

### Header Actions

#### New Motion Button (+)
Opens motion creation form

#### Menu Actions (⋮)
- **Categories**: Manage motion categories
- **Motion blocks**: Manage motion blocks
- **Workflows**: Edit workflow states
- **Call list**: Presentation order
- **Amendments**: View all amendments
- **Import**: Bulk import motions
- **Export**: PDF/CSV/Excel export

### Multiselect Actions
- **Set state**: Bulk state change
- **Set recommendation**: Bulk recommendation
- **Set category**: Assign category
- **Set block**: Assign to block
- **Export**: Export selected
- **Move**: Move to another meeting
- **Delete**: Remove motions

### Filters
1. **Submitters**: Filter by motion authors
2. **Categories**: By assigned categories
3. **Motion blocks**: By assigned blocks
4. **States**: Current workflow state
5. **Recommendations**: By recommendation
6. **Tags**: By assigned tags
7. **Favorites**: Personal favorites
8. **Personal notes**: Has notes
9. **Amendments**: Show only amendments

## Motion Detail Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  A001 - Budget Proposal 2024    [✏️] [⋮] [←→]  │
├─────────────────────────────────────────────────┤
│  State: [Permitted ▼]  Rec: [Accept ▼]         │
├─────────────────────────────────────────────────┤
│  Tabs: [Content] [Amendments] [Info]            │
│  ┌─────────────────────────────────────────────┐│
│  │ Content Tab                                 ││
│  │                                             ││
│  │ Text:                                       ││
│  │ The assembly decides to approve the        ││
│  │ budget for 2024 with the following...      ││
│  │                                             ││
│  │ Reason:                                     ││
│  │ Due to increased costs and new projects... ││
│  │                                             ││
│  │ [Show full text ▼]                          ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Actions:                                       │
│  [Create Poll] [Amendments] [Follow Rec.]       │
└─────────────────────────────────────────────────┘
```

### Content Tab Sections

1. **Motion Text**
   - Original version
   - Changed version (with amendments)
   - Diff view
   - Final version
   - Line numbering toggle

2. **Reason**
   - Explanatory text
   - Not included in amendments

3. **Attachments**
   - Linked files
   - Download links

4. **Comments**
   - Multiple comment sections
   - Permission-based visibility

### Amendments Tab
Shows all amendments to this motion:
```
┌─────────────────────────────────────────────────┐
│  Amendments (3)                   [+ Create]    │
├─────────────────────────────────────────────────┤
│  A001-1: Change paragraph 2      [Accepted]    │
│  A001-2: Add new section         [Rejected]    │
│  A001-3: Modify conclusion       [Pending]     │
└─────────────────────────────────────────────────┘
```

### Info Tab
Displays metadata:
- Submitters
- Supporters
- State history
- Poll results
- Motion block
- Category
- Tags
- Origin/Derived motions

## Motion Creation/Edit Form

### Form Layout
```
┌─────────────────────────────────────────────────┐
│  Create new motion              [💾] [❌]       │
├─────────────────────────────────────────────────┤
│  Title *                                        │
│  [_____________________________________________]│
│                                                 │
│  Text *                                         │
│  ┌─────────────────────────────────────────────┐│
│  │ [Rich Text Editor Toolbar]                  ││
│  │ [B] [I] [U] [Link] [List] [Quote] ...      ││
│  ├─────────────────────────────────────────────┤│
│  │ [Motion text content area]                  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Reason                                         │
│  ┌─────────────────────────────────────────────┐│
│  │ [Reason text editor]                        ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Category: [Select category ▼]                 │
│  Motion block: [Select block ▼]                │
│  Tags: [Select tags...]                         │
│                                                 │
│  Submitters                     [+ Add]         │
│  [John Doe] [x]                                 │
│                                                 │
│  Attachments                    [+ Upload]      │
│                                                 │
│  □ Create as agenda item                        │
│     └─ Type: [Common ▼]                         │
│     └─ Parent: [Select item ▼]                 │
└─────────────────────────────────────────────────┘
```

### Form Fields

#### Required Fields
- **Title**: Motion headline
- **Text**: Main motion content

#### Optional Fields
- **Reason**: Justification (not amendable)
- **Category**: Organizational grouping
- **Motion block**: Thematic grouping
- **Tags**: Labels for filtering
- **Submitters**: Motion authors
- **Supporters**: Required supporters
- **Attachments**: Supporting documents

#### Amendment-Specific
- **Paragraph number**: Which paragraph to amend
- **Amendment text**: Replacement text

## Workflow States

### State Properties
Each state can define:
- **Name**: Display name
- **Color**: Visual indicator
- **Permissions**: Who can see/edit
- **Allow support**: Enable supporter feature
- **Allow polls**: Enable voting
- **Show recommendation**: Display field
- **Next states**: Possible transitions
- **Merge amendment**: Into final version
- **Restrictions**: Edit limitations

### Common Workflow Example
```
[Draft] → [Submitted] → [Permitted] → [Discussion]
                              ↓
                         [Voting] → [Accepted/Rejected]
```

## Motion Blocks

### Block Management
```
┌─────────────────────────────────────────────────┐
│  Motion blocks                    [+ New]       │
├─────────────────────────────────────────────────┤
│  Financial Motions (5 motions)    [✏️] [🗑️]    │
│  □ Internal                                     │
│                                                 │
│  Organizational Changes (3)       [✏️] [🗑️]    │
│  □ Internal                                     │
└─────────────────────────────────────────────────┘
```

### Block Features
- Group related motions
- Create agenda items for blocks
- Internal/public visibility
- Track completion percentage

## Categories

### Category Hierarchy
```
┌─────────────────────────────────────────────────┐
│  Categories                       [+ New]       │
├─────────────────────────────────────────────────┤
│  A. Finance                                     │
│    A.1. Budget                   [✏️] [🗑️]     │
│    A.2. Investments              [✏️] [🗑️]     │
│  B. Organization                                │
│    B.1. Statutes                 [✏️] [🗑️]     │
│    B.2. Elections                [✏️] [🗑️]     │
└─────────────────────────────────────────────────┘
```

### Category Settings
- **Name**: Category title
- **Prefix**: For motion numbering
- **Parent**: Hierarchical organization
- **Weight**: Sort order

## Change Recommendations

### Creating Recommendations
```
┌─────────────────────────────────────────────────┐
│  Create change recommendation                   │
├─────────────────────────────────────────────────┤
│  Line 23-25: "old text"                         │
│                                                 │
│  Change to:                                     │
│  [new text_____________________________________]│
│                                                 │
│  Type: ● Replace ○ Delete ○ Insert              │
│                                                 │
│  [Cancel]                      [Create]         │
└─────────────────────────────────────────────────┘
```

### Diff View
Shows changes with:
- Red strikethrough for deletions
- Green highlighting for additions
- Line numbers for reference
- Accept/Reject buttons

## Voting/Polls

### Poll Creation
```
┌─────────────────────────────────────────────────┐
│  Create poll                                    │
├─────────────────────────────────────────────────┤
│  Poll type: [Yes/No/Abstain ▼]                 │
│  Poll method: [Simple majority ▼]              │
│  Groups: [All participants ▼]                  │
│  □ Anonymous voting                             │
│  □ Publish immediately                          │
│                                                 │
│  [Cancel]                      [Create]         │
└─────────────────────────────────────────────────┘
```

### Poll Results Display
```
Yes:        45 (75%)  ████████████████████░░░░
No:         10 (17%)  ████░░░░░░░░░░░░░░░░░░░░
Abstain:     5 (8%)   ██░░░░░░░░░░░░░░░░░░░░░░
```

## Personal Features

### Personal Notes
- Private text notes per motion
- Star/favorite marking
- Not visible to others
- Exportable

### Follow Recommendation
- Automated voting based on recommendation
- Configurable per motion
- Vote delegation support

## Import/Export

### Import Format (CSV)
```csv
Identifier,Title,Text,Reason,Submitters,Category,Tags
A001,Budget 2024,Motion text...,Because...,John Doe,Finance,urgent
```

### Export Options
- **PDF**: Full catalog or selection
- **CSV**: Metadata export
- **Excel**: Structured data
- **Content options**:
  - Text/reason inclusion
  - Line numbers
  - Change recommendations
  - Comments
  - Voting results

## Technical Details

### Services
- `MotionControllerService`: CRUD operations
- `MotionRepositoryService`: Data access
- `MotionPdfService`: PDF generation
- `MotionCsvExportService`: Data export
- `MotionPermissionService`: Access control
- `ChangeRecommendationRepositoryService`: CR management
- `AmendmentControllerService`: Amendment handling

### Permissions
- `motion.can_create`: Create new motions
- `motion.can_support`: Add as supporter
- `motion.can_manage`: Full management
- `motion.can_manage_metadata`: Edit metadata
- `motion.can_see`: View motions
- `motion.can_see_internal`: View internal fields
- `motion.can_create_amendments`: Create amendments
- `motion.can_manage_polls`: Create/manage polls

## E2E Test Selectors

### List Page
- New button: `button[matTooltip="New motion"]`
- View toggle: `mat-button-toggle-group`
- Category tiles: `.tile-card`
- Motion rows: `.motion-list-row`
- Multiselect: `mat-checkbox.selection-checkbox`

### Detail Page
- Title: `h1.motion-title`
- State select: `mat-select.state-select`
- Recommendation: `mat-select.recommendation-select`
- Tab buttons: `mat-tab-group button`
- Content area: `.motion-content`
- Action buttons: `.motion-actions button`

### Forms
- Title input: `input[formControlName="title"]`
- Text editor: `editor[formControlName="text"]`
- Category select: `mat-select[formControlName="category_id"]`
- Submitter search: `os-search-selector[formControlName="submitter_ids"]`
- Save button: `button.save-button`

## Keyboard Shortcuts
- `Ctrl+Alt+N`: New motion
- `Ctrl+S`: Save (in edit mode)
- `Escape`: Cancel edit/close dialog
- `Space`: Toggle selection in list
- `Enter`: Open selected motion

## Accessibility Features
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation
- Screen reader announcements
- Focus management
- Color contrast compliance
- Status announcements for state changes