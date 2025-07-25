@motions @workflow
Feature: Motion Workflow
  As a meeting participant
  I want to create and manage motions
  So that I can propose decisions for voting

  Background:
    Given I am logged in as "delegate"
    And I am in the meeting "Board Meeting"
    And I am on the motions page

  @critical
  Scenario: Create a motion
    When I click the create motion button
    And I fill in the motion form with:
      | Field    | Value                                    |
      | Title    | Increase Budget for IT Department        |
      | Text     | The IT budget should be increased by 20% |
      | Reason   | To support digital transformation        |
      | Category | Finance                                  |
    And I click the create button
    Then I should see a success notification "Motion created"
    And the motion should appear with state "Draft"

  Scenario: Submit motion for review
    Given I have a draft motion "Budget Proposal"
    When I click the state button for "Budget Proposal"
    And I select "Submit"
    Then the motion state should change to "Submitted"
    And the motion should be visible to other participants

  @amendment
  Scenario: Create an amendment
    Given a motion "Original Motion" in state "Submitted" exists
    When I click the amendment button for "Original Motion"
    And I select paragraph 2
    And I enter the amendment text "Modified paragraph text"
    And I create the amendment
    Then I should see a success notification "Amendment created"
    And the amendment should be linked to the parent motion

  Scenario: Support a motion
    Given a motion "Important Proposal" exists
    And the motion requires 5 supporters
    When I click the support button
    Then I should see a success notification "Motion supported"
    And the supporter count should increase by 1

  @voting
  Scenario: Create and start a poll
    Given I am logged in as "admin"
    And a motion "Voting Motion" in state "Permitted" exists
    When I create a poll with:
      | Field  | Value           |
      | Type   | named           |
      | Method | YNA             |
    And I start the poll
    Then the poll should be in state "Started"
    And participants should be able to vote

  Scenario: Change motion state through workflow
    Given I am logged in as "admin"
    And a motion "Workflow Motion" exists
    When I change the state through:
      | From State | To State   |
      | Draft      | Submitted  |
      | Submitted  | Permitted  |
      | Permitted  | Accepted   |
    Then the motion should be in state "Accepted"
    And the state history should show all transitions

  Scenario: Filter motions by state
    Given the following motions exist:
      | Title      | State     |
      | Motion A   | Draft     |
      | Motion B   | Submitted |
      | Motion C   | Accepted  |
    When I filter by state "Submitted"
    Then I should see only "Motion B" in the results

  @export
  Scenario: Export motions to PDF
    Given multiple motions exist
    When I click the export button
    And I select "Export as PDF"
    Then a PDF file should be downloaded
    And it should contain all visible motions