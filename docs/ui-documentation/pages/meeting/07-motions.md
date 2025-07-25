# Meeting Motions Page Documentation

## Overview
The Meeting Motions page manages all motions within a meeting, providing workflow state management, amendment handling, projection controls, and comprehensive motion lifecycle management.

## URL Route
- Meeting Motions: `/:meetingId/motions`

## Page Layout

### Motions List Interface
```
┌─────────────────────────────────────────────────┐
│  Motions                    [📊] [+] [⋮]       │
├─────────────────────────────────────────────────┤
│  4 of 4    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 1-1  Änderungsantrag zu 1        👥 [⋮] ││
│  │    by Administrator (Test structure...)     ││
│  │    Sequential number 2                      ││
│  │    [submitted] 🏷️ Tag1, Tag3               ││
│  │    🏛️ C - Cad                              ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 2    ohne                         👥 [⋮] ││
│  │    by Administrator (Test structure...)     ││
│  │    Sequential number 3                      ││
│  │    [submitted] 🏷️ Tag3                     ││
│  │    🏛️ C - Cad, B - Bildung                 ││
│  │    🏛️ BLOCK A                              ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 3    komplex                      👥 [⋮] ││
│  │    by Administrator (Test structure...)     ││
│  │    Sequential number 4                      ││
│  │    [permitted]                              ││
│  │    🏛️ BLOCK A                              ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 A1   test                      2👥 [⋮]  ││
│  │    by Administrator (Test structure...)     ││
│  │    Sequential number 1                      ││
│  │    [submitted] 🏛️ C - Cad                  ││
│  │    🏛️ B - Bildung                          ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Motion Card Components

### Motion Display Elements
- **📹 Projector Button**: Project motion to main display
- **Motion Number**: Sequential motion identifier (1-1, 2, 3, A1)
- **Motion Title**: "Änderungsantrag zu 1", "ohne", "komplex", "test"
- **Submitter Info**: "by Administrator (Test structure...)"
- **Sequential Number**: Internal tracking number
- **Workflow State**: [submitted], [permitted] with color coding
- **Tags**: 🏷️ Tag1, Tag3 for categorization
- **Categories**: 🏛️ C - Cad, B - Bildung for organization
- **Motion Blocks**: 🏛️ BLOCK A for grouping related motions
- **Speaker Indicator**: 👥 or 2👥 showing speaker count
- **Actions Menu**: [⋮] for motion management

### Workflow State Indicators
```
[submitted]  - Blue badge: Motion submitted, awaiting review
[permitted]  - Green badge: Motion approved for discussion
[accepted]   - Green badge: Motion approved and passed
[rejected]   - Red badge: Motion rejected and closed
[withdrawn]  - Gray badge: Motion withdrawn by submitter
[adjourned]  - Yellow badge: Motion postponed
```

## Frontend Actions and Backend Mapping

### Motion Management
- **Create Motion**:
  - Frontend: Click [+] button, opens motion creation dialog
  - Backend: `POST /system/action` - `motion.create`
  - Service: `openslides-backend/action/motion/create.py`

- **Edit Motion**:
  - Frontend: Motion menu [⋮] > Edit
  - Backend: `POST /system/action` - `motion.update`
  - Service: `openslides-backend/action/motion/update.py`

- **Delete Motion**:
  - Frontend: Motion menu [⋮] > Delete
  - Backend: `POST /system/action` - `motion.delete`
  - Service: `openslides-backend/action/motion/delete.py`

### Workflow State Management
- **Change Motion State**:
  - Frontend: State transition buttons/dialogs
  - Backend: `POST /system/action` - `motion.set_state`
  - Service: `openslides-backend/action/motion/set_state.py`

- **Submit Motion**:
  - Frontend: Submit button in creation/edit
  - Backend: Sets initial workflow state
  - Service: Motion creation with workflow assignment

### Projection Controls
- **Project Motion**:
  - Frontend: Click 📹 projector button
  - Backend: `POST /system/action` - `projector.project`
  - Service: `openslides-backend/action/projector/project.py`
  - Real-time: `openslides-autoupdate-service` broadcasts projection

### Data Loading
- **Motion List**:
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_motions`
  - Service: `openslides-backend/presenter/motion.py`

