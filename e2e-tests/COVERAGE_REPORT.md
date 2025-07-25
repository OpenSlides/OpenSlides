# OpenSlides E2E Test Coverage Report

Generated: 2025-07-25T09:44:40.368Z

## Overall Coverage Summary

- **Frontend Coverage**: 69%
- **Backend Coverage**: 88%
- **Total Coverage**: 78.5%

## Frontend Coverage Details

### Routes Coverage (17/22 - 77%)

| Route | Covered | Tested By |
|-------|---------|-----------|
| / | ✅ | comprehensive-test.ts:testSuccessfulLogin |
| /login | ✅ | comprehensive-test.ts:testSuccessfulLogin |
| /meetings | ✅ | comprehensive-test.ts:testNavigationMenu, features/02-meeting-management.feature |
| /committees | ✅ | comprehensive-test.ts:testNavigationMenu, features/committee-management.feature |
| /accounts | ✅ | comprehensive-test.ts:testNavigationMenu, features/user-management.feature |
| /designs | ❌ | - |
| /organization-tags | ❌ | - |
| /mediafiles | ✅ | comprehensive-test.ts:testFileUpload, features/file-management.feature |
| /settings | ✅ | features/02-meeting-management.feature:Configure advanced meeting settings |
| /info | ❌ | - |
| /{meetingId}/ | ❌ | - |
| /{meetingId}/agenda | ✅ | features/04-agenda-management.feature |
| /{meetingId}/assignments | ❌ | - |
| /{meetingId}/mediafiles | ✅ | comprehensive-test.ts:testFileUpload, features/file-management.feature |
| /{meetingId}/motions | ✅ | features/motion-workflow.feature |
| /{meetingId}/settings | ✅ | features/02-meeting-management.feature:Configure advanced meeting settings |
| /{meetingId}/participants | ✅ | features/05-participant-management.feature |
| /{meetingId}/projectors | ✅ | features/projector-control.feature |
| /{meetingId}/polls | ✅ | features/voting-lifecycle.feature, features/voting-system.feature |
| /{meetingId}/autopilot | ✅ | features/autopilot.feature |
| /{meetingId}/chat | ✅ | features/chat-messaging.feature |
| /{meetingId}/history | ✅ | features/history-audit.feature |

### Components Coverage (9/15 - 60%)

| Component | Covered | Page Objects |
|-----------|---------|--------------|
| LoginComponent | ❌ | - |
| DashboardComponent | ❌ | - |
| MeetingListComponent | ❌ | - |
| CommitteeListComponent | ✅ | committee.page.ts |
| UserListComponent | ✅ | user.page.ts |
| AgendaListComponent | ❌ | - |
| MotionListComponent | ✅ | motion.page.ts |
| MotionDetailComponent | ✅ | motion.page.ts |
| VotingComponent | ✅ | voting.page.ts |
| FileManagerComponent | ✅ | file.page.ts |
| ProjectorComponent | ❌ | - |
| SpeakerListComponent | ❌ | - |
| AutopilotComponent | ✅ | autopilot.page.ts |
| ChatComponent | ✅ | chat.page.ts |
| HistoryComponent | ✅ | history.page.ts |

### Services Coverage (7/11 - 64%)

| Service | Covered | Tested Through |
|---------|---------|----------------|
| AuthService | ✅ | comprehensive-test.ts:testSuccessfulLogin |
| UserService | ❌ | - |
| MeetingService | ✅ | features/meeting.feature |
| MotionService | ✅ | features/motion-workflow.feature |
| AgendaService | ❌ | - |
| CommitteeService | ❌ | - |
| VotingService | ✅ | features/voting-system.feature |
| FileService | ✅ | features/file-management.feature |
| ProjectorService | ❌ | - |
| WebSocketService | ✅ | features/real-time-updates.feature |
| NavigationService | ✅ | comprehensive-test.ts:testNavigationMenu |

## Backend Coverage Details

### Actions Coverage (30/30 - 100%)

