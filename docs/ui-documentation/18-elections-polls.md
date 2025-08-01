# OpenSlides Elections and Polls Documentation

## Overview
The Elections module provides comprehensive voting and polling functionality within meetings, allowing organizers to create elections, manage candidates, conduct polls, and collect votes through various voting methods including electronic voting systems.

## URL Routes
- Elections main: `/:meetingId/elections`
- Specific election: `/:meetingId/elections/:electionId`
- Poll management: `/:meetingId/elections/:electionId/polls/:pollId`

## Page Layout
```
┌─────────────────────────────────────────────────┐
│  Elections                     [+] [⋮]          │
├─────────────────────────────────────────────────┤
│  2 of 2    [≡ SORT] [⚲ FILTER] [🔍 Search___] │
├─────────────────────────────────────────────────┤
│  Election List                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 2. Wahl                                  ││
│  │     Searching for candidates    ?  👥      ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ 📹 Wahl                                     ││
│  │     In the election process    3  👥       ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Election Management Interface

### Header Controls
- **Create Election Button (+)**: Add new elections
- **Menu Button (⋮)**: Bulk operations and system settings
- **Result Counter**: Shows current results ("2 of 2")
- **Sort Button (≡ SORT)**: Election sorting options
- **Filter Button (⚲ FILTER)**: Advanced filtering controls
- **Search Field**: Real-time election search

### Election Card Display
Each election is displayed as a card containing:
- **Video Icon (📹)**: Indicates live/recorded election
- **Election Name**: "2. Wahl", "Wahl" (customizable titles)
- **Status Indicator**: Current election phase
  - "Searching for candidates"
  - "In the election process"
- **Candidate Count**: Number of candidates (3, ? for unknown)
- **Participants Icon (👥)**: Shows participant involvement

## Election States and Workflow

### Election Phases

#### 1. Candidate Search Phase
```
┌─────────────────────────────────────────────────┐
│ 📹 2. Wahl                                      │
│    Searching for candidates              ?  👥  │
├─────────────────────────────────────────────────┤
│ Phase: Candidate Registration                   │
│ • Candidates can self-nominate                  │
│ • Administrators can add candidates             │
│ • Candidate information collection              │
│ • Nomination period management                  │
└─────────────────────────────────────────────────┘
```

#### 2. Election Process Phase
```
┌─────────────────────────────────────────────────┐
│ 📹 Wahl                                         │
│    In the election process              3  👥   │
├─────────────────────────────────────────────────┤
│ Phase: Active Voting                            │
│ • Electronic voting enabled                     │
│ • Real-time vote collection                     │
│ • Vote counting and results                     │
│ • Live result updates                           │
└─────────────────────────────────────────────────┘
```

#### 3. Additional Election States
- **Preparation**: Setting up election parameters
- **Closed**: Election completed, results finalized
- **Aborted**: Election cancelled or terminated
- **Published**: Results published and visible

## Election Creation and Configuration

### Create New Election Dialog
```
┌─────────────────────────────────────────────────┐
│  Create election                        [x]     │
├─────────────────────────────────────────────────┤
│  Election title *                               │
│  [Board Member Election_______________]         │
│                                                 │
│  Description                                    │
│  [Text area for election description]           │
│                                                 │
│  Number of positions                            │
│  [3] positions to fill                          │
│                                                 │
│  Voting method                                  │
│  ● Electronic voting                            │
│  ○ Paper ballots                                │
│  ○ Show of hands                                │
│                                                 │
│  Candidate self-nomination                      │
│  ☑ Allow candidates to self-nominate           │
│                                                 │
│  Voting period                                  │
│  Start: [DD.MM.YYYY HH:MM]                     │
│  End:   [DD.MM.YYYY HH:MM]                     │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Election Configuration Options
- **Election Type**: Simple majority, multiple choice, preferential voting
- **Vote Visibility**: Secret ballot, public voting, anonymous
- **Quorum Requirements**: Minimum participation thresholds
- **Multiple Positions**: Single seat or multi-seat elections
- **Voting Duration**: Time limits and scheduling
- **Result Publication**: Immediate or delayed result display

## Candidate Management

