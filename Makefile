override DEV_PATH=dev
override DOCKER_PATH=$(DEV_PATH)/docker
override SCRIPT_PATH=$(DEV_PATH)/scripts
override MAKEFILE_PATH=$(SCRIPT_PATH)/makefile
override DC_DEV=docker compose -f $(DOCKER_PATH)/docker-compose.dev.yml
override DC_TEST=docker compose -f $(DOCKER_PATH)/docker-compose.test.yml
override GO_VERSION=$(shell head -n 1 go.work)
override DOCKER_COMPOSE_FILE=$(DOCKER_PATH)/docker-compose.dev.yml


# Build images for different contexts

build build-prod:
	$(DOCKER_PATH)/build.sh

# Development
.SERVICE_TARGETS := auth autoupdate backend client icc manage media proxy search vote

$(.SERVICE_TARGETS):
	@echo ""

.FLAGS := no-cache capsule compose-local-branch no-log-prefix

$(.FLAGS):
	@echo ""

.PHONY: dev

devstop:
	@sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	@bash $(MAKEFILE_PATH)/make-dev.sh "dev-stop" "$(filter-out $@, $(MAKECMDGOALS))"

dev dev-help dev-standalone dev-detached dev-attached dev-stop dev-exec dev-enter dev-clean dev-build dev-log dev-log-attach dev-restart dev-full-restart dev-docker-reset:
	@sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	@bash $(MAKEFILE_PATH)/make-dev.sh $@ "$(filter-out $@, $(MAKECMDGOALS))"

# Tests

run-tests:
	bash dev/scripts/makefile/test-all-submodules.sh "$(filter-out $@, $(MAKECMDGOALS))"

test-ci:
	bash $(SCRIPT_PATH)/act/run-act.sh $(FOLDER) $(WORKFLOW_TRIGGER)

# Localprod

localprod run-localprod:
	@if [ ! -f "dev/localprod/docker-compose.yml" ]; then echo "No docker-compose.yml exists in dev/localprod. Have you run setup.sh yet?" && exit 1; fi
	docker compose -f dev/localprod/docker-compose.yml up --build

localprod-stop:
	@if [ ! -f "dev/localprod/docker-compose.yml" ]; then echo "No docker-compose.yml exists in dev/localprod. Have you run setup.sh yet?" && exit 1; fi
	docker compose -f dev/localprod/docker-compose.yml down

localprod-delete:
	rm ./dev/localprod/openslides
	rm ./dev/localprod/docker-compose.yml

localprod-build:
	@if [ ! -d "dev/localprod/" ]; then echo "Directory dev/localprod not found." && exit 1; fi
	cd ./dev/localprod && ./setup.sh

localprod-log:
	@if [ ! -f "dev/localprod/docker-compose.yml" ]; then echo "No docker-compose.yml exists in dev/localprod. Have you run setup.sh yet?" && exit 1; fi
	docker compose -f dev/localprod/docker-compose.yml logs $(ARGS)

# Checkout

checkout:
	@bash $(MAKEFILE_PATH)/checkout.sh "${REMOTE}" "$(BRANCH)" "$(FILE)" "$(PULL)" "$(LATEST)"

checkout-pull:
	@bash $(MAKEFILE_PATH)/checkout.sh "${REMOTE}" "$(BRANCH)" "$(FILE)" "true" "$(LATEST)"

checkout-help:
	@bash $(MAKEFILE_PATH)/checkout.sh -h

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
	dev/scripts/copy-translations.sh


########################## Deprecation List ##########################

warning-deprecation:
	@echo "\033[1;33m DEPRECATION WARNING: This make command is deprecated and will be removed soon! \033[0m"

warning-deprecation-alternative: | warning-deprecation
	@echo "\033[1;33m Please use the following command instead: $(ALTERNATIVE) \033[0m"

build-dev:
	@make warning-deprecation-alternative ALTERNATIVE="dev-build"
	sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	@bash $(MAKEFILE_PATH)/make-dev.sh "dev-build" "$(filter-out $@, $(MAKECMDGOALS))"

run-dev:
	@make warning-deprecation-alternative ALTERNATIVE="dev"
	sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	@bash $(MAKEFILE_PATH)/make-dev.sh "dev-build" "$(filter-out $@, $(MAKECMDGOALS))"
	$(DC_DEV) up $(ARGS)

run-dev-detached:
	@make warning-deprecation-alternative ALTERNATIVE="dev"
	sed -i "1s/.*/$(GO_VERSION)/" $(DOCKER_PATH)/workspaces/*.work
	@bash $(MAKEFILE_PATH)/make-dev.sh "dev-build" "$(filter-out $@, $(MAKECMDGOALS))"
	$(DC_DEV) up $(ARGS) -d

stop-dev:
	@make warning-deprecation-alternative ALTERNATIVE="dev-stop"
	$(DC_DEV) down --volumes --remove-orphans

# Run the tests of all services
run-service-tests:
	@make warning-deprecation-alternative ALTERNATIVE="run-tests"
	chmod +x $(SCRIPT_PATH)/makefile/test-all-submodules.sh
	$(SCRIPT_PATH)/makefile/test-all-submodules.sh

# Execute while run-dev is running: Switch to the test database to execute backend tests without
# interfering with your dev database
switch-to-test: | warning-deprecation
	$(DC_DEV) stop postgres
	$(DC_TEST) up -d postgres-test
	$(DC_DEV) -f $(DOCKER_PATH)/docker-compose.backend.yml up -d backend
	$(DC_DEV) restart datastore-writer datastore-reader autoupdate vote

# Execute while run-dev is running: Switch back to your dev database
switch-to-dev: | warning-deprecation
	$(DC_TEST) stop postgres-test
	$(DC_DEV) up -d postgres backend
	$(DC_DEV) restart datastore-writer datastore-reader autoupdate vote

# Shorthand to directly enter a shell in the backend after switching the databases
run-backend: | warning-deprecation switch-to-test
	$(DC_DEV) exec backend ./entrypoint.sh bash --rcfile .bashrc

# Stop all backend-related services so that the backend dev setup can start
stop-backend: | warning-deprecation
	$(DC_DEV) stop backend datastore-reader datastore-writer auth vote postgres redis icc autoupdate search

# Restart all backend-related services
start-backend: | warning-deprecation
	$(DC_DEV) up -d backend datastore-reader datastore-writer auth vote postgres redis icc autoupdate search


# Stop the dev server with OpenTelemetry
stop-dev-otel: | warning-deprecation
	$(DC_DEV) -f $(DOCKER_PATH)/dc.otel.dev.yml down --volumes --remove-orphans


# Same as run-dev, but with OpenTelemetry
run-dev-otel: | warning-deprecation build-dev
	$(DC_DEV) -f $(DOCKER_PATH)/dc.otel.dev.yml up $(ARGS)

# You may only use this one time after cloning this repository.
# Will set the upstream remote to "origin"
submodules-origin-to-upstream: | warning-deprecation
	git submodule foreach -q --recursive 'git remote rename origin upstream'
