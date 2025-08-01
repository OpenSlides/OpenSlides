@history @audit @tracking
Feature: History and Audit Trail
  As a meeting administrator
  I want to track all actions and changes
  So that I have a complete audit trail of meeting activities

  Background:
    Given I am logged in as an administrator
    And I am in a meeting with history enabled
    And I navigate to the history section

  @smoke
  Scenario: View recent activity history
    Then I should see a chronological list of activities
    And each entry should show:
      | Field       | Description                |
      | Timestamp   | When the action occurred   |
      | User        | Who performed the action   |
      | Action      | What was done              |
      | Object      | What was affected          |
      | Changes     | What changed               |
    And I should be able to filter by date range

  @motion-history
  Scenario: Track motion lifecycle history
    Given a motion "Budget Amendment" has been through multiple states
    When I search for "Budget Amendment" in history
    Then I should see the complete motion timeline:
      | Time  | User    | Action           | Details                    |
      | 10:00 | Alice   | Created motion   | Initial draft              |
      | 10:15 | Alice   | Updated text     | Added paragraph 3          |
      | 10:30 | Bob     | Added supporter  | Supporting motion          |
      | 10:45 | Admin   | Changed state    | Submitted → Received       |
      | 11:00 | Admin   | Changed state    | Received → Accepted        |
      | 14:00 | System  | Opened voting    | Poll created               |
      | 14:30 | System  | Closed voting    | Results: 45 Yes, 12 No     |

  @user-activity
  Scenario: View specific user's activity
    When I filter history by user "John Doe"
    Then I should see all actions by John Doe:
      | Actions               |
      | Login times           |
      | Motions created       |
      | Votes cast            |
      | Speeches given        |
      | Files uploaded        |
      | Settings changed      |
    And I should be able to export this user report

  @detailed-changes
  Scenario: View detailed change information
    Given a complex motion was edited multiple times
    When I click on a history entry "Motion text updated"
    Then I should see a detailed diff view showing:
      | Original text    |
      | Modified text    |
      | Added content    |
      | Deleted content  |
    And changes should be highlighted in colors

  @voting-audit
  Scenario: Audit voting activities
    Given several votes have been conducted
    When I filter by action type "Voting"
    Then I should see comprehensive voting audit:
      | Vote ID | Motion | Start Time | End Time | Participants | Results |
    When I click on a specific vote
    Then I should see:
      | Who voted when       |
      | Vote changes         |
      | Technical events     |
      | Final tally          |

  @permission-changes
  Scenario: Track permission and role changes
    When I filter by "Permission changes"
    Then I should see all permission modifications:
      | Time  | Admin   | User    | Permission      | Action  |
      | 09:00 | Alice   | Bob     | Can edit motion | Granted |
      | 10:00 | Alice   | Carol   | Admin rights    | Granted |
      | 11:00 | System  | Dave    | Speaking rights | Revoked |
    And each change should show the reason

  @file-history
  Scenario: Track document history
    Given files have been uploaded and modified
    When I filter by "File operations"
    Then I should see:
      | File uploads      |
      | File deletions    |
      | File movements    |
      | Access logs       |
      | Download records  |
    And I should see who accessed confidential files

  @export-history
  Scenario: Export audit trail
    When I click "Export history"
    And I configure export options:
      | Option          | Value           |
      | Date range      | Last 30 days    |
      | Format          | PDF             |
      | Include         | All actions     |
      | Privacy level   | Anonymized      |
    Then a comprehensive audit report should be generated
    And it should be digitally signed for authenticity

  @history-search
  Scenario: Advanced history search
    When I click "Advanced search"
    And I set search criteria:
      | Field       | Operator | Value        |
      | Action      | Contains | vote         |
      | User        | Is       | John Doe     |
      | Date        | Between  | Jan 1 - Jan 31 |
      | Object type | Is       | Motion       |
    Then I should see filtered results matching all criteria
    And I should be able to save this search

  @compliance-report
  Scenario: Generate compliance report
    Given regulatory compliance is required
    When I click "Generate compliance report"
    And I select report type "Data Protection Audit"
    Then the report should include:
      | Personal data access logs     |
      | Data modification records     |
      | Consent tracking              |
      | Data retention compliance     |
      | Right to erasure requests     |

  @real-time-monitoring
  Scenario: Monitor activities in real-time
    When I enable "Live monitoring"
    Then I should see activities as they happen
    And new entries should appear without refresh
    When suspicious activity occurs
    Then I should receive an alert notification

  @rollback-capability
  Scenario: Review rollback possibilities
    Given an incorrect bulk action was performed
    When I locate the action in history
    And I click "Analyze rollback"
    Then I should see:
      | What can be rolled back     |
      | What cannot be rolled back  |
      | Potential side effects      |
      | Recommended actions         |

  @history-retention
  Scenario: Configure history retention
    When I access history settings
    And I configure retention policies:
      | Data type        | Retention period |
      | Login records    | 90 days         |
      | Vote records     | 7 years         |
      | Chat messages    | 30 days         |
      | General actions  | 1 year          |
    Then old records should be archived accordingly
    And archived data should remain searchable

  @security-events
  Scenario: Track security-relevant events
    When I filter by "Security events"
    Then I should see:
      | Failed login attempts      |
      | Permission violations      |
      | Suspicious activities      |
      | System security changes    |
      | Data export activities     |
    And high-risk events should be highlighted

  @history-api
  Scenario: Access history via API
    When I request history data via API with parameters:
      | limit      | 100          |
      | offset     | 0            |
      | action     | user.update  |
    Then I should receive paginated JSON data
    And it should include all relevant metadata
    And API access should be logged