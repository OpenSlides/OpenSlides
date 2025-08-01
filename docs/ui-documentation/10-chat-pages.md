# OpenSlides Chat Pages Documentation

## Overview
The Chat module provides real-time messaging functionality within meetings, allowing participants to communicate through different chat groups with role-based access control.

## URL Routes
- Main chat: `/:meetingId/chat`
- Specific chat group: `/:meetingId/chat/:groupId`

## Chat Main Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Chat                           [+ New Group]   │
├─────────────────────────────────────────────────┤
│  Sidebar        │   Chat Area                   │
│  ┌─────────────┐│  ┌───────────────────────────┐│
│  │Chat groups  ││  │ General                   ││
│  │             ││  │ ✏️ Default, Admin,       ││
│  │ General     ││  │    Delegates              ││
│  │ [Selected]  ││  ├───────────────────────────┤│
│  │             ││  │                           ││
│  │ Support     ││  │ [Chat messages area]      ││
│  │             ││  │                           ││
│  │             ││  │                           ││
│  │             ││  │                           ││
│  │             ││  │                           ││
│  │             ││  │                           ││
│  │             ││  │                           ││
│  │             ││  ├───────────────────────────┤│
│  │             ││  │ [Type message...] [Send]  ││
│  │             ││  └───────────────────────────┘│
│  └─────────────┘│                              │
└─────────────────────────────────────────────────┘
```

### Chat Groups Sidebar
- **Group List**: Shows all available chat groups
- **Active Group**: Currently selected group is highlighted
- **Permission Indicator**: Shows which groups can access each chat
- **New Group Button**: Creates additional chat groups (with permissions)

### Chat Area

#### Group Header
- **Group Name**: Name of the current chat group
- **Access Groups**: Shows which user groups can participate
- **Edit Button (✏️)**: Modify group settings (with permissions)
- **Menu (⋮)**: Additional group actions

#### Message Display Area
- **Real-time Messages**: Live chat messages
- **User Names**: Message sender identification
- **Timestamps**: Message posting times
- **Message Threading**: Chronological message flow
- **Auto-scroll**: Automatically scrolls to newest messages

#### Message Input
- **Text Input**: Type message area
- **Send Button**: Submit message
- **Enter Key**: Send message on Enter
- **Multi-line Support**: Shift+Enter for new lines

## Chat Group Management

### Create New Group Dialog
```
┌─────────────────────────────────────────────────┐
│  Create chat group                      [x]     │
├─────────────────────────────────────────────────┤
│  Group name *                                   │
│  [Customer Support____________]                 │
│                                                 │
│  Access groups                                  │
│  Select which groups can participate:           │
│                                                 │
│  [x] Default group                              │
│  [x] Admin                                      │
│  [ ] Delegates                                  │
│  [ ] Board members                              │
│  [x] Staff                                      │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Edit Group Dialog
```
┌─────────────────────────────────────────────────┐
│  Edit chat group                        [x]     │
├─────────────────────────────────────────────────┤
│  Group name *                                   │
│  [General_____________________]                 │
│                                                 │
│  Access groups                                  │
│  [x] Default group                              │
│  [x] Admin                                      │
│  [x] Delegates                                  │
│  [ ] Board members                              │
│                                                 │
│  [Delete Group]                                 │
│                                                 │
│  [Cancel]                         [Save]        │
└─────────────────────────────────────────────────┘
```

## Message Types and Features

### Standard Messages
```
┌─────────────────────────────────────────────────┐
│  John Doe                          10:30 AM     │
│  Hello everyone! Looking forward to today's     │
│  meeting.                                       │
└─────────────────────────────────────────────────┘
```

### System Messages
```
┌─────────────────────────────────────────────────┐
│  📢 System                          10:25 AM    │
│  Meeting started                                │
└─────────────────────────────────────────────────┘
```

### Message Actions
- **Copy Message**: Copy text to clipboard
- **Reply to Message**: Reference specific message
- **Report Message**: Flag inappropriate content (if enabled)
- **Delete Message**: Remove own messages (time-limited)

## Real-time Features

### Live Updates
- **WebSocket Connection**: Real-time message delivery
- **Typing Indicators**: Show when users are typing
- **Online Status**: Display active participants
- **Message Delivery**: Confirmation of sent messages
- **Push Notifications**: Browser notifications for new messages

