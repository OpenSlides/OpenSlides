# OpenSlides Projector System Detailed Documentation

## Overview
The Projector system provides comprehensive presentation and display management, allowing real-time projection of meeting content including agendas, motions, elections, speaker lists, and custom content to multiple screens and display devices.

## URL Routes
- Projectors main: `/:meetingId/projector`
- Specific projector: `/:meetingId/projector/:projectorId`
- Projector management: `/:meetingId/projector/manage`

## Projector Interface Layout
```
┌─────────────────────────────────────────────────┐
│  Projectors                            [+] [⋮]  │
├─────────────────────────────────────────────────┤
│  Multiple Projector View                        │
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ Default projector              ⭐ ✏️ 🗑      ││
│  │ ┌─────────────────────────────────────────┐ ││
│  │ │ OpenSlides Demo             ⏰ 16:36   │ ││
│  │ │ Presentation and assembly system       │ ││
│  │ ├─────────────────────────────────────────┤ ││
│  │ │ Wahl                                   │ ││
│  │ │ Election                               │ ││
│  │ │                                       │ ││
│  │ │ Candidates                             │ ││
│  │ │ • Administrator (Test structure level)│ ││
│  │ │ • b (Test structure level b)          │ ││
│  │ │ • a (Test structure level a)          │ ││
│  │ │                                       │ ││
│  │ │ ┌─────────────────────────────────────┐ ││
│  │ │ │ List of speakers                    │ ││
│  │ │ │ 1. Administrator (Test structure    │ ││
│  │ │ │    level...)                        │ ││
│  │ │ │ 2. a (Test structure level a...)    │ ││
│  │ │ │ 3. b (Test structure level b...)    │ ││
│  │ │ └─────────────────────────────────────┘ ││
│  │ └─────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ Nebenprojektor                 ⭐ ✏️ 🗑      ││
│  │ ┌─────────────────────────────────────────┐ ││
│  │ │ OpenSlides Demo             ⏰ 15:36   │ ││
│  │ │ Presentation and assembly system       │ ││
│  │ │                                       │ ││
│  │ │ [Gray projection area - no content]    │ ││
│  │ │                                       │ ││
│  │ └─────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Projector Types and Configuration

### Default Projector
- **Primary Display**: Main meeting presentation screen
- **Full Content Support**: Can display all projection types
- **Real-time Updates**: Live content synchronization
- **Multi-layer Content**: Overlays and composite projections

### Secondary Projectors (Nebenprojektor)
- **Auxiliary Displays**: Additional screens for specific content
- **Specialized Content**: Focus on specific meeting aspects
- **Independent Control**: Separate content management
- **Flexible Configuration**: Customizable display options

### Projector Controls
Each projector features:
- **Star Icon (⭐)**: Mark as favorite/primary
- **Edit Icon (✏️)**: Configure projector settings
- **Delete Icon (🗑)**: Remove projector
- **Time Display (⏰)**: Current time or countdown
- **Content Area**: Live projection preview

## Projection Content Types

### Meeting Header Information
```
┌─────────────────────────────────────────────────┐
│ OpenSlides Demo                      ⏰ 16:36   │
│ Presentation and assembly system                │
└─────────────────────────────────────────────────┘
```
- **Meeting Title**: Display meeting name
- **Description**: Meeting subtitle or description
- **Time Display**: Current time or meeting countdown
- **Branding**: Organization logo and styling

### Election Projection
```
┌─────────────────────────────────────────────────┐
│ Wahl                                            │
│ Election                                        │
│                                                 │
│ Candidates                                      │
│ • Administrator (Test structure level)          │
│ • b (Test structure level b)                    │
│ • a (Test structure level a)                    │
└─────────────────────────────────────────────────┘
```

#### Election Content Elements
- **Election Title**: Name of the current election
- **Election Type**: Type indicator (e.g., "Election")
- **Candidate List**: Live candidate information
- **Voting Status**: Current election phase
- **Results Display**: Real-time vote tallies (when appropriate)

### List of Speakers Projection
```
┌─────────────────────────────────────────────────┐
│ List of speakers                                │
│ 1. Administrator (Test structure level...)      │
│ 2. a (Test structure level a...)                │
│ 3. b (Test structure level b...)                │
└─────────────────────────────────────────────────┘
```

#### Speaker List Features
- **Sequential Numbering**: Speaker order indication
- **Speaker Names**: Full participant names
- **Additional Info**: Structure level, titles, affiliations
- **Current Speaker**: Highlighted active speaker
- **Real-time Updates**: Live queue management

### Agenda Item Projection
- **Item Number**: Agenda item numbering
- **Item Title**: Agenda item name
- **Item Status**: Current state (open, closed, hidden)
- **Duration**: Time allocation and tracking
- **Sub-items**: Hierarchical agenda structure

### Motion Projection
- **Motion Number**: Sequential motion identifier
- **Motion Title**: Motion subject line
- **Motion Text**: Full motion content with line numbers
- **Motion Status**: Current workflow state
- **Submitter Information**: Motion authors and supporters
- **Amendment Display**: Related amendments and changes

## Projector Management

### Create New Projector Dialog
```
┌─────────────────────────────────────────────────┐
│  Create projector                       [x]     │
├─────────────────────────────────────────────────┤
│  Projector name *                               │
│  [Secondary Display_________________]           │
│                                                 │
│  Resolution                                     │
│  ● 1920x1080 (Full HD)                         │
│  ○ 1280x720 (HD)                               │
│  ○ 1024x768 (XGA)                              │
│  ○ Custom: [____] x [____]                      │
│                                                 │
│  Aspect ratio                                   │
│  ● 16:9 (Widescreen)                            │
│  ○ 4:3 (Standard)                               │
│  ○ 16:10 (Widescreen variant)                   │
│                                                 │
│  Default content                                │
│  [Meeting header ▼]                             │
│                                                 │
│  Background color                               │
│  [⚪] #FFFFFF                                   │
│                                                 │
│  Show scroll bar                                │
│  ☑ Enable scroll bar for long content          │
│                                                 │
│  Show header                                    │
│  ☑ Display meeting information header          │
│                                                 │
│  Show clock                                     │
│  ☑ Display current time                        │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Projector Configuration Options
- **Display Settings**: Resolution, aspect ratio, scaling
- **Content Preferences**: Default projection type, background
- **Layout Options**: Header display, clock, scroll bars
- **Color Scheme**: Background colors, text colors, themes
- **Interaction Settings**: Click behavior, navigation controls

