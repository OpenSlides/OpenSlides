@users @accounts @organization
Feature: User and Account Management
  As an administrator
  I want to manage user accounts and permissions
  So that I can control access to the system

  Background:
    Given I am logged in as "admin"
    And I navigate to the accounts page

  @smoke
  Scenario: View list of users
    Then I should see the user list
    And I should see user details including username, name, and groups

  Scenario: Create a new user account
    When I click the "Create account" button
    And I fill in the user form with:
      | Field            | Value                |
      | Username         | john.doe             |
      | First name       | John                 |
      | Last name        | Doe                  |
      | Email            | john.doe@example.com |
      | Default password | Welcome123!          |
    And I select the group "Delegates"
    And I click "Save"
    Then I should see a success message
    And the user "john.doe" should appear in the list

  Scenario: Edit user details
    Given a user "test.user" exists
    When I search for user "test.user"
    And I click on the user "test.user"
    And I click the "Edit" button
    And I update the following fields:
      | Field      | Value               |
      | Email      | updated@example.com |
      | First name | Updated             |
    And I click "Save"
    Then I should see a success message
    And the user details should be updated

  Scenario: Reset user password
    Given a user "password.test" exists
    When I click on the user "password.test"
    And I click the "Reset password" button
    And I enter a new password "NewPassword123!"
    And I confirm the password reset
    Then I should see a success message
    And the user should be able to login with the new password

  Scenario: Manage user groups and permissions
    Given a user "permission.test" exists
    When I click on the user "permission.test"
    And I click the "Groups" tab
    And I assign the following groups:
      | Group        | Action |
      | Delegates    | Add    |
      | Staff        | Add    |
      | Presenters   | Remove |
    And I save the group assignments
    Then the user should have the correct group memberships

  Scenario: Bulk import users
    When I click the "Import" button
    And I select a CSV file with user data
    And I map the CSV columns to user fields
    And I click "Import"
    Then I should see a progress indicator
    And all valid users should be imported
    And I should see a summary of imported and failed records

  Scenario: Deactivate a user account
    Given a user "inactive.test" exists
    When I click on the user "inactive.test"
    And I click the "Deactivate account" button
    And I confirm the deactivation
    Then the user should be marked as inactive
    And the user should not be able to login

  @search
  Scenario: Search and filter users
    Given multiple users exist with various attributes
    When I enter "john" in the search field
    Then I should see only users matching "john"
    When I apply the filter "Group: Delegates"
    Then I should see only users in the "Delegates" group

  @permissions
  Scenario: User self-service profile editing
    Given I am logged in as a regular user
    When I navigate to my profile
    Then I should see my profile information
    And I should be able to edit:
      | Field    |
      | Email    |
      | Password |
    But I should not be able to edit:
      | Field    |
      | Username |
      | Groups   |

  @delete @critical
  Scenario: Delete a user account
    Given a user "delete.test" exists
    When I click on the user "delete.test"
    And I click the "Delete account" button
    And I confirm the deletion with reason "Test account no longer needed"
    Then I should see a success message
    And the user "delete.test" should not appear in the list
    And the user should not be able to login

  @delete
  Scenario: Bulk delete users
    Given the following users exist:
      | Username       | Status   |
      | temp.user1     | inactive |
      | temp.user2     | inactive |
      | temp.user3     | inactive |
    When I select all inactive users
    And I choose "Delete selected" from bulk actions
    And I confirm the bulk deletion
    Then all selected users should be deleted
    And I should see "3 users deleted successfully"

  @permissions @validation
  Scenario: Prevent deletion of last admin
    Given I am the only administrator
    When I try to delete my own account
    Then I should see an error "Cannot delete the last administrator"
    And the delete action should be prevented

  @export
  Scenario: Export user list
    Given multiple users exist with various attributes
    When I click the "Export" button
    And I select export format "CSV"
    And I choose fields to export:
      | Field         |
      | Username      |
      | Email         |
      | Groups        |
      | Last login    |
    And I click "Export"
    Then a CSV file should be downloaded
    And it should contain all selected user data

  @activity
  Scenario: View user activity log
    Given a user "activity.test" exists
    When I click on the user "activity.test"
    And I click the "Activity log" tab
    Then I should see the user's recent activities:
      | Activity Type    | Description |
      | Login           | Login history |
      | Motion created  | Motions submitted |
      | Votes cast      | Voting participation |
      | Profile updated | Profile changes |

  @presence
  Scenario: Check user online status
    Given multiple users are logged in
    When I view the user list
    Then I should see online status indicators
    And I should see:
      | Status    | Indicator |
      | Online    | Green dot |
      | Away      | Yellow dot |
      | Offline   | Gray dot |
    And the status should update in real-time