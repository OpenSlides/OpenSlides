# Frontend-Backend Integration Mapping

## Overview
This document maps all frontend user actions to their corresponding backend services, API endpoints, and data flow within the OpenSlides microservices architecture.

## Architecture Overview

### Microservices Structure
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Datastore     │
│   Angular 19    │◄──►│   Python Flask   │◄──►│   PostgreSQL    │
│   TypeScript    │    │   Actions/       │    │   Key-Value     │
│                 │    │   Presenters     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Autoupdate     │    │   Auth Service   │    │   Media Service │
│  Go WebSocket   │    │   Node.js/TS     │    │   Python        │
│  Real-time      │    │   JWT/Sessions   │    │   File Handling │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Organization-Level Pages

### Dashboard Page
**Frontend Route**: `/dashboard`

#### Actions:
- **Load Organization Data**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_organization`
  - Service: `openslides-backend/presenter/organization.py`
  - Response: Organization name, settings, statistics

- **Load Activity Feed**
  - Frontend: Activity component loading
  - Backend: `GET /system/presenter/get_history`
  - Service: `openslides-backend/presenter/history.py`
  - Response: Recent system activities, changes

- **Create Meeting (Quick Action)**
  - Frontend: Quick action button click
  - Backend: `POST /system/action` - `meeting.create`
  - Service: `openslides-backend/action/meeting/create.py`
  - Payload: `{"name": "Meeting Name", "committee_id": 1}`

### Meetings Page
**Frontend Route**: `/meetings`

#### Actions:
- **Load Meetings List**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_meetings`
  - Service: `openslides-backend/presenter/meeting.py`
  - Response: Array of meeting objects with metadata

- **Create Meeting**
  - Frontend: Create button → Dialog → Submit
  - Backend: `POST /system/action` - `meeting.create`
  - Service: `openslides-backend/action/meeting/create.py`
  - Payload: 
    ```json
    {
      "name": "Board Meeting",
      "committee_id": 1,
      "start_time": 1627891200,
      "description": "Monthly board meeting"
    }
    ```

- **Enter Meeting**
  - Frontend: Click meeting tile or Enter button
  - Backend: Navigation to meeting + initial data load
  - Service: `GET /system/presenter/get_meeting/{meeting_id}`
  - Response: Meeting configuration, permissions, initial state

### Committees Page
**Frontend Route**: `/committees`

#### Actions:
- **Load Committees**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_committees`
  - Service: `openslides-backend/presenter/committee.py`
  - Response: Committee list with member counts, meetings

- **Create Committee**
  - Frontend: Create button → Dialog → Submit
  - Backend: `POST /system/action` - `committee.create`
  - Service: `openslides-backend/action/committee/create.py`
  - Payload:
    ```json
    {
      "name": "Finance Committee",
      "description": "Financial oversight",
      "manager_ids": [1, 2]
    }
    ```

- **Add Members to Committee**
  - Frontend: Committee detail → Add members
  - Backend: `POST /system/action` - `committee.add_user`
  - Service: `openslides-backend/action/committee/`
  - Payload: `{"committee_id": 1, "user_ids": [3, 4, 5]}`

### Accounts Page
**Frontend Route**: `/accounts`

#### Actions:
- **Load Users**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_users`
  - Service: `openslides-backend/presenter/user.py`
  - Response: User accounts with organization roles, activity

- **Create User**
  - Frontend: Create button → Dialog → Submit
  - Backend: `POST /system/action` - `user.create`
  - Service: `openslides-backend/action/user/create.py`
  - Payload:
    ```json
    {
      "username": "john.doe",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@org.com",
      "organization_management_level": "user"
    }
    ```

- **Import Users**
  - Frontend: Import button → File upload → Column mapping
  - Backend: `POST /system/action` - `user.import`
  - Service: `openslides-backend/action/user/import.py`
  - Payload: CSV data with field mappings

- **Reset Password**
  - Frontend: User menu → Reset password
  - Backend: `POST /system/action` - `user.reset_password`
  - Service: `openslides-backend/action/user/reset_password.py`
  - Integration: `openslides-auth-service` handles password generation

## Meeting-Level Pages

