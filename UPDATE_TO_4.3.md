
The goal of this document is to provide a basic technical understanding what
changes are included in OpenSlides 4.3.0 as well as provide a guide to
performing the upgrade. It is recommended to read the whole document before
starting the procedure. Skip to [How to upgrade safely](#how-to-upgrade-safely)
if you're only looking for steps to follow.


## Collections, Fields, Models, Datastore ... what exactly?

Since the implementation of OpenSlides 4 the structure of the application data
was defined as a set of _collections_, each having a set of _fields_ that hold
data of different types. Among others a _field_ can be of type _relation_ and
it's value be pointing to another _collection_ - this is how links are created
within the data.

When storing data, an instance of a _collection_ is created holding the
concrete values for the _fields_. It is identifiable with a fully qualified ID
(_FQID_) of the form `<collection>/<id>` (f.e. `user/42`) and is commonly
referred to as a _model_.

The technical definition of this is kept in the
[openslides-meta](https://github.com/OpenSlides/openslides-meta) repository.
The complete structure with all _collections_ and their _fields_ can be found
in the `collections` folder. See the
[README.md](https://github.com/OpenSlides/openslides-meta/blob/main/README.md)
for more details on the format.

The initial implementation to store the application data following this
structure was the _datastore_. Written in python it used a PostgreSQL DB as
backend to store _models_ into a single table, mapping _FQIDs_ to JSON objects
containing _fields_ as keys and their respective values. This results in the
SQL schema definition being rather simple.


## Changes in 4.3.0


### Datastore removed

With OpenSlides `4.3.0` the datastore is removed and the data structure defined
in [openslides-meta](https://github.com/OpenSlides/openslides-meta) is
translated into a more traditional and much more explicit SQL schema. This also
involves a lot of changes in the backend. However since the semantic structure
remains unchanged, all user facing functionality in the
[openslides-client](https://github.com/OpenSlides/openslides-client) also stays
the same.

When upgrading to OpenSlides 4.3.0 all data contained in the `models` table
used by the obsolete _datastore_ is migrated into the new tables defined by
[`schema_relational.sql`](https://github.com/OpenSlides/openslides-meta/blob/main/dev/sql/schema_relational.sql)
(which is generated from the
[`collections`](https://github.com/OpenSlides/openslides-meta/tree/main/collections))
definitions. This is done by migration `100`.


### manage-tool replaced

Until now we have provided the `openslides` binary (developed in the
`openslides-manage-service` repository) to create a compose file from a
built-in template as well as call actions on the backend such as migrations.

This tool has been rewritten (in the `openslides-cli` repository) and renamed
to `osmanage`, aiming to provide the same features (and more) while simplifying
the architecture and the templating functionality.

Most notably the provided and recommended template for docker compose is no
longer embedded in the binary but instead now resides in the [contrib
folder](https://github.com/OpenSlides/openslides-cli/tree/main/contrib). A new
example config can also be found there. As the templating mechanism now
interpretes templates and config completely generically, there are also no more
compiled-in defaults and all values must be set either in the provided config
or template file.

> [!IMPORTANT]
> If you built scipts or other automations on top of the old manage tool, they
> are now very likely to break.

Please refer to the updated
[INSTALL.md](https://github.com/OpenSlides/OpenSlides/blob/main/INSTALL.md),
[openslides-cli/README.md](https://github.com/OpenSlides/openslides-cli/blob/main/README.md)
or the `--help` messages for details.


## How to upgrade safely

The migration `100` will move **all** data into new tables and finally delete
the table that originally held it. We have done a lot of testing and prepared
steps to follow and tools to use to help guide through this process.
Most steps will be consistent with what is described in
[INSTALL.md](https://github.com/OpenSlides/OpenSlides/blob/main/INSTALL.md)
For reference the old version can be found on the [`stable/4.2.x`
branch](https://github.com/OpenSlides/OpenSlides/blob/stable/4.2.x/INSTALL.md)

Since the major version of the PostgreSQL database is upgraded to `17`, a
database dump is not only advisable but mandatory. As updating to 4.3.0
requires upgrading to an intermediate version, the guide will create two dumps
in order to be able to revert to either version.

In addition to the SQL dump (which can be used to restore the DB to the
captured state) we also recommend to export all _models_ in JSON form using the
`get_everything.py` script. After the upgrade procedure is complete we can get
a new _models_ export of the same format and use a script to systematically
compare them and verify all data is still there and intact.


### Backup 4.2.29 (SQL dump)

First we create a DB dump to be able to revert to this in case anything goes
wrong.

    # Create a directory for storing backup data
    mkdir /some/safe/place
    docker compose exec --user postgres postgres pg_dump -U openslides > /some/safe/place/dump-4.2.29.sql

### Update to 4.2.30

Now we have to upgrade to the intermediate version `4.2.30` which should not be
used in production and only includes some migrations we need to run before
upgrading to `4.3.0`.

So we adjust our `config.yml` file.

    defaults:
      tag: 4.2.30

And deploy the new version.

    ./openslides config -c config.yml .
    docker compose up -d

Now run the migrations.

    ./openslides migrations stats
    ./openslides migrations finalize

### Backup 4.2.30 (JSON export, SQL dump)

Now the database is prepared and ready for migration to `4.3.0`.
In order to verify the data afterwards we will now export all data in JSON
format.

    docker compose exec backendManage bash
    # Now we are inside the backend container
    python cli/get_everything.py > data/d1.json
    exit
    # Now we are back on the host
    docker compose cp backendManage:/app/data/d1.json /some/safe/place/d1.json

We also need a new DB dump to insert after upgrading to new PostgreSQL version
`17`.

    docker compose exec --user postgres postgres pg_dump -U openslides > /some/safe/place/dump-4.2.30.sql

### Prepare Update to 4.3.0 (install osmanage, set env vars)

Next we will prepare for the actual update.

For compatibility we edit our `config.yml` to set two values explicitly.

    defaults:
      containerRegistry: ghcr.io/openslides/openslides
      tag: 4.3.0

Also the we will execute migration `100` soon. It will require two environment
variables to be set. Part of the migration is setting the new `time_zone` field
for existing meetings. Please set as is appropriate for your instance. We
prepare this by adding to our `config.yml`:

    services:
      backendManage:
        environment:
          MIG0100_I_READ_DOCS: '1'
          MIG0100_TIMEZONE: 'Europe/Berlin'

Since the old manage tool (`openslides`) was replaced by a new one
(`osmanage`), we will now fetch that together with accompanying template file
for regenerating our compose file with it later.

    wget https://github.com/OpenSlides/openslides-cli/releases/download/latest/osmanage
    wget https://raw.githubusercontent.com/OpenSlides/openslides-cli/refs/heads/main/contrib/docker-compose.yml.tmpl
    chmod +x osmanage

### Update to 4.3.0

Now we need to shutdown the instance and also remove the volumes.

> [!WARNING]
> If the SQL dump during [Backup 4.2.30](#backup-4230-json-export-sql-dump) did not work for any reason you will lose all your data!

Be sure you did the SQL dump.

Take a deep breath and shutdown your instance with also removing volumes.

    docker compose down --volumes

For deploying the new version, we start with only starting postgres.

    # For comparison we can keep the old compose file
    mv docker-compose.yml docker-compose.yml.old
    # --force is needed when overwriting
    ./osmanage config -c config.yml -t docker-compose.yml.tmpl .
    # Start PostgreSQL
    docker compose up -d postgres

Insert the data

    docker compose exec --no-TTY --user postgres postgres psql -U openslides < /some/safe/place/dump-4.2.30.sql

Start the remaining services

    docker compose up -d

Run migration `100`

    ./osmanage migrations stats
    ./osmanage migrations migrate
    ./osmanage migrations finalize

### Verify Data (JSON export, models diff)

Finally we can compare the application data, we exported as JSON earlier, to
the data present after the migration using a python script included in the
backend.

We start by copying the earlier export (`d1.json`) into the new backend container.

    # Copy `d1.json`
    docker compose cp /some/safe/place/d1.json backendManage:/app/data/d1.json

Next we do a new JSON export (`d2.json`) in much the same way

    docker compose exec backendManage bash
    # Now we are inside the backend container
    source scripts/export_database_variables.sh
    python cli/get_everything.py > data/d2.json
    # The /app/data/ folder now contains d1.json and d2.json

Lastly we call the script to automatically compare all data.  Differences will
be reported.

    # Still inside the backend container
    cd meta
    python dev/scripts/models_diff.py -v /app/data/d1.json /app/data/d2.json

Please investigate the output carefully. For varying degree of detail you can
provide zero to five verbose flags (`-vvvvv`). If some of the output concerns
you, we are prepared to discuss that publicly in a GitHub issue.

Congratulations, the database is now migrated to the new schema, the data
verified and OpenSlides ready to use.


## Good to know

### defaults for containerRegistry and tag

Since the new manage tool (`osmanage`) no longer contains compiled in defaults
for executing templates `defaults.containerRegistry` and `defaults.tag` must
now be set explicitly in `config.yml`. Like so:

    defaults:
      containerRegistry: ghcr.io/openslides/openslides
      tag: 4.3.X

Depending on how TLS is setup it may be necessary now to set options explictly
in `config.yml`. Like so:

    enableLocalHTTPS: true

For most values the provided template contains reasonable defaults.

### MI -1 caveat

Before running migration `100` current MI will be shown to be one lower than we
previously migrated to.
This is due to changes in how migrations are handled internally. It might raise
an eyebrow, but is not to be worried about.
