#!/bin/bash

set -e

curl --header "Content-Type: application/json" -d '' http://localhost:9011/internal/datastore/writer/truncate_db
