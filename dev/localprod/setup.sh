#!/bin/bash

[[ -f ./openslides ]] ||
  wget https://github.com/OpenSlides/openslides-manage-service/releases/download/latest/openslides

[[ -x ./openslides ]] ||
  chmod +x ./openslides

./openslides setup .
./openslides config --config config.yml .
