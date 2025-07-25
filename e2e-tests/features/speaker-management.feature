@speakers @speaker-list @meeting
Feature: Speaker List Management
  As a meeting chair
  I want to manage speaker lists
  So that discussions are organized and fair

  Background:
    Given I am logged in as a meeting chair
    And I am in an active meeting
    And I am viewing an agenda item with discussion

  @smoke
  Scenario: Add speakers to the list
    When I see participants want to speak
    And I click "Add speaker"
    And I select:
      | Participant   |
      | John Smith    |
      | Sarah Johnson |
      | Mike Brown    |
    Then they should be added to the speaker list
    And they should see their position in queue
    And the list should show on the projector

  @speaker-queue
  Scenario: Manage speaker queue order
    Given the speaker list contains:
      | Position | Speaker       | Type        |
      | 1        | Alice Green   | Normal      |
      | 2        | Bob White     | Normal      |
      | 3        | Carol Black   | Normal      |
    When I drag Bob White to position 1
    Then the order should update
    And speakers should be notified of changes
    When I mark Alice as "Point of Information"
    Then she should get priority placement

  @start-speech
  Scenario: Start and manage active speech
    Given "John Smith" is next in the speaker list
    When I click "Start speech" for John
    Then John should be marked as current speaker
    And a timer should start
    And his video should be spotlighted
    And his name should show on projector
    And other participants should be muted

  @speech-time
  Scenario: Manage speaking time limits
    Given speaking time is set to 3 minutes
    And Alice is currently speaking
    When 2:30 have elapsed
    Then a warning should appear
    When 3:00 minutes pass
    Then time should turn red
    And warning sound should play
    And "Extend time" button appears
    When I click "Extend 1 minute"
    Then timer should add 1 minute

  @end-speech
  Scenario: End speech and transition
    Given Bob is currently speaking
    When I click "End speech"
    Then Bob's speech time should be recorded
    And he should be marked as "has spoken"
    And next speaker should be highlighted
    And statistics should update
    When I click "Start next speaker"
    Then the next person should begin automatically

  @point-of-order
  Scenario: Handle points of order
    Given normal speakers are in queue
    When Emma raises a "Point of Order"
    Then she should jump to priority queue
    And current speaker should see notice
    And I should get an alert
    When current speaker finishes
    Then Emma should speak next automatically
    And she should have reduced time limit

  @pro-contra
  Scenario: Manage pro/contra speaker lists
    Given the topic has controversial discussion
    When I enable "Pro/Contra mode"
    Then two separate lists should appear
    When participants register to speak
    Then they must choose:
      | Position |
      | Pro      |
      | Contra   |
      | Neutral  |
    And speakers should alternate pro/contra

  @speaker-statistics
  Scenario: View speaking statistics
    Given multiple people have spoken
    When I click "Speaker statistics"
    Then I should see:
      | Speaker       | Times | Total Duration | Avg Duration |
      | John Smith    | 3     | 8:45          | 2:55         |
      | Sarah Johnson | 2     | 5:20          | 2:40         |
      | Mike Brown    | 1     | 3:15          | 3:15         |
    And I should see gender balance statistics
    And participation distribution charts

  @close-list
  Scenario: Close speaker list
    Given 5 speakers are in queue
    When I click "Close speaker list"
    Then no new speakers can be added
    And current queue remains
    And "List closed" indicator shows
    And participants see closed status
    When I click "Reopen list"
    Then new registrations are allowed

  @clear-list
  Scenario: Clear speaker list with confirmation
    Given multiple speakers are waiting
    When I click "Clear speaker list"
    Then I should see confirmation dialog
    When I confirm "Clear all 8 speakers?"
    Then all speakers should be removed
    And notifications should be sent
    And action should be logged

  @speaker-notes
  Scenario: Add notes to speakers
    Given I need to track speaker points
    When I click notes icon for a speaker
    And I add note "Wants to discuss budget impact"
    Then the note should be saved
    And visible only to operators
    When the speaker starts
    Then I should see the note reminder

  @intervention-requests
  Scenario: Handle intervention requests
    Given Sarah is currently speaking
    When Tom requests "Direct response"
    Then I see intervention request
    And Tom appears in special queue
    And I can approve/deny
    When I approve the intervention
    Then Tom gets 1 minute immediately after Sarah

  @speaker-categories
  Scenario: Categorize speakers
    When I configure speaker categories:
      | Category        | Time Limit | Priority |
      | Board Members   | 5 min      | High     |
      | Members         | 3 min      | Normal   |
      | Guests          | 2 min      | Low      |
    Then speakers should be categorized
    And time limits should apply automatically
    And queue ordering should respect priorities

  @batch-operations
  Scenario: Perform batch speaker operations
    Given I select multiple speakers
    When I choose "Batch actions"
    Then I can:
      | Set same time limit for all      |
      | Mark all as "has spoken"         |
      | Move all to different item       |
      | Remove all from list             |

  @speaker-export
  Scenario: Export speaker data
    Given a discussion has concluded
    When I export speaker data
    Then I should get a report with:
      | Complete speaker sequence        |
      | Individual speaking times        |
      | Total discussion duration        |
      | Participation statistics         |
      | Speaking order visualization     |

  @remote-speakers
  Scenario: Manage remote/hybrid speakers
    Given some participants are remote
    When I manage speaker list
    Then I should see:
      | Connection status indicators     |
      | Audio/video check options       |
      | Network quality warnings        |
    When a remote speaker is next
    Then system should verify connection
    And connection should be verified before allowing speech to start