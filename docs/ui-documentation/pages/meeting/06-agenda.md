# Meeting Agenda Page Documentation

## Overview
The Meeting Agenda page manages the meeting's agenda structure, item ordering, visibility controls, speaker management, and real-time meeting flow coordination.

## URL Route
- Meeting Agenda: `/:meetingId/agenda`

## Page Layout

### Agenda List Interface
```
┌─────────────────────────────────────────────────┐
│  Agenda                             [+] [⋮]     │
├─────────────────────────────────────────────────┤
│  15 of 15                  [⚲ FILTER] [🔍 Search]│
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 A                 👁️ public      2👥 [⋮] ││
│  │    Agenda item A                           ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 2. Wahl (Election)  🔒 internal   2👥 [⋮] ││
│  │    Election agenda item                     ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 B                 👁️ public Tag2   👥 [⋮] ││
│  │    Agenda item B                           ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 C                 🔒 internal      👥 [⋮] ││
│  │    Agenda item C                           ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 D                 🔒 internal      👥 [⋮] ││
│  │    Agenda item D                           ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 E                 👁️ public      2👥 [⋮] ││
│  │    Agenda item E                           ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Agenda Item Components

### Item Display Elements
- **📹 Projector Button**: Project item to main display
- **Item Number/Title**: "A", "2. Wahl (Election)", "B", etc.
- **Visibility Indicator**: 
  - 👁️ public: Visible to all participants
  - 🔒 internal: Visible to authorized users only
- **Tags**: Item categorization (Tag2, etc.)
- **Speaker Count**: 2👥 indicates number of speakers
- **Actions Menu**: [⋮] for item management

### Visibility States
```
👁️ public    - Visible to all meeting participants
🔒 internal  - Visible only to authorized participants  
⭕ hidden    - Completely hidden from regular participants
```

## Frontend Actions and Backend Mapping

### Agenda Management
- **Create Agenda Item**:
  - Frontend: Click [+] button, opens creation dialog
  - Backend: `POST /system/action` - `agenda_item.create`
  - Service: `openslides-backend/action/agenda_item/create.py`

- **Edit Agenda Item**:
  - Frontend: Item menu [⋮] > Edit
  - Backend: `POST /system/action` - `agenda_item.update`
  - Service: `openslides-backend/action/agenda_item/update.py`

- **Delete Agenda Item**:
  - Frontend: Item menu [⋮] > Delete
  - Backend: `POST /system/action` - `agenda_item.delete`
  - Service: `openslides-backend/action/agenda_item/delete.py`

### Projection Controls
- **Project Item**:
  - Frontend: Click 📹 projector button
  - Backend: `POST /system/action` - `projector.project`
  - Service: `openslides-backend/action/projector/project.py`
  - Real-time: `openslides-autoupdate-service` broadcasts projection

### Speaker Management
- **Open Speaker List**:
  - Frontend: Click speaker count (2👥)
  - Backend: `GET /system/presenter/get_list_of_speakers`
  - Service: `openslides-backend/presenter/list_of_speakers.py`

- **Add Speaker**:
  - Frontend: Speaker management dialog
  - Backend: `POST /system/action` - `speaker.create`
  - Service: `openslides-backend/action/speaker/create.py`

### Data Loading
- **Agenda List**:
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_agenda_items`
  - Service: `openslides-backend/presenter/agenda_item.py`

- **Filter/Search**:
  - Frontend: Client-side filtering with server data
  - Backend: Full agenda data loaded initially
  - Service: Presenter provides complete agenda data

## Create Agenda Item Dialog

### Dialog Interface
```
┌─────────────────────────────────────────────────┐
│  Create agenda item                     [x]     │
├─────────────────────────────────────────────────┤
│  Item Details                                   │
│                                                 │
│  Title *                                        │
│  [New Business Discussion___________]           │
│                                                 │
│  Item number                                    │
│  [Auto-generated]                               │
│                                                 │
│  Visibility                                     │
│  ● Public                                       │
│  ○ Internal                                     │
│  ○ Hidden                                       │
│                                                 │
│  Item type                                      │
│  ● Common item                                  │
│  ○ Hidden item                                  │
│  ○ Internal item                                │
│                                                 │
│  Duration (minutes)                             │
│  [30_______]                                    │
│                                                 │
│  Tags                                           │
│  [Select tags...] 🏷️                           │
│                                                 │
│  [Cancel]                        [Create Item]  │
└─────────────────────────────────────────────────┘
```

