build:
	docker compose -f docker-compose.dev.yml  build --no-cache

dev: | build
	docker compose -f docker-compose.dev.yml up

stop:
	docker compose -f docker-compose.dev.yml down

restart: | build
	docker compose -f docker-compose.dev.yml down
	docker compose -f docker-compose.dev.yml up

psql:
	docker compose -f docker-compose.dev.yml exec postgres psql -U openslides -d openslides