- **Statistics View**:
  - Frontend: Click [📊] statistics button
  - Backend: `GET /system/presenter/get_motion_statistics`
  - Service: Motion statistics presenter

## Create Motion Dialog

### Dialog Interface
```
┌─────────────────────────────────────────────────┐
│  Create motion                          [x]     │
├─────────────────────────────────────────────────┤
│  Motion Details                                 │
│                                                 │
│  Title *                                        │
│  [Budget Amendment 2024_______________]         │
│                                                 │
│  Motion text *                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ The organization shall increase the annual  ││
│  │ budget allocation for community programs    ││
│  │ by 15% to better serve member needs and     ││
│  │ expand outreach initiatives.                ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Reason                                         │
│  ┌─────────────────────────────────────────────┐│
│  │ Current funding levels are insufficient     ││
│  │ for planned community expansion...          ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Category                                       │
│  [C - Cad ▼]                                    │
│                                                 │
│  Tags                                           │
│  [Select tags...] 🏷️ Budget, Finance           │
│                                                 │
│  Motion block                                   │
│  [BLOCK A ▼]                                    │
│                                                 │
│  Supporters                                     │
│  [Add supporters...] 👥                         │
│                                                 │
│  [Cancel]                       [Create Motion] │
└─────────────────────────────────────────────────┘
```

### Dialog Actions
- **Category Selection**:
  - Frontend: Dropdown with available categories
  - Backend: `GET /system/presenter/get_motion_categories`
  - Service: `openslides-backend/presenter/motion_category.py`

- **Tag Selection**:
  - Frontend: Multi-select tag picker
  - Backend: `GET /system/presenter/get_tags`
  - Service: `openslides-backend/presenter/tag.py`

- **Supporter Selection**:
  - Frontend: Multi-select participant picker
  - Backend: `GET /system/presenter/get_users`
  - Service: `openslides-backend/presenter/user.py`

## Motion Detail View

### Detailed Motion Interface
```
┌─────────────────────────────────────────────────┐
│  Motion 1-1: Änderungsantrag zu 1      [✏️] [⋮]│
├─────────────────────────────────────────────────┤
│  Motion Information                             │
│  Submitter: Administrator                       │
│  State: [submitted]                             │
│  Sequential: 2    Category: C - Cad            │
│  Tags: 🏷️ Tag1, Tag3                           │
│  Created: 24.07.2024 14:30                     │
│                                                 │
│  Motion Text                                    │
│  ┌─────────────────────────────────────────────┐│
│  │  1  The organization shall implement new    ││
│  │  2  communication procedures including      ││
│  │  3  regular newsletters and quarterly       ││
│  │  4  meetings with all departments to        ││
│  │  5  ensure transparency and engagement.     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Reason                                         │
│  Current communication methods are outdated    │
│  and ineffective for member engagement...      │
│                                                 │
│  Workflow Actions                               │
│  [Accept] [Reject] [Recommend] [Create Poll]    │
│                                                 │
│  Supporters (0)                                 │
│  No supporters yet                              │
│                                                 │
│  Amendments (0)                                 │
│  [Create Amendment]                             │
│                                                 │
│  Related Files                                  │
│  [Attach Files...]                              │
└─────────────────────────────────────────────────┘
```

### Workflow Actions
- **Accept Motion**:
  - Frontend: [Accept] button
  - Backend: `POST /system/action` - `motion.set_state` (to accepted)
  - Service: State transition with workflow validation

- **Create Poll**:
  - Frontend: [Create Poll] button
  - Backend: `POST /system/action` - `poll.create`
  - Service: `openslides-backend/action/poll/create.py`

