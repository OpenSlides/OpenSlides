run-service-tests:
	git submodule foreach 'make run-tests'

build-dev:
	./dev-commands/submodules-do.sh 'make build-dev'
	make -C proxy build-dev

run-dev: | build-dev
	docker-compose -f docker/docker-compose.dev.yml up $(ARGS)

run-dev-otel: | build-dev
	docker-compose -f docker/docker-compose.dev.yml -f docker/dc.otel.dev.yml up $(ARGS)

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
