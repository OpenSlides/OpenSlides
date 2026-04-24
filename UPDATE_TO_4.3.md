
The goal of this document is to provide a basic technical understanding what
changes are included in OpenSlides 4.3.0 as well as provide steps to perform
the upgrade.


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
in the `collections` folder. See the `README.md` for more details on the
format.

The initial implementation to store the application data following this
structure was the _datastore_. Written in python it used a PostgreSQL DB as
backend to store _models_ into a single table, mapping _FQIDs_ to JSON objects
containing _fields_ as keys and their respective values. This results in the
SQL schema definition being rather simple.


## Changes in 4.3.0

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


## How to upgrade safely

The migration `100` will move **all** data into new tables and finally delete
the table that originally held it. We have done a lot of testing and prepared
steps to follow and tools to use to help guide through this process. Still,
before starting the upgrade it is more than advisable (!) to have a recent
backup of the database. See
[INSTALL.md](https://github.com/OpenSlides/OpenSlides/blob/main/INSTALL.md#database-dump)
for help with that.

In addition to the SQL dump (which can be used to restore the DB to the
captured state) we also recommend to dump all _models_ in JSON form using the
`get_everything.py` script. After the upgrade procedure is complete we can get
a new _models_ dump of the same format and use a script to systematically
compare them and verify all data is still there and intact.

    TODO: more datail / instructions

Before starting the big migration `100` all previous migrations must be
executed in order to prepare the data and solving known issues that would cause
migration `100` to fail.

    TODO: more datail / instructions

Now we can run migration `100`

    TODO: more datail / instructions

Run `get_everything.py` again and verify using `models_diff.py`.

    TODO: more datail / instructions


## Good to know

### MI -1 caveat

Before running migration `100` current MI will be shown to be one lower than we
previously migrated to.
This is due to changes in how migrations are handled internally. It might raise
an eyebrow, but is not to be worried about.
