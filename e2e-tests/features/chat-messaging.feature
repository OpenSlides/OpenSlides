@chat @messaging @realtime
Feature: Chat and Messaging System
  As a meeting participant
  I want to use the chat system
  So that I can communicate with other participants during the meeting

  Background:
    Given I am logged in as a meeting participant
    And I am in an active meeting
    And the chat feature is enabled

  @smoke
  Scenario: Access and send a chat message
    When I click on the "Chat" menu item
    Then the chat interface should open
    When I type "Hello everyone!" in the message field
    And I press Enter or click Send
    Then my message should appear in the chat
    And it should show my name and timestamp
    And other participants should see my message immediately

  @private-messages
  Scenario: Send a private message
    Given another participant "John Doe" is online
    When I click on "John Doe" in the participant list
    And I select "Send private message"
    And I type "Can we discuss the budget item?"
    And I send the message
    Then a private chat window should open with John
    And the message should be marked as private
    And only John and I should see this conversation

  @chat-groups
  Scenario: Create a group chat
    When I click "Create group chat"
    And I name it "Finance Committee Discussion"
    And I add participants:
      | Name          |
      | Sarah Miller  |
      | Tom Wilson    |
      | Lisa Brown    |
    And I click "Create"
    Then the group chat should be created
    And all selected participants should be notified
    When I send a message to the group
    Then all group members should receive it

  @mentions
  Scenario: Mention participants in chat
    When I type "@Sarah" in the chat
    Then I should see autocomplete suggestions
    When I select "Sarah Miller"
    And I complete the message "@Sarah Miller please check motion 5"
    And I send it
    Then Sarah should receive a notification
    And the mention should be highlighted
    And Sarah should see it in her mentions tab

  @chat-moderation
  Scenario: Moderate chat messages
    Given I have chat moderation permissions
    When I see an inappropriate message
    And I click the message options menu
    And I select "Delete message"
    And I provide reason "Violation of chat guidelines"
    Then the message should be removed
    And the author should be notified
    And an audit log entry should be created

  @file-sharing
  Scenario: Share files in chat
    When I click the attachment button
    And I select a PDF file "meeting-notes.pdf"
    And I add message "Here are my notes"
    And I send
    Then the file should be uploaded
    And a file preview should appear in chat
    And participants should be able to download it

  @chat-search
  Scenario: Search chat history
    Given the chat has many messages
    When I click the search icon
    And I search for "budget"
    Then I should see all messages containing "budget"
    And results should be highlighted
    When I click a search result
    Then the chat should scroll to that message

  @emoji-reactions
  Scenario: React to messages with emojis
    Given a message "Great idea!" exists
    When I hover over the message
    And I click the reaction button
    And I select the "👍" emoji
    Then the reaction should be added
    And a reaction count should show
    When others add the same reaction
    Then the count should increment

  @chat-notifications
  Scenario: Configure chat notifications
    When I click chat settings
    And I configure notifications:
      | Setting              | Value    |
      | All messages         | Off      |
      | Mentions            | On       |
      | Private messages    | On       |
      | Keywords            | budget   |
    Then I should only receive selected notifications
    And desktop notifications should respect settings

  @typing-indicators
  Scenario: See when others are typing
    Given I'm in a chat conversation
    When another participant starts typing
    Then I should see "John is typing..."
    When they stop typing without sending
    Then the indicator should disappear after 3 seconds

  @chat-export
  Scenario: Export chat transcript
    Given I have permission to export chat
    When I click "Export chat"
    And I select date range and format:
      | Start date | 2024-01-01 |
      | End date   | 2024-01-31 |
      | Format     | PDF        |
    Then a formatted transcript should be generated
    And it should include all messages and metadata

  @message-threading
  Scenario: Reply to messages in threads
    Given a message "Should we vote now?" exists
    When I click "Reply in thread"
    And I type "I think we need more discussion"
    And I send
    Then a thread should be created
    And the thread count should show on original message
    When others reply to the thread
    Then all thread messages should be grouped

  @chat-polls
  Scenario: Create quick polls in chat
    When I type "/poll Should we take a break?"
    And I add options:
      | Option |
      | Yes    |
      | No     |
      | In 10 minutes |
    And I send
    Then an interactive poll should appear
    And participants should be able to vote inline
    And results should update in real-time

  @offline-messages
  Scenario: Handle offline message queue
    Given I lose internet connection
    When I send messages while offline
    Then messages should be queued locally
    And show pending status
    When connection is restored
    Then queued messages should be sent
    And timestamps should reflect actual send time

  @chat-history
  Scenario: Load historical messages
    Given I join a meeting late
    When I open the chat
    Then recent message history should load
    When I scroll up
    Then older messages should load progressively
    And I should see "Beginning of chat" when complete