### Dialog Actions
- **Tag Selection**:
  - Frontend: Multi-select tag picker
  - Backend: `GET /system/presenter/get_tags`
  - Service: `openslides-backend/presenter/tag.py`

- **Item Creation**:
  - Frontend: Form submission
  - Backend: `POST /system/action` - `agenda_item.create`
  - Service: Creates item with specified properties

## Speaker Management Dialog

### Speaker List Interface
```
┌─────────────────────────────────────────────────┐
│  Speakers: New Business Discussion      [x]     │
├─────────────────────────────────────────────────┤
│  Current Speaker: None                          │
│  Next in Queue: John Doe                       │
│                                                 │
│  Speaker Queue                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ 1. John Doe (Delegates)        [⏹️] [⋮]   ││
│  │    Signed up: 14:25                        ││
│  │                                             ││
│  │ 2. Mary Smith (Committee)      [⏹️] [⋮]   ││
│  │    Signed up: 14:27                        ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Add Speaker                                    │
│  [Select participant ▼] [Add to Queue]          │
│                                                 │
│  Speaking Controls                              │
│  [Start Next] [End Current] [Close List]        │
└─────────────────────────────────────────────────┘
```

### Speaker Actions
- **Start Speaker**:
  - Frontend: [Start Next] button
  - Backend: `POST /system/action` - `speaker.start_speech`
  - Service: `openslides-backend/action/speaker/start_speech.py`

- **End Speaker**:
  - Frontend: [End Current] button  
  - Backend: `POST /system/action` - `speaker.end_speech`
  - Service: `openslides-backend/action/speaker/end_speech.py`

- **Add Speaker**:
  - Frontend: Participant selection + Add button
  - Backend: `POST /system/action` - `speaker.create`
  - Service: Creates speaker entry in queue

## Agenda Item Context Menu

### Item Actions Menu
```
┌─────────────────────────────────────────────────┐
│  Agenda item actions                    [x]     │
├─────────────────────────────────────────────────┤
│  📋 View details                                │
│  ✏️ Edit item                                   │
│  📹 Project item                                │
│  🎤 Manage speakers                             │
│  👁️ Change visibility                           │
│  🏷️ Manage tags                                 │
│  ⬆️ Move up                                     │
│  ⬇️ Move down                                   │
│  📄 Add content                                 │
│  🗑️ Delete item                                 │
└─────────────────────────────────────────────────┘
```

### Menu Actions
- **Change Visibility**:
  - Frontend: Visibility toggle options
  - Backend: `POST /system/action` - `agenda_item.update` (visibility field)
  - Service: Updates item visibility state

- **Move Up/Down**:
  - Frontend: Reorder agenda items
  - Backend: `POST /system/action` - `agenda_item.sort`
  - Service: `openslides-backend/action/agenda_item/sort.py`

- **Add Content**:
  - Frontend: Links motions, elections, or files to item
  - Backend: `POST /system/action` - Content association actions
  - Service: Various content linking services

## Real-time Features

### Autoupdate Integration
- **Speaker Changes**: Live speaker queue updates
- **Projection Changes**: Real-time projector content updates  
- **Item Status**: Live agenda item status changes
- **Visibility Changes**: Dynamic visibility updates

### WebSocket Events
- `agenda_item_updated` - Item changes
- `speaker_started` - Speaker queue changes
- `projector_updated` - Projection changes
- `list_of_speakers_updated` - Speaker list changes

## E2E Test Selectors
- Agenda list: `.agenda-list`
- Agenda item: `.agenda-item`
- Create item: `[data-cy="headbarMainButton"]`
- Projector button: `.projector-button`
- Speaker count: `.speaker-count`
- Item menu: `.agenda-item-menu`
- Visibility indicator: `.visibility-indicator`

## Backend Integration Points

### Primary Services
1. **Agenda Items**: `openslides-backend/action/agenda_item/`
2. **Speakers**: `openslides-backend/action/speaker/`
3. **Projector**: `openslides-backend/action/projector/`
4. **Real-time**: `openslides-autoupdate-service`

### Key Actions
- `agenda_item.create` - Creates new agenda item
- `agenda_item.update` - Updates item properties
- `agenda_item.delete` - Removes agenda item
- `agenda_item.sort` - Reorders agenda items
- `speaker.create` - Adds speaker to queue
- `speaker.start_speech` - Starts speaker time
- `speaker.end_speech` - Ends speaker time
- `projector.project` - Projects item to display

### Data Presenters
- `agenda_item` - Agenda item data
- `list_of_speakers` - Speaker queue data
- `projector` - Projection state data
- `tag` - Available tags for items