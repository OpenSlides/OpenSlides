#!/bin/bash

set -e

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets to run development contex in various ways

help ()
{
    info "\
Builds and starts development related images. Intended to be called from Makefiles

Parameters:
    #1 TARGET       : Name of the Makefile Target that called this script.
    #2 SERVICE      : Name of the Service that called this script. If empty, the main repository assumed to be the caller
    #3 COMPOSE_FILE : Path to the docker compose file that should be used (Path relative to the services directory)
    #4 ARGS         : Additional parameters that will be appended to the called docker run or docker compose calls
    #5 USED_SHELL   : Optional parameter to declare the type of shell that is supposed to entered when attaching / entering container. Default is 'sh'

Flags:
    -v              : Appends '--volumes' whenever a docker compose setup is closed

Available dev functions:
    dev             : Builds and starts development images
    dev-clean       : Stops ALL containers and deletes ALL images. Then builds and starts development images
    dev-help        : Print help
    dev-detached    : Builds and starts development images with detach flag
    dev-attached    : Builds and starts development images; enters shell of started image
                          If a docker compose file is declared, the \$ARGS parameter determines
                          the specific container id you will enter (default value is equal the service name)
                          as well as the shell you want to enter (sh, bash, entrypoint etc.)
    dev-standalone  : Builds and starts development images; closes them immediatly afterwards
    dev-stop        : Stops any currently running images associated with the service or docker compose file
    dev-exec        : Executes command inside container.
                          Use \$ARGS to declare command that should be used. If using a docker compose setup, declare which container the command should be used in.
    dev-enter       : Enters bash of started container.
                          If a docker compose file is declared, the \$ARGS parameter determines
                          the specific container id you will enter (default value is equal the service name)
    "
}

# Flags
while getopts "v" FLAG; do
    case "${FLAG}" in
    v) CLOSE_VOLUMES="--volumes" ;;
    *) echo "Can't parse flag ${FLAG}" && break ;;
    esac
done
shift $((OPTIND - 1))

# Setup
TARGET=$1
SERVICE=$2
COMPOSE_FILE=$3
ARGS=$4
USED_SHELL=$5

LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Strip 'dev', '-' and any '.o' or similar file endings that may have been automatically added from implicit rules by GNU
FUNCTION=${TARGET#"dev"}
FUNCTION=${FUNCTION#"-"}
FUNCTION=${FUNCTION%.*}

if [ -z "$USED_SHELL" ]; then USED_SHELL="sh"; fi

# - Error Catching
if [ -z "$SERVICE" ] && [ -z "$COMPOSE_FILE" ]
then
    if [ "$FUNCTION" = "help" ]
    then
        help
        exit 0
    fi
    error "Run-dev requires either a docker compose file or a specific service image to run (Missing Parameters #2 and/or #3)"
    exit 1
fi

info "Running $FUNCTION"


# - Run specific function
if [ -n "$COMPOSE_FILE" ]
then
    # Run-dev functions using docker compose

    # Helpers
    USER_ID=$(id -u)
    GROUP_ID=$(id -g)
    DC="CONTEXT=dev USER_ID=$USER_ID GROUP_ID=$GROUP_ID docker compose -f ${COMPOSE_FILE}"

    case "$FUNCTION" in
    "help")        help ;;
    "clean")       { docker stop $(docker ps -aq) && docker rm $(docker ps -a -q) && docker rmi -f $(docker images -aq); } || \
                    echocmd make build-dev && \
                    echocmd eval "$DC up $ARGS" ;;
    "standalone")  echocmd make build-dev && echocmd eval "$DC up $ARGS" && echocmd eval "$DC down $CLOSE_VOLUMES" ;;
    "detached")    echocmd make build-dev && echocmd eval "$DC up $ARGS -d"  && info "Containers started" ;;
    "attached")    echocmd make build-dev && echocmd eval "$DC up -d" && \
                   { [ -z "$ARGS" ] && \info "No container was specified; Service container will be taken as default" && ARGS="$SERVICE"; } && \
                   echocmd eval "$DC exec $ARGS $USED_SHELL" && \
                   echocmd eval "$DC down $CLOSE_VOLUMES" ;;
    "stop")        echocmd eval "$DC down $CLOSE_VOLUMES" ;;
    "exec")        echocmd eval "$DC exec $ARGS" ;;
    "enter")       { [ -z "$ARGS" ] && \info "No container was specified; Service container will be taken as default" && ARGS="$SERVICE"; } && \
                   echocmd eval "$DC exec $ARGS" ;;
    "")            echocmd make build-dev && echocmd eval "$DC up $ARGS $USED_SHELL" ;;
    *)             warn "No command found matching $FUNCTION" ;;
    esac
elif [ -n "$SERVICE" ]
then
    # Run-dev functions with a single image

    # Helpers
    IMAGE_TAG=openslides-"$SERVICE"-dev

    echo $FUNCTION
    echo $IMAGE_TAG

    case "$FUNCTION" in
    "help")        help ;;
    "clean")       { docker stop $(shell docker ps -aq) && docker rm $(shell docker ps -a -q) && docker rmi -f $(shell docker images -aq); } || \
                    echocmd make build-dev && \
                    echocmd docker run "$IMAGE_TAG" ;;
    "standalone")  echocmd make build-dev && echocmd docker run "$ARGS" "$IMAGE_TAG" && echocmd docker stop $(docker ps -a -q --filter ancestor="$IMAGE_TAG" --format="{{.ID}}") ;;
    "detached")    echocmd make build-dev && echocmd docker run "$ARGS" -d "$IMAGE_TAG" && info "Container started" ;;
    "attached")    echocmd make build-dev && echocmd docker run -ti "$ARGS" "$IMAGE_TAG" "$USED_SHELL";;
    "stop")        echocmd docker exec $(docker ps -a -q --filter ancestor="$IMAGE_TAG" --format="{{.ID}}") "$ARGS";;
    "exec")        echocmd docker exec $(docker ps -a -q --filter ancestor="$IMAGE_TAG" --format="{{.ID}}") "$ARGS" ;;
    "enter")       echocmd docker -it $(docker ps -a -q --filter ancestor="$IMAGE_TAG" --format="{{.ID}}") "$ARGS" "$USED_SHELL" ;;
    "")             echocmd make build-dev && echocmd docker run "$ARGS" "$IMAGE_TAG" ;;
    *)             warn "No command found matching $FUNCTION" ;;
    esac
fi

exit 0