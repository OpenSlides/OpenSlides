# OpenSlides File Management and Modal Dialogs Documentation

## Overview
The File Management system provides comprehensive document handling, organization, and access control, including folder structures, file uploads, permissions, and integration with meeting content. Modal dialogs throughout the system provide consistent user interactions for content creation and management.

## URL Routes
- Files main: `/:meetingId/files`
- File details: `/:meetingId/files/:fileId`
- Folder view: `/:meetingId/files/folder/:folderId`

## File Management Interface

### File List Layout
```
┌─────────────────────────────────────────────────┐
│  Files                         [+] [📁] [⋮]    │
├─────────────────────────────────────────────────┤
│  Navigation: [🏠] / logos                       │
├─────────────────────────────────────────────────┤
│  File and Folder List                           │
│  ┌─────────────────────────────────────────────┐│
│  │ 📁 logos                     👥 Admin, Staff││
│  │    [Folder description/metadata]      [⋮]   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Additional files and folders would appear here]│
└─────────────────────────────────────────────────┘
```

### File Management Controls
- **Upload Button (+)**: Add new files
- **Create Folder (📁)**: Create new directory
- **Menu (⋮)**: Bulk operations and settings
- **Breadcrumb Navigation**: Show current location
- **Access Control**: Permission indicators (👥 Admin, Staff)

## Folder Creation Dialog

### New Directory Dialog
```
┌─────────────────────────────────────────────────┐
│  New directory                          [x]     │
├─────────────────────────────────────────────────┤
│  Please enter a name for the new directory:     │
│                                                 │
│  Title *                                        │
│  [Documents_______________________]             │
│                                                 │
│  Restrictions                            ▼     │
│  If empty, everyone can access.                 │
│                                                 │
│  [Dropdown showing access control options]      │
│  • Everyone (Default)                           │
│  • Admin only                                   │
│  • Delegates                                    │
│  • Custom groups...                             │
│                                                 │
│  Description (optional)                         │
│  [Text area for folder description]             │
│                                                 │
│  [Cancel]                           [Save]      │
└─────────────────────────────────────────────────┘
```

### Folder Properties
- **Directory Name**: Required folder identifier
- **Access Restrictions**: Permission-based folder access
- **Description**: Optional folder metadata
- **Inheritance**: Subfolder permission inheritance
- **Default Access**: "Everyone can access" when unrestricted

## File Upload System

### File Upload Dialog
```
┌─────────────────────────────────────────────────┐
│  Upload files                           [x]     │
├─────────────────────────────────────────────────┤
│  Drop files here or click to browse             │
│  ┌─────────────────────────────────────────────┐│
│  │           📄                                ││
│  │     Drop files here                         ││
│  │    [Browse files...]                        ││
│  │                                             ││
│  │  Supported formats: PDF, DOC, DOCX, XLS,    ││
│  │  XLSX, PPT, PPTX, TXT, JPG, PNG, GIF       ││
│  │  Maximum file size: 100MB                   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Upload to folder                               │
│  [Current folder: /logos ▼]                     │
│                                                 │
│  File permissions                               │
│  ● Inherit from folder                          │
│  ○ Custom permissions                           │
│                                                 │
│  Processing options                             │
│  ☑ Extract text from PDF for search            │
│  ☑ Generate thumbnails for images              │
│  ☐ Convert to PDF if possible                  │
│                                                 │
│  [Cancel]                        [Upload]       │
└─────────────────────────────────────────────────┘
```

### File Upload Features
- **Drag & Drop**: Direct file dropping interface
- **Multiple Selection**: Bulk file upload capability
- **Format Support**: Wide range of document and image formats
- **Size Limits**: Configurable maximum file sizes
- **Folder Selection**: Choose target directory
- **Permission Inheritance**: Automatic or custom permissions
- **Processing Options**: Text extraction, thumbnail generation

### Upload Progress Dialog
```
┌─────────────────────────────────────────────────┐
│  Uploading files                        [x]     │
├─────────────────────────────────────────────────┤
│  Progress: 2 of 5 files uploaded               │
│                                                 │
│  ✅ document1.pdf         [████████████] 100%  │
│  ✅ presentation.pptx     [████████████] 100%  │
│  🔄 spreadsheet.xlsx      [████████░░░░]  75%  │
│  ⏳ image1.jpg            [░░░░░░░░░░░░]   0%  │
│  ⏳ image2.png            [░░░░░░░░░░░░]   0%  │
│                                                 │
│  Current: spreadsheet.xlsx (2.3MB / 3.1MB)     │
│  Estimated time remaining: 15 seconds           │
│                                                 │
│  [Cancel remaining]              [Minimize]     │
└─────────────────────────────────────────────────┘
```

