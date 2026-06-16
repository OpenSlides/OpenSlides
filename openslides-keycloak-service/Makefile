override SERVICE=keycloak

# Build images for different contexts

build-prod:
	docker build ./ $(ARGS) --tag "openslides-$(SERVICE)" --build-arg CONTEXT="prod" --target "prod"

build-dev:
	docker build ./ $(ARGS) --tag "openslides-$(SERVICE)-dev" --build-arg CONTEXT="dev" --target "dev"

build-tests:
	docker build ./ $(ARGS) --tag "openslides-$(SERVICE)-tests" --build-arg CONTEXT="tests" --target "tests"

# Local dev

dev: | build
	docker compose -f docker-compose.dev.yml up

dev-enter:
	docker compose -f docker-compose.dev.yml exec keycloak-service sh

stop:
	docker compose -f docker-compose.dev.yml down

restart: | build
	docker compose -f docker-compose.dev.yml down
	docker compose -f docker-compose.dev.yml up

psql:
	docker compose -f docker-compose.dev.yml exec postgres psql -U openslides -d openslides