- **Create Amendment**:
  - Frontend: [Create Amendment] button
  - Backend: `POST /system/action` - `motion.create` (as amendment)
  - Service: Creates child motion with amendment flag

## Amendment System

### Amendment Creation Dialog
```
┌─────────────────────────────────────────────────┐
│  Create amendment                       [x]     │
├─────────────────────────────────────────────────┤
│  Amendment to: Motion 2 "ohne"                  │
│                                                 │
│  Amendment type                                 │
│  ● Line-based amendment                         │
│  ○ Replacement amendment                        │
│                                                 │
│  Lines to amend                                 │
│  From line: [2] To line: [3]                    │
│                                                 │
│  Original text:                                 │
│  procedures including regular newsletters       │
│                                                 │
│  Amendment text:                                │
│  [procedures including monthly newsletters      │
│   and quarterly reports]                       │
│                                                 │
│  Reason:                                        │
│  [Monthly updates provide more timely          │
│   information to members]                      │
│                                                 │
│  [Cancel]                   [Create Amendment] │
└─────────────────────────────────────────────────┘
```

### Amendment Actions
- **Line Amendment**:
  - Frontend: Line-based text modification
  - Backend: `POST /system/action` - `motion.create` with amendment data
  - Service: Creates amendment with line references

## Motion Context Menu

### Motion Actions Menu
```
┌─────────────────────────────────────────────────┐
│  Motion actions                         [x]     │
├─────────────────────────────────────────────────┤
│  📋 View details                                │
│  ✏️ Edit motion                                 │
│  📹 Project motion                              │
│  📊 Create poll                                 │
│  📄 Create amendment                            │
│  🎤 Manage speakers                             │
│  🏷️ Manage tags                                 │
│  📁 Attach files                                │
│  🔄 Change state                                │
│  📤 Export motion                               │
│  🗑️ Delete motion                               │
└─────────────────────────────────────────────────┘
```

### Advanced Actions
- **Manage Speakers**:
  - Frontend: Opens speaker management for motion
  - Backend: Links to agenda item speaker list
  - Service: `openslides-backend/presenter/list_of_speakers.py`

- **Export Motion**:
  - Frontend: Export dialog with format options
  - Backend: `GET /system/presenter/export_motion`
  - Service: Motion export presenter

## Real-time Features

### Autoupdate Integration
- **State Changes**: Live motion state updates
- **Amendment Changes**: Real-time amendment notifications
- **Projection Updates**: Live projector content changes
- **Speaker Updates**: Dynamic speaker queue changes

### WebSocket Events
- `motion_updated` - Motion content changes
- `motion_state_changed` - Workflow state transitions
- `projector_updated` - Projection changes
- `amendment_created` - New amendment notifications

## E2E Test Selectors
- Motion list: `.motion-list`
- Motion card: `.motion-card`
- Create motion: `[data-cy="headbarMainButton"]`
- Projector button: `.projector-button`
- Motion state: `.motion-state`
- Motion menu: `.motion-menu`
- Statistics button: `.statistics-button`

## Backend Integration Points

### Primary Services
1. **Motion Management**: `openslides-backend/action/motion/`
2. **Workflow Management**: `openslides-backend/action/motion_state/`
3. **Amendment System**: Motion creation with amendment flag
4. **Poll Integration**: `openslides-backend/action/poll/`
5. **Real-time**: `openslides-autoupdate-service`

### Key Actions
- `motion.create` - Creates new motion or amendment
- `motion.update` - Updates motion content
- `motion.delete` - Removes motion
- `motion.set_state` - Changes workflow state
- `motion.support` - Adds/removes motion support
- `motion.create_poll` - Creates voting poll
- `projector.project` - Projects motion content

### Data Presenters
- `motion` - Motion data and content
- `motion_state` - Workflow state information
- `motion_category` - Motion categorization
- `poll` - Voting poll data
- `tag` - Motion tagging system