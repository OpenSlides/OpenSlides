# OpenSlides UI Exploration Summary

## Completed Documentation

### 1. Main UI Documentation (`/docs/UI_DOCUMENTATION.md`)
- Overview of the entire OpenSlides UI
- Login process and credentials
- Dashboard/Calendar view
- Navigation structure (organization and meeting levels)
- UI components and patterns
- Technical architecture overview

### 2. Individual Page Documentation

#### Agenda Page (`/docs/pages/agenda.md`)
- Complete documentation of agenda management
- List view with filtering and sorting
- Create new topic form with all fields
- Context menu actions for agenda items
- Visibility settings (public/internal/hidden)
- Integration with other features
- Technical implementation details

#### Motions Page (`/docs/pages/motions.md`)
- Comprehensive motion management documentation
- Motion lifecycle and workflow states
- Create motion form with rich text editors
- Submitters, supporters, and metadata
- Amendments and motion blocks
- Voting integration
- Export options
- Technical API endpoints and subscriptions

## Key Findings

### Authentication
- Login URL: `http://localhost:8080/login`
- Credentials: `admin` / `admin` (not `superadmin`)
- Organization-based multi-tenancy

### UI Framework
- Angular 19 with Material Design
- TipTap rich text editor for content
- Real-time updates via WebSocket (autoupdate service)
- Responsive design with mobile support

### Common UI Patterns

#### List Views
- Item count display ("X of Y")
- Sort, filter, and search controls
- Context menus on each item
- Floating action button for creation

#### Forms
- Required fields marked with asterisk
- Rich text editors for content
- Multi-select dropdowns for relationships
- Real-time validation
- Save/Cancel actions

#### Navigation
- Hamburger menu for main navigation
- Breadcrumb navigation
- Tab-based sub-navigation where applicable

### Data Attributes for Testing
- Consistent `data-cy` attributes (though not visible in current setup)
- ARIA labels on all form inputs
- Semantic HTML structure
- Material Design component classes

## Remaining Areas to Document

### High Priority
1. **Participants/User Management**
   - User list and roles
   - Permissions and groups
   - Presence tracking
   - Import/export

2. **Voting and Polls**
   - Poll creation
   - Voting interfaces
   - Results display
   - Vote verification

3. **Elections/Assignments**
   - Candidate management
   - Ballot configuration
   - Results calculation

### Medium Priority
4. **Files/Media Management**
   - Upload interface
   - File organization
   - Access controls

5. **Projector Control**
   - Projection queue
   - Layout management
   - Live view

6. **Settings**
   - Meeting configuration
   - Organization settings
   - User preferences

## Technical Challenges Encountered

### Development Environment
- Proxy service not running, requiring nginx workaround
- Some API endpoints returning 404 (presenter service)
- WebSocket connections failing (not affecting core functionality)
- Periodic network interruptions causing offline mode

### Workarounds Applied
1. Created nginx proxy on port 8080 to access services
2. Routed API calls through nginx configuration
3. Dismissed HTTPS warnings for development
4. Continued documentation despite connectivity issues

## Recommendations

### For Testing
1. Use the documented selectors and ARIA labels
2. Account for real-time updates in test timing
3. Handle offline mode gracefully
4. Test with different permission levels

### For Development
1. Ensure all services are properly configured
2. Set up proper SSL certificates for production
3. Monitor WebSocket connection stability
4. Implement proper error handling for offline scenarios

## Next Steps
1. Complete documentation for remaining pages when system is stable
2. Create E2E test scenarios based on documented workflows
3. Document any custom configurations or deployments
4. Add screenshots to the documentation folders