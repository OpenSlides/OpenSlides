@smoke @meetings
Feature: Meeting Management
  As an organization administrator
  I want to manage meetings
  So that I can organize events and sessions

  Background:
    Given I am logged in as "admin"
    And I am on the meetings page

  @critical
  Scenario: Create a new meeting
    When I click the create meeting button
    And I fill in the meeting form with:
      | Field       | Value                        |
      | Name        | Annual General Meeting 2024  |
      | Committee   | Board Committee              |
      | Start Date  | 2024-12-01                  |
      | Description | Annual board meeting         |
    And I click the create button
    Then I should see a success notification "Meeting created successfully"
    And the meeting "Annual General Meeting 2024" should appear in the list

  Scenario: Enter a meeting
    Given a meeting "Board Meeting" exists
    When I click on the meeting "Board Meeting"
    Then I should be redirected to the meeting home page
    And I should see the meeting navigation menu

  Scenario: Search for meetings
    Given the following meetings exist:
      | Name              | Committee          | Date       |
      | Board Meeting     | Board Committee    | 2024-07-01 |
      | Finance Review    | Finance Committee  | 2024-07-15 |
      | Strategy Session  | Board Committee    | 2024-08-01 |
    When I search for "Finance"
    Then I should see only "Finance Review" in the results

  Scenario: Duplicate a meeting
    Given a meeting "Template Meeting" exists
    When I click the menu for meeting "Template Meeting"
    And I select "Duplicate"
    Then I should see a success notification "Meeting duplicated successfully"
    And I should see "Template Meeting (Copy)" in the list

  @delete
  Scenario: Delete a meeting
    Given a meeting "Old Meeting" exists
    When I click the menu for meeting "Old Meeting"
    And I select "Delete"
    And I confirm the deletion
    Then I should see a success notification "Meeting deleted successfully"
    And the meeting "Old Meeting" should not appear in the list

  Scenario: Archive a meeting
    Given an active meeting "Completed Meeting" exists
    When I click the menu for meeting "Completed Meeting"
    And I select "Archive"
    Then I should see a success notification "Meeting archived successfully"
    And the meeting should appear in the archived section