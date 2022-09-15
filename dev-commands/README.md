# `dev-commands/import-sql.sh`

Script to clear postgres DB and afterwards run SQL queries from a file (e.g.
created by `pg_dump`) using `import-events.sh` from the datastores cli scripts.
Run this after starting the dev setup with `make run-dev`.
To ensure consistend data output the autoupdate and depending services are
recreated after the import.
If migrations are necessary, please run \`./dc-dev.sh restart backend\` to
apply them.
