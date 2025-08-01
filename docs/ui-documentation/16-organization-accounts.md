# OpenSlides Organization Accounts Documentation

## Overview
The Organization Accounts page provides centralized user management at the organization level, allowing administrators to manage user accounts, permissions, and access across all meetings and committees within the organization.

## URL Routes
- Organization Accounts: `/organizations/:orgId/accounts`

## Page Layout
```
┌─────────────────────────────────────────────────┐
│  Accounts                          [+] [⋮]      │
├─────────────────────────────────────────────────┤
│  3 of 3    [≡ SORT] [⚲ FILTER] [🔍 Search___] │
├─────────────────────────────────────────────────┤
│  User List                                      │
│  ┌─────────────────────────────────────────────┐│
│  │ a                                     [⋮]   ││
│  │ a                              📅 1         ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ b                                     [⋮]   ││
│  │ b                              📅 1         ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ Administrator                         [⋮]   ││
│  │ admin                   👤 Superadmin      ││
│  │                              📅 1         ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Account List Interface

### Header Controls
- **Create Account Button (+)**: Add new user accounts
- **Menu Button (⋮)**: Bulk operations and system settings
- **Result Counter**: Shows current results ("3 of 3")
- **Sort Button (≡ SORT)**: Account sorting options
- **Filter Button (⚲ FILTER)**: Advanced filtering controls
- **Search Field**: Real-time account search

### Account Card Display
Each account is displayed as a card containing:
- **Display Name**: Primary name shown (e.g., "Administrator", "a", "b")
- **Username**: System username (e.g., "admin", "a", "b")
- **Role Indicator**: Special roles like "👤 Superadmin"
- **Meeting Count**: Number of meetings the user has access to (📅 1)
- **Actions Menu (⋮)**: Individual account actions

## Account Management Features

### User Types and Roles
- **Superadmin**: Full system access and administration rights
- **Organization Admin**: Organization-level management permissions
- **Committee Manager**: Committee-specific administrative access
- **Meeting Admin**: Individual meeting administration
- **Regular User**: Basic participant access
- **Guest User**: Limited, temporary access

### Account Information Display
Each account card shows:
- **Primary Information**:
  - Full name/display name
  - Username/login identifier
  - Email address (when available)
- **Role and Permissions**:
  - Organization role indicator
  - Permission level badge
  - Access scope information
- **Activity Metrics**:
  - Number of meetings with access
  - Last login timestamp
  - Account creation date
  - Account status (active, inactive, locked)

## Account Creation and Management

### Create New Account Dialog
```
┌─────────────────────────────────────────────────┐
│  Create user account                    [x]     │
├─────────────────────────────────────────────────┤
│  Username *                                     │
│  [john.doe_______________________]             │
│                                                 │
│  Display name                                   │
│  [John Doe_______________________]             │
│                                                 │
│  Email address                                  │
│  [john.doe@organization.com_______]            │
│                                                 │
│  Password *                                     │
│  [●●●●●●●●●●●●●●●●●●●●●●●●]                   │
│                                                 │
│  Confirm password *                             │
│  [●●●●●●●●●●●●●●●●●●●●●●●●]                   │
│                                                 │
│  Organization role                              │
│  [Regular user ▼]                               │
│                                                 │
│  Send welcome email                             │
│  ☑ Send account credentials via email         │
│                                                 │
│  [Cancel]                        [Create]       │
└─────────────────────────────────────────────────┘
```

### Edit Account Dialog
```
┌─────────────────────────────────────────────────┐
│  Edit user account                      [x]     │
├─────────────────────────────────────────────────┤
│  Username                                       │
│  [admin________________________]               │
│                                                 │
│  Display name                                   │
│  [Administrator_________________]               │
│                                                 │
│  Email address                                  │
│  [admin@openslides.demo__________]              │
│                                                 │
│  Organization role                              │
│  [Superadmin ▼]                                 │
│                                                 │
│  Account status                                 │
│  ● Active                                       │
│  ○ Inactive                                     │
│  ○ Locked                                       │
│                                                 │
│  Meeting access                                 │
│  ☑ OpenSlides Demo                             │
│  ☐ Planning Committee                          │
│  ☐ Board Meeting                               │
│                                                 │
│  Last login: 24.07.2024 14:30:15               │
│  Created: 15.06.2024 09:15:42                  │
│                                                 │
│  [Reset Password] [Delete Account]              │
│                                                 │
│  [Cancel]                           [Save]      │
└─────────────────────────────────────────────────┘
```

## Account Actions and Operations

### Individual Account Actions
Available from the account card menu (⋮):
- **Edit Account**: Modify account properties
- **Reset Password**: Generate new password
- **Change Role**: Modify organization permissions
- **Meeting Access**: Manage meeting-specific permissions
- **Lock Account**: Temporarily disable access
- **Delete Account**: Permanently remove account
- **Impersonate User**: Login as user (admin only)
- **View Activity Log**: Account usage history

### Bulk Operations
Select multiple accounts for bulk actions:
- **Bulk Role Assignment**: Change roles for multiple users
- **Bulk Meeting Access**: Grant/revoke meeting access
- **Bulk Email**: Send notifications to selected users
- **Export User Data**: Download account information
- **Bulk Deactivation**: Disable multiple accounts
- **Password Reset**: Force password reset for selected users

## Advanced Account Features

### Password Management
```
┌─────────────────────────────────────────────────┐
│  Password settings                      [x]     │
├─────────────────────────────────────────────────┤
│  Password policy                                │
│  ☑ Minimum 8 characters                       │
│  ☑ Require uppercase letters                  │
│  ☑ Require lowercase letters                  │
│  ☑ Require numbers                            │
│  ☑ Require special characters                 │
│                                                 │
│  Password expiration                            │
│  ☐ Never expire                               │
│  ☑ Expire after 90 days                       │
│                                                 │
│  Failed login attempts                          │
│  Lock account after: [5] failed attempts       │
│  Unlock after: [30] minutes                    │
│                                                 │
│  [Save settings]                                │
└─────────────────────────────────────────────────┘
```

### Role and Permission Management
- **Organization Roles**: System-wide permission sets
- **Committee Permissions**: Committee-specific access rights
- **Meeting Roles**: Individual meeting permissions
- **Custom Permissions**: Granular permission control
- **Permission Templates**: Standardized role definitions

### Account Import/Export
- **CSV Import**: Bulk account creation from spreadsheet
- **LDAP Integration**: Synchronize with directory services
- **SSO Integration**: Single sign-on configuration
- **Data Export**: Download account data for compliance
- **Account Templates**: Predefined account configurations

## Filtering and Search

### Sort Options
```
┌─────────────────────────────────────────────────┐
│  Sort accounts by                       [x]     │
├─────────────────────────────────────────────────┤
│  ○ Display name (A-Z)                           │
│  ● Display name (Z-A)                           │
│  ○ Username (A-Z)                               │
│  ○ Username (Z-A)                               │
│  ○ Last login (most recent)                     │
│  ○ Last login (oldest)                          │
│  ○ Creation date (newest)                       │
│  ○ Creation date (oldest)                       │
│  ○ Role level                                   │
│                                                 │
│  [Apply]                          [Cancel]      │
└─────────────────────────────────────────────────┘
```

### Filter Options
```
┌─────────────────────────────────────────────────┐
│  Filter accounts                        [x]     │
├─────────────────────────────────────────────────┤
│  Role:                                          │
│  ☐ Superadmin                                   │
│  ☐ Organization Admin                           │
│  ☐ Committee Manager                            │
│  ☐ Meeting Admin                                │
│  ☑ Regular User                                │
│                                                 │
│  Status:                                        │
│  ☑ Active                                      │
│  ☐ Inactive                                     │
│  ☐ Locked                                       │
│                                                 │
│  Meeting access:                                │
│  [Select meeting ▼]                             │
│                                                 │
│  Last login:                                    │
│  From: [______] To: [______]                    │
│                                                 │
│  [Clear all]                    [Apply filters] │
└─────────────────────────────────────────────────┘
```

## Security and Compliance

### Account Security
- **Strong Password Policies**: Configurable password requirements
- **Two-Factor Authentication**: Optional 2FA setup
- **Login Monitoring**: Track login attempts and patterns
- **Session Management**: Control active sessions
- **Account Lockout**: Automatic protection against brute force

### Audit and Compliance
- **Activity Logging**: Track all account actions
- **Access Reports**: Generate compliance reports
- **Data Retention**: Configurable data retention policies
- **Privacy Controls**: GDPR-compliant data handling
- **Export Controls**: Secure data export capabilities

### Data Protection
- **Encryption**: Secure password storage
- **Data Minimization**: Collect only necessary information
- **Right to Deletion**: Account removal capabilities
- **Data Portability**: Export user data
- **Consent Management**: Privacy preference handling

## Integration Features

### External Authentication
- **LDAP/Active Directory**: Enterprise directory integration
- **SAML SSO**: Single sign-on with identity providers
- **OAuth Integration**: Third-party authentication
- **API Access**: Programmatic account management
- **Webhook Support**: External system notifications

### Meeting Integration
- **Automatic Enrollment**: Add users to meetings
- **Role Synchronization**: Maintain consistent permissions
- **Cross-meeting Access**: Unified user experience
- **Permission Inheritance**: Automatic permission assignment

## Data Models

### User Account Model
```typescript
{
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active: boolean;
  is_physical_person: boolean;
  password?: string;
  last_login?: number;
  organization_management_level?: OrganizationManagementLevel;
  meeting_ids: number[];
  committee_ids: number[];
  created_at: number;
  updated_at: number;
}
```

### Organization Role Model
```typescript
{
  user_id: number;
  organization_id: number;
  role: OrganizationRole;
  permissions: string[];
  granted_at: number;
  granted_by_id: number;
}
```

## Permissions and Access Control

### Organization Permissions
- `organization.can_see_users`: View user accounts
- `organization.can_manage_users`: Create/edit/delete accounts
- `organization.can_manage_roles`: Assign organization roles
- `organization.can_see_sensitive_data`: View detailed account info

### Access Levels
- **Superadmin**: Full system administration
- **Organization Admin**: Organization-wide user management
- **Committee Manager**: Committee-specific user management
- **Meeting Admin**: Meeting participant management
- **User**: Self-service account management

## E2E Test Selectors

### Account List
- Accounts container: `.accounts-list`
- Account card: `.account-card`
- Account name: `.account-name`
- Username: `.account-username`
- Role indicator: `.account-role`
- Meeting count: `.meeting-count`
- Account actions: `.account-actions`

### Controls
- Create button: `button[matTooltip="Create account"]`
- Sort button: `button[matTooltip="Sort"]`
- Filter button: `button[matTooltip="Filter"]`
- Search input: `input[placeholder="Search"]`
- Bulk actions: `.bulk-actions`

### Dialogs
- Username input: `input[formControlName="username"]`
- Display name input: `input[formControlName="display_name"]`
- Email input: `input[formControlName="email"]`
- Password input: `input[formControlName="password"]`
- Role select: `mat-select[formControlName="role"]`

## Keyboard Shortcuts
- `Ctrl+N`: Create new account
- `Ctrl+F`: Focus search field
- `Enter`: Open selected account
- `Delete`: Delete selected accounts
- `Ctrl+A`: Select all accounts
- `Escape`: Clear selection/close dialogs

## Accessibility Features
- **Screen Reader Support**: ARIA labels for all elements
- **Keyboard Navigation**: Full keyboard control
- **High Contrast**: Compatible with accessibility themes
- **Focus Management**: Clear focus indicators
- **Semantic Structure**: Proper heading hierarchy
- **Alternative Text**: Descriptive labels for icons

## Performance Features
- **Lazy Loading**: Load accounts on demand
- **Virtual Scrolling**: Handle large user lists
- **Caching**: Cache account metadata
- **Optimized Search**: Debounced search with server-side filtering
- **Progressive Enhancement**: Core functionality without JavaScript