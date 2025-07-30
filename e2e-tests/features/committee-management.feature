@committees @organization
Feature: Committee Management
  As an administrator
  I want to manage committees
  So that I can organize meetings by committee

  Background:
    Given I am logged in as "admin"
    And I navigate to the committees page

  @smoke
  Scenario: View list of committees
    Then I should see the committees list
    And I should see committee details including name and member count

  Scenario: Create a new committee
    When I click the "Create committee" button
    And I fill in the committee form with:
      | Field              | Value                    |
      | Name               | Finance Committee        |
      | Description        | Handles financial matters|
      | Meeting prefix     | FC                       |
    And I click "Save"
    Then I should see a success message
    And the committee "Finance Committee" should appear in the list

  Scenario: Edit an existing committee
    Given a committee "Test Committee" exists
    When I click on the committee "Test Committee"
    And I click the "Edit" button
    And I change the name to "Updated Committee"
    And I click "Save"
    Then I should see a success message
    And the committee "Updated Committee" should appear in the list

  Scenario: Delete a committee
    Given a committee "Temporary Committee" exists
    When I click on the committee "Temporary Committee"
    And I click the "Delete" button
    And I confirm the committee deletion
    Then I should see a success message
    And the committee "Temporary Committee" should not appear in the list

  Scenario: Assign members to committee
    Given a committee "Member Test Committee" exists
    When I click on the committee "Member Test Committee"
    And I click the "Members" tab
    And I add the following members:
      | User           | Role      |
      | Administrator  | Manager   |
      | Test User      | Member    |
    Then the members should be visible in the committee member list

  @permissions
  Scenario: View committees with limited permissions
    Given I am logged in as a user with view-only permissions
    When I navigate to the committees page
    Then I should see the committees list
    But I should not see the "Create committee" button
    And I should not see any edit or delete options