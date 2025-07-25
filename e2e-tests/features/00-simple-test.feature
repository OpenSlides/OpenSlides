@smoke @simple
Feature: Simple Test
  
  Scenario: Verify we can reach OpenSlides
    When I navigate to the base URL
    Then the page URL should contain "login"