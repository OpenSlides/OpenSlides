build-dev:
	make -C caddy build-dev
	git submodule foreach 'make build-dev'
	docker-compose -f docker/docker-compose.dev.yml build

run-dev: | build-dev
	UID=$$(id -u $${USER}) GID=$$(id -g $${USER}) docker-compose -f docker/docker-compose.dev.yml up

stop-dev:
	docker-compose -f docker/docker-compose.dev.yml down

get-server-shell:
	docker-compose -f docker/docker-compose.dev.yml run server bash

