#!/bin/bash

# Import OpenSlides utils package
. "$(dirname "$0")/../util.sh"

# Processes various development operations

# Functions
help ()
{
    info "\
Builds and starts development related images. Intended to be called from main repository makefile

Parameters:
    #1 TARGET                   : Name of the makefile target that called this script
    #2 SERVICE                  : Name of the service to be operated on. If empty, the main repository is assumed to be operated on

Environment Variables (can be set when invoking make target):
    RUN_ARGS                 : Additional parameters that will be appended to dev-run calls
    ATTACH_CONTAINER         : Determine target container to enter for dev-attached and dev-enter
    EXEC_COMMAND             : Determine command to be called for dev-exec
    LOG_CONTAINER            : Determine target container to log for dev-log

Example: make   dev-exec   backend   EXEC_COMMAND='vote ls'
                   ^          ^               ^
                Param #1   Param #2      Env Variable
    ( This executes 'ls' in a vote-container created and maintained by a running backend compose setup )

Flags:
    no-cache             : Prevents use of cache when building docker images
    capsule              : Enables encapsulation of docker build output
    compose-local-branch : Compose setups pull service images from the main branch by default. When 'compose-local-branch' is set to true, the checked out branch of the service will be pulled instead.
                           Example: Backend-Service is locally checked-out to 'feature/xyz'. Its dev compose setup pulls 'vote' from github by referencing
                           'openslides-vote-service.git#main'. If 'compose-local-branch' is set to true, the path 'openslides-vote-service.git#feature/xyz' will be used
                           instead.

Available dev functions:
    dev             : Builds and starts development images
    dev-help        : Print help
    dev-detached    : Builds and starts development images with detach flag. This causes started containers to run in the background
    dev-attached    : Builds and starts development images; enters shell of started image.
                          If a docker compose file is declared, the \$ATTACH_CONTAINER parameter determines
                          the specific container id you will enter (default value is equal the service name)
    dev-standalone  : Builds and starts development images; closes them immediately afterwards
    dev-stop        : Stops any currently running images or docker compose file associated with the service
    dev-exec        : Executes command inside container.
                          Use \$EXEC_ARGS to declare command that should be executed.
                          If using a docker compose setup, also declare which container the command should be executed in.
                          Example: 'dev-exec RUN_ARGS=\"service-name echo hello\"' will run \"echo hello\" inside the container named \"service-name\"
    dev-enter       : Enters shell of started container.
                          If a docker compose file is declared, the \$ATTACH_CONTAINER parameter determines
                          the specific container id you will enter (default value is equal the service name)
    dev-build       : Builds the development image
    dev-log         : Prints log output of given container.
    "
}

build_capsuled()
{
    local FUNC=$1

    # Record time
    local PRE_TIMESTAMP=$(date +%s)

    # Build Image
    info "Building image"
    capsule "$FUNC"
    local RESPONSE=$?

    local POST_TIMESTAMP=$(date +%s)
    local BUILD_TIME=$(( POST_TIMESTAMP - PRE_TIMESTAMP ))
    # Output
    if [ "$RESPONSE" != 0 ]
    then
        error "Building image failed: $ERROR"
    elif [ "$BUILD_TIME" -le 3 ]
    then
        success "Image found in cache"
    else
        success "Build image successfully"
    fi
}

build()
{
    local BUILD_ARGS="";

    if [ -n "$NO_CACHE" ]; then local BUILD_ARGS="--no-cache"; fi

    # Build all submodules
    if [ "$SERVICE_FOLDER" = "" ]
    then
        if [ -n "$CAPSULE" ]
        then
            build_capsuled "dev/scripts/makefile/build-all-submodules.sh dev $BUILD_ARGS"
        else
            dev/scripts/makefile/build-all-submodules.sh dev $BUILD_ARGS
        fi
        return
    fi

    # Build specific submodule
    (
        cd "$SERVICE_FOLDER" || abort 1

        if [ -n "$CAPSULE" ]
        then
            build_capsuled "make build-dev ARGS=$BUILD_ARGS"
        else
            make build-dev ARGS=$BUILD_ARGS
        fi
    )
}

