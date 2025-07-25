# OpenSlides Elections/Voting Pages Documentation

## Overview
The Elections module (internally called "Assignments") manages electoral processes including candidate nominations, voting procedures, and result calculations. It supports various voting methods and both electronic and paper-based ballots.

## URL Routes
- Election list: `/:meetingId/assignments`
- Election detail: `/:meetingId/assignments/:id`
- Election polls: `/:meetingId/assignments/polls`
- Single poll: `/:meetingId/assignments/polls/:id`

## Election List Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Elections                      [+ New] [⋮ Menu]│
├─────────────────────────────────────────────────┤
│  [Filter] [Sort] [Search_____________]          │
├─────────────────────────────────────────────────┤
│  □ | Title | Phase | Candidates | Open Posts |⋮│
├─────────────────────────────────────────────────┤
│  □ Board Election    Voting     8      5     [⋮]│
│  □ Committee Chair   Search     3      1     [⋮]│
│  □ Treasurer        Finished    2      1     [⋮]│
└─────────────────────────────────────────────────┘
```

### List Columns
1. **Checkbox**: For multiselect operations
2. **Title**: Election name
3. **Phase**: Current election phase with color coding:
   - 🔍 Search (blue) - Candidature phase
   - 🗳️ Voting (yellow) - Active voting
   - ✅ Finished (green) - Completed
4. **Candidates**: Number of candidates
5. **Open Posts**: Positions to be filled
6. **Menu**: Individual actions

### Header Actions

#### New Election Button (+)
Opens election creation dialog

#### Menu Actions (⋮)
- **Export as PDF**: Generate elections list
- **Project all**: Show on projector

### Multiselect Actions
- **Set phase**: Bulk phase change
- **Delete**: Remove selected elections

### Individual Actions (Row Menu)
- **View**: Open election detail
- **Edit**: Modify election
- **Delete**: Remove election
- **Project**: Show on projector
- **Add to agenda**: Create agenda item

## Election Detail Page

### Page Layout
```
┌─────────────────────────────────────────────────┐
│  Board Election 2024           [✏️] [⋮] [←→]   │
├─────────────────────────────────────────────────┤
│  Phase: [Search] [Voting] [Finished]            │
├─────────────────────────────────────────────────┤
│  Open posts: 5                                  │
│  Election method: Yes/No/Abstain per candidate  │
│                                                 │
│  Description:                                   │
│  Annual board election for 5 positions...       │
├─────────────────────────────────────────────────┤
│  Candidates (8)                [+ Add candidate]│
│  ┌─────────────────────────────────────────────┐│
│  │ 1. John Doe                    [↑][↓][🗑️]  ││
│  │ 2. Jane Smith                  [↑][↓][🗑️]  ││
│  │ 3. Bob Johnson                 [↑][↓][🗑️]  ││
│  │ 4. Alice Brown                 [↑][↓][🗑️]  ││
│  │ 5. Mike Wilson                 [↑][↓][🗑️]  ││
│  │ [+ Add myself as candidate]                 ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Ballots                        [+ New ballot]  │
│  ┌─────────────────────────────────────────────┐│
│  │ Ballot 1: Running ⏱️          [View results]││
│  │ Ballot 2: Finished ✓          [View results]││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Phase Management
Click on phase chips to change:
- **Search Phase**: Candidates can be nominated
- **Voting Phase**: Voting enabled, no new candidates
- **Finished Phase**: Election complete, read-only

### Candidate Management

#### Adding Candidates
1. **Add candidate button**: Search and add users
2. **Self-nomination**: "Add myself" (if permitted)
3. **Drag handles**: Reorder candidates

#### Candidate Actions
- **Reorder**: Drag or use arrows
- **Remove**: Delete button (phase-dependent)

### Election Edit Form
```
┌─────────────────────────────────────────────────┐
│  Edit election                 [💾 Save] [❌]   │
├─────────────────────────────────────────────────┤
│  Title *                                        │
│  [Board Election 2024_________]                 │
│                                                 │
│  Description                                    │
│  [Annual board election for...]                 │
│                                                 │
│  Open posts *                                   │
│  [5____________________________]                │
│                                                 │
│  □ Create agenda item                           │
│  □ Show as list (not enumerated)               │
│                                                 │
│  Default poll description                       │
│  [Standard ballot_____________]                 │
└─────────────────────────────────────────────────┘
```

## Ballot/Poll Creation