## File Operations and Management

### File Details Dialog
```
┌─────────────────────────────────────────────────┐
│  File details: company-logo.png        [x]     │
├─────────────────────────────────────────────────┤
│  📄 Preview                                     │
│  ┌─────────────────────────────────────────────┐│
│  │         [Image preview]                     ││
│  │                                             ││
│  │    🏢 Company Logo Preview                  ││
│  │                                             ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  File information                               │
│  Name: company-logo.png                         │
│  Size: 245 KB                                   │
│  Type: PNG Image                                │
│  Uploaded: 24.07.2024 14:30:15                 │
│  Uploaded by: Administrator                     │
│  Folder: /logos                                 │
│                                                 │
│  Usage                                          │
│  Used in: 2 motions, 1 agenda item             │
│  Projections: 5 times                          │
│  Downloads: 23 times                            │
│                                                 │
│  Access permissions                             │
│  👥 Admin, Staff (Edit)                        │
│  👁️ Delegates (View only)                      │
│                                                 │
│  [Download] [Edit] [Move] [Delete]              │
└─────────────────────────────────────────────────┘
```

### File Sharing Dialog
```
┌─────────────────────────────────────────────────┐
│  Share file: annual-report.pdf         [x]     │
├─────────────────────────────────────────────────┤
│  Share with meeting participants                │
│                                                 │
│  Link sharing                                   │
│  ☑ Enable public link                          │
│  Link: https://openslides.example.com/file/abc  │
│  [Copy link]                                    │
│                                                 │
│  Link options                                   │
│  ☐ Require authentication                      │
│  ☑ Allow download                              │
│  ☐ Set expiration date                         │
│  Expires: [DD.MM.YYYY_______]                  │
│                                                 │
│  Access permissions                             │
│  Select groups that can access this file:       │
│  ☑ Admin                                       │
│  ☑ Delegates                                   │
│  ☐ Board members                               │
│  ☑ Staff                                       │
│                                                 │
│  Notification                                   │
│  ☑ Send email notification to selected groups  │
│  ☐ Add to meeting announcement                 │
│                                                 │
│  [Cancel]                         [Share]       │
└─────────────────────────────────────────────────┘
```

## Content Creation Modals

