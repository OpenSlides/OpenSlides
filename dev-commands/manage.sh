#!/bin/bash
docker build openslides-manage-service/ --target manage --tag openslides-manage
docker run --network host openslides-manage $@
