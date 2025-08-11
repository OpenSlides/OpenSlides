#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Runs act on given submodule directory

DIND_CONTAINER="dind-act-container"
SERVICE_FOLDER=$1
WORKFLOW_TRIGGER=$2
LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [ -z "${SERVICE_FOLDER}" ] ; then \
    error "Please provide the directory of the service to analyse"; \
	exit 1; \
fi

if [ -z "${WORKFLOW}" ] ; then \
    warn "No github workflow trigger specified. Taking 'pull_request' as default"; \
	WORKFLOW_TRIGGER="pull_request"; \
fi

cleanup()
{
    info "Cleanup"
    # Close Act Containers
    for ACT_CONTAINER in $(docker ps -a --filter "name=act" --format "{{.ID}}"); do
        echocmd docker stop "$ACT_CONTAINER" &> /dev/null
        echocmd docker rm "$ACT_CONTAINER" &> /dev/null
    done

    # Close DIND Container
    echocmd docker stop "$DIND_CONTAINER" &> /dev/null
    echocmd docker rm "$DIND_CONTAINER" &> /dev/null
}

trap 'cleanup' EXIT INT

(
    cd "$LOCAL_PWD"/../../.. || exit 1

    # Build dockerfile
    info "Building Image"
    echocmd docker build -f "$LOCAL_PWD"/Dockerfile -t act-on --build-arg SUBDIRECTORY="$SERVICE_FOLDER" .

    info "Setup Container Environment"
    echocmd docker run --name "$DIND_CONTAINER" -v /var/run/docker.sock:/var/run/docker.sock -d act-on

    info "Act"
    echocmd docker exec -it "$DIND_CONTAINER" bin/act "$WORKFLOW_TRIGGER"
)
