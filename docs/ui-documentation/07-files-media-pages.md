# OpenSlides Files/Media Pages Documentation

## Overview
The Files/Media module manages all file assets including documents, images, fonts, and logos. It supports hierarchical folder structures, access control, and integration with other OpenSlides features like projectors and motions.

## URL Routes
- Meeting files: `/:meetingId/mediafiles`
- Organization files: `/mediafiles`
- File upload: `/:meetingId/mediafiles/upload`

## File List Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Files                         [📤 Upload] [⋮]  │
├─────────────────────────────────────────────────┤
│  📁 Home > Documents > Meeting 2024             │
├─────────────────────────────────────────────────┤
│  [🔍 Search files...]                           │
├─────────────────────────────────────────────────┤
│  □ | Name | Size | Type | Access | Usage | ⋮   │
├─────────────────────────────────────────────────┤
│  □ 📁 Presentations      --    Folder  All   [⋮]│
│  □ 📁 Documents          --    Folder  All   [⋮]│
│  □ 📄 Agenda.pdf        2.3MB  PDF    All   [⋮]│
│  □ 🖼️ Logo.png          156KB  Image  All  🏛️[⋮]│
│  □ 📄 Minutes.docx      1.2MB  Doc    Board [⋮]│
│  □ 🎨 CustomFont.ttf    245KB  Font   All  🔤[⋮]│
└─────────────────────────────────────────────────┘
```

### Navigation Elements
1. **Breadcrumb Trail**: Shows current directory path
2. **Parent Navigation**: Click breadcrumb items to navigate up
3. **Folder Navigation**: Click folders to navigate down

### List Columns
1. **Checkbox**: For multiselect operations
2. **Name**: File/folder name with type icon
3. **Size**: File size (empty for folders)
4. **Type**: File type or "Folder"
5. **Access**: Access groups or "All"
6. **Usage**: Icons showing where file is used:
   - 🏛️ = Used as logo
   - 🔤 = Used as font
   - 📊 = Used in presentation
7. **Menu**: Individual file actions

### File Type Icons
- 📁 = Folder/Directory
- 📄 = PDF document
- 🖼️ = Image (JPG, PNG, etc.)
- 📄 = Document (DOC, TXT, etc.)
- 🎨 = Font file
- 🎥 = Video file
- 📎 = Other file types

### Header Actions

#### Upload Button (📤)
Opens upload interface

#### Menu Actions (⋮)
- **New folder**: Create directory
- **Download all**: Archive current directory
- **Select all**: Select all visible items

### Multiselect Actions
When files are selected:
- **Move**: Move to different folder
- **Delete**: Remove selected items
- **Download**: Create archive of selection
- **Set access groups**: Bulk permission update

## File Upload Interface

### Upload Dialog
```
┌─────────────────────────────────────────────────┐
│  Upload files                           [x]     │
├─────────────────────────────────────────────────┤
│  Upload to: Home > Documents > Meeting 2024     │
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │                                             ││
│  │        📤 Drop files here or click          ││
│  │           to select files                   ││
│  │                                             ││
│  │     [Select Files] [Select Folder]         ││
│  │                                             ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Access groups (optional)                       │
│  [Select groups... ▼]                           │
│                                                 │
│  □ Upload files in parallel                     │
│                                                 │
│  Files to upload (3):                           │
│  ┌─────────────────────────────────────────────┐│
│  │ ✓ Report.pdf (2.3 MB)                      ││
│  │ ⏳ Presentation.pptx (5.6 MB) - 45%        ││
│  │ ⏸️ Budget.xlsx (1.2 MB) - Queued           ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Cancel]                    [Upload]           │
└─────────────────────────────────────────────────┘
```

### Upload Features
1. **Drag & Drop**: Drop files anywhere in the zone
2. **File Selection**: Click to browse files
3. **Folder Upload**: Upload entire folders
4. **Access Control**: Set permissions during upload
5. **Parallel Upload**: Toggle concurrent uploads
6. **Progress Tracking**: Individual file progress
7. **Queue Management**: Pause/resume uploads

## File/Folder Management

### Create Folder Dialog
```
┌─────────────────────────────────────────────────┐
│  Create new folder                      [x]     │
├─────────────────────────────────────────────────┤
│  Folder name *                                  │
│  [Meeting Documents___________]                 │
│                                                 │
│  Access groups (optional)                       │
│  [Select groups... ▼]                           │
│  Leave empty for public access                  │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Edit File Dialog
```
┌─────────────────────────────────────────────────┐
│  Edit file                              [x]     │
├─────────────────────────────────────────────────┤
│  File name *                                    │
│  [Annual Report 2024__________]                 │
│                                                 │
│  Access groups                                  │
│  [x] Board Members                              │
│  [x] Committee Chairs                           │
│  [ ] All Participants                           │
│                                                 │
│  [Cancel]                         [Save]        │
└─────────────────────────────────────────────────┘
```

### Move Files Dialog
```
┌─────────────────────────────────────────────────┐
│  Move 3 files                           [x]     │
├─────────────────────────────────────────────────┤
│  Select destination folder:                     │
│                                                 │
│  📁 Home                                        │
│  └─ 📁 Documents                                │
│      ├─ 📁 Archives                             │
│      ├─ 📁 Current ← (current location)         │
│      └─ 📁 Templates                            │
│  └─ 📁 Presentations                            │
│                                                 │
│  [Cancel]                         [Move]        │
└─────────────────────────────────────────────────┘
```

