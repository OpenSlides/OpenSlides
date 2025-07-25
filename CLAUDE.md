# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## OpenSlides Overview

OpenSlides is a web-based presentation and assembly system with a microservices architecture. Version: 4.2.18-dev

### Architecture

The system consists of multiple specialized microservices:
- **Frontend**: Angular 19 client (TypeScript) - `openslides-client/`
- **Backend**: Python service (Flask/Werkzeug) - `openslides-backend/`
- **Auth**: Node.js/TypeScript authentication - `openslides-auth-service/`
- **Autoupdate**: Go real-time updates via WebSocket/SSE - `openslides-autoupdate-service/`
- **Datastore**: Python data persistence - `openslides-datastore-service/`
- **Vote**: Go electronic voting - `openslides-vote-service/`
- **Search**: Go full-text search (Bleve) - `openslides-search-service/`
- **ICC**: Go inter-component communication - `openslides-icc-service/`
- **Media**: Python file handling - `openslides-media-service/`
- **Manage**: Go system management - `openslides-manage-service/`
- **Proxy**: Traefik reverse proxy - `openslides-traefik-proxy/`

Services communicate via Redis and share a PostgreSQL 15 database.

## Development Commands

### Essential Commands
```bash
# Start development server (required first)
make run-dev

# Run all tests
make run-service-tests

# Build development images
make build-dev

# Stop development server
make stop-dev
```

### Service-Specific Testing

Backend (Python):
```bash
cd openslides-backend
make test              # All tests
make test-unit         # Unit tests only
make coverage          # Coverage report
pytest tests/unit/test_specific.py  # Single test file
```

Client (Angular):
```bash
cd openslides-client
make run-karma-tests   # Unit tests
make run-playwright    # E2E tests
npm run test:watch     # Watch mode
```

Go Services:
```bash
cd openslides-[service]-service
make gotest           # Run tests
go test ./... -v      # Verbose output
```

### Code Quality

Python (Backend):
```bash
cd openslides-backend
make black            # Format code
make flake8           # Lint
make mypy             # Type check
make all              # Run all checks
```

TypeScript (Client):
```bash
cd openslides-client
make run-check-linting      # ESLint
make run-check-prettifying  # Prettier
npm run lint:fix           # Auto-fix issues
```

Go Services:
```bash
make gofmt            # Format
make golinter         # Lint
```

### Database Operations
```bash
# Switch to test database (while dev running)
make switch-to-test

# Access PostgreSQL
dev/scripts/db.sh

# Clear all data
dev/scripts/clear-ds.sh

# Export/Import data
dev/scripts/export-ds.sh backup.json
dev/scripts/set-ds.sh backup.json

# Backend console with test DB
make run-backend
```

## Working with the Codebase

### Backend (Python) Structure
- `openslides_backend/action/`: Action handlers for API operations
- `openslides_backend/presenter/`: Data presenters for API responses
- `openslides_backend/migrations/`: Database migrations
- `openslides_backend/models/`: Domain models and schemas
- `tests/unit/`: Unit tests
- `tests/integration/`: Integration tests

Key patterns:
- Actions follow command pattern with `perform()` method
- Presenters handle data queries
- All database operations go through datastore service

### Client (Angular) Structure
- `client/src/app/site/`: Feature modules
- `client/src/app/domain/`: Domain models and repositories
- `client/src/app/gateways/`: API communication
- `client/src/app/ui/`: Shared UI components
- `client/src/app/infrastructure/`: Core services

Key patterns:
- ViewModels wrap domain models for UI
- Repositories handle data access
- Controllers manage component logic
- Real-time updates via autoupdate service subscriptions

### Service Communication
- HTTP REST APIs between services
- Redis for pub/sub messaging
- Autoupdate service provides real-time WebSocket/SSE updates
- All external requests go through Traefik proxy on port 8000

### Common Development Tasks

#### Adding a new API endpoint:
1. Backend: Create action in `openslides_backend/action/`
2. Backend: Add tests in `tests/unit/` and `tests/integration/`
3. Client: Update gateway service in `client/src/app/gateways/`
4. Client: Update repository in `client/src/app/domain/repositories/`

#### Modifying database schema:
1. Update model in `openslides_backend/models/`
2. Create migration in `openslides_backend/migrations/`
3. Update datastore reader/writer if needed
4. Update client models in `client/src/app/domain/models/`

#### Adding real-time updates:
1. Backend action must notify autoupdate service
2. Client subscribes via autoupdate service
3. ViewModels automatically update through repositories

### Service Ports
- Client: 9001
- Backend: 9002/9003
- Auth: 9004
- Autoupdate: 9012
- Datastore: 9010/9011
- Vote: 9013
- Search: 9050
- ICC: 9007
- Manage: 9008
- Proxy (main entry): 8000
- PostgreSQL: 5432
- Redis: 6379

Access the application at https://localhost:8000 (self-signed cert warning is normal).

## Important Notes

1. All services run in Docker containers - never install dependencies globally
2. Use git submodules - each service is a separate repository
3. Database changes require migrations
4. Client requires compilation - changes auto-reload in dev mode
5. Backend changes auto-reload except for structural changes
6. Always run formatters/linters before committing
7. Test database is separate - use `make switch-to-test` for testing
8. Email testing available at http://localhost:8025 (MailHog)