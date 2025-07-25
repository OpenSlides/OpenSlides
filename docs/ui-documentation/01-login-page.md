# OpenSlides Login Page Documentation

## Overview
The OpenSlides login page is the entry point for users accessing the system. It is built with Angular 19 and uses Material Design components.

## Access URL
- Development: https://localhost:8000/login
- Note: The development server uses a self-signed certificate, which causes browser warnings

## Page Structure

### Components
- **LoginWrapperComponent** (`os-login-wrapper`): Main container for login-related pages
- **LoginMaskComponent** (`os-login-mask`): The actual login form component

### Layout
```
┌─────────────────────────────────────┐
│         Header Toolbar              │
│    [OpenSlides Logo - Dark]         │
├─────────────────────────────────────┤
│                                     │
│         Login Form Area             │
│        (Currently Empty)            │
│                                     │
├─────────────────────────────────────┤
│           Footer Links              │
│  © Copyright | Legal | Privacy      │
└─────────────────────────────────────┘
```

## Known Issues

### HTTP Warning
When accessing via HTTP (http://localhost:8000), users see:
- Message: "Using OpenSlides over HTTP is not supported. Enable HTTPS to continue."
- Dialog with "OK" button to dismiss

### Authentication Endpoint
The login form requires connection to the backend authentication service:
- Endpoint: `/system/auth/who-am-i/`
- Currently returns 404 in development setup when accessed through port 8080

## Expected Form Elements (from code analysis)

### Username Input
- Data attribute: `data-cy="loginUsernameInput"`
- Type: text input
- Validation: Required

### Password Input  
- Data attribute: `data-cy="loginPasswordInput"`
- Type: password input
- Validation: Required

### Login Button
- Data attribute: `data-cy="loginButton"`
- Type: submit button
- Text: "Login"

### Additional Elements
- Forgot Password Button (floating right)
- Public Access Button (if enabled)
- SAML Login Option (if configured)

## Authentication Details
- Default credentials: `admin` / `admin` (has superadmin privileges)
- Additional test users:
  - `a` / `a` (regular user)
  - `b` / `jKwSLGCk` (regular user)
- Multi-tenant architecture supporting organizations and meetings
- Session management via cookies
- Authentication endpoint: POST `/system/auth/login`

## Technical Details

### Routing
- Login routes are defined in the login module
- Path: `/login`
- Child routes:
  - `/login/legalnotice` - Legal notice page
  - `/login/privacypolicy` - Privacy policy page
  - `/login/reset-password` - Password reset
  - `/login/reset-password-confirm` - Password reset confirmation

### Services Used
- `AuthService`: Handles authentication logic
- `OperatorService`: Manages current user state
- `HttpService`: Makes API calls to backend

### Form Validation
- Uses Angular Reactive Forms
- Username and password are required fields
- Form submission disabled until valid

## Development Notes

### Port Configuration
- Client runs on port 9001 internally
- Backend runs on ports 9002-9003
- Caddy proxy exposes everything on port 8000 (HTTPS)
- The nginx workaround on port 8080 doesn't properly proxy backend requests

### Console Errors
Common console errors in development:
- WebSocket connection failures (Vite HMR)
- 404 errors for `/system/auth/who-am-i/` when backend proxy is misconfigured

## Next Steps
To properly document the login functionality:
1. Fix the backend proxy configuration
2. Access the application through the proper Caddy proxy (port 8000)
3. Document the actual rendered login form
4. Test login flow with default credentials
5. Document post-login navigation