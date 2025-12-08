#!/bin/bash

cd "$(dirname $0)"

# extract translations
./dc-dev.sh exec client npm run extract
./dc-dev.sh exec backend make extract-translations
./dc-dev.sh exec projector make extract-translations

# merge translations
echo "merging POT files..."
cd ../..
xgettext --no-location -o i18n/template-en.pot \
         openslides-client/client/src/assets/i18n/template-en.pot \
         openslides-backend/openslides_backend/i18n/messages/template-en.pot  \
         openslides-projector-service/locale/default.pot 
