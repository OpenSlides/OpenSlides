@realtime @websocket
Feature: Real-time Updates and Synchronization
  As a meeting participant
  I want to see real-time updates
  So that I stay synchronized with meeting activities

  Background:
    Given I am logged in as a participant
    And I am in an active meeting
    And WebSocket connection is established

  @smoke
  Scenario: Real-time agenda updates
    Given I am viewing the agenda
    When another user adds a new agenda item "Emergency Motion"
    Then I should see the new item appear without refreshing
    And the item count should update automatically

  Scenario: Live motion status changes
    Given I am viewing a motion "Test Motion"
    When an administrator changes the motion state to "accepted"
    Then I should immediately see the state change
    And the motion should show in the new state color

  Scenario: Concurrent editing notification
    Given I am editing a motion
    When another user starts editing the same motion
    Then I should see a notification "Another user is editing this motion"
    And I should see who is editing

  Scenario: Live voting updates
    Given a vote is in progress
    And I have permission to see live results
    When other participants cast their votes
    Then I should see the vote count update in real-time
    And the participation percentage should increase

  Scenario: Speaker list updates
    Given I am viewing the current speaker list
    When the chair adds me to the speaker list
    Then I should see my name appear immediately
    And I should see my position in the queue
    When my turn comes
    Then I should receive a notification

  Scenario: Presence tracking
    Given I am viewing the participant list
    When participants join or leave the meeting
    Then I should see their presence status update
    And the attendance count should reflect changes

  Scenario: Connection status indicator
    Given I am in a meeting
    Then I should see a connection status indicator
    When the WebSocket connection is lost
    Then I should see "Connection lost" warning
    And when connection is restored
    Then I should see "Connected" status
    And any missed updates should be synchronized

  Scenario: Push notifications
    Given I have enabled push notifications
    And I am not actively viewing the meeting
    When I am added to the speaker list
    Then I should receive a push notification
    And clicking it should take me to the speaker list

  @performance
  Scenario: Handle high-frequency updates
    Given 100 participants are in the meeting
    When multiple updates occur simultaneously:
      | Update Type        | Count |
      | Vote submissions   | 50    |
      | Motion edits       | 5     |
      | Speaker requests   | 10    |
    Then all updates should be processed
    And the UI should remain responsive
    And no updates should be lost

  Scenario: Offline queue synchronization
    Given I have performed actions while offline:
      | Action              |
      | Created a motion    |
      | Uploaded a file     |
      | Requested to speak  |
    When my connection is restored
    Then all queued actions should be synchronized
    And I should see confirmation of processed actions