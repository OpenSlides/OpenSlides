@voting @meeting
Feature: Electronic Voting System
  As a meeting participant
  I want to participate in electronic voting
  So that decisions can be made efficiently and transparently

  Background:
    Given I am logged in as a participant with voting rights
    And I am in an active meeting
    And electronic voting is enabled

  @smoke
  Scenario: Vote on a motion
    Given a motion "Budget Proposal" has an active vote
    When I navigate to the motion "Budget Proposal"
    Then I should see the voting interface
    When I select "Yes" and submit my vote
    Then I should see a confirmation message
    And my vote should be recorded
    And I should not be able to vote again

  Scenario: Anonymous voting
    Given a motion has an anonymous vote configured
    When I cast my vote
    Then my vote should be recorded
    But my name should not be associated with the vote
    And only the vote totals should be visible

  Scenario: Named voting with delegation
    Given I have delegated my vote to "John Doe"
    And a motion has a named vote
    When the voting starts
    Then "John Doe" should be able to vote on my behalf
    And the vote should show as delegated

  Scenario: Vote on election
    Given an election "Board Members" is active with 3 positions
    And there are 5 candidates
    When I open the election voting interface
    Then I should be able to select up to 3 candidates
    When I select my preferred candidates and submit
    Then my vote should be recorded
    And I should see a confirmation

  Scenario: Weighted voting
    Given I represent an organization with 10 votes
    And weighted voting is enabled
    When I vote on a motion
    Then my vote should count as 10 votes
    And the vote weight should be clearly displayed

  Scenario: Live voting results
    Given I have permission to see live results
    And a vote is in progress
    When I view the voting results
    Then I should see:
      | Information     |
      | Current turnout |
      | Votes cast      |
      | Votes remaining |
    And the results should update in real-time

  Scenario: Voting with majority requirements
    Given a motion requires a 2/3 majority
    When the voting is completed with results:
      | Vote    | Count |
      | Yes     | 65    |
      | No      | 30    |
      | Abstain | 5     |
    Then the system should calculate the majority correctly
    And show that the motion failed to reach 2/3 majority

  @permissions
  Scenario: Restricted voting access
    Given I do not have voting rights for this motion
    When I try to access the voting interface
    Then I should see a message "You are not eligible to vote"
    But I should be able to see the motion details

  Scenario: Voting deadline
    Given a vote has a deadline of "2024-01-15 15:00"
    And the current time is "2024-01-15 15:01"
    When I try to vote
    Then I should see "Voting has closed"
    And I should not be able to submit a vote

  Scenario: Change vote before closing
    Given voting allows changing votes
    And I have already voted "Yes" on a motion
    When I access the voting interface again
    Then I should see my current vote
    When I change my vote to "No" and submit
    Then my vote should be updated
    And I should see a confirmation of the change

  Scenario: Proxy voting
    Given I have been assigned as a proxy for "Jane Smith"
    When a vote is active
    Then I should see options to:
      | Option                |
      | Vote for myself       |
      | Vote for Jane Smith   |
    When I submit both votes
    Then both votes should be recorded separately

  @reports
  Scenario: Generate voting report
    Given a vote has been completed
    And I have permission to generate reports
    When I click "Generate voting report"
    Then I should be able to download a report containing:
      | Content                |
      | Vote results           |
      | Turnout statistics     |
      | Time stamps            |
      | Voter list (if named)  |