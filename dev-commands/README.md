# `dev-commands/import-sql.sh`

Script to clear postgres DB and afterwards run SQL queries from a file (e.g.
created by `pg_dump`).
Run this after starting the dev setup with `make run-dev`.
If migrations are necessary, execute \`./dc-dev.sh restart backend\` to run them.
If autoupdate is logging errors because the DB has changed restart it by running
`./dc-dev.sh restart autoupdate`.
