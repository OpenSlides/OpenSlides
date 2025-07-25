# Motion Create Form Documentation

## Overview
The motion creation form allows users to submit new proposals for consideration by the assembly.

## Navigation
- **URL**: `/{meeting_id}/motions/new`
- **Access**: Click floating action button (+) from motion list
- **Breadcrumb**: Meeting > Motions > New motion

## Page Header
- **Title**: "New motion" 
- **Close Button**: X icon (returns to motion list)
- **Save Button**: Disabled until required fields are filled

## Form Fields

### 1. Submitters Section
- **Field**: Multi-select dropdown
- **Label**: "Submitters"
- **Required**: No
- **Test Selector**: `[aria-label="Submitters"]`
- **Purpose**: Designate motion authors/sponsors
- **Default**: Empty (current user may be auto-added based on permissions)

### 2. Title Field
- **Field**: Text input
- **Label**: "Title"
- **Required**: Yes (marked with *)
- **Test Selector**: `[aria-label="Title"]`
- **Validation**: Cannot be empty
- **Purpose**: Brief description of the motion

### 3. Motion Text Section
- **Label**: "The assembly may decide:"
- **Field**: Rich text editor (TipTap)
- **Required**: Yes
- **Test Selector**: First `.tiptap.ProseMirror`
- **Validation Error**: "This field is required." (shown below when empty)

#### Text Editor Toolbar
- **Formatting**: 
  - Paragraph style dropdown
  - Bold (`format_bold`)
  - Italic (`format_italic`)
  - Underline (`format_underline`)
  - Strikethrough (`format_strikethrough`)
- **Colors**:
  - Text color picker (`format_color_text`) - Default: #000000
  - Background color picker (`format_color_fill`) - Default: #000000
- **Clear Format**: Remove all formatting (`format_clear`)
- **Lists**:
  - Bullet list (`format_list_bulleted`)
  - Numbered list (`format_list_numbered`)
- **Insert**:
  - Link (`link`)
  - Image (`image`)
- **History**:
  - Undo (`undo`) - Disabled initially
  - Redo (`redo`) - Disabled initially
- **Source**: HTML code view (`code`)

### 4. Reason Section
- **Label**: "Reason"
- **Field**: Rich text editor (TipTap)
- **Required**: No
- **Test Selector**: Second `.tiptap.ProseMirror`
- **Purpose**: Justification for the motion
- **Toolbar**: Identical to motion text editor

### 5. Category Field
- **Field**: Dropdown select
- **Label**: "Category"
- **Required**: No
- **Test Selector**: `[aria-label="Category"]`
- **Purpose**: Organize motions by topic

### 6. Attachments Section
- **Field**: Multi-select dropdown
- **Label**: "Attachments"
- **Required**: No
- **Test Selector**: `[aria-label="Attachments"]`
- **Upload Button**: Cloud upload icon (`cloud_upload`)
- **Purpose**: Attach supporting documents

### 7. Agenda Integration
- **Checkbox**: "Add to agenda"
- **Test Selector**: `[aria-label="Add to agenda"]`
- **Default**: Unchecked
- **Sub-fields** (visible when checked):
  
  #### Agenda Visibility
  - **Field**: Dropdown select
  - **Label**: "Agenda visibility"
  - **Test Selector**: `[aria-label="Agenda visibility"]`
  - **Options**:
    - public
    - internal (default when agenda enabled)
    - hidden
  
  #### Parent Agenda Item
  - **Field**: Dropdown select
  - **Label**: "Parent agenda item"
  - **Test Selector**: `[aria-label="Parent agenda item"]`
  - **Purpose**: Place under existing agenda item

### 8. Supporters Field
- **Field**: Multi-select dropdown
- **Label**: "Supporters"
- **Required**: Depends on meeting settings
- **Test Selector**: `[aria-label="Supporters"]`
- **Purpose**: Additional endorsers beyond submitters

### 9. Workflow Field
- **Field**: Dropdown select
- **Label**: "Workflow"
- **Required**: Yes
- **Test Selector**: `[aria-label="Workflow"]`
- **Default**: "Simple Workflow"
- **Purpose**: Determines motion lifecycle states

## Form Behavior

### Validation
- Save button remains disabled until:
  - Title is filled
  - Motion text contains content
- Real-time validation as user types
- Error messages appear below fields

### Save Action
- Creates motion in "submitted" state
- Redirects to motion detail view
- Shows success notification

### Cancel Action
- Close button (X) in header
- Prompts if unsaved changes exist
- Returns to motion list

## Accessibility
- All form fields have ARIA labels
- Tab navigation supported
- Screen reader friendly
- Error messages announced

## Technical Details
- Component: `MotionCreateComponent`
- Route: `motions/new`
- Guards: Requires `motion.can_create` permission
- API: `POST /system/action/motion.create`