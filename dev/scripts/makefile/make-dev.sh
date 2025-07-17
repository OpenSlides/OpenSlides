#!/bin/bash

set -e

# Import OpenSlides utils package
. "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/../util.sh"

# Used in Makefile Targets to run development contex in various ways

# Functions
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
    #6 VOLUMES      : Optional paramter to declare Volumes and other run/compose up specific commands

Flags:
    -v              : Appends '--volumes' whenever a docker compose setup is closed

Available dev functions:
    dev             : Builds and starts development images
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
    dev-build       : Builds the development image
    "
}

build()
{
    # Record time
    local PRE_TIMESTAMP=$(date +%s)

    # Build Image
    info "Building image"
    capsule make build-dev
    local RESPONSE=$?

    local POST_TIMESTAMP=$(date +%s)
    local BUILD_TIME=$(( $POST_TIMESTAMP - $PRE_TIMESTAMP ))
    # Output
    if [ "$RESPONSE" != 0 ]
    then
        error "Build image failed: $ERROR"
    elif [ "$BUILD_TIME" -le 3 ]
    then
        success "Image cached"
    else
        success "Build image successfully"
    fi
}

clean()
{
    ask y "Confirm deleting ALL images and containers?" || abort
    if [ "$(docker ps -aq)" = "" ]
    then
        info "No containers to stop"
    else
        docker stop $(docker ps -aq)
    fi

    if [ "$(docker ps -a -q)" = "" ]
    then
        info "No containers to remove"
    else
        docker rm $(docker ps -a -q)
    fi

    if [ "$(docker images -aq)" = "" ]
    then
        info "No images to remove"
    else
        docker rmi -f $(docker images -aq)
    fi
}

run()
{
    info "Running container"
    local FLAGS=$1
    local SHELL=$2
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        echocmd eval "$DC up $FLAGS $VOLUMES $ARGS"
    else
        # Already active check
        echo "$(docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}")"
        if [ "$(docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}")" = "$CONTAINER_NAME" ]
        then
            { ask y "Container already running, restart it?" && stop; } || { echo "Continue with existing container" && return; }
        fi

        # Single Container
        echocmd docker run --name "$CONTAINER_NAME"  "$FLAGS" "$VOLUMES" "$ARGS" "$IMAGE_TAG" "$SHELL"
    fi
}

attach()
{
    info "Attaching to running container"
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        local CONTAINER_TO_ENTER=$ARGS
        { [ -z "$ARGS" ] && \info "No container was specified; Service container will be taken as default" && CONTAINER_TO_ENTER="$SERVICE"; }
        echocmd eval "$DC exec $CONTAINER_TO_ENTER $USED_SHELL"
    else
        # Single Container
        echocmd docker exec -it "$CONTAINER_NAME" "$USED_SHELL"
    fi

    local CONTAINER_STATUS="$?"
    if [ "$CONTAINER_STATUS" != 0 ]; then warn "Container exit status: $CONTAINER_STATUS"; fi
}

exec()
{
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        echocmd eval "$DC exec $ARGS"
    else
        # Single Container
        echocmd docker exec "$CONTAINER_NAME" "$ARGS"
    fi
}

stop()
{
    info "Stop running container"
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        echocmd eval "$DC down $CLOSE_VOLUMES"
    else
        # Single Container
        echocmd docker stop "$CONTAINER_NAME"
        echocmd docker rm "$CONTAINER_NAME"
    fi
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
VOLUMES=$6

CONTAINER_NAME="make-dev-$SERVICE"
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

# Helpers
USER_ID=$(id -u)
GROUP_ID=$(id -g)
DC="CONTEXT=dev USER_ID=$USER_ID GROUP_ID=$GROUP_ID docker compose -f ${COMPOSE_FILE}"
IMAGE_TAG=openslides-"$SERVICE"-dev

# - Run specific function
case "$FUNCTION" in
    "help")        help ;;
    "clean")       clean ;;
    "standalone")  build && run && stop ;;
    "detached")    build && run "-d" && info "Containers started" ;;
    "attached")    build && run "-d" && attach && stop ;;
    "stop")        stop ;;
    "exec")        exec ;;
    "enter")       attach ;;
    "build")       build ;;
    "")            build && run ;;
    *)             warn "No command found matching $FUNCTION" && help ;;
esac

exit $?