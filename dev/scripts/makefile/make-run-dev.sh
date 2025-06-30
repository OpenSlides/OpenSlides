#!/bin/bash

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets to run development contex in various ways
# Parameter #1: Makefile Target that called this script

help ()
{
    info "\
Builds and starts development related images. Intended to be called from Makefiles

Parameters:
    #1 TARGET       : Name of the Makefile Target that called this script.
    #2 SERVICE      : Name of the Service that called this script. If empty, the main repository assumed to be the caller
    #3 COMPOSE_FILE : Path to the docker compose file that should be used (Path relative to the services directory)
    #4 ARGS         : Additional parameters that will be appended to the called docker run or docker compose calls

Available run-dev functions:
    run-dev             : Builds and starts development images
    run-dev-help        : Print help
    run-dev-detach      : Builds and starts development images with detach flag
    run-dev-attach      : Builds and starts development images; enters shell of started image
                          If a docker compose file is declared, the ARGS parameter determines the specific container id you will enter
    run-dev-standalone  : Builds and starts development images; closes them immediatly afterwards
    run-dev-stop        : Stops any currently running images associated with the service or docker compose file
    "
}

# Setup
TARGET=$1
SERVICE=$2
COMPOSE_FILE=$3
ARGS=$4

LOCAL_PWD=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

PREFIX="run-dev-"
FUNCTION=${TARGET#"$PREFIX"}

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

# - Build Image
echocmd bash $LOCAL_PWD/build-all-submodules.sh dev "$SERVICE"

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
    "standalone")  echocmd eval "$DC up $ARGS" && echocmd eval "$DC down" ;;
    "detached")    echocmd eval "$DC up $ARGS" -d  && info "Containers started";;
    "attached")    { [ -z "$ARGS" ] && error "No container was specified (type: make dev-run-help)" && exit 1; } || \
                   echocmd eval "$DC up $ARGS" -d && \
                   echocmd eval "$DC exec $ARGS ./entrypoint.sh bash --rcfile .bashrc" && \
                   echocmd eval "$DC down" ;;
    "stop")        echocmd eval "$DC down" ;;
    *)             echocmd eval "$DC up $ARGS" ;;

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
    "standalone")  echocmd docker run "$IMAGE_TAG" && echocmd docker stop $(docker ps -a -q --filter ancestor="$IMAGE_TAG" --format="{{.ID}}") ;;
    "detached")    echocmd docker run -d "$IMAGE_TAG" && info "Container started" ;;
    "attached")    echocmd docker run "$IMAGE_TAG" ;;
    "stop")        echocmd docker stop $(docker ps -a -q --filter ancestor="$IMAGE_TAG" --format="{{.ID}}") ;;
    *)             echocmd docker run "$IMAGE_TAG" ;;
    esac
fi