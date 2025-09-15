override DEV_PATH=dev
override DOCKER_PATH=$(DEV_PATH)/docker
override SCRIPT_PATH=$(DEV_PATH)/scripts
override MAKEFILE_PATH=$(SCRIPT_PATH)/makefile
override DC_DEV=docker compose -f $(DOCKER_PATH)/docker-compose.dev.yml
override DC_TEST=docker compose -f $(DOCKER_PATH)/docker-compose.test.yml
override GO_VERSION=$(shell head -n 1 go.work)
override DOCKER_COMPOSE_FILE=$(DOCKER_PATH)/docker-compose.dev.yml


# Build images for different contexts

build-prod build-dev build-tests:
	sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	bash $(MAKEFILE_PATH)/make-build-main.sh $@

# Development
.SERVICE_TARGETS := auth autoupdate backend client datastore icc manage media proxy search vote

$(.SERVICE_TARGETS):
	@echo ""

.FLAGS := no-cache capsule compose-local-branch

$(.FLAGS):
	@echo ""

.PHONY: dev

dev dev-help dev-standalone dev-detached dev-attached dev-stop dev-exec dev-enter dev-clean dev-build:
	@sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	@bash $(MAKEFILE_PATH)/make-dev.sh $@ "$(filter-out $@, $(MAKECMDGOALS))" "$(DEV_ARGS)" "$(ATTACH_TARGET_CONTAINER)" "$(EXEC_COMMAND)"

# Tests

run-tests:
	bash dev/scripts/makefile/test-all-submodules.sh "$(DEV_ARGS)" "$(ATTACH_TARGET_CONTAINER)" "$(EXEC_COMMAND)"

test-ci:
	bash $(SCRIPT_PATH)/act/run-act.sh $(FOLDER) $(WORKFLOW_TRIGGER)

# Make-release commands

services-to-main:
	$(SCRIPT_PATH)/make-update.sh fetch-all-changes $(ARGS)

services-to-main-pull:
	$(SCRIPT_PATH)/make-update.sh fetch-all-changes --pull $(ARGS)

staging-update:
	$(SCRIPT_PATH)/make-update.sh staging $(ARGS)

staging-log:
	$(SCRIPT_PATH)/make-update.sh staging-log

hotfix-update:
	$(SCRIPT_PATH)/make-update.sh hotfix $(ARGS)

stable-update:
	$(SCRIPT_PATH)/make-update.sh stable $(ARGS)

# Translation helper targets

extract-translations:
	dev/scripts/extract-translations.sh

push-translations:
	tx push --source

pull-translations:
	tx pull --translations --languages $$(dev/scripts/dc-dev.sh exec client npm run get-available-languages | tail -n 1)

copy-translations:
	cp i18n/*.po openslides-client/client/src/assets/i18n/
	cp i18n/*.po openslides-backend/openslides_backend/i18n/messages/




########################## Deprecation List ##########################

deprecation-warning:
	@echo "\033[1;33m DEPRECATION WARNING: This make command is deprecated and will be removed soon! \033[0m"

deprecation-warning-alternative: | deprecation-warning
	@echo "\033[1;33m Please use the following command instead: $(ALTERNATIVE) \033[0m"

build: | deprecation-warning
	$(DOCKER_PATH)/build.sh

run-dev:
	@make deprecation-warning-alternative ALTERNATIVE="dev"
	sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	chmod +x $(SCRIPT_PATH)/makefile/build-all-submodules.sh
	$(DC_DEV) up $(ARGS)

run-dev-detached:
	@make deprecation-warning-alternative ALTERNATIVE="dev"
	sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	chmod +x $(SCRIPT_PATH)/makefile/build-all-submodules.sh
	$(DC_DEV) up $(ARGS) -d

stop-dev:
	@make deprecation-warning-alternative ALTERNATIVE="dev-stop"
	$(DC_DEV) down --volumes --remove-orphans

# Run the tests of all services
run-service-tests:
	@make deprecation-warning-alternative ALTERNATIVE="run-tests"
	chmod +x $(SCRIPT_PATH)/makefile/test-all-submodules.sh
	$(SCRIPT_PATH)/makefile/test-all-submodules.sh

# Execute while run-dev is running: Switch to the test database to execute backend tests without
# interfering with your dev database
switch-to-test: | deprecation-warning
	$(DC_DEV) stop postgres
	$(DC_TEST) up -d postgres-test
	$(DC_DEV) -f $(DOCKER_PATH)/docker-compose.backend.yml up -d backend
	$(DC_DEV) restart datastore-writer datastore-reader autoupdate vote

# Execute while run-dev is running: Switch back to your dev database
switch-to-dev: | deprecation-warning
	$(DC_TEST) stop postgres-test
	$(DC_DEV) up -d postgres backend
	$(DC_DEV) restart datastore-writer datastore-reader autoupdate vote

# Shorthand to directly enter a shell in the backend after switching the databases
run-backend: | deprecation-warning switch-to-test
	$(DC_DEV) exec backend ./entrypoint.sh bash --rcfile .bashrc

# Stop all backend-related services so that the backend dev setup can start
stop-backend: | deprecation-warning
	$(DC_DEV) stop backend datastore-reader datastore-writer auth vote postgres redis icc autoupdate search

# Restart all backend-related services
start-backend: | deprecation-warning
	$(DC_DEV) up -d backend datastore-reader datastore-writer auth vote postgres redis icc autoupdate search


# Stop the dev server with OpenTelemetry
stop-dev-otel: | deprecation-warning
	$(DC_DEV) -f $(DOCKER_PATH)/dc.otel.dev.yml down --volumes --remove-orphans


# Same as run-dev, but with OpenTelemetry
run-dev-otel: | deprecation-warning build-dev
	$(DC_DEV) -f $(DOCKER_PATH)/dc.otel.dev.yml up $(ARGS)

# You may only use this one time after cloning this repository.
# Will set the upstream remote to "origin"
submodules-origin-to-upstream: | deprecation-warning
	git submodule foreach -q --recursive 'git remote rename origin upstream'
