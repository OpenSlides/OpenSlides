@voting @lifecycle @critical
Feature: Complete Voting Lifecycle Management
  As a meeting operator
  I want to manage the complete lifecycle of votes
  So that voting processes are properly controlled and auditable

  Background:
    Given I am logged in as a meeting administrator
    And I am in an active meeting
    And I navigate to the voting section

  @smoke @poll-lifecycle
  Scenario: Create and start a simple motion vote
    Given a motion "Budget Approval 2024" is in state "permitted"
    When I click "Create vote" for the motion
    And I configure the vote with:
      | Setting           | Value              |
      | Title             | Budget Vote        |
      | Type              | Public vote        |
      | Method            | Yes/No/Abstain     |
      | Duration          | 5 minutes          |
      | Min votes         | 50%                |
    And I click "Create"
    Then the vote should be created in "Created" state
    When I click "Start voting"
    Then the vote should transition to "Started" state
    And participants should see the voting interface
    And a countdown timer should be visible

  @poll-stop
  Scenario: Stop an active vote
    Given a vote "Active Vote" is currently running
    And 75% of participants have voted
    When I click "Stop voting"
    And I confirm "Stop voting now?"
    Then the vote should transition to "Finished" state
    And no more votes should be accepted
    And preliminary results should be available

  @poll-publish
  Scenario: Publish voting results
    Given a vote has finished with results:
      | Option  | Votes | Percentage |
      | Yes     | 45    | 60%        |
      | No      | 20    | 27%        |
      | Abstain | 10    | 13%        |
    When I review the results
    And I click "Publish results"
    Then the results should be visible to all participants
    And the motion state should update based on the outcome
    And a voting protocol should be generated

  @poll-cancel
  Scenario: Cancel a running vote
    Given a vote is currently active
    And technical issues have been reported
    When I click "Cancel vote"
    And I provide reason "Technical difficulties"
    And I confirm the cancellation
    Then the vote should be marked as "Cancelled"
    And all submitted votes should be discarded
    And participants should be notified of cancellation

  @poll-types
  Scenario Outline: Different voting types lifecycle
    Given I create a vote of type "<type>"
    When I configure it with method "<method>"
    And I set options "<options>"
    And I start the vote
    Then the correct voting interface should appear
    And the vote counting should follow "<counting>" rules

    Examples:
      | type        | method          | options                    | counting        |
      | Motion      | YNA             | Yes,No,Abstain            | Simple majority |
      | Election    | Votes           | Candidate A,B,C,D         | Most votes      |
      | Poll        | Multiple choice | Option 1,2,3,4            | All responses   |
      | Assignment  | Ranked          | First,Second,Third choice | Weighted        |

  @anonymous-voting
  Scenario: Anonymous voting lifecycle
    Given I create an anonymous vote
    When I start the voting
    Then participant names should not be recorded
    When I stop the voting
    Then I should see vote counts but no voter information
    And the anonymity should be preserved in all reports

  @delegation
  Scenario: Voting with delegations
    Given participant "John" has delegated to "Sarah"
    And participant "Mike" has delegated to "Sarah"
    When Sarah opens the voting interface
    Then she should see "Voting for 3 people"
    When she casts votes
    Then she should cast 3 separate votes
    And the vote count should reflect all delegations

  @voting-phases
  Scenario: Multi-phase voting
    Given a complex motion requires two voting phases
    When I complete phase 1 voting
    Then I should see phase 1 results
    When I configure phase 2 based on phase 1 outcomes
    And I start phase 2 voting
    Then only qualified voters should participate
    And final results should combine both phases

  @voting-groups
  Scenario: Group-based voting rights
    Given voting groups are configured:
      | Group      | Weight | Can Vote |
      | Board      | 3      | Yes      |
      | Members    | 1      | Yes      |
      | Observers  | 0      | No       |
    When I start a weighted vote
    Then board members' votes should count 3x
    And observers should not see voting interface
    And results should show weighted totals

  @revote
  Scenario: Handle vote that requires revoting
    Given a vote ended with exactly 50/50 split
    When I click "Initiate revote"
    And I add a revote message "Due to tie, we need a second round"
    Then a new vote should be created
    And it should reference the original vote
    And participants should be notified of revote

  @batch-voting
  Scenario: Batch voting on multiple items
    Given I have 5 related motions to vote on
    When I select all motions
    And I click "Create batch vote"
    And I configure batch settings
    Then 5 linked votes should be created
    When I click "Start all votes"
    Then participants should vote on all items in sequence
    And results should be collected together

  @voting-validation
  Scenario: Validate voting requirements
    Given a vote requires 2/3 majority
    And minimum participation is 60%
    When the vote ends with:
      | Participation | 55%  |
      | Yes votes     | 65%  |
    Then the vote should be marked "Invalid - Insufficient participation"
    And I should have option to extend or revote

  @export-voting
  Scenario: Export voting data
    Given multiple votes have been completed
    When I select votes to export
    And I choose export format:
      | Format | Options                |
      | PDF    | Include voter names    |
      | CSV    | Detailed vote data     |
      | JSON   | Machine readable       |
    Then voting data should be exported correctly
    And it should include all selected metadata