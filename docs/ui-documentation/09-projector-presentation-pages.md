# OpenSlides Projector/Presentation Pages Documentation

## Overview
The Projector module provides a comprehensive presentation system for meetings, supporting multiple simultaneous projectors, various content types, and real-time updates. It's designed for large assemblies and conferences requiring professional presentation capabilities.

## URL Routes
- Projector list: `/:meetingId/projectors`
- Projector detail: `/:meetingId/projectors/:sequential_number`
- Fullscreen view: `/:meetingId/projectors/:sequential_number/fullscreen`

## Projector List Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Projectors                    [+ New] [⋮ Menu] │
├─────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐        │
│  │ Main Screen     │ │ Side Display   │        │
│  │ ⭐ Reference    │ │                │        │
│  │                 │ │                │        │
│  │ [Live Preview] │ │ [Live Preview] │        │
│  │                 │ │                │        │
│  │ Resolution:     │ │ Resolution:     │        │
│  │ 1920×1080      │ │ 1024×768       │        │
│  │                 │ │                │        │
│  │ [View] [⚙️]    │ │ [View] [⚙️]    │        │
│  └─────────────────┘ └─────────────────┘        │
│  ┌─────────────────┐ ┌─────────────────┐        │
│  │ Lobby Display   │ │ Stream Output  │        │
│  │ 🔒 Internal     │ │                │        │
│  │                 │ │                │        │
│  │ [Live Preview] │ │ [Live Preview] │        │
│  │                 │ │                │        │
│  │ Resolution:     │ │ Resolution:     │        │
│  │ 1280×720       │ │ 1920×1080      │        │
│  │                 │ │                │        │
│  │ [View] [⚙️]    │ │ [View] [⚙️]    │        │
│  └─────────────────┘ └─────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Projector Cards
Each projector displays:
- **Name**: Projector title
- **Status Icons**:
  - ⭐ = Reference projector
  - 🔒 = Internal (not public)
- **Live Preview**: Real-time content preview
- **Resolution**: Current display size
- **Actions**:
  - View: Open detail/fullscreen
  - Settings (⚙️): Edit configuration

### List Actions