## Logo and Font Management

### Set as Logo Menu
```
┌─────────────────────────────────────────────────┐
│  Set as logo for:                              │
├─────────────────────────────────────────────────┤
│  ✓ Main logo                                   │
│  □ Projector logo                               │
│  □ Web header                                   │
│  □ PDF header left                              │
│  □ PDF header right                             │
│  □ PDF footer left                              │
│  □ PDF footer right                             │
│  □ PDF ballot paper                             │
└─────────────────────────────────────────────────┘
```

### Set as Font Menu
```
┌─────────────────────────────────────────────────┐
│  Set as font for:                              │
├─────────────────────────────────────────────────┤
│  □ Regular text                                 │
│  □ Italic text                                  │
│  □ Bold text                                    │
│  □ Bold italic text                             │
│  □ Monospace                                    │
│  □ Main heading                                 │
│  □ Subheading                                   │
└─────────────────────────────────────────────────┘
```

### Usage Indicators
Files show usage icons with tooltips:
- **Logo icon (🏛️)**: Hover shows "Used as: Main logo, PDF header"
- **Font icon (🔤)**: Hover shows "Used as: Regular text, Bold text"

## File Actions Menu

### Individual File Actions (⋮)
For regular files:
- **Project**: Show on projector
- **Edit**: Change name/permissions
- **Move**: Move to different folder
- **Delete**: Remove file
- **Download**: Download file
- **Set as logo**: Configure logo usage
- **Set as font**: Configure font usage
- **Information**: View file details

For folders:
- **Enter folder**: Navigate into folder
- **Edit**: Change name/permissions
- **Move**: Move folder
- **Delete**: Remove folder (must be empty)
- **Download**: Download as archive

## Organization vs Meeting Files

### Organization Files
- Available at `/mediafiles`
- Shared across all meetings
- Can be published/unpublished
- Special permissions required

### Meeting Files
- Available at `/:meetingId/mediafiles`
- Specific to one meeting
- Inherit meeting permissions
- Can reference organization files

### Publishing Files
```
┌─────────────────────────────────────────────────┐
│  ⚠️ Publish file organization-wide?             │
├─────────────────────────────────────────────────┤
│  This will make the file available to all      │
│  meetings in the organization.                  │
│                                                 │
│  File: Logo.png                                 │
│                                                 │
│  [Cancel]                      [Publish]        │
└─────────────────────────────────────────────────┘
```

## Search and Filter

### Search Functionality
- Search by file name
- Search within current directory
- Real-time filtering as you type
- Highlights matching terms

### Access Group Filter
Files are automatically filtered based on:
- User's group memberships
- File access restrictions
- Inherited folder permissions

## Technical Details

### Data Models

**Mediafile Model**:
```typescript
{
  id: number;
  title: string;
  is_directory: boolean;
  access_group_ids: number[];
  parent_id?: number;
  child_ids: number[];
  list_of_speakers_id?: number;
  projection_ids: number[];
  used_as_logo_in_meeting_id?: string;
  used_as_font_in_meeting_id?: string;
  // Organization files only
  published_to_meetings_in_organization_id?: number;
}
```

**Meeting Mediafile Model**:
```typescript
{
  id: number;
  mediafile_id: number;
  meeting_id: number;
  access_group_ids: number[];
  // File data
  filename: string;
  mimetype: string;
  filesize: number;
  create_timestamp: number;
  // PDF specific
  pdf_information?: {
    pages: number;
    encrypted: boolean;
  };
}
```

### Services
- `MediafileControllerService`: CRUD operations
- `MediafileRepositoryService`: Data access
- `MediafileCommonService`: Shared utilities
- `MediaManageService`: Logo/font management
- `MediafileListExportService`: Bulk download
- `ViewMeetingMediafileService`: Meeting-specific

### Permissions
- `mediafile.can_see`: View files
- `mediafile.can_manage`: Upload/edit/delete
- `meeting.can_manage_logos_and_fonts`: Logo/font settings
- `organization.can_manage_organization`: Org files

## E2E Test Selectors

### List Page
- Upload button: `button[matTooltip="Upload files"]`
- File rows: `.file-list-row`
- Folder rows: `.folder-row`
- Breadcrumb: `.breadcrumb-item`
- Search input: `input[placeholder="Search files"]`
- Multiselect checkbox: `mat-checkbox.selection-checkbox`

### Upload Dialog
- Drop zone: `.upload-drop-zone`
- File input: `input[type="file"]`
- Access groups: `os-list-search-selector`
- Upload button: `button.upload-button`
- Progress bars: `.upload-progress`

### File Actions
- Menu button: `button.file-menu`
- Edit option: `button[matTooltip="Edit"]`
- Delete option: `button[matTooltip="Delete"]`
- Logo menu: `.logo-menu-item`
- Font menu: `.font-menu-item`

### Dialogs
- Title input: `input[formControlName="title"]`
- Group selector: `os-list-search-selector[formControlName="access_group_ids"]`
- Save button: `button.save-button`
- Cancel button: `button.cancel-button`

## Keyboard Shortcuts
- `Ctrl+U`: Open upload dialog
- `Delete`: Delete selected files
- `Enter`: Open folder/download file
- `Ctrl+A`: Select all files
- `Escape`: Close dialogs

## Accessibility Features
- ARIA labels for all actions
- Keyboard navigation support
- Screen reader file type announcements
- Focus management in dialogs
- Alternative text for icons
- Status announcements for uploads