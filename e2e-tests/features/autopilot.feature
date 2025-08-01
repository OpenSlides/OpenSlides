@autopilot @automation @meeting-flow
Feature: Autopilot - Automated Meeting Flow
  As a meeting operator
  I want to use autopilot mode
  So that routine meeting procedures are automated

  Background:
    Given I am logged in as a meeting operator
    And I am in a meeting with autopilot enabled
    And I navigate to the autopilot section

  @smoke
  Scenario: Start basic autopilot mode
    When I click "Start Autopilot"
    And I select autopilot profile "Standard Meeting"
    Then autopilot should activate
    And I should see the autopilot control panel
    And the current agenda item should be displayed
    And the next scheduled action should be shown

  @agenda-progression
  Scenario: Automatic agenda progression
    Given autopilot is running
    And the current agenda item has 5 minutes allocated
    When the time expires
    Then autopilot should:
      | Action                           |
      | Show 1-minute warning            |
      | Close speaker list at time       |
      | Transition to next agenda item   |
      | Reset speaker list               |
      | Start timer for new item         |

  @speaker-management
  Scenario: Automated speaker list management
    Given autopilot is managing speakers
    And speakers are registered:
      | Name    | Duration |
      | Alice   | 3 min    |
      | Bob     | 3 min    |
      | Carol   | 3 min    |
    When Alice's time starts
    Then autopilot should:
      | Display speaker name prominently  |
      | Start countdown timer             |
      | Show warning at 30 seconds        |
      | Play sound at time expiry         |
      | Automatically switch to Bob       |

  @voting-automation
  Scenario: Automated voting procedures
    Given a motion is ready for voting
    When autopilot reaches the voting phase
    Then it should automatically:
      | Action                          | Duration |
      | Announce motion for voting      | 30s      |
      | Open voting                     | -        |
      | Display voting interface        | 2 min    |
      | Show countdown                  | -        |
      | Close voting at time           | -        |
      | Display results                | 30s      |
      | Move to next item              | -        |

  @break-scheduling
  Scenario: Automatic break management
    Given autopilot profile includes:
      | Break after    | Duration |
      | 90 minutes     | 15 min   |
      | Lunch at 12:30 | 60 min   |
    When 90 minutes have elapsed
    Then autopilot should:
      | Announce upcoming break       |
      | Complete current speaker      |
      | Start break timer             |
      | Display break screen          |
      | Play notification at end      |
      | Resume with next item         |

  @custom-autopilot
  Scenario: Configure custom autopilot profile
    When I click "Create custom profile"
    And I configure:
      | Setting                  | Value            |
      | Agenda timing           | Strict           |
      | Speaker warnings        | 1min, 30s, 10s   |
      | Auto-close discussions  | After 2 speakers |
      | Voting duration        | 3 minutes        |
      | Break frequency        | Every 2 hours    |
      | Motion introduction    | Play video       |
    And I save as "Board Meeting Profile"
    Then the profile should be available for use

  @interruption-handling
  Scenario: Handle autopilot interruptions
    Given autopilot is running
    When I click "Pause autopilot"
    Then current timers should pause
    And manual control should resume
    And current state should be saved
    When I click "Resume autopilot"
    Then autopilot should continue from saved state

  @point-of-order
  Scenario: Handle points of order in autopilot
    Given autopilot is managing the meeting
    When a participant raises a point of order
    Then autopilot should:
      | Pause current proceedings      |
      | Enable point of order mode     |
      | Start 2-minute timer          |
      | Allow operator intervention    |
      | Resume after resolution        |

  @parallel-sessions
  Scenario: Manage parallel session autopilots
    Given the meeting has 3 parallel sessions
    When I configure autopilot for each:
      | Session     | Profile         | Start Time |
      | Main Hall   | Plenary Session | 09:00      |
      | Room A      | Workshop        | 09:30      |
      | Room B      | Committee       | 09:30      |
    Then each session should run independently
    And I should see all sessions in monitor view
    And be able to control each separately

  @autopilot-templates
  Scenario: Use meeting type templates
    When I select autopilot template:
      | Template           | Features                           |
      | Annual Assembly    | Welcome, Reports, Elections, Close |
      | Board Meeting      | Approval, Reports, Decisions       |
      | Quick Standup      | Updates, Blockers, Next steps      |
    Then autopilot should be pre-configured
    And follow the template structure
    And appropriate timings for each section should be applied

  @decision-tracking
  Scenario: Automatic decision recording
    Given autopilot is configured to track decisions
    When a vote concludes with a decision
    Then autopilot should:
      | Record decision text           |
      | Note vote results              |
      | Tag responsible parties        |
      | Set follow-up dates           |
      | Add to decision register      |

  @livestream-integration
  Scenario: Coordinate with livestream
    Given meeting is being livestreamed
    When autopilot manages transitions
    Then it should:
      | Show transition screens        |
      | Mute during breaks            |
      | Display agenda progress       |
      | Show speaker names            |
      | Hide sensitive content        |

  @emergency-stop
  Scenario: Emergency stop autopilot
    Given autopilot is running
    When I press the emergency stop button
    Then all timers should stop
    And current state should freeze
    And manual control should engage
    And alert should be logged
    And recovery options should show

  @reports
  Scenario: Generate autopilot reports
    Given a meeting was run with autopilot
    When I request an autopilot report
    Then it should show:
      | Planned vs actual timings     |
      | Agenda completion rate        |
      | Speaker time utilization      |
      | Voting participation          |
      | Interruption statistics       |
      | Efficiency metrics            |

  @ai-optimization
  Scenario: AI-powered autopilot suggestions
    Given historical meeting data exists
    When I enable "AI optimization"
    Then autopilot should suggest:
      | Optimal time allocations      |
      | Best break positions          |
      | Speaker time adjustments      |
      | Voting duration optimization  |
    And suggestions should be based on previous meeting patterns