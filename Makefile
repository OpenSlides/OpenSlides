DC_PATH=dev/docker
SCRIPT_PATH=dev/scripts
DC=docker-compose -f $(DC_PATH)/docker-compose.dev.yml

# Main command: start the dev server
run-dev: | build-dev 
	$(DC) up $(ARGS)

# Same as run-dev, but with OpenTelemetry
run-dev-otel: | build-dev
	$(DC) -f $(DC_PATH)/dc.otel.dev.yml up $(ARGS)

# Build the docker dev images for all services in parallel
build-dev:
	$(SCRIPT_PATH)/submodules-do.sh 'make build-dev'
	make -C proxy build-dev
	
# Run the tests of all services
run-service-tests:
	git submodule foreach 'make run-tests'

# Execute while run-dev is running: Switch to the test database to execute backend tests without
# interfering with your dev database
switch-to-test:
	$(DC) stop postgres
	docker-compose -f $(DC_PATH)/docker-compose.test.yml up -d postgres-test
	$(DC) -f $(DC_PATH)/docker-compose.backend.yml up -d backend
	$(DC) restart datastore-writer datastore-reader autoupdate vote

# Execute while run-dev is running: Switch back to your dev database
switch-to-dev:
	docker-compose -f $(DC_PATH)/docker-compose.test.yml stop postgres-test
	$(DC) up -d postgres backend
	$(DC) restart datastore-writer datastore-reader autoupdate vote 

# Shorthand to directly enter a shell in the backend after switching the databases
run-backend: | switch-to-test
	$(DC) exec backend ./entrypoint.sh bash --rcfile .bashrc

# Stop the dev server
stop-dev:
	$(DC) down --volumes --remove-orphans

# Stop the dev server with OpenTelemetry
stop-dev-otel:
	$(DC) -f $(DC_PATH)/dc.otel.dev.yml down --volumes --remove-orphans

build:
	$(DC_PATH)/build.sh

# Shorthand to execute the make-release script
services-to-staging:
	$(SCRIPT_PATH)/make-update.sh fetch-all-changes

main-to-services:
	$(SCRIPT_PATH)/make-update.sh update-main-branches

staging-update:
	$(SCRIPT_PATH)/make-update.sh staging

main-update:
	$(SCRIPT_PATH)/make-update.sh main

# You may only use this one time after cloning this repository.
# Will set the upstream remote to "origin"
submodules-origin-to-upstream:
	git submodule foreach -q --recursive 'git remote rename origin upstream'
