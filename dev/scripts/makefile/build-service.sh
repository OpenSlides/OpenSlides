#!/bin/bash

# Import OpenSlides utils package
. $( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh

# Builds a single Submodule Service. This expects to be in the directory/subdirectory of the respective service

export SERVICE=$1
export CONTEXT=$2
export MODULE=$3
export PORT=$4

if [ -z "${SERVICE}" ]; then
    error "Please provide the name of the service you want to build (bash build-service.sh <service-name> <desired_context>, example: proxy, auth, datastore)" >&2
	exit 1
fi

if [ "${CONTEXT}" != "prod" -a "${CONTEXT}" != "dev" -a "${CONTEXT}" != "tests" ] ; then \
    error "Please provide a context for this build (bash build-service.sh <service-name> <desired_context> , possible options: prod, dev, tests)"; \
	exit 1; \
fi

export TAG=openslides-${SERVICE}
export OPT_ARGS=

if [ -n "${MODULE}" ]; then
    export TAG=${TAG}-${MODULE}
    export OPT_ARGS="--build-arg MODULE=${MODULE} --build-arg PORT=${PORT}"
fi

if [ "${CONTEXT}" != "prod" ]; then export TAG="${TAG}-${CONTEXT}"; fi

info "Building submodule '${SERVICE}' for ${CONTEXT} context"

echocmd docker build -f ./Dockerfile ./ --tag ${TAG} --build-arg CONTEXT=${CONTEXT} --target ${CONTEXT} ${OPT_ARGS}
