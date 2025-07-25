# OpenSlides Organization Tags Documentation

## Overview
The Organization Tags module provides a centralized tagging system for categorizing and organizing various elements across the OpenSlides system at the organization level. Tags help with content organization, filtering, and management across multiple meetings and committees.

## URL Routes
- Organization Tags: `/organizations/:orgId/tags`

## Page Layout
```
┌─────────────────────────────────────────────────┐
│  Tags                           [+] [⋮]         │
├─────────────────────────────────────────────────┤
│  Search: [🔍 Search_____________]                │
├─────────────────────────────────────────────────┤
│  1 of 1                                         │
├─────────────────────────────────────────────────┤
│  Tag List                                       │
│  ┌─────────────────────────────────────────────┐│
│  │  Orga Tag 1                      [✏️] [🗑]  ││
│  │  [Blue badge/chip styling]                  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Empty space for additional tags]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Tag Management Interface

### Header Controls
- **Create Tag Button (+)**: Add new organization-wide tags
- **Menu Button (⋮)**: Additional management options and bulk operations
- **Search Field**: Real-time filtering of existing tags
- **Result Counter**: Shows current results ("1 of 1")

### Tag Display
Each tag is displayed as:
- **Tag Name**: "Orga Tag 1" (customizable name)
- **Visual Styling**: Colored badge/chip for easy identification
- **Edit Button (✏️)**: Modify tag properties
- **Delete Button (🗑)**: Remove tag from system

## Tag Creation and Management

### Create New Tag Dialog
```
┌─────────────────────────────────────────────────┐
│  Create organization tag                [x]     │
├─────────────────────────────────────────────────┤
│  Tag name *                                     │
│  [Budget Category_________________]             │
│                                                 │
│  Color                                          │
│  ┌─────────────────────────────────────┐       │
│  │ [🔵][🔴][🟡][🟢][🟣][🟠][⚫][⚪]  │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Description (optional)                         │
│  [Text area for tag description]                │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Edit Tag Dialog
```
┌─────────────────────────────────────────────────┐
│  Edit organization tag                  [x]     │
├─────────────────────────────────────────────────┤
│  Tag name *                                     │
│  [Orga Tag 1______________________]             │
│                                                 │
│  Color                                          │
│  ┌─────────────────────────────────────┐       │
│  │ [🔵][🔴][🟡][🟢][🟣][🟠][⚫][⚪]  │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Description                                    │
│  [Text area with existing description]          │
│                                                 │
│  Usage Statistics                               │
│  Used in: 3 meetings, 7 motions, 2 files      │
│                                                 │
│  [Delete Tag]                                   │
│                                                 │
│  [Cancel]                           [Save]      │
└─────────────────────────────────────────────────┘
```

## Tag Properties and Features

### Tag Attributes
- **Name**: Unique identifier for the tag
- **Color**: Visual color coding for easy recognition
- **Description**: Optional detailed description of tag purpose
- **Usage Scope**: Organization-wide availability
- **Creation Date**: When the tag was created
- **Creator**: User who created the tag

### Color Options
Available color palette:
- **Blue** (🔵): Default, general purpose
- **Red** (🔴): High priority, urgent items
- **Yellow** (🟡): Warnings, attention needed
- **Green** (🟢): Approved, completed items
- **Purple** (🟣): Special categories
- **Orange** (🟠): In progress, pending
- **Black** (⚫): System, technical tags
- **White** (⚪): Custom, neutral tags

## Tag Usage and Applications

### Content Tagging
Tags can be applied to:
- **Meetings**: Categorize meetings by type, department, or priority
- **Motions**: Tag motions by topic, committee, or status
- **Agenda Items**: Organize agenda content
- **Files/Documents**: Categorize uploaded materials
- **Committees**: Mark committee types and purposes
- **Participants**: Group participants by role or affiliation

### Filtering and Search
- **Meeting Filters**: Show only meetings with specific tags
- **Motion Categorization**: Filter motions by tag
- **Document Organization**: Find files by tag
- **Bulk Operations**: Apply actions to tagged items
- **Report Generation**: Create reports based on tags

## Administrative Features

### Bulk Management
```
┌─────────────────────────────────────────────────┐
│  Bulk tag operations                    [x]     │
├─────────────────────────────────────────────────┤
│  Selected tags: 3                               │
│                                                 │
│  Available actions:                             │
│  ○ Merge tags                                   │
│  ○ Change color                                 │
│  ○ Export tag data                              │
│  ○ Delete selected                              │
│                                                 │
│  [Cancel]                        [Execute]      │
└─────────────────────────────────────────────────┘
```