### Edit Projector Settings
```
┌─────────────────────────────────────────────────┐
│  Edit projector                         [x]     │
├─────────────────────────────────────────────────┤
│  Projector name                                 │
│  [Default projector________________]            │
│                                                 │
│  Current content                                │
│  ┌─────────────────────────────────────────────┐│
│  │ 1. Meeting header                           ││
│  │    OpenSlides Demo                   [🗑]  ││
│  │ 2. Election: Wahl                           ││
│  │    Candidate list and voting         [🗑]  ││
│  │ 3. List of speakers                         ││
│  │    Current speaker queue             [🗑]  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Available content to project                   │
│  [Add content ▼]                                │
│                                                 │
│  Projection order                               │
│  ☑ Allow content stacking                      │
│  ☐ Replace content on new projection           │
│                                                 │
│  Display settings                               │
│  Scale: [100%] Zoom: [Fit to screen ▼]         │
│                                                 │
│  [Delete Projector]                             │
│                                                 │
│  [Cancel]                           [Save]      │
└─────────────────────────────────────────────────┘
```

### Content Management
- **Layer System**: Multiple content layers with stacking
- **Content Queue**: Ordered list of projection items
- **Quick Actions**: Add, remove, reorder projected content
- **Preview Mode**: Test content before projecting
- **Template Projections**: Predefined content combinations

## Projection Controls