clean()
{
    info "Stopping containers"
    if [ "$(docker ps -aq)" = "" ]
    then
        info "No containers to stop"
    else
        docker stop $(docker ps -aq)
    fi

    info "Removing containers"
    if [ "$(docker ps -a -q)" = "" ]
    then
        info "No containers to remove"
    else
        docker rm $(docker ps -a -q)
    fi

    ask n "Do you want to delete ALL images as well?" || abort 0
    info "Removing images"
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
        local BUILD_ARGS="";

        if [ -n "$NO_CACHE" ]; then local BUILD_ARGS="--build --force-recreate"; fi

        # Compose
        echocmd eval "$DC up ${BUILD_ARGS} ${FLAGS} ${VOLUMES} ${RUN_ARGS}"
    else
        # Already active check
        # Either stop existing containers and continue with run() or use existing containers from now on and exit run() early
        if [ "$(docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}")" = "$CONTAINER_NAME" ]
        then
            { ask y "Container already running, restart it?" && stop; } || { echo "Continue with existing container" && return; }
        fi

        # Single Container
        echocmd docker run --name "$CONTAINER_NAME"  "$FLAGS" "$VOLUMES" "$RUN_ARGS" "$IMAGE_TAG" "$SHELL"
    fi
}

attach()
{
    local TARGET_CONTAINER=$ATTACH_CONTAINER
    info "Attaching to running container"
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose

        # Determine container to enter, in case no container was specified as a paramater
        if [ -z "$SERVICE" ] && [ -z "$TARGET_CONTAINER" ]
        then
            # Main repository case, use input prompt to determine container
            local TARGET_CONTAINER=$(input "Which service container should be entered?")
            { [ -z "$TARGET_CONTAINER" ] && \info "No service container declared, exiting" && return; }
        else
            # Submodule case
            { [ -z "$TARGET_CONTAINER" ] && \info "No container was specified; Service container will be taken as default" && local TARGET_CONTAINER="$SERVICE"; }
        fi

        echocmd eval "$DC exec $TARGET_CONTAINER $USED_SHELL"
    else
        # Single Container
        echocmd docker exec -it "$CONTAINER_NAME" "$USED_SHELL"
    fi

    local CONTAINER_STATUS="$?"
    if [ "$CONTAINER_STATUS" != 0 ]; then warn "Container exit status: $CONTAINER_STATUS"; fi
}

exec()
{
    local FUNC=$EXEC_COMMAND
    if [ -n "$COMPOSE_FILE" ]
    then
        # Compose
        echocmd eval "$DC exec $FUNC"
    else
        # Single Container
        echocmd docker exec "$CONTAINER_NAME" "$FUNC"
    fi
}

stop()
{
    info "Stop running container"
    if [ "$SERVICE_FOLDER" = "" ]
    then
        # Compose in particular service folder with docker compose file
        echocmd eval "$DC down --volumes --remove-orphans"
    elif [ -n "$COMPOSE_FILE" ]
    then
        # Compose main
        echocmd eval "$DC down $CLOSE_VOLUMES"
    else
        # Single Container
        echocmd docker stop "$CONTAINER_NAME"
        echocmd docker rm "$CONTAINER_NAME"
    fi
}

log()
{
    local TARGET_CONTAINER=$LOG_CONTAINER
    if [ -n "$COMPOSE_FILE" ]
    then
        if [ -z "$SERVICE" ] && [ -z "$TARGET_CONTAINER" ]
        then
            # Main repository case, use input prompt to determine container
            local TARGET_CONTAINER=$(input "Which service container should be logged?")
            { [ -z "$TARGET_CONTAINER" ] && \info "No service container declared, exiting" && return; }
        elif [ -n "$SERVICE" ] && [ -z "$TARGET_CONTAINER" ]
        then
            # Submodule case
            info "No container was specified; Service container will be taken as default" && local TARGET_CONTAINER="$SERVICE"
        fi

        echocmd eval "docker compose -f $COMPOSE_FILE logs $TARGET_CONTAINER"
    else
        # Single Container
        echocmd docker container logs "$CONTAINER_NAME"
    fi

}

# Setup
## Parameters
TARGET=$1
SERVICE=$2

## Parameters RUN_ARGS, ATTACH_CONTAINER, EXEC_COMMAND, LOG_CONTAINER are fetched from environment