### Meeting Home/Calendar
**Frontend Route**: `/:meetingId/home`

#### Actions:
- **Load Meeting Calendar**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_meeting_calendar`
  - Service: `openslides-backend/presenter/meeting.py`
  - Response: Meeting schedule, related meetings, time blocks

- **Load Meeting Information**
  - Frontend: Meeting context loading
  - Backend: `GET /system/presenter/get_meeting/{meeting_id}`
  - Service: `openslides-backend/presenter/meeting.py`
  - Response: Meeting metadata, current state, permissions

### Agenda Page
**Frontend Route**: `/:meetingId/agenda`

#### Actions:
- **Load Agenda Items**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_agenda_items`
  - Service: `openslides-backend/presenter/agenda_item.py`
  - Response: Hierarchical agenda structure with visibility, speakers

- **Create Agenda Item**
  - Frontend: Create button → Dialog → Submit
  - Backend: `POST /system/action` - `agenda_item.create`
  - Service: `openslides-backend/action/agenda_item/create.py`
  - Payload:
    ```json
    {
      "title": "Budget Discussion",
      "meeting_id": 1,
      "type": 1,
      "is_internal": false,
      "duration": 1800
    }
    ```

- **Project Agenda Item**
  - Frontend: Click projector button (📹)
  - Backend: `POST /system/action` - `projector.project`
  - Service: `openslides-backend/action/projector/project.py`
  - Payload: `{"content_object_id": "agenda_item/1", "projector_id": 1}`
  - Real-time: `openslides-autoupdate-service` broadcasts to all clients

- **Manage Speakers**
  - Frontend: Click speaker count → Speaker dialog
  - Backend: `GET /system/presenter/get_list_of_speakers`
  - Service: `openslides-backend/presenter/list_of_speakers.py`
  - Response: Current speaker, queue, speaking times

- **Add Speaker**
  - Frontend: Speaker dialog → Add participant
  - Backend: `POST /system/action` - `speaker.create`
  - Service: `openslides-backend/action/speaker/create.py`
  - Payload: `{"list_of_speakers_id": 1, "user_id": 5}`

- **Start/End Speaker**
  - Frontend: Speaker controls
  - Backend: `POST /system/action` - `speaker.start_speech` / `speaker.end_speech`
  - Service: `openslides-backend/action/speaker/`
  - Real-time: Speaking time tracking, queue updates

### Motions Page
**Frontend Route**: `/:meetingId/motions`

#### Actions:
- **Load Motions**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_motions`
  - Service: `openslides-backend/presenter/motion.py`
  - Response: Motion list with states, categories, supporters

- **Create Motion**
  - Frontend: Create button → Dialog → Submit
  - Backend: `POST /system/action` - `motion.create`
  - Service: `openslides-backend/action/motion/create.py`
  - Payload:
    ```json
    {
      "title": "Budget Amendment",
      "text": "Motion text with line numbers...",
      "reason": "Justification for motion",
      "meeting_id": 1,
      "category_id": 2,
      "submitter_ids": [1]
    }
    ```

- **Change Motion State**
  - Frontend: Motion workflow buttons
  - Backend: `POST /system/action` - `motion.set_state`
  - Service: `openslides-backend/action/motion/set_state.py`
  - Payload: `{"motion_id": 1, "state_id": 3}`
  - Real-time: State change broadcasts to all clients

- **Create Amendment**
  - Frontend: Motion menu → Create amendment
  - Backend: `POST /system/action` - `motion.create` (with parent)
  - Service: `openslides-backend/action/motion/create.py`
  - Payload: Motion creation with amendment_paragraph data

- **Create Poll**
  - Frontend: Motion → Create poll button
  - Backend: `POST /system/action` - `poll.create`
  - Service: `openslides-backend/action/poll/create.py`
  - Integration: `openslides-vote-service` for electronic voting

- **Project Motion**
  - Frontend: Click projector button (📹)
  - Backend: `POST /system/action` - `projector.project`
  - Service: Projects motion with amendments, recommendations

### Participants Page
**Frontend Route**: `/:meetingId/participants`

#### Actions:
- **Load Participants**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_meeting_users`
  - Service: `openslides-backend/presenter/meeting_user.py`
  - Response: Meeting participants with presence, groups, permissions