### Content Selection Menu
```
┌─────────────────────────────────────────────────┐
│  Add content to projection              [x]     │
├─────────────────────────────────────────────────┤
│  Content categories                             │
│                                                 │
│  📋 Agenda                                      │
│  ├─ Current agenda item                         │
│  ├─ Full agenda list                            │
│  └─ Agenda item details                         │
│                                                 │
│  📄 Motions                                     │
│  ├─ Current motion                              │
│  ├─ Motion list                                 │
│  ├─ Motion text with line numbers               │
│  └─ Amendment overview                          │
│                                                 │
│  🗳️ Elections                                   │
│  ├─ Current election                            │
│  ├─ Candidate list                              │
│  ├─ Election results                            │
│  └─ Voting instructions                         │
│                                                 │
│  🎤 Speakers                                    │
│  ├─ Current list of speakers                    │
│  ├─ Next speakers preview                       │
│  └─ Speaking time countdown                     │
│                                                 │
│  👥 Participants                                │
│  ├─ Participant list                            │
│  ├─ Presence overview                           │
│  └─ Group information                           │
│                                                 │
│  📄 Custom Content                              │
│  ├─ Custom text                                 │
│  ├─ Uploaded images                             │
│  ├─ External webpage                            │
│  └─ Countdown timer                             │
│                                                 │
│  [Cancel]                          [Project]    │
└─────────────────────────────────────────────────┘
```

### Projection Actions
- **Project**: Add content to active projector
- **Project to All**: Send content to all projectors
- **Project to Specific**: Choose target projector
- **Preview**: Test projection without displaying
- **Schedule**: Queue content for future projection

### Real-time Controls
- **Play/Pause**: Control dynamic content
- **Previous/Next**: Navigate through content items
- **Zoom Controls**: Adjust content scaling
- **Scroll Controls**: Navigate long content
- **Overlay Toggle**: Show/hide overlays

## Advanced Projection Features

### Multi-Screen Support
- **Extended Desktop**: Span content across multiple screens
- **Duplicate Mode**: Same content on multiple projectors
- **Independent Mode**: Different content per projector
- **Mixed Configuration**: Combination of modes

### Content Synchronization
- **Live Updates**: Automatic content refresh
- **WebSocket Integration**: Real-time data synchronization
- **State Management**: Consistent content state
- **Conflict Resolution**: Handle simultaneous updates

### Presentation Templates
```
┌─────────────────────────────────────────────────┐
│  Presentation templates                         │
├─────────────────────────────────────────────────┤
│  Quick templates                                │
│                                                 │
│  📋 Meeting Opening                             │
│  • Meeting header + Agenda overview             │
│                                                 │
│  🗳️ Election Setup                              │
│  • Election info + Candidate list + Speakers    │
│                                                 │
│  📄 Motion Discussion                           │
│  • Motion text + Speakers + Amendment status    │
│                                                 │
│  🎤 Speaker Session                             │
│  • Current speaker + Queue + Timer              │
│                                                 │
│  📊 Results Display                             │
│  • Voting results + Statistics + Next item      │
│                                                 │
│  Custom templates (3)                           │
│  • Board Meeting Standard                       │
│  • Committee Presentation                       │
│  • Annual Assembly Layout                       │
│                                                 │
│  [Create Template] [Import] [Export]            │
└─────────────────────────────────────────────────┘
```

### Custom Content Creation
```
┌─────────────────────────────────────────────────┐
│  Create custom content                  [x]     │
├─────────────────────────────────────────────────┤
│  Content type                                   │
│  ● Text message                                 │
│  ○ Image/Logo                                   │
│  ○ Countdown timer                              │
│  ○ External webpage                             │
│                                                 │
│  Content title                                  │
│  [Break Announcement________________]           │
│                                                 │
│  Message text                                   │
│  [15-minute break                               │
│   Meeting resumes at 14:30                     │
│   Coffee and refreshments available]            │
│                                                 │
│  Text formatting                                │
│  Font size: [Large ▼] Color: [⬛] #000000      │
│  ☑ Bold   ☐ Italic   ☐ Center align           │
│                                                 │
│  Background                                     │
│  Color: [⚪] #FFFFFF                            │
│  Image: [Choose file...]                        │
│                                                 │
│  Display duration                               │
│  ☐ Manual control                               │
│  ☑ Auto-hide after: [15] minutes               │
│                                                 │
│  [Preview]                    [Create]          │
└─────────────────────────────────────────────────┘
```