### Create Agenda Item Dialog
```
┌─────────────────────────────────────────────────┐
│  Create agenda item                     [x]     │
├─────────────────────────────────────────────────┤
│  Item details                                   │
│                                                 │
│  Title *                                        │
│  [Budget Discussion___________________]         │
│                                                 │
│  Item number                                    │
│  ● Automatic numbering                          │
│  ○ Manual: [3.1____]                           │
│                                                 │
│  Duration (minutes)                             │
│  [30_____]                                      │
│                                                 │
│  Text/Description                               │
│  [Rich text editor with formatting toolbar]     │
│  [Discussion of the annual budget proposal      │
│   including revenue projections and expense     │
│   allocations for the upcoming fiscal year.]    │
│                                                 │
│  Visibility                                     │
│  ● Public item                                  │
│  ○ Internal item                                │
│  ○ Hidden item                                  │
│                                                 │
│  Item type                                      │
│  [Discussion ▼] (Discussion/Decision/Info)      │
│                                                 │
│  Attachments                                    │
│  [📎 budget-proposal.pdf]            [Remove]  │
│  [Add attachment...]                            │
│                                                 │
│  Tags                                           │
│  🏷️ [Budget] [Finance] [Priority]             │
│  [Add tag...]                                   │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Create Motion Dialog
```
┌─────────────────────────────────────────────────┐
│  Create motion                          [x]     │
├─────────────────────────────────────────────────┤
│  Motion details                                 │
│                                                 │
│  Title *                                        │
│  [Increase membership fees_____________]        │
│                                                 │
│  Motion text *                                  │
│  [Rich text editor with formatting toolbar]     │
│  [The membership fees shall be increased by     │
│   10% effective January 1st of the following    │
│   year to ensure adequate funding for all       │
│   organizational activities and services.]       │
│                                                 │
│  Reason (optional)                              │
│  [The current fee structure has remained        │
│   unchanged for three years while operational   │
│   costs have increased significantly...]        │
│                                                 │
│  Category                                       │
│  [Financial matters ▼]                          │
│                                                 │
│  Motion type                                    │
│  ● Standard motion                              │
│  ○ Amendment to existing motion                 │
│  ○ Procedural motion                            │
│                                                 │
│  Submitters                                     │
│  [Select submitters ▼]                          │
│  • John Doe (Board Member)            [Remove]  │
│  [Add submitter...]                             │
│                                                 │
│  Supporters (optional)                          │
│  [Add supporters...]                            │
│                                                 │
│  Related agenda item                            │
│  [3.1 Budget Discussion ▼]                     │
│                                                 │
│  Attachments                                    │
│  [Add attachment...]                            │
│                                                 │
│  Workflow                                       │
│  Starting state: [Submitted ▼]                 │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Create Election Dialog
```
┌─────────────────────────────────────────────────┐
│  Create election                        [x]     │
├─────────────────────────────────────────────────┤
│  Election details                               │
│                                                 │
│  Title *                                        │
│  [Board Member Election_______________]         │
│                                                 │
│  Description                                    │
│  [Election for three open board positions       │
│   with two-year terms beginning January 1st.]   │
│                                                 │
│  Number of positions                            │
│  [3] positions to fill                          │
│                                                 │
│  Election method                                │
│  ● Vote for candidates                          │
│  ○ Yes/No/Abstain for each                     │
│  ○ Preferential voting (ranked choice)          │
│                                                 │
│  Ballot type                                    │
│  ● Electronic voting                            │
│  ○ Paper ballots                                │
│  ○ Show of hands                                │
│                                                 │
│  Candidate nominations                          │
│  ☑ Allow self-nomination                       │
│  ☑ Allow nomination by others                  │
│  Nomination deadline: [DD.MM.YYYY HH:MM]       │
│                                                 │
│  Voting period                                  │
│  Start: [DD.MM.YYYY HH:MM]                     │
│  End:   [DD.MM.YYYY HH:MM]                     │
│                                                 │
│  Eligible voters                                │
│  ☑ All participants                            │
│  ☐ Delegates only                              │
│  ☐ Custom group: [Select group ▼]              │
│                                                 │
│  Result publication                             │
│  ● Immediately after voting ends               │
│  ○ Manual publication by administrator          │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Create Participant Dialog
```
┌─────────────────────────────────────────────────┐
│  Create participant                     [x]     │
├─────────────────────────────────────────────────┤
│  Personal information                           │
│                                                 │
│  Title                                          │
│  [Dr._______]                                   │
│                                                 │
│  First name *                                   │
│  [Jane_____________________]                    │
│                                                 │
│  Last name *                                    │
│  [Smith____________________]                    │
│                                                 │
│  Username                                       │
│  [jane.smith_______________]                    │
│                                                 │
│  Email address                                  │
│  [jane.smith@example.com___]                    │
│                                                 │
│  Structure level                                │
│  [Board Member_____________]                    │
│                                                 │
│  Participant number                             │
│  [12345] (Auto-generated)                       │
│                                                 │
│  Groups and permissions                         │
│  ☑ Default                                     │
│  ☑ Delegates                                   │
│  ☐ Admin                                       │
│  ☐ Staff                                       │
│                                                 │
│  Account settings                               │
│  ☑ Send welcome email with login credentials   │
│  ☐ Account is active                           │
│  ☐ Is present in meeting                       │
│                                                 │
│  Additional information                         │
│  Gender: [Not specified ▼]                     │
│  Vote weight: [1.0____]                        │
│  Comment: [_________________________]          │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

## Import/Export Dialogs

### Import Participants Dialog
```
┌─────────────────────────────────────────────────┐
│  Import participants                    [x]     │
├─────────────────────────────────────────────────┤
│  File selection                                 │
│                                                 │
│  Import file                                    │
│  [Choose CSV file...] participants.csv         │
│                                                 │
│  File format requirements                       │
│  Required columns: first_name, last_name       │
│  Optional columns: title, email, username,     │
│  structure_level, number, groups, comment      │
│                                                 │
│  Column mapping                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ CSV Column        → OpenSlides Field        ││
│  │ First Name        → first_name              ││
│  │ Last Name         → last_name               ││
│  │ Email Address     → email                   ││
│  │ Department        → structure_level         ││
│  │ Role              → groups                  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Import options                                 │
│  ☑ Skip duplicate usernames                    │
│  ☑ Send welcome emails to new participants     │
│  ☐ Set all participants as present             │
│                                                 │
│  Default settings for imported users            │
│  Default groups: [Default ▼]                   │
│  Vote weight: [1.0____]                        │
│                                                 │
│  Preview (first 5 rows)                        │
│  [Table preview of CSV data]                   │
│                                                 │
│  [Cancel]                        [Import]       │
└─────────────────────────────────────────────────┘
```

