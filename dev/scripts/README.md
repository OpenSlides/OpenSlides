# Scripts

This folder gathers some useful scripts when developing OpenSlides. Most of the scripts only work in
dev mode and are neither tested nor recommended for use on productive instances.

For ease of use, consider adding this folder to your `$PATH` to be able to call the scripts from
anywhere in the repository.

## `clear-ds.sh`

Shorthand to call the `truncate_db` route of the writer via curl.

## `db.sh`

Shorthand to get to a psql shell inside the postgres container.

## `dc-dev.sh`

Shorthand script to not have to type out the whole docker compose command every time one wants to
access a container. It is not a standalone program - supply docker compose command and options as args
as you would to `docker compose`.

## `export-ds.sh`

Dumps the current content of the datastore as a JSON file into the file provided as argument
(`export.json` by default) by calling the `get_everything` route of the reader.

## `reset-db-import-sql.sh`

Script to clear postgres DB and afterwards run SQL queries from a file (e.g.
created by `pg_dump`) using `import-events.sh` from the datastores cli scripts.
Run this after starting the dev setup with `make dev`.
To ensure consistent data output the autoupdate and depending services are
recreated after the import.
If migrations are necessary, please run \`./dc-dev.sh restart backend\` to
apply them.

## `services-to-main.sh`

Reset the heads of all submodules to the upstream's main branch. See `--help` for details.

## `set-ds.sh`

Similar to `reset-db-import-sql.sh`, but accepts a JSON file as input (uses the `example-data.json`
by default).

## `strip-meta-fieds.py`

Helper script used by `export-ds.sh` to remove all meta fields from the output.
