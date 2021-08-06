run-system-tests:
	echo "TODO: write complete system tests"

run-service-tests:
	git submodule foreach 'make run-tests'

build-dev:
	git submodule foreach 'make build-dev'
	make -C proxy build-dev

run-dev: | build-dev
	docker-compose -f docker/docker-compose.dev.yml up

stop-dev:
	docker-compose -f docker/docker-compose.dev.yml down --volumes --remove-orphans

copy-node-modules:
	docker-compose -f docker/docker-compose.dev.yml exec client bash -c "cp -r /app/node_modules/ /app/src/"
	mv openslides-client/client/src/node_modules/ openslides-client/client/

reload-proxy:
	docker-compose -f docker/docker-compose.dev.yml exec -w /etc/caddy proxy caddy reload

services-to-master:
	# Note: This script updates all submodules to upstream/master[1]. For setting the submodules to the linked
	# commits use `git submodule update`. The `upstream` remote must be set up correctly to point to the main repo.
	#
	# [1] ...or main, or whatever branch the OS4 one is. See .gitmodules.
	git submodule foreach -q --recursive 'git checkout $(git config -f $$toplevel/.gitmodules submodule.$$name.branch || echo master); git pull upstream $$(git config -f $$toplevel/.gitmodules submodule.$$name.branch || echo master)'