- **Add Participant**
  - Frontend: Add button → User selection → Submit
  - Backend: `POST /system/action` - `meeting_user.create`
  - Service: `openslides-backend/action/meeting_user/create.py`
  - Payload:
    ```json
    {
      "meeting_id": 1,
      "user_id": 5,
      "group_ids": [2],
      "is_present": true
    }
    ```

- **Toggle Presence**
  - Frontend: Click presence checkbox
  - Backend: `POST /system/action` - `meeting_user.set_present`
  - Service: `openslides-backend/action/meeting_user/set_present.py`
  - Payload: `{"meeting_user_id": 1, "present": true}`
  - Real-time: Presence updates broadcast immediately

- **Change Participant Groups**
  - Frontend: Participant menu → Change groups
  - Backend: `POST /system/action` - `meeting_user.update`
  - Service: Updates group_ids field
  - Effect: Permission changes take effect immediately

### Elections Page
**Frontend Route**: `/:meetingId/elections`

#### Actions:
- **Load Elections**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_assignments`
  - Service: `openslides-backend/presenter/assignment.py`
  - Response: Elections with candidates, polls, results

- **Create Election**
  - Frontend: Create button → Dialog → Submit
  - Backend: `POST /system/action` - `assignment.create`
  - Service: `openslides-backend/action/assignment/create.py`
  - Payload: Election title, description, number of positions

- **Add Candidate**
  - Frontend: Election → Add candidate
  - Backend: `POST /system/action` - `assignment_candidate.create`
  - Service: `openslides-backend/action/assignment_candidate/create.py`

- **Create Election Poll**
  - Frontend: Election → Create poll
  - Backend: `POST /system/action` - `poll.create`
  - Service: Creates ballot poll for election
  - Integration: `openslides-vote-service` for ballot management

### Files Page
**Frontend Route**: `/:meetingId/files`

#### Actions:
- **Load Files**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_mediafiles`
  - Service: `openslides-backend/presenter/mediafile.py`
  - Response: File tree structure with permissions, metadata

- **Upload File**
  - Frontend: Upload button → File selection → Submit
  - Backend: `POST /media/upload`
  - Service: `openslides-media-service`
  - Process: File validation, virus scanning, storage
  - Backend: `POST /system/action` - `mediafile.create`
  - Service: `openslides-backend/action/mediafile/create.py`

- **Create Folder**
  - Frontend: Create folder button → Dialog
  - Backend: `POST /system/action` - `mediafile.create_directory`
  - Service: `openslides-backend/action/mediafile/create_directory.py`

- **Project File**
  - Frontend: File → Project button
  - Backend: `POST /system/action` - `projector.project`
  - Service: Projects file content (PDF, images, etc.)

### Projector Page
**Frontend Route**: `/:meetingId/projector`

#### Actions:
- **Load Projector State**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_projectors`
  - Service: `openslides-backend/presenter/projector.py`
  - Response: Active projections, projector configuration

- **Project Content**
  - Frontend: Project buttons throughout application
  - Backend: `POST /system/action` - `projector.project`
  - Service: `openslides-backend/action/projector/project.py`
  - Real-time: Projection changes broadcast to all displays

- **Control Projector**
  - Frontend: Projector controls (next, previous, clear)
  - Backend: Various projector control actions
  - Service: `openslides-backend/action/projector/`
  - Real-time: Immediate projector updates

### History Page
**Frontend Route**: `/:meetingId/history`

#### Actions:
- **Load History**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_history`
  - Service: `openslides-backend/presenter/history.py`
  - Response: Meeting activity log with timestamps, changes

- **Filter History**
  - Frontend: Filter controls
  - Backend: History presenter with filter parameters
  - Service: Server-side filtering of activity log

### Settings Page
**Frontend Route**: `/:meetingId/settings`

