CONTEXT = prod

build:
	docker build -t openslides-proxy-dev --build-arg CONTEXT=dev .

build-prod:
	docker build -t openslides-proxy --build-arg CONTEXT=prod .

run-tests:
	@echo "No tests for proxy service"

make-localhost-cert:
	./make-localhost-cert.sh