# SERVICE contains all additionally provided make targets. This may include flags
# Extract flags here
TEMP_SERVICE=$SERVICE
SERVICE=""
for CMD in $TEMP_SERVICE; do
    case "$CMD" in
        "no-cache")     NO_CACHE=true ;;
        "capsule")      CAPSULE=true ;;
        "compose-local-branch") USE_LOCAL_BRANCH_FOR_COMPOSE=true ;;
        *)              SERVICE="$CMD" ;;
    esac
done

# Variables
SERVICE_FOLDER=""
CONTAINER_NAME="make-os-dev-$SERVICE"
USED_SHELL="sh"

# Remove ARGS flag from maketarget that's calling this script
MAKEFLAGS=
unset ARGS

# Strip 'dev', '-' and any '.o' or similar file endings that may have been automatically added from implicit rules by GNU
FUNCTION=${TARGET#"dev"}
FUNCTION=${FUNCTION#"-"}
FUNCTION=${FUNCTION%.*}

# - Extrapolate parameters depending on service
case "$SERVICE" in
    "auth")         SERVICE_FOLDER="./openslides-auth-service" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/docker-compose.dev.yml" ;;
    "autoupdate")   SERVICE_FOLDER="./openslides-autoupdate-service" ;;
    "backend")      SERVICE_FOLDER="./openslides-backend" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/dev/docker-compose.dev.yml" &&
                    USED_SHELL="bash --rcfile .bashrc" &&
                    CLOSE_VOLUMES="--volumes" ;;
    "client")       SERVICE_FOLDER="./openslides-client" &&
                    VOLUMES="-v `pwd`/client/src:/app/src -v `pwd`/client/cli:/app/cli -p 127.0.0.1:9001:9001/tcp" ;;
    "datastore")    SERVICE_FOLDER="./openslides-datastore-service" ;;
    "icc")          SERVICE_FOLDER="./openslides-icc-service" ;;
    "manage")       SERVICE_FOLDER="./openslides-manage-service" ;;
    "media")        SERVICE_FOLDER="./openslides-media-service" &&
                    COMPOSE_FILE="$SERVICE_FOLDER/docker-compose.test.yml" &&
                    USED_SHELL="bash" &&
                    if [ "$FUNCTION" = "attached" ]; then FUNCTION="media-attached"; fi ;; # Temporary fix for wait-for-it situation
    "proxy")        SERVICE_FOLDER="./openslides-proxy" ;;
    "search")       SERVICE_FOLDER="./openslides-search-service" ;;
    "vote")         SERVICE_FOLDER="./openslides-vote-service" ;;
    "")             COMPOSE_FILE="dev/docker/docker-compose.dev.yml" ;;
    *)              ;;
esac

if [ -n "$SERVICE" ]; then info "Running $FUNCTION for $SERVICE"
else info "Running $FUNCTION"; fi

# Compose dev branch checkout
COMPOSE_REFERENCE_BRANCH="main"

if [ -n "$USE_LOCAL_BRANCH_FOR_COMPOSE" ]
then
    COMPOSE_REFERENCE_BRANCH=$(git -C "$SERVICE_FOLDER" branch --show-current) && \
    info "Ditching 'main' for '$COMPOSE_REFERENCE_BRANCH' in compose setup to fetch external services"
fi

# Helpers
USER_ID=$(id -u)
GROUP_ID=$(id -g)
DC="CONTEXT=dev USER_ID=$USER_ID GROUP_ID=$GROUP_ID COMPOSE_REFERENCE_BRANCH=$COMPOSE_REFERENCE_BRANCH docker compose -f ${COMPOSE_FILE}"
IMAGE_TAG="openslides-$SERVICE-dev"

# - Run specific function
case "$FUNCTION" in
    "help")             help ;;
    "clean")            clean ;;
    "standalone")       build && run && stop ;;
    "detached")         build && run "-d" && info "Containers started" ;;
    "attached")         build && run "-d" && attach && stop ;;
    "stop")             stop ;;
    "exec")             exec ;;
    "enter")            attach ;;
    "build")            build ;;
    "log")              log ;;
    "media-attached")   build && run "-d" && EXEC_COMMAND='-T tests wait-for-it "media:9006"' && exec "$EXEC_COMMAND" && attach "tests" && stop ;; # Special case for media (for now)
    "")                 build && run ;;
    *)                  warn "No command found matching $FUNCTION" && help ;;
esac

exit $?
