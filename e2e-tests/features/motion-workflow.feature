@motions @workflow @meeting
Feature: Motion Workflow Management
  As a meeting participant
  I want to create and manage motions through their workflow
  So that proposals can be properly discussed and decided

  Background:
    Given I am logged in as "admin"
    And I am in a meeting
    And I navigate to the motions section

  @smoke
  Scenario: Create a new motion
    When I click the "New motion" button
    And I fill in the motion form with:
      | Field     | Value                                           |
      | Title     | Increase budget for IT infrastructure          |
      | Text      | We propose to increase the IT budget by 20%   |
      | Reason    | Current infrastructure needs urgent upgrades   |
    And I select the category "Finance"
    And I add tags "urgent" and "infrastructure"
    And I click "Save"
    Then I should see a success message
    And the motion should be created with sequential number
    And the motion should be in "submitted" state

  Scenario: Edit motion as submitter
    Given I have submitted a motion "Test Motion"
    When I open the motion "Test Motion"
    And I click the "Edit" button
    And I update the motion text
    And I click "Save"
    Then the changes should be saved
    And the motion history should show the edit

  Scenario: Motion state transitions
    Given a motion "Workflow Test" exists in "submitted" state
    When I open the motion "Workflow Test"
    And I have permission to manage motions
    Then I should see available state transitions
    When I change the state to "permitted"
    Then the motion should be in "permitted" state
    And I should see new available transitions:
      | State       |
      | accepted    |
      | rejected    |
      | withdrawn   |
      | referred    |

  Scenario: Add amendments to motion
    Given a motion "Main Motion" exists in "permitted" state
    When I open the motion "Main Motion"
    And I click "Create amendment"
    And I fill in the amendment form with:
      | Field           | Value                          |
      | Amendment text  | Change "20%" to "15%"         |
      | Reason          | More realistic budget increase |
    And I click "Save"
    Then the amendment should be created
    And it should be linked to the parent motion

  Scenario: Manage motion supporters
    Given a motion "Support Test" exists
    And the meeting requires supporter count of 3
    When I open the motion "Support Test"
    And I click "Support this motion"
    Then I should be added as a supporter
    And the supporter count should increase
    When 3 users support the motion
    Then the motion should automatically move to "supported" state

  Scenario: Motion recommendation
    Given I have permission to make recommendations
    And a motion "Recommendation Test" exists
    When I open the motion "Recommendation Test"
    And I click "Add recommendation"
    And I select "Accept with modifications"
    And I add recommendation text "Accept with the following changes..."
    And I click "Save"
    Then the recommendation should be visible on the motion

  @voting
  Scenario: Start voting on motion
    Given a motion "Vote Test" is in "permitted" state
    And I have permission to manage voting
    When I open the motion "Vote Test"
    And I click "Start voting"
    And I configure the voting with:
      | Setting              | Value        |
      | Type                 | Named vote   |
      | Method               | YNA          |
      | Required majority    | Simple       |
    And I click "Start"
    Then the voting should be active
    And participants should be able to vote

  Scenario: Motion with multiple paragraphs
    Given a motion "Paragraph Test" exists
    When I open the motion "Paragraph Test"
    And I switch to "paragraph-based amendment" mode
    Then I should see the motion text split into paragraphs
    And I should be able to create amendments for specific paragraphs

  @permissions
  Scenario: Motion visibility based on state
    Given motions exist in various states
    And I am logged in as a regular participant
    When I navigate to the motions list
    Then I should only see motions in public states
    And I should not see motions in states:
      | State              |
      | draft              |
      | submitted_hidden   |
      | internal           |

  @export
  Scenario: Export motions
    Given multiple motions exist
    When I select motions for export
    And I click "Export"
    And I choose format "PDF"
    And I select options:
      | Option           |
      | Include reasons  |
      | Include comments |
    Then a PDF should be generated with the selected motions

  @delete @critical
  Scenario: Delete a motion
    Given a motion "Obsolete Proposal" exists in "draft" state
    When I open the motion "Obsolete Proposal"
    And I click the "Delete" button
    And I confirm deletion with reason "No longer relevant"
    Then the motion should be removed
    And it should not appear in any lists
    And deletion should be logged in history

  @bulk-operations
  Scenario: Perform bulk actions on motions
    Given I have selected multiple motions:
      | Motion             | State      |
      | Motion A           | submitted  |
      | Motion B           | submitted  |
      | Motion C           | submitted  |
    When I choose "Bulk actions"
    And I select "Change state to received"
    Then all selected motions should change state
    And I should see "3 motions updated"

  @motion-templates
  Scenario: Create motion from template
    When I click "New motion from template"
    And I select template "Standard Resolution"
    Then the motion form should be pre-filled:
      | Field              | Value                  |
      | Title prefix       | Resolution on          |
      | Text structure     | Whereas... Resolved... |
      | Category           | Resolutions            |
    And I should only need to fill specific content

  @motion-merging
  Scenario: Merge similar motions
    Given motions exist on similar topics:
      | Motion          | Submitter |
      | Budget Increase | Alice     |
      | Fund Raising    | Bob       |
    When I select both motions
    And I click "Merge motions"
    Then I should see merge options:
      | Create new combined motion   |
      | Merge into Motion A         |
      | Merge into Motion B         |
    When I merge and provide combined text
    Then a new motion should be created
    And original motions marked as "merged"

  @motion-history
  Scenario: View complete motion history
    Given a motion has been modified multiple times
    When I click "View history"
    Then I should see timeline with:
      | Version | Date       | Author | Changes           |
      | 1       | 2024-01-01 | Alice  | Initial draft     |
      | 2       | 2024-01-02 | Alice  | Added section 3   |
      | 3       | 2024-01-03 | Bob    | Revised wording   |
    And I should be able to:
      | View any version        |
      | Compare versions        |
      | Restore old version     |

  @motion-dependencies
  Scenario: Manage motion dependencies
    Given Motion B depends on Motion A passing
    When I set dependency "B requires A"
    Then Motion B should show:
      | Status: Blocked - waiting for Motion A |
      | Cannot be voted until A is accepted    |
    When Motion A is accepted
    Then Motion B should automatically become available

  @motion-notifications
  Scenario: Configure motion notifications
    When I subscribe to motion "Important Proposal"
    And I set notification preferences:
      | Event                | Notify |
      | State changes        | Yes    |
      | New amendments       | Yes    |
      | Comments added       | No     |
      | Voting opens         | Yes    |
    Then I should receive notifications accordingly
    And notifications should be sent via email and in-app

  @motion-comments
  Scenario: Add internal comments to motions
    Given I have permission to comment
    When I add an internal comment:
      """
      Legal review required before proceeding.
      Contact: legal@example.com
      """
    Then the comment should be visible to authorized users only
    And should appear in motion timeline
    And should have option to mark as "resolved"

  @motion-tagging
  Scenario: Tag and categorize motions
    When I edit motion tags
    And I add tags:
      | Tag         | Type     |
      | urgent      | Priority |
      | finance     | Topic    |
      | board-only  | Access   |
    Then motions should be filterable by tags
    And tags should affect visibility
    And show in motion overview

  @motion-translation
  Scenario: Manage multilingual motions
    Given the meeting supports multiple languages
    When I create a motion in English
    And I click "Add translation"
    And I select "German"
    Then I should be able to:
      | Add German title            |
      | Add German text             |
      | Add German reason           |
    And participants should see preferred language

  @motion-print-layout
  Scenario: Configure motion print layout
    When I select motions to print
    And I configure print settings:
      | Setting            | Value         |
      | Paper size         | A4            |
      | Include QR codes   | Yes           |
      | Line numbers       | Yes           |
      | Comments           | Inline        |
      | Amendments         | Separate page |
    Then print preview should reflect settings
    And PDF should be properly formatted

  @motion-deadlines
  Scenario: Set and enforce motion deadlines
    When I configure motion deadlines:
      | Phase          | Deadline    |
      | Submission     | 2024-01-15  |
      | Amendments     | 2024-01-20  |
      | Support needed | 2024-01-22  |
    Then system should:
      | Show countdown timers          |
      | Send reminder notifications    |
      | Automatically close phases     |
      | Prevent late submissions       |

  @motion-voting-preview
  Scenario: Preview motion voting configuration
    Given a motion is ready for voting
    When I click "Preview voting"
    Then I should see:
      | How motion will appear         |
      | Voting options available       |
      | Required majority              |
      | Eligible voters count          |
    And be able to test vote interface