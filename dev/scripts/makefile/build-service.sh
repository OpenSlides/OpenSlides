#!/bin/bash

export SERVICE=$1
export CONTEXT=$2
export MODULE=$3
export PORT=$4

if [ -z "${SERVICE}" ]; then
    echo "Please provide the name of the service you want to build (bash build-service.sh <service-name> <desired_context>, example: proxy, auth, datastore)" >&2
	exit 1
fi

if [ "${CONTEXT}" != "prod" -a "${CONTEXT}" != "dev" -a "${CONTEXT}" != "tests" ] ; then \
    echo "Please provide a context for this build (bash build-service.sh <service-name> <desired_context> , possible options: prod, dev, tests)"; \
	exit 1; \
fi

export TAG=openslides-${SERVICE}-
export OPT_ARGS=

if [ -n "${MODULE}" ]; then
    export TAG=${TAG}${MODULE}-
    export OPT_ARGS="--build-arg MODULE=${MODULE} --build-arg PORT=${PORT}"
fi

export TAG=${TAG}${CONTEXT}

echo "Building submodule '${SERVICE}' for ${CONTEXT} context"

docker build -f ./Dockerfile ./ --tag ${TAG} --build-arg CONTEXT=${CONTEXT} --target ${CONTEXT} ${OPT_ARGS}
