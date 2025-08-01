.PHONY: help install test test-smoke test-dev test-parallel docker-up docker-down clean report

help:
	@echo "OpenSlides E2E Test Suite"
	@echo "========================"
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make test          - Run all tests with Docker"
	@echo "  make test-smoke    - Run smoke tests only"
	@echo "  make test-dev      - Run tests in development mode (headed)"
	@echo "  make test-parallel - Run tests in parallel"
	@echo "  make docker-up     - Start Docker services"
	@echo "  make docker-down   - Stop Docker services"
	@echo "  make clean         - Clean reports and temp files"
	@echo "  make report        - Generate HTML report"

install:
	npm install
	@echo "Dependencies installed successfully"

test:
	./run-tests.sh

test-smoke:
	./run-tests.sh --no-docker smoke

test-dev:
	HEADLESS=false ./run-tests.sh --no-docker dev

test-parallel:
	./run-tests.sh --no-docker parallel

docker-up:
	npm run docker:up
	npm run wait-for-services

docker-down:
	npm run docker:down

clean:
	rm -rf reports dist
	@echo "Cleaned reports and temporary files"

report:
	npm run report
	@echo "Report generated at: reports/index.html"

# Development helpers
compile:
	npm run compile

lint:
	npm run lint

# Run specific feature
test-feature:
	@if [ -z "$(FEATURE)" ]; then \
		echo "Usage: make test-feature FEATURE=authentication"; \
		exit 1; \
	fi
	npm test -- features/*$(FEATURE)*.feature

# Run with specific tag
test-tag:
	@if [ -z "$(TAG)" ]; then \
		echo "Usage: make test-tag TAG=@critical"; \
		exit 1; \
	fi
	npm test -- --tags "$(TAG)"