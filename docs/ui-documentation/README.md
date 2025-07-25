# OpenSlides UI Documentation

## Overview
This comprehensive documentation covers the entire OpenSlides user interface, providing detailed information about every page, modal, view, and interaction within the system. The documentation has been systematically created through actual UI exploration using Playwright automation and manual analysis.

## Documentation Structure

### Individual Page Documentation

#### Organization-Level Pages
- **[01-dashboard.md](pages/01-dashboard.md)** - Main organization dashboard and navigation
- **[02-meetings.md](pages/02-meetings.md)** - Organization-wide meeting management
- **[03-committees.md](pages/03-committees.md)** - Committee structure and membership management
- **[04-accounts.md](pages/04-accounts.md)** - Organization user account management

#### Meeting-Level Pages
- **[05-meeting-home.md](pages/meeting/05-meeting-home.md)** - Meeting home page and calendar
- **[06-agenda.md](pages/meeting/06-agenda.md)** - Meeting agenda management with speakers
- **[07-motions.md](pages/meeting/07-motions.md)** - Motion workflow and amendment system
- **[08-participants.md](pages/meeting/08-participants.md)** - Meeting participant presence and management

### Comprehensive Documentation (Legacy)
These files contain the original comprehensive documentation that has been split into individual pages:

- **[19-meeting-settings-detailed.md](19-meeting-settings-detailed.md)** - Complete meeting settings configuration
- **[20-projector-system-detailed.md](20-projector-system-detailed.md)** - Multi-screen projection system
- **[21-file-management-modals.md](21-file-management-modals.md)** - File system and modal patterns
- **[22-motion-workflows-detailed.md](22-motion-workflows-detailed.md)** - Motion states and workflows
- **[23-participant-management-detailed.md](23-participant-management-detailed.md)** - Participant administration
- **[24-agenda-item-detailed-management.md](24-agenda-item-detailed-management.md)** - Agenda item management
- **[25-organization-level-settings-configuration.md](25-organization-level-settings-configuration.md)** - Organization administration

### Backend Integration
- **[backend-mapping.md](backend-mapping.md)** - Complete mapping of frontend actions to backend services

## Key Features Documented

### Page-Level Features
1. **Navigation Systems** - Organization and meeting-level navigation
2. **Data Management** - CRUD operations for all major entities
3. **Real-time Updates** - WebSocket-based live updates
4. **Permission Systems** - Role-based access control
5. **Workflow Management** - Complex state transitions
6. **File Handling** - Upload, organization, and projection
7. **Search and Filtering** - Advanced search capabilities
8. **Bulk Operations** - Multi-item management features

### Modal and Dialog Documentation
1. **Creation Dialogs** - For meetings, motions, participants, etc.
2. **Edit Interfaces** - Comprehensive editing capabilities
3. **Workflow Dialogs** - State transition interfaces
4. **Import/Export Dialogs** - Data transfer interfaces
5. **Settings Modals** - Configuration interfaces
6. **Confirmation Dialogs** - Action verification prompts

### Interactive Elements
1. **Projection Controls** - Real-time display management
2. **Speaker Management** - Queue and timing systems
3. **Presence Tracking** - Live attendance monitoring
4. **Voting Systems** - Poll creation and management
5. **Amendment Creation** - Motion modification workflows
6. **Group Management** - Permission assignment interfaces

## Technical Implementation

### Frontend Actions Mapped
Every documented user action has been mapped to its corresponding:
- **Backend API endpoint**
- **Service implementation**
- **Data flow**
- **Real-time updates**
- **Permission requirements**

### Backend Services Integration
The documentation covers integration with all OpenSlides services:

1. **openslides-backend** (Python Flask)
   - Actions for data modification
   - Presenters for data retrieval
   - Workflow management
   - Permission validation

2. **openslides-auth-service** (Node.js/TypeScript)
   - User authentication
   - Session management
   - Permission validation
   - JWT token handling

3. **openslides-autoupdate-service** (Go)
   - Real-time WebSocket updates
   - Live data synchronization
   - Event broadcasting
   - Client state management

4. **openslides-datastore-service** (Python)
   - Data persistence
   - Transaction management
   - Event sourcing
   - Migration handling

5. **openslides-media-service** (Python)
   - File upload and storage
   - Media processing
   - Access control
   - Thumbnail generation

6. **openslides-vote-service** (Go)
   - Electronic voting
   - Ballot management
   - Vote counting
   - Result publishing

7. **openslides-search-service** (Go with Bleve)
   - Full-text search
   - Search indexing
   - Faceted search
   - Permission-filtered results

### Data Models
Each page documentation includes:
- **TypeScript interfaces** for data structures
- **API request/response formats**
- **WebSocket event structures**
- **Permission model definitions**

## Exploration Methodology

### Playwright Automation
The documentation was created using systematic Playwright exploration:

1. **Automated Screenshots** - Visual documentation of every page
2. **Element Discovery** - Identification of interactive elements
3. **Action Mapping** - Recording of user interaction flows
4. **Data Structure Analysis** - Understanding of data relationships

### Manual Analysis
Supplemented with manual analysis of:
- **Source code review** - Understanding implementation details
- **API documentation** - Backend service integration
- **Configuration files** - System setup and options
- **Test files** - Understanding expected behaviors

## E2E Testing Support

### Test Selectors
Every documented page includes:
- **CSS selectors** for automated testing
- **Data-cy attributes** for Cypress testing
- **Accessibility selectors** for screen reader testing
- **Component identifiers** for React/Angular testing

### User Journey Mapping
The documentation supports E2E testing by providing:
- **Complete user workflows** from start to finish
- **Expected outcomes** for each action
- **Error scenarios** and handling
- **Permission-based variations** of interfaces

## Accessibility Documentation

### Screen Reader Support
- **ARIA labeling** patterns documented
- **Keyboard navigation** flows specified
- **Focus management** strategies outlined
- **Alternative text** requirements listed

### Keyboard Shortcuts
- **Global shortcuts** for navigation
- **Page-specific shortcuts** for efficiency
- **Accessibility shortcuts** for screen readers
- **Custom shortcuts** for power users

## Development Usage

### For Frontend Developers
- **Component structure** understanding
- **State management** patterns
- **API integration** examples
- **Real-time update** handling

### For Backend Developers
- **API endpoint** requirements
- **Permission validation** needs
- **Data structure** specifications
- **Real-time event** broadcasting

### For QA Engineers
- **Test case** generation from documentation
- **User story** validation
- **Regression testing** scenarios
- **Cross-browser** compatibility requirements

### for UX/UI Designers
- **User interaction** patterns
- **Information architecture** understanding
- **Workflow optimization** opportunities
- **Accessibility improvement** areas

## Maintenance and Updates

### Keeping Documentation Current
1. **Automated Screenshots** - Regular UI capture updates
2. **API Change Tracking** - Backend service evolution
3. **Feature Addition Documentation** - New functionality coverage
4. **User Feedback Integration** - Real-world usage insights

### Version Compatibility
- Documentation is current for **OpenSlides 4.2.18-dev**
- **Change tracking** for version differences
- **Migration notes** for major updates
- **Backward compatibility** information

## Contributing to Documentation

### Standards
- **Consistent formatting** using established patterns
- **Complete action mapping** to backend services
- **Visual documentation** with ASCII layouts
- **Technical accuracy** verified through testing

### Review Process
- **Technical review** by development team
- **User experience review** by product team
- **Accessibility review** by accessibility experts
- **Documentation review** by technical writers

This documentation serves as the comprehensive reference for understanding, developing, testing, and maintaining the OpenSlides user interface across all its complexity and functionality.