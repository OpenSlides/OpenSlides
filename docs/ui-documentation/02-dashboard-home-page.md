# OpenSlides Dashboard/Home Page Documentation

## Overview
OpenSlides has two distinct dashboard types:
1. **Organization Dashboard**: A calendar-like view of all meetings
2. **Meeting Home Page**: A customizable welcome page for each meeting

## Organization Dashboard

### URL Route
- Path: `/` (organization root)
- Component: `DashboardComponent`
- Location: `openslides-client/client/src/app/site/pages/organization/pages/dashboard/`

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Navigation Bar                                 │
│  [☰] OpenSlides    [Account] [Dark Mode] [Lang]│
├─────────────────────────────────────────────────┤
│  Sidebar          │   Main Content Area         │
│  ┌─────────────┐  │  ┌────────────────────────┐│
│  │ 📱 Dashboard │  │  │ Organization Header    ││
│  │ 📅 Meetings  │  │  │ [Organization Name]    ││
│  │ 📑 Committees│  │  │ [Description if set]   ││
│  │ 👥 Accounts  │  │  ├────────────────────────┤│
│  │ 🏷️ Tags      │  │  │ Calendar               ││
│  │ 📎 Files     │  │  │                        ││
│  │ 🎨 Design    │  │  │ 🔔 Active meetings     ││
│  │ ⚙️ Settings  │  │  │ [Meeting Cards...]     ││
│  └─────────────┘  │  │                        ││
│                   │  │ 🔄 Future meetings     ││
│                   │  │ [Meeting Cards...]     ││
│                   │  │                        ││
│                   │  │ 📜 Previous meetings   ││
│                   │  │ [Meeting Cards...]     ││
│                   │  │                        ││
│                   │  │ ⏰ Dateless meetings   ││
│                   │  │ [Meeting Cards...]     ││
│                   │  └────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Meeting Categories

1. **Active Meetings** (🔔)
   - Currently ongoing meetings
   - Highlighted with accent color
   - Shows "Today" badge

2. **Future Meetings** (🔄)
   - Scheduled to start in the future
   - Normal styling

3. **Previous Meetings** (📜)
   - Ended meetings
   - Grayed out appearance

4. **Dateless Meetings** (⏰)
   - Meetings without scheduled dates
   - Normal styling

### Meeting Card Structure

Each meeting is displayed as a card containing:

```
┌─────────────────────────────────────┐
│ Meeting Name            [🔒] [📁] [👥]│
│ Location (if set)                   │
│ Start: DD.MM.YYYY HH:MM            │
│ End: DD.MM.YYYY HH:MM              │
│                                     │
│ [Committee Name →]                  │
└─────────────────────────────────────┘
```

**Icons:**
- 🔒 = Locked from inside
- 📁 = Archived meeting
- 👥 = Public access allowed

### Meeting Card Interactions

1. **Click on Card**
   - If user has access: Navigates to meeting
   - If no access: Card is read-only

2. **Committee Button**
   - Text: Committee name with arrow
   - Action: Navigates to committee detail page
   - Only shown if meeting has a committee

### Access Control

**Navigation Menu Visibility:**
- Dashboard: Always visible
- Meetings: Always visible
- Committees: Always visible
- Accounts: Requires `OML.can_manage_users`
- Tags: Requires `OML.can_manage_organization`
- Files: Requires `OML.can_manage_organization`
- Design: Requires `OML.can_manage_organization`
- Settings: Requires `OML.can_manage_organization`

**Meeting Access:**
- Superadmin: Access all meetings
- Regular users: Based on meeting membership
- Anonymous users: Only see dashboard, no meeting access

## Meeting Home Page