### Poll Configuration Dialog
```
┌─────────────────────────────────────────────────┐
│  Create new ballot                      [x]     │
├─────────────────────────────────────────────────┤
│  General Settings                               │
│                                                 │
│  Title                                          │
│  [Ballot 1____________________]                 │
│                                                 │
│  Description                                    │
│  [First round of voting_______]                 │
│                                                 │
│  Poll method                                    │
│  ○ Yes per candidate (Y)                        │
│  ● Yes/No per candidate (YN)                    │
│  ○ Yes/No/Abstain per candidate (YNA)          │
│                                                 │
│  Poll type                                      │
│  ○ Analog (paper ballots)                       │
│  ● Electronic                                   │
│  ○ Electronic (anonymous)                       │
│                                                 │
│  Voting Settings                                │
│                                                 │
│  □ Add global abstain option                    │
│  □ Add global no option                         │
│                                                 │
│  Min votes: [0___] Max votes: [5___]           │
│  Max votes per option: [1___]                   │
│                                                 │
│  Groups entitled to vote                        │
│  [x] Delegates [x] Board [ ] Guests             │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Poll Methods Explained

#### Yes (Y)
- Single or multiple selection
- Voters choose candidates they support
- Best for: Simple elections

#### Yes/No (YN)
- Vote yes or no for each candidate
- Each candidate evaluated independently
- Best for: Approval voting

#### Yes/No/Abstain (YNA)
- Full options per candidate
- Most detailed feedback
- Best for: Formal elections

## Voting Interface

### Electronic Voting View
```
┌─────────────────────────────────────────────────┐
│  Board Election - Ballot 1                      │
├─────────────────────────────────────────────────┤
│  Select up to 5 candidates                      │
│                                                 │
│  John Doe                                       │
│  [Yes] [No] [Abstain]                          │
│                                                 │
│  Jane Smith                                     │
│  [Yes] [No] [Abstain]                          │
│                                                 │
│  Bob Johnson                                    │
│  [Yes] [No] [Abstain]                          │
│                                                 │
│  Alice Brown                                    │
│  [Yes] [No] [Abstain]                          │
│                                                 │
│  Mike Wilson                                    │
│  [Yes] [No] [Abstain]                          │
│                                                 │
│  Global options:                                │
│  [General Abstain] [General No]                 │
│                                                 │
│  Selected: 3/5                                  │
│                                                 │
│  [Clear]                      [Submit vote]     │
└─────────────────────────────────────────────────┘
```

### Voting Progress
```
┌─────────────────────────────────────────────────┐
│  Voting Progress                                │
├─────────────────────────────────────────────────┤
│  Time remaining: 04:32                          │
│                                                 │
│  Votes received: 45/120 (37.5%)                 │
│  ████████████░░░░░░░░░░░░░░░░░░░               │
│                                                 │
│  [Stop voting]                                  │
└─────────────────────────────────────────────────┘
```

## Results Display

### Results View
```
┌─────────────────────────────────────────────────┐
│  Board Election - Results                       │
├─────────────────────────────────────────────────┤
│  Ballot 1 (Finished)            [📊] [📄] [🗑️] │
├─────────────────────────────────────────────────┤
│  Valid votes: 118 | Invalid: 2 | Total: 120    │
├─────────────────────────────────────────────────┤
│  Results:                                       │
│                                                 │
│  1. Jane Smith          ✓ Elected               │
│     Yes: 95 (80.5%)  ████████████████████░░    │
│     No: 20 (16.9%)   ████░░░░░░░░░░░░░░░░░    │
│     Abstain: 3 (2.5%)                          │
│                                                 │
│  2. John Doe           ✓ Elected                │
│     Yes: 89 (75.4%)  ███████████████░░░░░░    │
│     No: 25 (21.2%)   █████░░░░░░░░░░░░░░░░    │
│     Abstain: 4 (3.4%)                          │
│                                                 │
│  3. Bob Johnson        ✓ Elected                │
│     Yes: 78 (66.1%)  █████████████░░░░░░░░    │
│     No: 35 (29.7%)   ██████░░░░░░░░░░░░░░░    │
│     Abstain: 5 (4.2%)                          │
│                                                 │
│  [Continue with more candidates...]             │
└─────────────────────────────────────────────────┘
```

### Result Actions
- **Project (📊)**: Show results on projector
- **PDF (📄)**: Generate results document
- **Delete (🗑️)**: Remove ballot (with permission)

## Paper Ballot Management

### Analog Voting Entry
```
┌─────────────────────────────────────────────────┐
│  Enter paper ballot results                     │
├─────────────────────────────────────────────────┤
│  Candidate         | Yes | No | Abstain         │
├─────────────────────────────────────────────────┤
│  John Doe         | [45] | [20] | [5]          │
│  Jane Smith       | [52] | [15] | [3]          │
│  Bob Johnson      | [38] | [25] | [7]          │
│  Alice Brown      | [41] | [22] | [7]          │
│  Mike Wilson      | [35] | [30] | [5]          │
├─────────────────────────────────────────────────┤
│  Valid ballots:    [70__]                       │
│  Invalid ballots:  [2___]                       │
│  Total ballots:    [72__]                       │
│                                                 │
│  [Cancel]                    [Save results]     │
└─────────────────────────────────────────────────┘
```

### Ballot Paper Generation
```
┌─────────────────────────────────────────────────┐
│  Print ballot papers                    [x]     │
├─────────────────────────────────────────────────┤
│  Number of ballots: [150___]                    │
│                                                 │
│  Ballots per page:                              │
│  ● 1 (large)                                    │
│  ○ 2 (medium)                                   │
│  ○ 4 (small)                                    │
│  ○ 8 (very small)                              │
│                                                 │
│  [Cancel]                    [Generate PDF]     │
└─────────────────────────────────────────────────┘
```

## Vote Delegation

### Delegation in Elections
- Delegated votes counted automatically
- Visual indicator for delegated voting
- Delegation chains supported
- Can be disabled per meeting

### Delegated Voting View
```
┌─────────────────────────────────────────────────┐
│  Voting as: John Doe (+ 2 delegations)         │
│  Total vote weight: 3.0                         │
└─────────────────────────────────────────────────┘
```

## Technical Details

### Data Models

**Assignment (Election)**:
```typescript
{
  id: number;
  title: string;
  description: string;
  open_posts: number;
  phase: AssignmentPhase; // Search, Voting, Finished
  default_poll_description: string;
  number_poll_candidates: boolean;
  candidate_ids: number[];
  poll_ids: number[];
}
```

**Assignment Candidate**:
```typescript
{
  id: number;
  assignment_id: number;
  user_id: number;
  weight: number; // for sorting
}
```

**Poll Configuration**:
```typescript
{
  pollmethod: PollMethod; // Y, YN, YNA, N
  type: PollType; // analog, named, pseudoanonymous
  min_votes_amount: number;
  max_votes_amount: number;
  max_votes_per_option: number;
  global_yes: boolean;
  global_no: boolean;
  global_abstain: boolean;
  entitled_group_ids: number[];
}
```

### Services
- `AssignmentControllerService`: Election CRUD
- `AssignmentPollService`: Poll management
- `AssignmentPollPdfService`: Ballot generation
- `AssignmentCandidateService`: Candidate handling
- `VotingService`: Electronic voting logic

### Permissions
- `assignment.can_see`: View elections
- `assignment.can_manage`: Full control
- `assignment.can_nominate_self`: Self-nomination
- `assignment.can_nominate_others`: Nominate others
- `poll.can_manage`: Create/manage polls

## E2E Test Selectors

### List Page
- New button: `button[matTooltip="New election"]`
- Election rows: `.assignment-row`
- Phase chips: `mat-chip.phase-chip`
- Multiselect: `mat-checkbox.selection-checkbox`

### Detail Page
- Phase selector: `.phase-selector mat-chip`
- Add candidate: `button.add-candidate`
- Candidate list: `.candidate-list`
- New ballot: `button[matTooltip="New ballot"]`
- Ballot cards: `.ballot-card`

### Voting
- Vote buttons: `.vote-button`
- Submit button: `button.submit-vote`
- Results chart: `.result-chart`
- Vote input: `input.vote-input`

### Forms
- Title input: `input[formControlName="title"]`
- Posts input: `input[formControlName="open_posts"]`
- Method select: `mat-select[formControlName="pollmethod"]`
- Type radios: `mat-radio-button[value="analog"]`

## Keyboard Shortcuts
- `Enter`: Submit vote
- `Tab`: Navigate options
- `Space`: Select option
- `Escape`: Cancel dialog
- Numbers `1-9`: Quick candidate selection

## Accessibility Features
- ARIA labels for voting options
- Keyboard navigation support
- Screen reader announcements
- Color-blind friendly results
- Focus management in dialogs
- Status updates for voting progress