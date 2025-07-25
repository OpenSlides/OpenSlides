# OpenSlides UI Exploration Status

## Current Status

### 1. Development Environment
- ✅ OpenSlides development server is running
- ✅ All containers are up except the proxy (SSL certificate issue)
- ✅ Created nginx workaround on port 8080 to access the client
- ✅ Application is accessible at http://localhost:8080

### 2. Container Status
- **Client**: Running on internal port 9001 (accessible via nginx on 8080)
- **Backend**: Running on ports 9002-9003
- **Auth**: Running on port 9004
- **Autoupdate**: Running on port 9012
- **Database**: PostgreSQL running on port 5432
- **Redis**: Running on port 6379
- **Other services**: Vote, Search, ICC, Manage, Media - all running
- **Proxy**: Failed due to SSL certificate issues (can be fixed later)

### 3. Login Credentials
- Username: `superadmin`
- Password: `superadmin`

### 4. Tasks Completed
1. ✅ Started the development server
2. ✅ Set up access to the application (via nginx workaround)
3. 🔄 Need to document login page with Playwright MCP

### 5. Remaining Tasks
1. Document the login page and authentication flow
2. Explore and document the main dashboard/home page
3. Document the meeting/assembly management features
4. Explore and document agenda/topics functionality
5. Document motion management features
6. Explore participant/user management
7. Document voting and poll features
8. Explore assignment/election features
9. Document file/media management
10. Explore projector and presentation features
11. Document settings and configuration pages
12. Create comprehensive documentation file with all findings

## How to Continue After Restart

1. **Verify the environment is still running:**
   ```bash
   docker ps | grep -E "(client|backend|auth)"
   ```

2. **If nginx proxy is not running, recreate it:**
   ```bash
   docker run -d --rm --name port-forward --network docker_default -p 8080:80 nginx:alpine
   docker exec port-forward sh -c 'echo "server { listen 80; location / { proxy_pass http://client:9001; proxy_set_header Host \$host; } }" > /etc/nginx/conf.d/default.conf && nginx -s reload'
   ```

3. **Access OpenSlides:**
   - URL: http://localhost:8080
   - Login: superadmin / superadmin

4. **With Playwright MCP enabled, you should be able to:**
   - Navigate to pages
   - Take screenshots
   - Fill forms
   - Click buttons
   - Extract element information

## Key UI Elements to Document

### Login Page
- Username input: `data-cy="loginUsernameInput"`
- Password input: `data-cy="loginPasswordInput"`
- Login button: `data-cy="loginButton"`
- Forgot password button
- Public access button (if enabled)
- SAML login option (if configured)

### Expected Post-Login Navigation
Based on code analysis, expect to find:
- Meeting list/dashboard
- Organization settings
- Committee management
- User/participant management
- Account settings

## Technical Notes
- Frontend: Angular 19 with Material Design
- Uses data-cy attributes for E2E testing
- Reactive forms for validation
- WebSocket connections for real-time updates
- Multi-tenant architecture with meetings/organizations

## Next Steps with MCP
1. Use Playwright to navigate to http://localhost:8080
2. Document the login page with screenshots
3. Login as superadmin
4. Systematically explore each section of the UI
5. Document all forms, modals, and controls
6. Note all data-cy attributes for testing
7. Create comprehensive documentation for E2E test development