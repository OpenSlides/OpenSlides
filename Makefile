run-integration-tests:
	@echo "Start OpenSlides Dev"
	make run-dev ARGS="-d"
	@echo "Start integration tests"
	make cypress-docker
	docker-compose -f integration/docker-compose.yml up
	@echo "Stop OpenSlides Dev"
	make stop-dev

run-service-tests:
	git submodule foreach 'make run-tests'

build-dev:
	./dev-commands/submodules-do.sh 'make build-dev'
	make -C proxy build-dev

run-dev: | build-dev
	docker-compose -f docker/docker-compose.dev.yml up $(ARGS)

stop-dev:
	docker-compose -f docker/docker-compose.dev.yml down --volumes --remove-orphans

copy-node-modules:
	docker-compose -f docker/docker-compose.dev.yml exec client bash -c "cp -r /app/node_modules/ /app/src/"
	mv openslides-client/client/src/node_modules/ openslides-client/client/

reload-proxy:
	docker-compose -f docker/docker-compose.dev.yml exec -w /etc/caddy proxy caddy reload

services-to-main:
	./services-to-main.sh

submodules-origin-to-upstream:
	# You may only use this one time after cloning this repository.
	# Will set the upstream remote to "origin"
	git submodule foreach -q --recursive 'git remote rename origin upstream'

cypress-open:
	cd integration; npm run cypress:open

cypress-run:
	cd integration; npm run cypress:run

cypress-docker:
	docker-compose -f integration/docker-compose.yml build
	docker-compose -f integration/docker-compose.yml up