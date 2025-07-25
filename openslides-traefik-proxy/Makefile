SERVICE=traefik-proxy

build-prod:
	docker build ./ --tag "openslides-$(SERVICE)" --build-arg CONTEXT="prod" --target "prod"

build-dev:
	docker build ./ --tag "openslides-$(SERVICE)-dev" --build-arg CONTEXT="dev" --target "dev"

run-tests:
	@echo "No tests for proxy service"

make-localhost-cert:
	./make-localhost-cert.sh