### Connection Status
- **Connected**: Green indicator
- **Connecting**: Yellow indicator
- **Disconnected**: Red indicator with retry options

## Chat Settings and Configuration

### Group-level Settings
- **Group Name**: Editable display name
- **Access Control**: User groups that can participate
- **Message History**: Retention policies
- **Moderation**: Content filtering options

### User Settings
- **Notifications**: Enable/disable chat notifications
- **Sound Effects**: Audio alerts for new messages
- **Auto-scroll**: Behavior for new messages
- **Display Options**: Message grouping and timestamps

## Access Control and Permissions

### Chat Permissions
- `chat.can_see`: View chat groups
- `chat.can_manage`: Create/edit/delete groups
- `chat.can_send_messages`: Send messages
- `chat.can_clear_history`: Delete message history

### Group-based Access
- **Public Groups**: All participants can join
- **Restricted Groups**: Limited to specific user groups
- **Private Groups**: Invitation-only groups
- **Admin Groups**: Management-only discussions

## Moderation Features

### Message Management
- **Edit Messages**: Modify sent messages (time-limited)
- **Delete Messages**: Remove inappropriate content
- **Clear History**: Bulk delete chat history
- **Export Chat**: Download chat logs

### User Management
- **Mute Users**: Temporarily disable sending
- **Ban Users**: Permanent removal from chat
- **User Reports**: Review reported messages

## Technical Details

### Data Models

**Chat Group Model**:
```typescript
{
  id: number;
  name: string;
  access_group_ids: number[];
  meeting_id: number;
  weight: number;
  read_only: boolean;
}
```

**Chat Message Model**:
```typescript
{
  id: number;
  chat_group_id: number;
  user_id: number;
  username: string;
  text: string;
  timestamp: number;
  edited_timestamp?: number;
}
```

### Services
- `ChatService`: Real-time messaging
- `ChatGroupControllerService`: Group management
- `ChatMessageControllerService`: Message handling
- `WebSocketService`: Live connection management

### WebSocket Events
- `chat_message_created`: New message
- `chat_message_updated`: Message edited
- `chat_message_deleted`: Message removed
- `user_typing`: Typing indicators
- `user_joined`: User entered chat
- `user_left`: User left chat

## E2E Test Selectors

### Chat Interface
- Chat groups list: `.chat-groups-list`
- Group item: `.chat-group-item`
- Active group: `.chat-group-item.active`
- Messages area: `.chat-messages`
- Message item: `.chat-message`
- Message input: `input.message-input`
- Send button: `button.send-message`

### Group Management
- New group button: `button[matTooltip="New chat group"]`
- Group name input: `input[formControlName="name"]`
- Access groups: `mat-checkbox.access-group`
- Edit group: `button[matTooltip="Edit group"]`
- Delete group: `button.delete-group`

### Messages
- Message text: `.message-text`
- Message author: `.message-author`
- Message timestamp: `.message-timestamp`
- Message actions: `.message-actions`

## Keyboard Shortcuts
- `Enter`: Send message
- `Shift+Enter`: New line in message
- `Ctrl+/`: Focus message input
- `Esc`: Close dialogs
- `Up/Down arrows`: Navigate chat groups

## Accessibility Features
- **Screen Reader Support**: ARIA labels for all elements
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Compatible with high contrast modes
- **Focus Management**: Proper focus handling in dialogs
- **Live Regions**: Announce new messages to screen readers
- **Color Indicators**: Not solely color-dependent status

## Integration Features

### Meeting Integration
- **Speaker Notifications**: Chat alerts during speaking
- **Agenda Integration**: Link messages to agenda items
- **Motion Discussion**: Chat during motion debates
- **Break Announcements**: System messages for breaks

### External Integration
- **Email Notifications**: Send chat summaries via email
- **Mobile Apps**: Cross-platform compatibility
- **API Access**: Programmatic message posting
- **Webhook Support**: External system notifications

## Privacy and Security

### Data Protection
- **Message Encryption**: Secure transmission
- **Audit Logging**: Track all chat activities
- **Data Retention**: Configurable message history
- **Export Controls**: Secure data export

### Content Security
- **Input Sanitization**: Prevent XSS attacks
- **Rate Limiting**: Prevent spam
- **Content Filtering**: Block inappropriate content
- **Link Validation**: Safe URL handling