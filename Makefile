run-service-tests:
	git submodule foreach 'make run-tests'

build-dev:
	./dev-commands/submodules-do.sh 'make build-dev'
	make -C proxy build-dev

run-dev: | build-dev
	docker-compose -f docker/docker-compose.dev.yml up $(ARGS)

run-dev-otel: | build-dev
	docker-compose -f docker/docker-compose.dev.yml -f docker/dc.otel.dev.yml up $(ARGS)

switch-to-test:
	docker-compose -f docker/docker-compose.dev.yml stop postgres
	docker-compose -f docker/docker-compose.test.yml up postgres-test -d
	docker-compose -f docker/docker-compose.dev.yml restart datastore-writer datastore-reader autoupdate vote backend

switch-to-dev:
	docker-compose -f docker/docker-compose.test.yml stop postgres-test
	docker-compose -f docker/docker-compose.dev.yml up postgres -d
	docker-compose -f docker/docker-compose.dev.yml restart datastore-writer datastore-reader autoupdate vote backend

run-backend: | switch-to-test
	docker-compose -f docker/docker-compose.dev.yml exec backend ./entrypoint.sh bash --rcfile .bashrc

stop-dev:
	docker-compose -f docker/docker-compose.dev.yml down --volumes --remove-orphans

stop-dev-otel:
	docker-compose -f docker/docker-compose.dev.yml -f docker/dc.otel.dev.yml down --volumes --remove-orphans

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
