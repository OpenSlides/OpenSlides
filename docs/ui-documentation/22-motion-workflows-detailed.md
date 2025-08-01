# OpenSlides Motion Workflows and States Documentation

## Overview
The Motion Workflows system provides comprehensive state management for motions, enabling complex approval processes, amendments, recommendations, and state transitions that mirror real-world parliamentary procedures and organizational decision-making processes.

## URL Routes
- Motions main: `/:meetingId/motions`
- Motion detail: `/:meetingId/motions/:motionId`
- Motion edit: `/:meetingId/motions/:motionId/edit`
- Amendment view: `/:meetingId/motions/:motionId/amendments`
- Motion history: `/:meetingId/motions/:motionId/history`

## Motion List Interface

### Motion Overview Layout
```
┌─────────────────────────────────────────────────┐
│  Motions                        [📊] [+] [⋮]    │
├─────────────────────────────────────────────────┤
│  4 of 4    [≡ SORT] [⚲ FILTER] [🔍 Search___] │
├─────────────────────────────────────────────────┤
│  Motion List                                    │
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 1-1  Änderungsantrag zu 1                ││
│  │         by Administrator (Test structure...  ││
│  │         Sequential number 2                  ││
│  │         [submitted] 🏷️ Tag1, Tag3           ││
│  │                          🏛️ C - Cad    👥  ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 2    ohne                                ││
│  │         by Administrator (Test structure...  ││
│  │         Sequential number 3                  ││
│  │         [submitted] 🏷️ Tag3                 ││
│  │                C - Cad, B - Bildung         ││
│  │                          🏛️ BLOCK A    👥  ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 3    komplex                             ││
│  │         by Administrator (Test structure...  ││
│  │         Sequential number 4                  ││
│  │         [permitted]                          ││
│  │                          🏛️ BLOCK A         ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 A1   test                                ││
│  │         by Administrator (Test structure...  ││
│  │         Sequential number 1                  ││
│  │         [submitted] C - Cad, B - Bildung    ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Motion Workflow States

### Standard Motion States

#### Submitted State
```
┌─────────────────────────────────────────────────┐
│ [submitted] - Motion Initial State              │
├─────────────────────────────────────────────────┤
│ Description: Motion has been submitted and is   │
│ awaiting initial review                         │
│                                                 │
│ Available Actions:                              │
│ • Accept motion (→ Accepted)                    │
│ • Reject motion (→ Rejected)                    │
│ • Withdraw motion (→ Withdrawn)                 │
│ • Edit motion content                           │
│                                                 │
│ Permissions:                                    │
│ • Submitter: Can edit, withdraw                 │
│ • Admin: Can accept, reject, modify             │
│ • Delegates: Can view                           │
│                                                 │
│ Visual Indicator: Blue badge                    │
└─────────────────────────────────────────────────┘
```

#### Permitted State
```
┌─────────────────────────────────────────────────┐
│ [permitted] - Motion Approved for Discussion    │
├─────────────────────────────────────────────────┤
│ Description: Motion has passed initial review   │
│ and is ready for discussion and voting          │
│                                                 │
│ Available Actions:                              │
│ • Create poll (→ Voting)                        │
│ • Recommend acceptance (→ Recommended)          │
│ • Recommend rejection (→ Not Recommended)       │
│ • Return to submitted (→ Submitted)             │
│ • Create amendment                              │
│                                                 │
│ Permissions:                                    │
│ • Admin: Full control                           │
│ • Committee Chair: Can recommend                │
│ • Participants: Can create amendments           │
│                                                 │
│ Visual Indicator: Green badge                   │
└─────────────────────────────────────────────────┘
```

#### Additional Workflow States
- **Accepted**: Motion approved and finalized
- **Rejected**: Motion denied and closed
- **Withdrawn**: Motion retracted by submitter
- **Adjourned**: Motion postponed to future meeting
- **Not Decided**: Motion discussion incomplete
- **Referred to Committee**: Sent to committee for review

### Amendment Workflow States

#### Amendment-Specific States
- **Amendment Submitted**: Initial amendment state
- **Amendment Accepted**: Amendment approved by original submitter
- **Amendment Rejected**: Amendment declined
- **Amendment Withdrawn**: Amendment retracted
- **Amendment Merged**: Amendment incorporated into main motion

## Motion Detail View

### Detailed Motion Interface
```
┌─────────────────────────────────────────────────┐
│  Motion 1-1: Änderungsantrag zu 1      [✏️] [⋮]│
├─────────────────────────────────────────────────┤
│  Metadata Section                               │
│  Submitter: Administrator (Test structure level)│
│  Sequential: 2    State: [submitted]            │
│  Category: C - Cad    Tags: 🏷️ Tag1, Tag3     │
│  Created: 24.07.2024 14:30                     │
│                                                 │
│  Motion Text                                    │
│  ┌─────────────────────────────────────────────┐│
│  │  1  The organization shall implement new    ││
│  │  2  procedures for member communication     ││
│  │  3  including regular newsletters and       ││
│  │  4  quarterly meetings with all departments ││
│  │  5  to ensure transparency and engagement.  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Reason                                         │
│  Current communication methods are outdated     │
│  and do not reach all members effectively...    │
│                                                 │
│  Workflow Actions                               │
│  [Accept Motion] [Reject Motion] [Recommend]    │
│                                                 │
│  Related Items                                  │
│  • Agenda Item: 3.1 Budget Discussion          │
│  • Files: budget-proposal.pdf                  │
│  • Amendments: None                             │
│                                                 │
│  Comments and Discussion                        │
│  [Add Comment] [View History] [Export PDF]      │
└─────────────────────────────────────────────────┘
```

### Motion Components

#### Motion Metadata
- **Motion Number**: Sequential identifier (1-1, 2, 3, A1)
- **Title**: Motion subject line
- **Submitter Information**: Author details and structure level
- **State Badge**: Current workflow state with color coding
- **Category Assignment**: Organizational categorization
- **Tags**: Flexible labeling system
- **Sequential Number**: Internal tracking number
- **Creation Timestamp**: When motion was submitted

#### Motion Content
- **Motion Text**: Main proposal with line numbers
- **Reason/Justification**: Supporting rationale
- **Attachments**: Supporting documents
- **Related Agenda Item**: Connection to agenda structure
- **Amendment References**: Links to related amendments

## Amendment System

### Amendment Creation Dialog
```
┌─────────────────────────────────────────────────┐
│  Create amendment to Motion 1                   │
├─────────────────────────────────────────────────┤
│  Amendment type                                 │
│  ● Line-based amendment                         │
│  ○ Replacement amendment                        │
│  ○ Addition amendment                           │
│                                                 │
│  Original text (lines to change)                │
│  From line: [2] To line: [3]                    │
│                                                 │
│  Original text:                                 │
│  procedures for member communication            │
│  including regular newsletters                  │
│                                                 │
│  Amendment text:                                │
│  [procedures for enhanced member communication  │
│   including monthly newsletters]               │
│                                                 │
│  Reason for amendment:                          │
│  [Monthly newsletters would provide more        │
│   timely updates than quarterly meetings]      │
│                                                 │
│  Amendment submitter:                           │
│  [Current user: Administrator]                  │
│                                                 │
│  [Cancel]                    [Create Amendment] │
└─────────────────────────────────────────────────┘
```

### Amendment Types
- **Line Amendment**: Modify specific lines of text
- **Replacement Amendment**: Replace entire sections
- **Addition Amendment**: Add new content
- **Deletion Amendment**: Remove existing content

### Amendment Workflow
1. **Creation**: Amendment submitted against parent motion
2. **Review**: Amendment reviewed by motion submitter
3. **Decision**: Accept, reject, or modify amendment
4. **Integration**: Accepted amendments merged into motion
5. **Voting**: Amended motion proceeds to voting

## Workflow Action Dialogs

### Motion State Transition Dialog
```
┌─────────────────────────────────────────────────┐
│  Change motion state                    [x]     │
├─────────────────────────────────────────────────┤
│  Current state: Submitted                       │
│                                                 │
│  Available transitions:                         │
│  ● Accept motion                                │
│    → Motion will be marked as accepted          │
│                                                 │
│  ○ Reject motion                                │
│    → Motion will be closed as rejected          │
│                                                 │
│  ○ Refer to committee                           │
│    → Send to committee for detailed review      │
│    Committee: [Select committee ▼]              │
│                                                 │
│  ○ Adjourn motion                               │
│    → Postpone to future meeting                 │
│    Target meeting: [Select meeting ▼]          │
│                                                 │
│  Comment (optional):                            │
│  [Text area for state change justification]     │
│                                                 │
│  Notification options:                          │
│  ☑ Notify submitter of state change            │
│  ☑ Send email to interested participants       │
│  ☐ Add to meeting announcement                  │
│                                                 │
│  [Cancel]                      [Change State]   │
└─────────────────────────────────────────────────┘
```

### Recommendation Dialog
```
┌─────────────────────────────────────────────────┐
│  Add recommendation                     [x]     │
├─────────────────────────────────────────────────┤
│  Motion: Änderungsantrag zu 1                   │
│                                                 │
│  Recommendation type:                           │
│  ● Acceptance                                   │
│  ○ Rejection                                    │
│  ○ Modified acceptance                          │
│  ○ Referral                                     │
│                                                 │
│  Recommendation text:                           │
│  [The committee recommends acceptance of this   │
│   motion with the suggested amendments          │
│   regarding implementation timeline.]           │
│                                                 │
│  Recommending body:                             │
│  [Budget Committee ▼]                           │
│                                                 │
│  Voting recommendation:                         │
│  [Yes/No/Abstain ▼]                            │
│                                                 │
│  Supporting documents:                          │
│  [Add attachment...]                            │
│                                                 │
│  Publication:                                   │
│  ☑ Include in motion documentation             │
│  ☑ Display during voting                       │
│  ☐ Send to all participants                    │
│                                                 │
│  [Cancel]                   [Add Recommendation]│
└─────────────────────────────────────────────────┘
```

## Motion Categories and Organization

### Category Management
- **Category Assignment**: Organize motions by topic
- **Color Coding**: Visual category identification
- **Category Permissions**: Access control per category
- **Category Statistics**: Motion counts and states per category

### Motion Numbering Systems
- **Sequential Numbering**: 1, 2, 3, 4...
- **Amendment Numbering**: 1-1, 1-2, 1-3... (amendments to motion 1)
- **Category Prefixes**: A1, B1, C1... (by category)
- **Custom Numbering**: Configurable numbering schemes

### Motion Collections
- **Block Assignments**: Group related motions (BLOCK A)
- **Committee Assignment**: Associate with committees
- **Agenda Integration**: Link to agenda items
- **Meeting Association**: Track across multiple meetings

## Voting Integration

### Poll Creation from Motion
```
┌─────────────────────────────────────────────────┐
│  Create poll for motion                 [x]     │
├─────────────────────────────────────────────────┤
│  Motion: komplex (Motion 3)                     │
│                                                 │
│  Poll type:                                     │
│  ● Yes/No/Abstain                               │
│  ○ Named voting                                 │
│  ○ Secret ballot                                │
│  ○ Electronic voting                            │
│                                                 │
│  Poll title:                                    │
│  [Vote on Motion 3: komplex]                   │
│                                                 │
│  Voting method:                                 │
│  ● Simple majority                              │
│  ○ Two-thirds majority                          │
│  ○ Absolute majority                            │
│  ○ Consensus                                    │
│                                                 │
│  Eligible voters:                               │
│  ☑ All participants                            │
│  ☐ Delegates only                              │
│  ☐ Committee members only                      │
│                                                 │
│  Voting duration:                               │
│  ● No time limit                                │
│  ○ Fixed duration: [15] minutes                 │
│                                                 │
│  Options display:                               │
│  ☑ Show motion text during voting              │
│  ☑ Display recommendations                     │
│  ☑ Show amendment status                       │
│                                                 │
│  [Cancel]                      [Create Poll]    │
└─────────────────────────────────────────────────┘
```

## Advanced Workflow Features

### Workflow Templates
- **Simple Workflow**: Submit → Accept/Reject
- **Committee Workflow**: Submit → Committee Review → Recommend → Vote
- **Amendment Workflow**: Submit → Amendment Period → Final Vote
- **Emergency Workflow**: Fast-track for urgent motions
- **Custom Workflows**: Organization-specific processes

### Workflow Permissions
- **State-based Permissions**: Different access per workflow state
- **Role-based Actions**: Actions available by user role
- **Conditional Transitions**: Rules governing state changes
- **Approval Requirements**: Multi-level approval processes

### Workflow Automation
- **Automatic Transitions**: Time-based or event-triggered state changes
- **Email Notifications**: Automatic stakeholder notifications
- **Calendar Integration**: Deadline and reminder management
- **External System Integration**: ERP, CRM, or other system workflows

## Data Models

### Motion Model
```typescript
{
  id: number;
  number: string;
  title: string;
  text: string;
  reason?: string;
  modified_final_version?: string;
  amendment_paragraph?: number;
  state_id: number;
  recommendation_id?: number;
  category_id?: number;
  block_id?: number;
  origin_id?: number;
  derived_motion_ids: number[];
  attachment_ids: number[];
  tag_ids: number[];
  supporter_ids: number[];
  submitter_ids: number[];
  sort_parent_id?: number;
  sort_child_ids: number[];
  sort_weight: number;
  created: number;
  last_modified: number;
  sequential_number: number;
}
```

### Motion State Model
```typescript
{
  id: number;
  name: string;
  recommendation_label?: string;
  css_class: string;
  restrictions: string[];
  allow_support: boolean;
  allow_create_poll: boolean;
  allow_submitter_edit: boolean;
  set_number: boolean;
  show_state_extension_field: boolean;
  merge_amendment_into_final: string;
  show_recommendation_extension_field: boolean;
  next_state_ids: number[];
  previous_state_ids: number[];
  workflow_id: number;
  weight: number;
}
```

### Motion Workflow Model
```typescript
{
  id: number;
  name: string;
  state_ids: number[];
  first_state_id: number;
  default_workflow_meeting_id?: number;
  default_amendment_workflow_meeting_id?: number;
  default_statute_amendment_workflow_meeting_id?: number;
}
```

## E2E Test Selectors

### Motion List
- Motion list: `.motion-list`
- Motion card: `.motion-card`
- Motion number: `.motion-number`
- Motion title: `.motion-title`
- Motion state: `.motion-state`
- Motion submitter: `.motion-submitter`

### Motion Detail
- Motion detail: `.motion-detail`
- Motion text: `.motion-text`
- Motion reason: `.motion-reason`
- Workflow actions: `.workflow-actions`
- State button: `.state-button`
- Amendment list: `.amendment-list`

### Workflow Controls
- State transition: `.state-transition`
- Recommend button: `.recommend-button`
- Create poll: `.create-poll`
- Edit motion: `.edit-motion`
- Create amendment: `.create-amendment`

## Keyboard Shortcuts
- `Ctrl+N`: Create new motion
- `Ctrl+E`: Edit current motion
- `Ctrl+A`: Create amendment
- `Ctrl+P`: Create poll
- `Ctrl+R`: Add recommendation
- `Enter`: Apply state transition
- `Escape`: Cancel current action

## Accessibility Features
- **Screen Reader Support**: Full ARIA labeling for workflow states
- **Keyboard Navigation**: Complete keyboard control
- **High Contrast**: State indicators compatible with accessibility themes
- **Focus Management**: Clear focus indicators in workflow dialogs
- **Status Announcements**: Screen reader announcements for state changes
- **Alternative Text**: Descriptive labels for workflow actions