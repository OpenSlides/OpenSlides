@agenda @meeting
Feature: Agenda Management
  As a meeting administrator
  I want to manage agenda items
  So that I can organize meeting topics and discussions

  Background:
    Given I am logged in as "admin"
    And I am in the meeting "Board Meeting"
    And I am on the agenda page

  @critical
  Scenario: Create an agenda item
    When I click the create agenda item button
    And I fill in the agenda form with:
      | Field    | Value                |
      | Title    | Budget Discussion    |
      | Type     | common              |
      | Duration | 30                  |
      | Comment  | Review Q3 budget    |
    And I click the create button
    Then I should see a success notification "Agenda item created"
    And the item "Budget Discussion" should appear in the agenda

  Scenario: Manage speakers list
    Given an agenda item "Opening Remarks" exists
    When I click the speaker button for "Opening Remarks"
    And I add "John Doe" to the speakers list
    And I add "Jane Smith" to the speakers list
    Then I should see 2 speakers in the queue

  Scenario: Start and stop speaker
    Given an agenda item "Discussion" with speakers exists
    When I start the speaker "John Doe"
    Then the speaker timer should start
    And "John Doe" should be marked as current speaker
    When I stop the current speaker
    Then the timer should stop
    And speaking time should be recorded

  @projector
  Scenario: Project agenda item
    Given an agenda item "Main Topic" exists
    When I click the projector button for "Main Topic"
    Then the item should be marked as projected
    And it should appear on the projector view

  Scenario: Change item visibility
    Given an agenda item "Internal Discussion" exists
    When I open the menu for "Internal Discussion"
    And I select "Set as internal" from the agenda menu
    Then the item should be marked as internal
    And it should not be visible to regular participants

  @reorder
  Scenario: Reorder agenda items
    Given the following agenda items exist:
      | Title    | Order |
      | Item A   | 1     |
      | Item B   | 2     |
      | Item C   | 3     |
    When I drag "Item C" above "Item A"
    Then the order should be:
      | Title    | Order |
      | Item C   | 1     |
      | Item A   | 2     |
      | Item B   | 3     |

  Scenario: Delete agenda item
    Given an agenda item "Old Item" exists
    When I open the menu for "Old Item"
    And I select "Delete" from the agenda menu
    And I confirm the agenda item deletion
    Then I should see a success notification "Agenda item deleted"
    And "Old Item" should not appear in the agenda