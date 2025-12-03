#!/bin/bash

cd "$(dirname $0)"
cd ../..
for f in i18n/*.po; do [ -e "$f" ] || continue;
    echo $f
    PO_LANG=$(basename "$f" .po)
    cp $f openslides-client/client/src/assets/i18n/
    cp $f openslides-backend/openslides_backend/i18n/messages/
    mkdir -p "openslides-projector-service/locale/$PO_LANG"
    cp $f "openslides-projector-service/locale/$PO_LANG/default.po"
done
