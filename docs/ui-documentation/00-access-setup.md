# OpenSlides UI Access Setup

## Current Status
The OpenSlides development environment is running successfully with all services operational. However, accessing the UI through automated tools like Playwright is challenging due to self-signed certificate issues.

## Service Status
- ✅ Client (Angular): Running on internal port 9001
- ✅ Backend (Python): Running on ports 9002-9003
- ✅ Auth Service: Running on port 9004
- ✅ Autoupdate Service: Running on port 9012
- ✅ Datastore: Running on ports 9010-9011
- ✅ PostgreSQL: Running on port 5432
- ✅ Redis: Running on port 6379
- ✅ Traefik Proxy: Running on port 8000 (HTTPS)
- ✅ All other services: Running

## Access Methods

### 1. Direct Browser Access
- URL: https://localhost:8000
- Accept the self-signed certificate warning
- Login with credentials: `admin` / `admin`

### 2. API Access
```bash
# Login via API
curl -k -X POST https://localhost:8000/system/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Check authentication status
curl -k https://localhost:8000/system/auth/who-am-i
```

## Known Issues

### Self-Signed Certificate
The development environment uses a self-signed certificate which causes:
- Browser warnings that must be manually accepted
- Automated tools (like Playwright) failing to connect
- HTTP access being rejected with "Client sent an HTTP request to an HTTPS server"

### Solutions
1. **For Development**: Use `mkcert` to generate locally trusted certificates
2. **For Testing**: Configure Playwright to ignore certificate errors
3. **Workaround**: Access services directly on their internal ports (not recommended)

## Next Steps for UI Documentation
1. Set up proper local certificates using mkcert
2. Configure Playwright to handle self-signed certificates
3. Or use manual browser testing with screenshots
4. Document each UI component systematically

## Initial Data
The development environment creates the following initial data:
- Organization: "Test Organization"
- Meeting: "OpenSlides Demo"
- Users:
  - `admin` (superadmin)
  - `a` (delegate)
  - `b` (delegate)
- Groups: Default, Admin, Staff, Committees, Delegates
- Sample content: Topics, Motions, Assignments, Polls