#### Actions:
- **Load Meeting Settings**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_meeting_settings`
  - Service: `openslides-backend/presenter/meeting.py`
  - Response: All meeting configuration options

- **Update Settings**
  - Frontend: Settings form submission
  - Backend: `POST /system/action` - `meeting.update`
  - Service: `openslides-backend/action/meeting/update.py`
  - Payload: Settings object with changed values

### Chat Page
**Frontend Route**: `/:meetingId/chat`

#### Actions:
- **Load Chat Messages**
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_chat_messages`
  - Service: `openslides-backend/presenter/chat_message.py`
  - Response: Chat history with user information

- **Send Message**
  - Frontend: Message input → Send
  - Backend: `POST /system/action` - `chat_message.create`
  - Service: `openslides-backend/action/chat_message/create.py`
  - Real-time: `openslides-autoupdate-service` broadcasts to chat participants

## Real-time Communication

### Autoupdate Service Integration
**Service**: `openslides-autoupdate-service` (Go)

#### WebSocket Events:
- **Connection Establishment**
  - Client: WebSocket connection to autoupdate service
  - Auth: JWT token validation via auth service
  - Response: Initial data snapshot for meeting/organization

- **Data Updates**
  - Trigger: Any backend action that modifies data
  - Process: Datastore notifies autoupdate service
  - Broadcast: Filtered updates sent to relevant clients
  - Client: Automatic UI updates via Angular data binding

#### Key Real-time Features:
- **Presence Updates**: Participant join/leave notifications
- **Speaker Queue**: Live speaker list changes
- **Projector Content**: Real-time projection updates
- **Motion States**: Workflow state changes
- **Chat Messages**: Instant message delivery
- **Voting**: Live voting results and status
- **Agenda Changes**: Item reordering, visibility changes

### Authentication Flow
**Service**: `openslides-auth-service` (Node.js/TypeScript)

#### Login Process:
1. **Frontend**: Login form submission
2. **Auth Service**: Credential validation
3. **Response**: JWT token + refresh token
4. **Storage**: Tokens stored in secure HTTP-only cookies
5. **Authorization**: JWT included in all API requests
6. **Session Management**: Automatic token refresh

#### Permission Validation:
- **Frontend**: UI element visibility based on permissions
- **Backend**: Action-level permission validation
- **Groups**: Meeting-specific group permissions
- **Organization**: Organization-level role permissions

## Data Storage and Persistence

### Datastore Service
**Service**: `openslides-datastore-service` (Python)

#### Operations:
- **Write Operations**: Create, Update, Delete (CUD)
- **Read Operations**: Filtered reads by permission level
- **Transactions**: Atomic multi-model updates
- **History**: Complete audit trail of all changes
- **Migration**: Automatic schema migrations

#### Data Models:
- **Relational Structure**: PostgreSQL with JSON fields
- **Key-Value Access**: Redis caching layer
- **Event Sourcing**: All changes tracked as events
- **Consistency**: ACID transactions across related objects

## Search Integration

### Search Service
**Service**: `openslides-search-service` (Go with Bleve)

#### Features:
- **Full-text Search**: Motion text, agenda items, participant names
- **Indexed Content**: Real-time search index updates
- **Permission Filtering**: Search results filtered by user permissions
- **Faceted Search**: Filter by categories, states, dates
- **Search API**: `GET /search` with query parameters

## File Handling

### Media Service
**Service**: `openslides-media-service` (Python)

#### Operations:
- **Upload Processing**: File validation, virus scanning
- **Storage**: Secure file storage with access control
- **Thumbnail Generation**: Automatic image thumbnails
- **PDF Processing**: Text extraction for search indexing
- **Access Control**: Permission-based file access
- **Streaming**: Efficient file streaming for large files

## Error Handling and Logging

### Error Responses:
```json
{
  "success": false,
  "message": "Action failed",
  "errors": [
    {
      "type": "PermissionDenied",
      "message": "No permission to perform this action"
    }
  ]
}
```

### Logging Integration:
- **Request Tracing**: Unique request IDs across services
- **Performance Monitoring**: OpenTelemetry integration
- **Error Tracking**: Centralized error logging
- **Audit Trail**: Complete action logging for compliance

This comprehensive mapping shows how every frontend user action flows through the OpenSlides microservices architecture, enabling developers to understand the complete data flow and integration points between the Angular frontend and the distributed backend services.