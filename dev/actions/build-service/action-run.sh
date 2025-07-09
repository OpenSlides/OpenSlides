#!/bin/bash

chmod +x ${GITHUB_ACTION_PATH}/../../scripts/makefile/build-service.sh
${GITHUB_ACTION_PATH}/../../scripts/makefile/build-service.sh ${SERVICE} ${CONTEXT} ${MODULE} ${PORT}