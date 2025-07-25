# OpenSlides Autopilot Page Documentation

## Overview
The Autopilot page provides automated meeting management functionality, particularly focused on election processes and speaker list management. It allows moderators to run elections and manage speaking queues with automated workflows.

## URL Routes
- Autopilot main: `/:meetingId/autopilot`

## Page Layout
```
┌─────────────────────────────────────────────────┐
│  Autopilot                                      │
├─────────────────────────────────────────────────┤
│  Election Section                               │
│  ┌─────────────────────────────────────────────┐│
│  │  Wahl                                       ││
│  │  [Election management interface]            ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  Speaker Management                             │
│  ┌─────────────────────────────────────────────┐│
│  │  List of speakers                 🔒  ↻     ││
│  │  ┌─────────────────────────────────────────┐││
│  │  │ 1. ▶️ Administrator (Test structure    │││
│  │  │      level - No. 12345-67890 - male)   │││
│  │  │                             ⋮         │││
│  │  ├─────────────────────────────────────────┤││
│  │  │ 2. ▶ a (Test structure level a -      │││
│  │  │      No. 12345-67891 - female)         │││
│  │  │                             ⋮         │││
│  │  ├─────────────────────────────────────────┤││
│  │  │ 3. ▶ b (Test structure level b -      │││
│  │  │      No. 12345-67892 - diverse)        │││
│  │  │                             ⋮         │││
│  │  └─────────────────────────────────────────┘││
│  │                                             ││
│  │  Select speaker           ▼                 ││
│  │                                             ││
│  │  [-  Remove me]    [⚠️  Point of order]    ││
│  │                                             ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Election Management (Wahl)

### Purpose
The election section provides automated tools for managing electoral processes within meetings, including:
- **Candidate Management**: Handling electoral candidates
- **Voting Process**: Automating vote collection and counting
- **Results Display**: Presenting election outcomes
- **Workflow Management**: Guiding through election phases

### Features
- **Automated Elections**: Streamlined election processes
- **Real-time Updates**: Live election progress tracking
- **Candidate Lists**: Management of electoral candidates
- **Vote Tallying**: Automated counting and result calculation

## List of Speakers Management

### Speaker Queue Display
The speaker list shows registered speakers in order with detailed information:

#### Speaker Entry Format
```
Position. ▶️ Name (Additional Info)
   Detailed participant information
   Action menu (⋮)
```

### Speaker Information
Each speaker entry displays:
- **Position Number**: Sequential speaking order (1, 2, 3...)
- **Play Button (▶️)**: Indicates current or next speaker
- **Speaker Name**: Full participant name
- **Participant Details**: 
  - Test structure level information
  - Participant ID number
  - Gender designation (male, female, diverse)

### Speaker Controls

#### Current Speaker Management
- **Active Speaker Indicator**: Visual highlighting of current speaker
- **Play Controls**: Start/stop speaking time
- **Time Management**: Speaking duration tracking
- **Next Speaker**: Automatic progression to next in queue

#### Queue Management
- **Speaker Registration**: "Select speaker" dropdown for adding speakers
- **Remove from Queue**: "Remove me" button for self-removal
- **Point of Order**: Emergency interrupt mechanism for urgent matters
- **Queue Reordering**: Administrative tools for changing speaker order

### Speaker Queue Actions

#### Add Speaker
- **Dropdown Selection**: Choose from eligible participants
- **Automatic Queuing**: Add to end of current speaker list
- **Duplicate Prevention**: Prevent same speaker appearing twice
- **Permission Checks**: Verify speaking rights

#### Remove Speaker
- **Self-Removal**: "Remove me" button for current user
- **Administrative Removal**: Moderator tools to remove any speaker
- **Queue Adjustment**: Automatic reordering after removal

#### Point of Order
- **Emergency Interrupt**: High-priority speaking request
- **Queue Override**: Bypass normal speaking order
- **Urgent Matters**: Handle procedural or urgent issues
- **Moderator Control**: Administrative approval for points of order

## Administrative Controls

### Lock/Unlock (🔒)
- **Queue Protection**: Prevent unauthorized modifications
- **Controlled Access**: Moderator-only changes when locked
- **Speaker Security**: Ensure integrity of speaking order
- **Permission Management**: Role-based access control

### Refresh/Sync (↻)
- **Real-time Updates**: Synchronize with latest data
- **Connection Recovery**: Handle network interruptions  
- **Data Consistency**: Ensure all participants see same queue
- **Auto-refresh**: Periodic automatic updates

## Automated Workflows

### Meeting Flow Management
- **Agenda Integration**: Link with agenda items
- **Time Management**: Speaking time limits and tracking
- **Transition Control**: Smooth handoffs between speakers
- **Process Automation**: Reduce manual moderator tasks

### Election Automation
- **Phase Management**: Guide through election stages
- **Candidate Presentation**: Automated candidate introductions
- **Voting Coordination**: Streamlined voting processes
- **Result Calculation**: Automatic tallying and reporting

## Integration Features

### Real-time Synchronization
- **WebSocket Updates**: Live speaker queue changes
- **Multi-device Sync**: Consistent view across all devices
- **Instant Notifications**: Immediate updates for queue changes
- **Connection Management**: Handle network interruptions gracefully

### Meeting Integration
- **Agenda Coordination**: Sync with current agenda item
- **Participant Database**: Access to full participant information
- **Permission System**: Respect user roles and permissions
- **History Tracking**: Log all speaker queue activities

## Technical Implementation

### Data Models
**Speaker Queue Entry**:
```typescript
{
  id: number;
  list_of_speakers_id: number;
  user_id: number;
  weight: number;
  marked: boolean;
  point_of_order: boolean;
  note?: string;
}
```

**Election Data**:
```typescript
{
  id: number;
  title: string;
  description: string;
  assignment_id: number;
  state: ElectionState;
  candidates: Candidate[];
  polls: Poll[];
}
```

### Services
- `AutopilotService`: Core automation functionality
- `ListOfSpeakersService`: Speaker queue management
- `ElectionService`: Election process handling
- `SpeakerControllerService`: Speaker actions and controls

## Accessibility Features
- **Keyboard Navigation**: Full keyboard control of all functions
- **Screen Reader Support**: ARIA labels for all interactive elements
- **High Contrast**: Compatible with accessibility themes
- **Focus Management**: Clear focus indicators
- **Audio Cues**: Optional sound notifications for speaker changes

## E2E Test Selectors

### Election Controls
- Election section: `.election-section`
- Election title: `.election-title`
- Election controls: `.election-controls`

### Speaker List
- Speaker list container: `.list-of-speakers`
- Speaker entry: `.speaker-entry`
- Speaker name: `.speaker-name`
- Speaker details: `.speaker-details`
- Current speaker: `.speaker-entry.current`
- Speaker actions: `.speaker-actions`

### Controls
- Add speaker dropdown: `mat-select.speaker-select`
- Remove button: `button.remove-speaker`
- Point of order: `button.point-of-order`
- Lock toggle: `button.queue-lock`
- Refresh button: `button.refresh-queue`

## Keyboard Shortcuts
- `Space`: Start/stop current speaker
- `N`: Next speaker
- `P`: Previous speaker
- `A`: Add speaker to queue
- `R`: Remove current user from queue
- `O`: Point of order
- `L`: Toggle queue lock

## Permission Requirements
- `autopilot.can_use`: Access autopilot functionality
- `list_of_speakers.can_manage`: Manage speaker queues
- `assignment.can_manage`: Manage elections
- `meeting.can_manage_metadata`: Administrative controls