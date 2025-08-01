@participants @presence
Feature: Participant Management
  As a meeting administrator
  I want to manage meeting participants
  So that I can track attendance and permissions

  Background:
    Given I am logged in as "admin"
    And I am in the meeting "Board Meeting"
    And I am on the participants page

  @critical
  Scenario: Add participant to meeting
    When I click the add participant button
    And I fill in the participant form with:
      | Field     | Value         |
      | Given name| John          |
      | Surname   | Doe           |
      | Email     | john@test.com |
      | Username  | johndoe       |
    And I save the participant
    Then I should see a success notification
    And "John Doe" should appear in the participant list

  @presence @simple
  Scenario: Toggle participant presence
    When I click the presence checkbox for "a"
    Then "a" should be marked as present
    And I should see a success notification

  Scenario: Change participant group
    Given "Bob Johnson" is a participant in group "Observers"
    When I open the menu for "Bob Johnson"
    And I select "Change groups"
    And I select group "Delegates"
    And I save the changes
    Then I should see a success notification "Groups updated"
    And "Bob Johnson" should show group "Delegates"

  @import
  Scenario: Import participants from CSV
    When I click the import button
    And I upload the file "participants.csv"
    And I map the columns:
      | CSV Column | Field      |
      | Column A   | Username   |
      | Column B   | First Name |
      | Column C   | Last Name  |
    And I click import
    Then I should see a success notification "Import completed"
    And the imported participants should appear in the list

  Scenario: Add participant to speakers list
    Given "Alice Brown" is a participant
    And an agenda item "Current Topic" is active
    When I open the menu for "Alice Brown"
    And I select "Add to speakers"
    Then I should see a success notification "Added to speakers list"
    And "Alice Brown" should appear in the speakers queue

  @filter
  Scenario: Filter participants by group
    Given the following participants exist:
      | Name        | Group      | Present |
      | User A      | Admin      | Yes     |
      | User B      | Delegates  | Yes     |
      | User C      | Delegates  | No      |
      | User D      | Observers  | Yes     |
    When I filter by group "Delegates"
    Then I should see only:
      | Name   |
      | User B |
      | User C |

  Scenario: Bulk presence update
    Given multiple participants are selected
    When I select bulk action "Mark as present"
    And I confirm the action
    Then all selected participants should be marked as present
    And I should see a success notification

  @remove
  Scenario: Remove participant from meeting
    Given "Test User" is a participant
    When I open the menu for "Test User"
    And I select "Remove from meeting"
    And I confirm the removal
    Then I should see a success notification "Participant removed"
    And "Test User" should not appear in the list