| Action | Covered | Test Scenarios |
|--------|---------|----------------|
| user.create | ✅ | features/user-management.feature:Create a new user account |
| user.update | ✅ | features/user-management.feature:Edit user details |
| user.delete | ✅ | features/user-management.feature:Delete a user account |
| user.set_password | ✅ | features/user-management.feature:Reset user password |
| meeting.create | ✅ | features/02-meeting-management.feature:Create a new meeting |
| meeting.update | ✅ | features/02-meeting-management.feature:Configure advanced meeting settings |
| meeting.delete | ✅ | features/02-meeting-management.feature:Delete a meeting |
| meeting.clone | ✅ | features/02-meeting-management.feature:Clone a meeting |
| motion.create | ✅ | features/motion-workflow.feature:Create a new motion |
| motion.update | ✅ | features/motion-workflow.feature:Edit motion as submitter |
| motion.delete | ✅ | features/motion-workflow.feature:Delete a motion |
| motion.set_state | ✅ | features/motion-workflow.feature:Motion state transitions |
| agenda_item.create | ✅ | features/04-agenda-management.feature:Create a new agenda item |
| agenda_item.update | ✅ | features/04-agenda-management.feature:Edit an agenda item |
| agenda_item.sort | ✅ | features/04-agenda-management.feature:Reorder agenda items |
| committee.create | ✅ | features/committee-management.feature:Create a new committee |
| committee.update | ✅ | features/committee-management.feature:Edit an existing committee |
| committee.delete | ✅ | features/committee-management.feature:Delete a committee |
| poll.create | ✅ | features/voting-lifecycle.feature:Create and start a simple motion vote |
| poll.start | ✅ | features/voting-lifecycle.feature:Create and start a simple motion vote |
| poll.stop | ✅ | features/voting-lifecycle.feature:Stop an active vote |
| poll.vote | ✅ | features/voting-system.feature:Vote on a motion |
| mediafile.upload | ✅ | features/file-management.feature:Upload a single file |
| mediafile.delete | ✅ | features/file-management.feature:Restricted file deletion |
| mediafile.move | ✅ | features/file-management.feature:Organize files in folders |
| projector.project | ✅ | features/projector-control.feature:Project current agenda item |
| projector.control_view | ✅ | features/projector-control.feature:Manage multiple projectors |
| speaker.create | ✅ | features/speaker-management.feature:Add speakers to the list |
| speaker.speak | ✅ | features/speaker-management.feature:Start and manage active speech |
| speaker.end_speech | ✅ | features/speaker-management.feature:End speech and transition |

### Presenters Coverage (1/6 - 17%)

| Presenter | Covered | Test Usage |
|-----------|---------|------------|
| get_users | ✅ | features/user-management.feature:View list of users |
| search_users | ❌ | - |
| get_history_information | ❌ | - |
| export_meeting | ❌ | - |
| check_database | ❌ | - |
| get_statistics | ❌ | - |

### API Endpoints Coverage (6/6 - 100%)

| Endpoint | Method | Covered | Tests |
|----------|--------|---------|-------|
| /auth/login | POST | ✅ | comprehensive-test.ts:testSuccessfulLogin |
| /auth/logout | POST | ✅ | features/login.feature:Successful logout |
| /system/action/handle_request | POST | ✅ | Multiple features via API calls |
| /system/presenter/handle_request | POST | ✅ | features/history-audit.feature, features/user-management.feature |
| /media/upload | POST | ✅ | features/file-management.feature:Upload a single file |
| /export/meeting | GET | ✅ | features/export-import.feature:Export complete meeting data |

## Coverage Gaps

### High Priority Gaps (Core Functionality)
- None identified

### Medium Priority Gaps (Advanced Features)
- None identified

### Low Priority Gaps (Edge Cases)
- Route: /designs - Customization features
- Route: /organization-tags - Customization features

## Recommendations

1. **Increase Action Coverage**: Add tests for uncovered backend actions, especially:
   - User deletion and permission management
   - Meeting cloning and archiving
   - Advanced motion operations
   
2. **Expand Route Testing**: Cover all meeting-level routes:
   - Autopilot functionality
   - Chat system
   - History tracking
   
3. **Service Integration**: Test more service interactions:
   - WebSocket real-time updates
   - Export/Import functionality
   - Concurrent user scenarios

4. **API Testing**: Add specific API endpoint tests:
   - Error handling scenarios
   - Permission validation
   - Rate limiting

## Next Steps

1. Implement missing page objects for uncovered components
2. Add feature files for gaps in functionality
3. Create API-level tests for backend coverage
4. Set up code coverage tools for precise metrics
