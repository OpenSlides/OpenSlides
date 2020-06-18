SHELL := /bin/bash

run-system-tests:
	echo "TODO: write complete system tests"

run-service-tests:
	git submodule foreach 'make run-tests'

build-dev:
	git submodule foreach 'make build-dev'
	make -C haproxy build-dev

run-dev: | build-dev
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

copy-node-modules:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec client bash -c "cp -r /app/node_modules/ /app/src/"
	mv openslides-client/client/src/node_modules/ openslides-client/client/

build-prod:
	git submodule status | awk '{ gsub(/[^0-9a-f]/, "", $$1); gsub("-","_",$$2); print toupper($$2)"_COMMIT_HASH="$$1 }' > .env
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

run-prod: | build-prod
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
