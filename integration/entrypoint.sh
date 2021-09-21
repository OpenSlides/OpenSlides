#!/bin/bash

# -------------------------------------------------------------------
# Copyright (C) 2020 by Intevation GmbH
# Author(s):
# Sean Engelhardt <sean.engelhardt@intevation.de>
#
# This program is distributed under the MIT license, as described
# in the LICENSE file included with the distribution.
# SPDX-License-Identifier: MIT
# -------------------------------------------------------------------

HOST="https://host.docker.internal:8000"

echo "wait until OpenSlides is up"
until [[ $(curl -k -s -o /dev/null -w %{http_code} $HOST) -eq 200 ]];
do
    sleep 5
done
echo ready

exec npx cypress run