### URL Route
- Path: `/:meetingId` (meeting root)
- Component: `StartComponent`
- Location: `openslides-client/client/src/app/site/pages/meetings/pages/home/`

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Meeting Navigation Bar                         │
│  [☰] [Meeting Name]  [Account] [Mode] [Lang]   │
├─────────────────────────────────────────────────┤
│  Sidebar          │   Main Content Area         │
│  ┌─────────────┐  │  ┌────────────────────────┐│
│  │ 🏠 Home      │  │  │ Home      [✏️ Edit]    ││
│  │ 🚀 Autopilot │  │  ├────────────────────────┤│
│  │ 📋 Agenda    │  │  │                        ││
│  │ 📝 Motions   │  │  │  [Welcome Title]       ││
│  │ 🗳️ Elections │  │  │                        ││
│  │ 👥 Participants│ │  │  [Welcome Text - HTML] ││
│  │ 📎 Files     │  │  │                        ││
│  │ 📺 Projector │  │  │                        ││
│  │ 💬 Chat      │  │  │                        ││
│  │ 📊 History   │  │  │                        ││
│  │ ⚙️ Settings  │  │  └────────────────────────┘│
│  └─────────────┘  │                            │
└─────────────────────────────────────────────────┘
```

### Edit Mode

When user has `meetingCanManageSettings` permission:

1. **Edit Button**
   - Location: Top-right of content area
   - Icon: Pencil (edit)
   - Action: Enters edit mode

2. **Edit Form**
   ```
   ┌─────────────────────────────────────┐
   │ Home                   [💾] [❌]    │
   ├─────────────────────────────────────┤
   │ Welcome title *                     │
   │ [_________________________________] │
   │                                     │
   │ Welcome text                        │
   │ ┌─────────────────────────────────┐ │
   │ │ [Rich Text Editor Toolbar]      │ │
   │ │ [B] [I] [U] [Link] [List] ...   │ │
   │ ├─────────────────────────────────┤ │
   │ │                                 │ │
   │ │ [Text content area]             │ │
   │ │                                 │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
   ```

3. **Form Fields**
   - **Welcome Title**: Required text field
   - **Welcome Text**: Rich text editor with HTML support

4. **Actions**
   - Save (💾): Saves changes
   - Cancel (❌): Discards changes

### Meeting Info Page

Alternative home page variant showing:

1. **Legal Notice Section**
   - Shows legal notice and privacy policy if configured
   - HTML content support

2. **Statistics Section** (for managers/admins)
   - **Logged-in Users**: Count of active users
   - **Requests to Speak**: Statistics widget

## Technical Details

### Services and Dependencies

**Organization Dashboard:**
- `MeetingControllerService`: Manages meeting data
- `ActiveMeetingService`: Tracks current meeting state
- `OrganizationService`: Organization data
- `OperatorService`: User permissions

**Meeting Home Page:**
- `MeetingSettingsService`: Meeting configuration
- `ViewMeetingService`: Meeting data access
- `UpdateService`: Real-time updates

### Data Models

**Meeting Card Data:**
```typescript
{
  id: number;
  name: string;
  location?: string;
  start_time?: timestamp;
  end_time?: timestamp;
  is_locked_from_inside: boolean;
  is_archived: boolean;
  enable_anonymous: boolean;
  committee?: {
    id: number;
    name: string;
  }
}
```

**Welcome Page Settings:**
```typescript
{
  welcome_title: string;  // Required
  welcome_text: string;   // HTML content
}
```

### Real-time Updates
- Meeting list updates via subscription
- Auto-refresh when meetings are created/modified
- WebSocket connection for live updates

### Performance Optimizations
- Virtual scrolling for large meeting lists
- Lazy loading of meeting details
- Efficient change detection strategies

## E2E Test Selectors

### Organization Dashboard
- Meeting cards: `.meeting-card`
- Active section: `.active-meetings`
- Future section: `.future-meetings`
- Previous section: `.previous-meetings`
- Dateless section: `.dateless-meetings`
- Committee button: `button.committee-link`

### Meeting Home Page
- Edit button: `button[matTooltip="Edit"]`
- Welcome title input: `input[formControlName="welcome_title"]`
- Welcome text editor: `.editor-container`
- Save button: `button.save-button`
- Cancel button: `button.cancel-button`

### Navigation
- Sidebar toggle: `button.menu-toggle`
- Menu items: `a.nav-link`
- Account menu: `button.account-button`
- Dark mode toggle: `button.theme-toggle`
- Language selector: `mat-select.lang-select`

## Accessibility Features
- Proper heading hierarchy
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader announcements for updates
- High contrast mode support
- Focus indicators on all interactive elements