### Candidate Registration
```
┌─────────────────────────────────────────────────┐
│  Candidate management                   [x]     │
├─────────────────────────────────────────────────┤
│  Election: Board Member Election                │
│                                                 │
│  Current candidates (3):                        │
│  ┌─────────────────────────────────────────────┐│
│  │ 1. John Doe                          [Edit] ││
│  │    Department: Finance                      ││
│  │    Experience: 5 years board member        ││
│  ├─────────────────────────────────────────────┤│
│  │ 2. Jane Smith                        [Edit] ││
│  │    Department: Marketing                    ││
│  │    Experience: 3 years committee chair     ││
│  ├─────────────────────────────────────────────┤│
│  │ 3. Bob Wilson                        [Edit] ││
│  │    Department: Operations                   ││
│  │    Experience: 10 years experience         ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Add Candidate] [Import from CSV]              │
│                                                 │
│  Nomination period:                             │
│  ● Open (accepts new candidates)                │
│  ○ Closed (finalized candidate list)           │
│                                                 │
│  [Save Changes]                                 │
└─────────────────────────────────────────────────┘
```

### Add Candidate Dialog
```
┌─────────────────────────────────────────────────┐
│  Add candidate                          [x]     │
├─────────────────────────────────────────────────┤
│  Candidate selection                            │
│  ● Existing participant                         │
│  ○ External candidate                           │
│                                                 │
│  Select participant                             │
│  [Choose participant ▼]                         │
│                                                 │
│  Candidate information                          │
│  Name: [Auto-filled from participant]          │
│  Department: [_________________]                │
│  Position: [___________________]                │
│                                                 │
│  Biography/Statement                            │
│  [Text area for candidate statement]            │
│                                                 │
│  Photo                                          │
│  [Upload candidate photo...]                    │
│                                                 │
│  [Cancel]                           [Add]       │
└─────────────────────────────────────────────────┘
```

## Voting Interface and Process

### Electronic Voting Interface
```
┌─────────────────────────────────────────────────┐
│  Election: Board Member Election        [x]     │
├─────────────────────────────────────────────────┤
│  Instructions                                   │
│  Select up to 3 candidates for the board.      │
│  Voting ends in: 15:42 minutes                 │
│                                                 │
│  Candidates                                     │
│  ┌─────────────────────────────────────────────┐│
│  │ ☐ John Doe                                  ││
│  │   Department: Finance                       ││
│  │   [View statement]                          ││
│  ├─────────────────────────────────────────────┤│
│  │ ☐ Jane Smith                                ││
│  │   Department: Marketing                     ││
│  │   [View statement]                          ││
│  ├─────────────────────────────────────────────┤│
│  │ ☐ Bob Wilson                                ││
│  │   Department: Operations                    ││
│  │   [View statement]                          ││
│  ├─────────────────────────────────────────────┤│
│  │ ☐ Abstain                                   ││
│  │ ☐ No (reject all candidates)                ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Selected: 0 of 3 maximum                      │
│                                                 │
│  [Submit Vote]                   [Clear All]    │
└─────────────────────────────────────────────────┘
```

### Voting Confirmation
```
┌─────────────────────────────────────────────────┐
│  Confirm your vote                      [x]     │
├─────────────────────────────────────────────────┤
│  Election: Board Member Election                │
│                                                 │
│  Your selections:                               │
│  • John Doe                                     │
│  • Jane Smith                                   │
│  • Bob Wilson                                   │
│                                                 │
│  Warning: This vote cannot be changed after     │
│  submission. Please review your choices.        │
│                                                 │
│  [Go Back]                    [Confirm Vote]    │
└─────────────────────────────────────────────────┘
```

## Poll Types and Voting Methods

### Single Choice Polls
- **Yes/No Voting**: Simple binary choices
- **Multiple Options**: Select one from many options
- **Approval Voting**: Vote for or against single proposal

### Multiple Choice Polls
- **Multi-Select**: Choose multiple options
- **Ranked Choice**: Preferential voting with rankings
- **Weighted Voting**: Assign weights to choices

### Electronic Voting Methods
- **Anonymous Voting**: Secret ballot with no voter identification
- **Pseudonymous Voting**: Traceable but anonymous voting
- **Open Voting**: Public vote with voter identification
- **Delegated Voting**: Proxy voting capabilities

## Results Display and Analysis

### Real-time Results Interface
```
┌─────────────────────────────────────────────────┐
│  Election Results: Board Member Election        │
├─────────────────────────────────────────────────┤
│  Status: Voting in progress                     │
│  Participation: 45 of 78 eligible voters (58%) │
│  Time remaining: 12:33 minutes                  │
│                                                 │
│  Current Results (Live):                        │
│  ┌─────────────────────────────────────────────┐│
│  │ John Doe              [████████░░] 32 votes ││
│  │ Jane Smith            [██████░░░░] 24 votes ││
│  │ Bob Wilson            [█████░░░░░] 20 votes ││
│  │ Abstentions           [██░░░░░░░░]  8 votes ││
│  │ No votes              [█░░░░░░░░░]  4 votes ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Export Results] [Close Voting] [Extend Time]  │
└─────────────────────────────────────────────────┘
```

