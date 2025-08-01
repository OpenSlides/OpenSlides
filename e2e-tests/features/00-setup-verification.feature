@smoke @setup
Feature: Setup Verification
  As a developer
  I want to verify the test environment is working
  So that I can run the full test suite

  Scenario: Verify OpenSlides is accessible
    When I navigate to the base URL
    Then the page should load successfully
    And I should see the OpenSlides login page or dashboard

  Scenario: Verify SSL certificate handling
    When I navigate to the base URL with HTTPS
    Then the page should load despite self-signed certificate
    And no SSL errors should block the page

  Scenario: Verify login page elements
    Given I am on the login page
    Then I should see the username input field
    And I should see the password input field
    And I should see the login button
    And I should see the OpenSlides logo