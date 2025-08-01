@projector @presentation
Feature: Projector and Presentation Control
  As a meeting operator
  I want to control projector displays
  So that content can be presented to the assembly

  Background:
    Given I am logged in with projector control permissions
    And I am in a meeting with projector enabled
    And I navigate to the projector control panel

  @smoke
  Scenario: Project current agenda item
    Given the agenda is displayed
    When I click "Project" on agenda item "Budget Report"
    Then the agenda item should appear on the projector
    And it should be marked as "Currently projected"
    And attendees should see it on the public display

  Scenario: Manage multiple projectors
    Given the meeting has 3 projectors configured
    When I view the projector control panel
    Then I should see controls for all 3 projectors
    When I assign different content to each:
      | Projector | Content            |
      | Main      | Current Motion     |
      | Left      | Speaker List       |
      | Right     | Vote Results       |
    Then each projector should display its assigned content

  Scenario: Create custom slides
    When I click "Create slide"
    And I enter slide content:
      | Field      | Value                    |
      | Title      | Welcome                  |
      | Subtitle   | Annual General Meeting   |
      | Body       | Please take your seats   |
    And I select a template "Meeting intro"
    And I click "Save and project"
    Then the custom slide should be displayed
    And it should be saved for future use

  Scenario: Queue presentation items
    When I add the following to the presentation queue:
      | Order | Item                    |
      | 1     | Welcome slide           |
      | 2     | Agenda overview         |
      | 3     | Motion 1                |
      | 4     | Motion 1 voting results |
    Then I should see the queue in order
    When I click "Start presentation"
    Then items should advance automatically based on timing

  Scenario: Live editing on projector
    Given a motion is being projected
    When I edit the motion text
    And I enable "Live update"
    Then changes should appear on the projector in real-time
    And participants should see the updates immediately

  Scenario: Countdown timer
    When I click "Show countdown"
    And I set the timer to "5:00"
    And I click "Start"
    Then the countdown should appear on the projector
    And it should count down to zero
    When time expires
    Then an alert should be shown

  Scenario: Split screen display
    When I enable split screen mode
    And I assign content to each half:
      | Side  | Content        |
      | Left  | Current Motion |
      | Right | Amendment Text |
    Then the projector should show both contents side by side

  Scenario: Emergency messages
    When I click "Emergency message"
    And I enter "Please evacuate the building"
    And I select priority "High"
    And I click "Display now"
    Then the message should override all projectors
    And it should be displayed prominently
    And a sound alert should play

  @templates
  Scenario: Use presentation templates
    When I click "Templates"
    Then I should see available templates:
      | Template            |
      | Meeting start       |
      | Break announcement  |
      | Lunch break         |
      | Meeting end         |
      | Technical pause     |
    When I select "Break announcement"
    And I customize the break duration to "15 minutes"
    Then the customized template should be projected

  Scenario: Project file presentations
    Given a PowerPoint file "quarterly-report.pptx" is uploaded
    When I select the file for projection
    Then I should see presentation controls:
      | Control          |
      | Next slide       |
      | Previous slide   |
      | Go to slide      |
      | Start/Stop       |
    And I should be able to navigate through slides

  @resolution
  Scenario: Manage display settings
    When I access projector settings
    Then I should be able to configure:
      | Setting           | Options                    |
      | Resolution        | 1920x1080, 1280x720       |
      | Font size         | Small, Medium, Large      |
      | Color scheme      | Light, Dark, High contrast|
      | Logo position     | Top-left, Top-right, None |
    And changes should apply immediately

  Scenario: Projector preview
    When I hover over a projectable item
    Then I should see a preview thumbnail
    When I click "Full preview"
    Then I should see exactly what would be projected
    And it should not affect the actual projector display