## Integration Features

### Meeting Integration
- **Agenda Synchronization**: Automatic agenda item projection
- **Motion Workflow**: Projection follows motion states
- **Speaker Management**: Live speaker queue updates
- **Election Process**: Real-time election content
- **Voting Integration**: Live poll and voting results

### External Systems
- **HDMI/Display Port**: Direct hardware connection
- **Network Streaming**: IP-based projection
- **Web Browser**: Browser-based projection clients
- **Mobile Devices**: Smartphone/tablet projection
- **Recording Systems**: Integration with recording equipment

### API and Automation
- **Projection API**: Programmatic content control
- **Webhook Integration**: External system notifications
- **Scheduled Projections**: Automated content scheduling
- **Remote Control**: External projection management
- **Backup Systems**: Failover projection capabilities

## Technical Implementation

### Data Models

**Projector Model**:
```typescript
{
  id: number;
  name: string;
  meeting_id: number;
  used_as_reference_projector_meeting_id?: number;
  used_as_default_projector_for_agenda_item_list_in_meeting_id?: number;
  used_as_default_projector_for_current_list_of_speakers_in_meeting_id?: number;
  scale: number;
  scroll: number;
  width: number;
  height: number;
  color: string;
  background_color: string;
  header_background_color: string;
  header_font_color: string;
  header_h1_color: string;
  chyron_background_color: string;
  chyron_font_color: string;
  show_header_footer: boolean;
  show_title: boolean;
  show_logo: boolean;
}
```

**Projection Model**:
```typescript
{
  id: number;
  current_projector_id: number;
  content_object_id: string;
  stable: boolean;
  type: string;
  options: ProjectionOptions;
  weight: number;
}
```

### Services
- `ProjectorService`: Core projection management
- `ProjectionService`: Content projection handling  
- `ProjectorControlService`: Real-time projection control
- `WebSocketService`: Live projection updates
- `ProjectionElementService`: Content element management

## E2E Test Selectors

### Projector Interface
- Projectors container: `.projectors-container`
- Projector card: `.projector-card`
- Projector name: `.projector-name`
- Projection content: `.projection-content`
- Projector controls: `.projector-controls`

### Projection Management
- Create projector: `button[matTooltip="Create projector"]`
- Edit projector: `button[matTooltip="Edit projector"]`
- Delete projector: `button[matTooltip="Delete projector"]`
- Project content: `button.project-content`
- Content selector: `.content-selector`

### Content Controls
- Add content: `button.add-content`
- Remove content: `button.remove-content`
- Content layer: `.content-layer`
- Projection preview: `.projection-preview`

## Keyboard Shortcuts
- `P`: Toggle projection mode
- `F`: Fullscreen projection
- `Ctrl+P`: Quick project current item
- `Ctrl+Shift+P`: Project to all screens
- `Escape`: Clear all projections
- `Space`: Toggle content playback

## Accessibility Features
- **Screen Reader Support**: ARIA labels for all projection controls
- **Keyboard Navigation**: Full keyboard control of projections
- **High Contrast**: Accessible color schemes for projections
- **Font Scaling**: Adjustable text size for projections
- **Alternative Formats**: Text alternatives for visual content

## Performance Features
- **Hardware Acceleration**: GPU-optimized rendering
- **Lazy Loading**: Load projection content on demand
- **Caching**: Cache frequently projected content
- **WebSocket Optimization**: Efficient real-time updates
- **Resource Management**: Optimize memory usage for multiple projectors