### Export Data Dialog
```
┌─────────────────────────────────────────────────┐
│  Export meeting data                    [x]     │
├─────────────────────────────────────────────────┤
│  Export format                                  │
│  ● CSV (Spreadsheet compatible)                 │
│  ○ JSON (Technical format)                      │
│  ○ PDF (Formatted document)                     │
│  ○ XML (Structured data)                        │
│                                                 │
│  Data to export                                 │
│  ☑ Participants                                │
│  ☑ Agenda items                                │
│  ☑ Motions                                     │
│  ☑ Elections and results                       │
│  ☐ Chat messages                               │
│  ☐ History/Audit log                           │
│  ☐ Files and attachments                       │
│                                                 │
│  Participant data fields                        │
│  ☑ Name and contact information                │
│  ☑ Groups and permissions                      │
│  ☑ Presence status                             │
│  ☐ Vote history (if available)                 │
│  ☐ Personal comments                           │
│                                                 │
│  Motion data fields                             │
│  ☑ Motion text and reason                      │
│  ☑ Submitters and supporters                   │
│  ☑ Workflow states                             │
│  ☑ Amendment information                       │
│  ☐ Vote results                                │
│                                                 │
│  Date range (optional)                          │
│  From: [DD.MM.YYYY______]                      │
│  To:   [DD.MM.YYYY______]                      │
│                                                 │
│  File options                                   │
│  ☑ Include column headers                      │
│  ☑ UTF-8 encoding                             │
│  Delimiter: [Comma ▼]                          │
│                                                 │
│  [Cancel]                      [Export]         │
└─────────────────────────────────────────────────┘
```

## User Interface Patterns

### Common Modal Elements
- **Close Button (×)**: Standard dialog closure
- **Cancel/Save Buttons**: Consistent action placement
- **Required Fields (*)**: Visual required field indicators
- **Help Text**: Explanatory text for complex options
- **Progressive Disclosure**: Advanced options hidden by default
- **Validation Messages**: Real-time form validation
- **Loading States**: Progress indicators for long operations

### Form Components
- **Text Inputs**: Standard text entry fields
- **Dropdowns**: Selection from predefined options
- **Checkboxes**: Multiple selection options
- **Radio Buttons**: Single selection from options
- **File Pickers**: File selection interfaces
- **Rich Text Editors**: Formatted text input
- **Date/Time Pickers**: Temporal value selection
- **Multi-select**: Multiple item selection interfaces

## Data Models

### File Model
```typescript
{
  id: number;
  filename: string;
  title?: string;
  mediafile_id: number;
  is_directory: boolean;
  filesize?: number;
  mimetype?: string;
  pdf_information?: object;
  create_timestamp: number;
  used_as_logo_for_organization_id?: number;
  used_as_font_for_organization_id?: number;
  token?: string;
  access_group_ids: number[];
  inherited_access_group_ids: number[];
  is_public: boolean;
  parent_id?: number;
  child_ids: number[];
}
```

### Modal Dialog State
```typescript
{
  isOpen: boolean;
  dialogType: string;
  data?: any;
  loading: boolean;
  error?: string;
  validationErrors: object;
}
```

## E2E Test Selectors

### File Management
- File list: `.file-list`
- File item: `.file-item`
- Folder item: `.folder-item`
- Upload button: `button[matTooltip="Upload"]`
- Create folder: `button[matTooltip="Create folder"]`

### Modal Dialogs
- Dialog container: `mat-dialog-container`
- Dialog title: `.mat-dialog-title`
- Dialog content: `.mat-dialog-content`
- Dialog actions: `.mat-dialog-actions`
- Close button: `button[mat-dialog-close]`

### Form Elements
- Text input: `input[formControlName]`
- Select dropdown: `mat-select`
- Checkbox: `mat-checkbox`
- Radio button: `mat-radio-button`
- File input: `input[type="file"]`

## Accessibility Features
- **Screen Reader Support**: ARIA labels and descriptions
- **Keyboard Navigation**: Tab order and keyboard shortcuts
- **Focus Management**: Proper focus handling in modals
- **High Contrast**: Compatible with accessibility themes
- **Error Announcements**: Screen reader error notifications
- **Form Labels**: Proper label associations