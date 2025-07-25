@smoke @fixed
Feature: Fixed Login Test
  
  Scenario: Login works correctly
    Given I am on the login page
    When I enter username "admin" and password "admin"
    And I click the login button
    Then I should be redirected to the dashboard