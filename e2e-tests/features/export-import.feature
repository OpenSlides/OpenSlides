@export @import @data-management
Feature: Export and Import Functionality
  As a system administrator
  I want to export and import data
  So that I can backup, migrate, and share meeting data

  Background:
    Given I am logged in as an administrator
    And I have appropriate export/import permissions

  @smoke @export-meeting
  Scenario: Export complete meeting data
    Given I am in a meeting with substantial data
    When I navigate to "Meeting settings"
    And I click "Export meeting"
    And I select export options:
      | Option              | Value    |
      | Include media files | Yes      |
      | Include history     | Yes      |
      | Include chat        | No       |
      | Format              | JSON     |
    And I click "Start export"
    Then export should begin with progress indicator
    And I should receive "meeting-export-2024-01-25.json"
    And the file should contain all selected data

  @import-meeting
  Scenario: Import meeting from backup
    Given I have a meeting export file
    When I go to "Create meeting"
    And I select "Import from file"
    And I upload "meeting-backup.json"
    Then I should see import preview:
      | Data Type      | Count |
      | Agenda items   | 15    |
      | Motions        | 23    |
      | Participants   | 150   |
      | Files          | 45    |
    When I click "Import"
    Then the meeting should be recreated
    And all data should be properly linked

  @selective-export
  Scenario: Export specific data types
    When I choose "Selective export"
    And I select only:
      | Data Type    |
      | Motions      |
      | Vote results |
    And I set date range "2024-01-01 to 2024-01-31"
    And I export as "CSV"
    Then only selected data should be exported
    And CSV should have proper column headers
    And data should be filterable in Excel

  @user-export
  Scenario: Export user data for GDPR
    Given a user requests their data
    When I go to user management
    And I select "John Doe"
    And I click "Export user data"
    Then I should export:
      | Personal information     |
      | Meeting participations   |
      | Motions created         |
      | Votes cast (if public)  |
      | Chat messages           |
      | Files uploaded          |
    And the export should be in machine-readable format

  @template-export
  Scenario: Export meeting as template
    Given I have a well-structured meeting
    When I export as template
    And I choose template options:
      | Include              | Exclude           |
      | Agenda structure     | Specific motions  |
      | Settings            | Participants      |
      | Voting types        | Vote results      |
      | File structure      | Actual files      |
    Then a reusable template should be created
    And sensitive data should be stripped

  @bulk-import-users
  Scenario: Import users from spreadsheet
    Given I have a CSV file with user data
    When I go to "Import users"
    And I upload "new-users.csv"
    Then I see column mapping interface:
      | CSV Column    | Maps to      |
      | First         | First name   |
      | Last          | Last name    |
      | Email         | Email        |
      | Department    | Custom field |
    When I configure import rules:
      | Rule                  | Action         |
      | Duplicate emails      | Skip           |
      | Missing required      | Create anyway  |
      | Invalid data          | Log and skip   |
    And I start import
    Then I should see import progress
    And receive detailed import report

  @motion-import
  Scenario: Import motions from document
    Given I have a Word document with motions
    When I use "Motion import wizard"
    And I upload "motions-draft.docx"
    Then the system should parse:
      | Motion titles          |
      | Motion text           |
      | Submitters            |
      | Reasoning             |
    And show preview of detected motions
    When I confirm import
    Then motions should be created correctly

  @conflict-resolution
  Scenario: Handle import conflicts
    Given I import data with conflicts
    When conflicts are detected:
      | Type                | Count |
      | Duplicate users     | 5     |
      | ID collisions      | 12    |
      | Missing references | 8     |
    Then I should see conflict resolution:
      | Option                    |
      | Keep existing            |
      | Overwrite with imported  |
      | Merge data               |
      | Create new with suffix   |
    And be able to resolve individually or bulk

  @incremental-sync
  Scenario: Incremental data synchronization
    Given I have a previously exported meeting
    When I export with "Changes since last export"
    Then only modified data should be included:
      | New items              |
      | Updated items          |
      | Deleted item references|
    And export should include sync metadata

  @cross-system-import
  Scenario: Import from other systems
    When I select "Import from external"
    Then I should see supported formats:
      | System          | Format    |
      | OpenSlides 3.x  | JSON      |
      | Generic CSV     | CSV       |
      | iCalendar       | ICS       |
      | MS Excel        | XLSX      |
    When I import from legacy system
    Then data should be transformed correctly

  @scheduled-export
  Scenario: Configure automatic exports
    When I set up scheduled exports:
      | Schedule    | Daily at 2 AM       |
      | Retention   | Keep last 30 days   |
      | Destination | SFTP server         |
      | Format      | Encrypted JSON      |
      | Notify      | admin@example.com   |
    Then exports should run automatically
    And old exports should be cleaned up
    And failures should trigger alerts

  @export-permissions
  Scenario: Role-based export restrictions
    Given I have limited export permissions
    When I try to export
    Then I should only see allowed options:
      | Allowed              | Blocked           |
      | Public agenda        | Vote details      |
      | Own submissions      | All users         |
      | Public documents     | Private files     |
    And exported data should be filtered

  @data-anonymization
  Scenario: Export with anonymization
    When I export for public release
    And I enable anonymization:
      | Anonymize           |
      | Speaker names       |
      | Vote details        |
      | Personal comments   |
    Then exported data should have:
      | Real names replaced with IDs  |
      | Emails removed               |
      | Votes aggregated only        |

  @import-validation
  Scenario: Validate import data integrity
    Given I upload an import file
    When validation runs
    Then I should see validation results:
      | Check                  | Status |
      | File integrity         | Pass   |
      | Schema validation      | Pass   |
      | Reference integrity    | Fail   |
      | Data completeness      | Warn   |
    And detailed error messages
    And option to fix and retry

  @rollback-import
  Scenario: Rollback failed import
    Given an import partially fails
    When I see "Import failed at 60%"
    Then I should have options:
      | Rollback all changes      |
      | Keep successful imports   |
      | View detailed error log   |
      | Export rollback state     |
    When I choose rollback
    Then system should restore previous state