### Tag Analytics
- **Usage Statistics**: How often each tag is used
- **Popularity Metrics**: Most and least used tags
- **Coverage Analysis**: Items without tags
- **Trend Analysis**: Tag usage over time
- **Performance Impact**: Tag system efficiency

## Search and Discovery

### Tag Search Features
- **Real-time Search**: Instant filtering as you type
- **Partial Matching**: Find tags with partial name matches
- **Case Insensitive**: Search regardless of case
- **Description Search**: Search within tag descriptions
- **Color Filtering**: Filter by tag color
- **Usage Filtering**: Find tags by usage count

### Advanced Search
```
┌─────────────────────────────────────────────────┐
│  Advanced tag search                    [x]     │
├─────────────────────────────────────────────────┤
│  Tag name contains:                             │
│  [budget_________________________]             │
│                                                 │
│  Color:                                         │
│  [Any color ▼]                                  │
│                                                 │
│  Usage range:                                   │
│  Min: [0  ] Max: [999]                          │
│                                                 │
│  Created between:                               │
│  From: [______] To: [______]                    │
│                                                 │
│  [Clear]                        [Search]        │
└─────────────────────────────────────────────────┘
```

## Tag Hierarchy and Organization

### Tag Categories
While flat by design, tags can be organized conceptually:
- **Functional Tags**: By department or function
- **Priority Tags**: Urgency and importance levels  
- **Status Tags**: Progress and completion states
- **Type Tags**: Content type classifications
- **Process Tags**: Workflow stage indicators

### Naming Conventions
Recommended tag naming patterns:
- **Prefixes**: `DEPT-`, `PRIORITY-`, `STATUS-`
- **Descriptive**: Clear, meaningful names
- **Consistent**: Follow organization standards
- **Searchable**: Include searchable keywords

## Integration Features

### Cross-Module Integration
- **Meeting Integration**: Tag meetings for easy organization
- **Motion Tagging**: Categorize motions and proposals
- **File Management**: Tag documents and media files  
- **Committee Organization**: Tag committees by type
- **User Grouping**: Organize participants by tags

### API Integration
- **REST API**: Programmatic tag management
- **Bulk Import/Export**: CSV-based tag operations
- **External Systems**: Integration with external tools
- **Reporting APIs**: Generate tag-based reports

## Data Models

### Organization Tag Model
```typescript
{
  id: number;
  name: string;
  color: string;
  description?: string;
  organization_id: number;
  created_at: number;
  created_by_id: number;
  usage_count: number;
  last_used: number;
}
```

### Tag Usage Model
```typescript
{
  id: number;
  tag_id: number;
  content_object_collection: string;
  content_object_id: number;
  created_at: number;
  created_by_id: number;
}
```

## Permissions and Access Control

### Tag Permissions
- `organization.can_see_tags`: View organization tags
- `organization.can_manage_tags`: Create, edit, delete tags
- `organization.can_use_tags`: Apply tags to content
- `organization.can_see_tag_analytics`: View usage statistics

### Permission Levels
- **Viewers**: Can see and search tags
- **Users**: Can apply existing tags to content
- **Managers**: Can create, edit, and delete tags
- **Administrators**: Full tag system management

## E2E Test Selectors

### Tag Interface
- Tag list container: `.tag-list`
- Tag item: `.tag-item`
- Tag name: `.tag-name`
- Tag color: `.tag-color`
- Create button: `button[matTooltip="Create tag"]`
- Search input: `input[placeholder="Search"]`

### Tag Management
- Edit button: `button[matTooltip="Edit tag"]`
- Delete button: `button[matTooltip="Delete tag"]`
- Tag name input: `input[formControlName="name"]`
- Color picker: `.color-picker`
- Description field: `textarea[formControlName="description"]`

### Bulk Operations
- Select all: `mat-checkbox.select-all`
- Tag checkbox: `mat-checkbox.tag-select`
- Bulk menu: `button.bulk-actions`
- Action selector: `mat-select.bulk-action`

## Keyboard Shortcuts
- `Ctrl+N`: Create new tag
- `Ctrl+F`: Focus search field
- `Enter`: Apply search/submit form
- `Escape`: Cancel current operation
- `Del`: Delete selected tags
- `Ctrl+A`: Select all visible tags

## Accessibility Features
- **Screen Reader Support**: ARIA labels for all elements
- **Keyboard Navigation**: Full keyboard control
- **High Contrast**: Compatible with accessibility themes
- **Focus Management**: Clear focus indicators
- **Color Alternatives**: Text labels supplement color coding
- **Semantic HTML**: Proper heading and list structure

## Performance Features
- **Lazy Loading**: Load tags on demand
- **Caching**: Cache frequently used tags
- **Pagination**: Handle large tag collections
- **Debounced Search**: Reduce server requests
- **Optimistic Updates**: Immediate UI feedback