### Final Results Display
```
┌─────────────────────────────────────────────────┐
│  Final Results: Board Member Election           │
├─────────────────────────────────────────────────┤
│  Status: Voting completed                       │
│  Final participation: 67 of 78 voters (86%)    │
│  Voting period: 24.07.2024 14:00 - 15:30       │
│                                                 │
│  Elected Candidates (3 positions):              │
│  ┌─────────────────────────────────────────────┐│
│  │ 🏆 1. John Doe           45 votes (67%)     ││
│  │ 🏆 2. Jane Smith         38 votes (57%)     ││
│  │ 🏆 3. Bob Wilson         35 votes (52%)     ││
│  │                                             ││
│  │ Not elected:                                ││
│  │    Sarah Davis           18 votes (27%)     ││
│  │    Mike Johnson          12 votes (18%)     ││
│  │                                             ││
│  │ Invalid votes: 2                            ││
│  │ Abstentions: 8                              ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Publish Results] [Generate Certificate]       │
│  [Export PDF] [Send Notifications]              │
└─────────────────────────────────────────────────┘
```

## Advanced Voting Features

### Voting Security
- **Ballot Encryption**: Secure vote transmission and storage
- **Vote Verification**: Voters can verify their votes were counted
- **Audit Trail**: Complete logging of all voting activities
- **Anti-Fraud Measures**: Duplicate vote prevention
- **Access Control**: Voter eligibility verification

### Accessibility Features
- **Screen Reader Support**: Full accessibility for voting interface
- **Keyboard Navigation**: Complete keyboard voting capability
- **High Contrast**: Accessible color schemes for voting
- **Font Scaling**: Adjustable text size for readability
- **Audio Assistance**: Audio descriptions of candidates

### Integration Features
- **Agenda Integration**: Link elections to agenda items
- **Participant Sync**: Automatic voter eligibility from participants
- **Notification System**: Email/SMS notifications for voting
- **External Systems**: Integration with identity providers
- **Backup Systems**: Failover and redundancy options

## Data Models

### Election Model
```typescript
{
  id: number;
  title: string;
  description?: string;
  meeting_id: number;
  open_posts: number;
  phase: ElectionPhase;
  default_poll_description?: string;
  number_poll_candidates: boolean;
  allow_multiple_posts_per_candidate: boolean;
  created_at: number;
  updated_at: number;
}
```

### Poll Model
```typescript
{
  id: number;
  content_object_id: number;
  title: string;
  type: PollType;
  state: PollState;
  onehundred_percent_base: PercentBase;
  majority_method: MajorityMethod;
  votes_amount: number;
  votes_cast: number;
  votes_valid: number;
  votes_invalid: number;
  votesabstain: number;
  votesno: number;
  votesvalid: number;
  is_pseudoanonymized: boolean;
}
```

### Vote Model
```typescript
{
  id: number;
  poll_id: number;
  user_id?: number;
  delegated_user_id?: number;
  value: VoteValue;
  weight: number;
  created_at: number;
}
```

## Permissions and Access Control

### Election Permissions
- `assignment.can_see`: View elections and results
- `assignment.can_nominate_other`: Nominate other participants
- `assignment.can_nominate_self`: Self-nomination
- `assignment.can_manage`: Create and manage elections

### Poll Permissions
- `poll.can_see`: View polls and results
- `poll.can_vote`: Participate in voting
- `poll.can_manage`: Create and manage polls
- `poll.can_see_results`: View detailed results

## E2E Test Selectors

### Election List
- Elections container: `.elections-list`
- Election card: `.election-card`
- Election title: `.election-title`
- Election status: `.election-status`
- Candidate count: `.candidate-count`

### Voting Interface
- Vote form: `.voting-form`
- Candidate options: `.candidate-option`
- Vote checkbox: `input[type="checkbox"].vote-option`
- Submit button: `button.submit-vote`
- Confirmation dialog: `.vote-confirmation`

### Results Display
- Results container: `.election-results`
- Vote counts: `.vote-count`
- Result bars: `.result-bar`
- Winner indicator: `.winner-badge`

## Keyboard Shortcuts
- `Ctrl+N`: Create new election
- `Space`: Select/deselect candidate
- `Enter`: Submit vote or confirm action
- `Escape`: Cancel current operation
- `Tab`: Navigate between candidates
- `Ctrl+S`: Save election settings

## Performance Features
- **Real-time Updates**: WebSocket-based live result updates
- **Optimistic UI**: Immediate feedback for user actions
- **Batch Processing**: Efficient vote counting and aggregation
- **Caching**: Cache election data for fast access
- **Scalability**: Handle large numbers of voters and elections