#### New Projector Button (+)
Opens creation dialog:
```
┌─────────────────────────────────────────────────┐
│  Create new projector                   [x]     │
├─────────────────────────────────────────────────┤
│  Name *                                         │
│  [Conference Display_________]                  │
│                                                 │
│  □ Internal projector                           │
│     Only visible to authorized users            │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

## Projector Detail Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Main Screen           [⚙️] [⛶] [✏️ Edit mode] │
├─────────────────────────────────────────────────┤
│  Controls: [-][+] [↑][↓] [◀][▶] [🔄 Live]     │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │                                             ││
│  │          Live Projector Display             ││
│  │                                             ││
│  │     [Current content being projected]       ││
│  │                                             ││
│  │                                             ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  Current Projections (2)                        │
│  ┌─────────────────────────────────────────────┐│
│  │ 📋 Current Agenda Item: 3.1 Budget         ││
│  │ 🎤 Current Speaker: John Doe (02:45)       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Preview (5)                    [Project all]   │
│  ┌─────────────────────────────────────────────┐│
│  │ ≡ 📝 Motion A001: Budget Approval    [📽️][x]││
│  │ ≡ 🗳️ Election Results: Board         [📽️][x]││
│  │ ≡ 📄 Financial Report PDF            [📽️][x]││
│  │ ≡ 💬 Message: 5 min break            [📽️][x]││
│  │ ≡ ⏱️ Countdown: Session Timer        [📽️][x]││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Control Panel
1. **Scale Controls**:
   - [-] Zoom out
   - [+] Zoom in
   - Reset to 100%

2. **Scroll Controls**:
   - [↑] Scroll up
   - [↓] Scroll down
   - Special PDF: Page navigation

3. **Navigation**:
   - [◀] Previous slide
   - [▶] Next slide

4. **Update Mode**:
   - [🔄 Live] Auto-refresh enabled
   - Click to toggle manual mode

### Queue Management

#### Current Projections
- Shows all active content
- Cannot be reordered
- Can be removed with [x]

#### Preview Queue
- Drag handle (≡) for reordering
- Project button (📽️) to activate
- Delete button (x) to remove
- "Project all" for bulk activation

#### Edit Mode
Toggle to enable:
- Drag-and-drop reordering
- Queue item deletion
- Bulk operations

## Projector Settings

### Configuration Dialog
```
┌─────────────────────────────────────────────────┐
│  Projector settings                     [x]     │
├─────────────────────────────────────────────────┤
│  General                                        │
│                                                 │
│  Name *                                         │
│  [Main Screen_________________]                 │
│                                                 │
│  □ Internal projector                           │
│  ☑ Set as reference projector                  │
│                                                 │
│  Display Settings                               │
│                                                 │
│  Resolution width (px)                          │
│  [1920________________________]                 │
│                                                 │
│  Aspect ratio                                   │
│  ● 16:9   ○ 4:3   ○ 16:10   ○ Custom           │
│                                                 │
│  Custom ratio: [16] : [9]                       │
│                                                 │
│  Theme Colors                                   │
│                                                 │
│  Background        Foreground                   │
│  [#ffffff] [🎨]   [#000000] [🎨]               │
│                                                 │
│  Header background Header foreground            │
│  [#317796] [🎨]   [#ffffff] [🎨]               │
│                                                 │
│  Chyron Colors                                  │
│                                                 │
│  Speaker name      Other content                │
│  [#317796] [🎨]   [#ffffff] [🎨]               │
│                                                 │
│  Display Options                                │
│                                                 │
│  ☑ Show header and footer                       │
│  ☑ Show title in header                         │
│  ☑ Show logo                                    │
│  ☑ Show clock                                   │
│                                                 │
│  [Cancel]                         [Save]        │
└─────────────────────────────────────────────────┘
```

## Content Types

### Agenda Display
```
┌─────────────────────────────────────────────────┐
│  Agenda                                         │
├─────────────────────────────────────────────────┤
│  1. Opening and Welcome                     ✓  │
│  2. Approval of Minutes                     ✓  │
│  3. Financial Report                            │
│     3.1 Budget Overview            ← Current    │
│     3.2 Quarterly Results                       │
│  4. Elections                                   │
│  5. Any Other Business                          │
└─────────────────────────────────────────────────┘
```

### Motion Display
```
┌─────────────────────────────────────────────────┐
│  Motion A001 - Budget Approval 2024             │
├─────────────────────────────────────────────────┤
│  Submitted by: Finance Committee                │
│  Status: Under Discussion                       │
│                                                 │
│  Text:                                          │
│  The assembly approves the proposed budget      │
│  for fiscal year 2024 with total expenses      │
│  of $2.5 million...                            │
│                                                 │
│  Reason:                                        │
│  Due to increased operational costs...          │
└─────────────────────────────────────────────────┘
```

### Current Speaker Display
```
┌─────────────────────────────────────────────────┐
│  Current Speaker                                │
├─────────────────────────────────────────────────┤
│                                                 │
│          👤 John Doe                            │
│                                                 │
│          ⏱️ 02:45                               │
│                                                 │
│  Speaking on: Budget Overview                   │
└─────────────────────────────────────────────────┘
```

### List of Speakers
```
┌─────────────────────────────────────────────────┐
│  List of Speakers - Budget Overview             │
├─────────────────────────────────────────────────┤
│  Current:                                       │
│  🎤 John Doe (02:45)                           │
│                                                 │
│  Waiting:                                       │
│  1. Jane Smith                                  │
│  2. Bob Johnson                                 │
│  3. Alice Brown (Point of Order)                │
│                                                 │
│  Finished (showing last 3):                     │
│  • Mike Wilson (03:12)                          │
│  • Sarah Davis (02:30)                          │
│  • Tom Anderson (04:15)                         │
└─────────────────────────────────────────────────┘
```

### PDF/Media Display
- Full PDF viewer with page controls
- Image display with zoom/pan
- Auto-scaling to fit projector
- Page navigation for multi-page documents

### Message Display
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│                                                 │
│        Coffee Break - 15 Minutes                │
│                                                 │
│        Please return at 10:45 AM                │
│                                                 │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Countdown Timer
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│          Session Timer                          │
│                                                 │
│            04:32                                │
│                                                 │
│      ████████████░░░░░░░░░░                    │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Speaker Chyron Overlay
```
┌─────────────────────────────────────────────────┐
│  [Main projected content]                       │
│                                                 │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  John Doe          │  Agenda: Budget Overview   │
└─────────────────────────────────────────────────┘
```

## Projection Defaults

Access via menu to set default behavior:
- Which content auto-projects
- Default projector for each content type
- Chyron overlay settings

## Technical Details

### Data Models

**Projector Model**:
```typescript
{
  id: number;
  name: string;
  width: number;  // pixels
  aspect_ratio_numerator: number;
  aspect_ratio_denominator: number;
  background_color: string;
  foreground_color: string;
  header_background_color: string;
  header_foreground_color: string;
  chyron_color_1: string;  // Speaker
  chyron_color_2: string;  // Content
  show_header_footer: boolean;
  show_title: boolean;
  show_logo: boolean;
  show_clock: boolean;
  is_internal: boolean;
  scale: number;
  scroll: number;
  current_projection_ids: number[];
  preview_projection_ids: number[];
  history_projection_ids: number[];
}
```

**Projection Model**:
```typescript
{
  id: number;
  projector_id: number;
  content_object_id: string;
  type: SlideType;
  options: any;  // Slide-specific options
  weight: number;  // For ordering
}
```

### Services
- `ProjectorControllerService`: CRUD operations
- `ProjectorRepositoryService`: Data access
- `ProjectionControllerService`: Content management
- `ProjectorMessageService`: Message handling
- `ProjectorCountdownService`: Timer management
- `SlideService`: Slide type registration

### Slide Types
Each slide type has:
- Scalability flag
- Scrollability flag
- Component class
- Slide options interface
- Specific rendering logic

### Permissions
- `projector.can_see`: View projectors
- `projector.can_manage`: Full control
- Internal projectors require manage permission

## E2E Test Selectors

### List Page
- New button: `button[matTooltip="New projector"]`
- Projector cards: `.projector-card`
- View button: `button[matTooltip="View"]`
- Settings button: `button[matTooltip="Settings"]`

### Detail Page
- Scale controls: `button.scale-up`, `button.scale-down`
- Scroll controls: `button.scroll-up`, `button.scroll-down`
- Navigation: `button.previous-slide`, `button.next-slide`
- Edit mode toggle: `mat-slide-toggle.edit-mode`
- Preview items: `.preview-item`
- Project button: `button.project-button`

### Settings Dialog
- Name input: `input[formControlName="name"]`
- Width input: `input[formControlName="width"]`
- Aspect ratio: `mat-radio-button[value="16:9"]`
- Color pickers: `input[type="color"]`
- Checkboxes: `mat-checkbox`

### Content Areas
- Live display: `.projector-live-view`
- Current projections: `.current-projections`
- Preview queue: `.preview-queue`
- Chyron overlay: `.speaker-chyron`

## Keyboard Shortcuts
- `F11`: Toggle fullscreen
- `+/-`: Scale controls
- `Arrow keys`: Scroll/navigate
- `Space`: Toggle play/pause (countdowns)
- `Escape`: Exit fullscreen

## Accessibility Features
- ARIA live regions for updates
- Keyboard navigation support
- Screen reader announcements
- High contrast theme support
- Focus indicators
- Alternative text for visual content