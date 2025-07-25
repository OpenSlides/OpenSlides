# Accounts Page Documentation

## Overview
The Accounts page manages organization-wide user accounts, providing user creation, editing, role management, and bulk operations across the entire organization.

## URL Route
- Accounts: `/accounts`

## Page Layout

### Accounts List Interface
```
┌─────────────────────────────────────────────────┐
│  Accounts                           [+] [📤] [⋮]│
├─────────────────────────────────────────────────┤
│  3 of 3    [≡ SORT] [⚲ FILTER] [🔍 Search___]  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │ a                                     [⋮]   ││
│  │ a                                           ││
│  │ 📅 1 meeting(s)                             ││
│  │ Last login: Never                           ││
│  │ Status: Active                              ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ Administrator                         [⋮]   ││
│  │ admin                                       ││
│  │ 👑 Superadmin                               ││
│  │ 📅 1 meeting(s)                             ││
│  │ Last login: 24.07.2024 14:20               ││
│  │ Status: Active                              ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Account Statistics                             │
│  Total: 3    Active: 3    Inactive: 0         │
│  Superadmins: 1    Never logged in: 2         │
└─────────────────────────────────────────────────┘
```

## Frontend Actions and Backend Mapping

### User Management
- **Create User**:
  - Frontend: Click [+] button, opens creation dialog
  - Backend: `POST /system/action` - `user.create`
  - Service: `openslides-backend/action/user/create.py`

- **Edit User**:
  - Frontend: User menu [⋮] > Edit
  - Backend: `POST /system/action` - `user.update`
  - Service: `openslides-backend/action/user/update.py`

- **Delete User**:
  - Frontend: User menu [⋮] > Delete
  - Backend: `POST /system/action` - `user.delete`
  - Service: `openslides-backend/action/user/delete.py`

- **Import Users**:
  - Frontend: Click [📤] import button
  - Backend: `POST /system/action` - `user.import`
  - Service: `openslides-backend/action/user/import.py`

### Data Loading
- **User List**:
  - Frontend: Component initialization
  - Backend: `GET /system/presenter/get_users`
  - Service: `openslides-backend/presenter/user.py`

- **User Statistics**:
  - Frontend: Calculated from user data
  - Backend: User data with login statistics
  - Service: User presenter with activity data

## Create User Dialog

### Dialog Interface
```
┌─────────────────────────────────────────────────┐
│  Create user                            [x]     │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│                                                 │
│  Title                                          │
│  [Mr./Ms./Dr.____]                              │
│                                                 │
│  First name *                                   │
│  [John_________________________]               │
│                                                 │
│  Last name *                                    │
│  [Smith________________________]               │
│                                                 │
│  Username *                                     │
│  [john.smith___________________]                │
│                                                 │
│  Email                                          │
│  [john.smith@organization.org__]                │
│                                                 │
│  Organization Role                              │
│  ● Regular user                                 │
│  ○ Organization administrator                   │
│  ○ Superadmin                                   │
│                                                 │
│  Committee Memberships                          │
│  [Select committees...] 🏛️                      │
│                                                 │
│  Account Settings                               │
│  ☑ Account is active                           │
│  ☑ Can change own password                     │
│  ☑ Send welcome email                          │
│                                                 │
│  [Cancel]                        [Create User]  │
└─────────────────────────────────────────────────┘
```

### Dialog Actions
- **Committee Selection**:
  - Frontend: Multi-select committee picker
  - Backend: `GET /system/presenter/get_committees`
  - Service: `openslides-backend/presenter/committee.py`

- **Role Assignment**:
  - Frontend: Radio button selection
  - Backend: Sets organization_management_level field
  - Service: User creation with role assignment

## User Detail View

### Detailed User Interface
```
┌─────────────────────────────────────────────────┐
│  User: John Smith                      [✏️] [⋮] │
├─────────────────────────────────────────────────┤
│  Personal Information                           │
│  Name: John Smith                               │
│  Username: john.smith                           │
│  Email: john.smith@org.com                      │
│  Title: Mr.                                     │
│                                                 │
│  Organization Role                              │
│  👤 Regular User                                │
│  Status: Active                                 │
│  Created: 20.07.2024                           │
│                                                 │
│  Committee Memberships                          │
│  🏛️ Finance Committee (Member)                  │
│  🏛️ Board Committee (Observer)                  │
│                                                 │
│  Meeting Participation                          │
│  📅 Total meetings: 5                          │
│  📅 Active meetings: 2                         │
│  📊 Last activity: 23.07.2024                  │
│                                                 │
│  Account Activity                               │
│  Last login: 24.07.2024 09:30                  │
│  Login count: 47                               │
│  Password changed: 01.07.2024                  │
│                                                 │
│  [Edit User] [Reset Password] [Deactivate]      │
└─────────────────────────────────────────────────┘
```

### User Management Actions
- **Reset Password**:
  - Frontend: User detail > Reset Password
  - Backend: `POST /system/action` - `user.reset_password`
  - Service: `openslides-backend/action/user/reset_password.py`

- **Activate/Deactivate**:
  - Frontend: Toggle active status
  - Backend: `POST /system/action` - `user.update` (is_active field)
  - Service: `openslides-backend/action/user/update.py`

## Import Users Dialog

### Import Interface
```
┌─────────────────────────────────────────────────┐
│  Import users                           [x]     │
├─────────────────────────────────────────────────┤
│  Upload Method                                  │
│  ● Upload CSV file                              │
│  ○ Paste data                                   │
│                                                 │
│  File Upload                                    │
│  [Choose file...] users.csv (5.2 KB)           │
│                                                 │
│  Column Mapping                                 │
│  First Name → first_name                       │
│  Last Name → last_name                         │
│  Email → email                                 │
│  Username → username                           │
│                                                 │
│  Import Options                                 │
│  ☑ Generate random passwords                   │
│  ☑ Send welcome emails                         │
│  ☐ Skip existing usernames                     │
│                                                 │
│  Default Settings                               │
│  Default committee: [None ▼]                   │
│  Account status: ☑ Active                      │
│                                                 │
│  [Cancel]                        [Import (47)]  │
└─────────────────────────────────────────────────┘
```

### Import Actions
- **File Processing**:
  - Frontend: File upload and CSV parsing
  - Backend: `POST /system/action` - `user.import`
  - Service: `openslides-backend/action/user/import.py`

- **Column Mapping**:
  - Frontend: Field mapping interface
  - Backend: Import action with field mappings
  - Service: User import with field validation

## E2E Test Selectors
- Account list: `.account-list`
- Account card: `.account-card`
- Create user: `button[matTooltip="Create user"]`
- Import users: `button[matTooltip="Import users"]`
- User name: `.user-name`
- User role: `.user-role`
- User status: `.user-status`

## Backend Integration Points

### Primary Services
1. **User Management**: `openslides-backend/action/user/`
2. **User Data**: `openslides-backend/presenter/user.py`
3. **Authentication**: `openslides-auth-service/`

### Key Actions
- `user.create` - Creates new user account
- `user.update` - Updates user information
- `user.delete` - Deletes user account
- `user.import` - Bulk user import from CSV
- `user.reset_password` - Resets user password
- `user.set_password` - Sets user password

### Authentication Integration
- **Login Tracking**: `openslides-auth-service` tracks login sessions
- **Password Management**: Auth service handles password validation
- **Session Management**: Auth service manages user sessions