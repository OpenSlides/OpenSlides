@realtime @websocket
Feature: Real-time Updates
  As a meeting participant
  I want to see real-time updates
  So that I stay synchronized with other users

  Background:
    Given I am logged in as "user1" in browser 1
    And I am logged in as "user2" in browser 2
    And both users are in the meeting "Live Meeting"

  @critical
  Scenario: Real-time agenda updates
    Given both users are on the agenda page
    When user1 creates an agenda item "New Topic"
    Then user2 should see "New Topic" appear immediately
    When user1 projects "New Topic"
    Then user2 should see "New Topic" marked as projected

  Scenario: Live speaker queue updates
    Given both users are viewing speaker list for "Discussion Item"
    When user1 adds themselves to the speaker list
    Then user2 should see user1 in the speaker queue
    When user1 starts speaking
    Then user2 should see user1 as current speaker
    And user2 should see the speaking timer running

  @presence
  Scenario: Live presence updates
    Given both users are on the participants page
    When user1 marks "John Doe" as present
    Then user2 should see "John Doe" marked as present
    And both users should see the same present count

  Scenario: Motion state changes broadcast
    Given both users are on the motions page
    And a motion "Test Motion" exists
    When user1 changes the motion state to "Submitted"
    Then user2 should see the state change immediately
    And the motion should show "Submitted" for both users

  @voting
  Scenario: Live voting updates
    Given a poll is running for motion "Vote Motion"
    And both users are viewing the motion
    When user1 votes "Yes"
    Then the vote count should update for both users
    When the poll is stopped
    Then both users should see the final results immediately

  @chat
  Scenario: Real-time chat messages
    Given both users are on the chat page
    When user1 sends message "Hello everyone"
    Then user2 should see the message immediately
    And the message should show user1 as sender
    When user2 replies "Hello back"
    Then user1 should see the reply immediately

  Scenario: Projector content synchronization
    Given both users are viewing the projector
    When user1 projects a motion "Important Motion"
    Then user2 should see "Important Motion" on projector
    When user1 navigates to next slide
    Then user2 should see the slide change

  @notifications
  Scenario: System notifications
    Given user2 has notification preferences enabled
    When user1 mentions user2 in a motion comment
    Then user2 should receive a notification
    And the notification should link to the motion