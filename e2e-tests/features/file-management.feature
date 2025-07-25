@files @media @meeting
Feature: File and Media Management
  As a meeting participant
  I want to upload and manage files
  So that documents can be shared and accessed during meetings

  Background:
    Given I am logged in as "admin"
    And I am in a meeting
    And I navigate to the files section

  @smoke
  Scenario: Upload a single file
    When I click the "Upload" button
    And I select a PDF file "meeting-agenda.pdf"
    And I add the description "Meeting agenda for January"
    And I click "Upload"
    Then I should see a progress indicator
    And the file should appear in the file list
    And the file should be accessible for download

  Scenario: Upload multiple files
    When I click the "Upload" button
    And I select multiple files:
      | Filename          | Type |
      | agenda.pdf        | PDF  |
      | budget.xlsx       | XLSX |
      | presentation.pptx | PPTX |
    And I click "Upload all"
    Then all files should be uploaded
    And I should see them in the file list

  Scenario: Organize files in folders
    Given I have uploaded several files
    When I create a new folder "Financial Reports"
    And I select files related to finance
    And I move them to "Financial Reports" folder
    Then the files should be organized in the folder
    And I should be able to navigate the folder structure

  Scenario: File permissions and visibility
    Given a file "confidential.pdf" exists
    When I edit the file properties
    And I set visibility to "Committee members only"
    And I save the changes
    Then only committee members should see the file
    And other users should not have access

  Scenario: Link files to agenda items
    Given an agenda item "Budget Discussion" exists
    And a file "budget-2024.xlsx" exists
    When I edit the agenda item
    And I attach the file "budget-2024.xlsx"
    Then the file should be linked to the agenda item
    And participants should see the file when viewing the agenda item

  Scenario: File versioning
    Given a file "contract-v1.pdf" exists
    When I upload a new version "contract-v2.pdf"
    Then both versions should be available
    And the latest version should be marked as current
    And I should be able to access version history

  Scenario: Preview files
    Given various file types are uploaded
    When I click on a PDF file
    Then I should see a preview of the file
    When I click on an image file
    Then I should see the image in a viewer
    When I click on a text document
    Then I should see the content preview

  Scenario: Search files
    Given multiple files exist with different names and tags
    When I search for "budget"
    Then I should see all files containing "budget" in name or description
    When I filter by file type "PDF"
    Then I should only see PDF files

  Scenario: File tags and metadata
    Given a file "report.pdf" exists
    When I edit the file
    And I add tags:
      | Tag      |
      | urgent   |
      | finance  |
      | 2024     |
    And I add custom metadata:
      | Field    | Value          |
      | Author   | John Smith     |
      | Department | Finance      |
    Then the tags and metadata should be saved
    And I should be able to filter by these tags

  @projector
  Scenario: Project file on screen
    Given a presentation file exists
    And a projector is available
    When I select the file
    And I click "Project"
    Then the file should be displayed on the projector
    And I should have controls for navigation

  Scenario: Download multiple files
    When I select multiple files
    And I click "Download selected"
    Then the files should be downloaded as a ZIP archive
    And the archive should maintain folder structure

  @storage
  Scenario: Storage quota management
    Given I am an administrator
    When I navigate to storage settings
    Then I should see:
      | Information        |
      | Total storage used |
      | Storage limit      |
      | File count         |
      | Largest files      |
    And I should be able to set storage quotas per committee

  @permissions
  Scenario: Restricted file deletion
    Given I am a regular user
    And I have uploaded a file
    When another user tries to delete my file
    Then they should see an error message
    But I should be able to delete my own file
    And administrators should be able to delete any file