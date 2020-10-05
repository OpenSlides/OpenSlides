run-system-tests:
	echo "TODO: write complete system tests"

run-service-tests:
	git submodule foreach 'make run-tests'

build-dev:
	git submodule foreach 'make build-dev'
	make -C haproxy build-dev

run-dev: | build-dev
	docker-compose -f docker/docker-compose.dev.yml up

stop-dev:
	docker-compose -f docker/docker-compose.dev.yml down

copy-node-modules:
	docker-compose -f docker/docker-compose.dev.yml exec client bash -c "cp -r /app/node_modules/ /app/src/"
	mv openslides-client/client/src/node_modules/ openslides-client/client/

reload-haproxy:
	docker-compose -f docker/docker-compose.dev.yml kill -s HUP haproxy
