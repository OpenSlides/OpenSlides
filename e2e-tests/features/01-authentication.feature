@smoke @authentication
Feature: User Authentication
  As a user
  I want to log in to OpenSlides
  So that I can access the system

  Background:
    Given I am on the login page

  @critical
  Scenario: Successful login with valid credentials
    When I enter username "admin" and password "admin"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see the welcome message

  Scenario: Failed login with invalid credentials
    When I enter username "invalid" and password "wrong"
    And I click the login button
    Then I should see an error message "Invalid username or password"
    And I should remain on the login page

  Scenario: Password field masking
    When I enter password "secretpassword" 
    Then the password should be masked
    And I should see dots instead of characters

  Scenario: Remember me functionality
    When I check the "Remember me" checkbox
    And I enter valid credentials
    And I click the login button
    Then I should be logged in
    And my session should persist after browser restart

  @logout
  Scenario: Successful logout
    Given I am logged in as "admin"
    When I click on the user menu
    And I click the logout button
    Then I should be redirected to the login page
    And I should see the login form

  Scenario: Session timeout
    Given I am logged in as "admin"
    When I remain inactive for 30 minutes
    Then I should be automatically logged out
    And I should see a session timeout message