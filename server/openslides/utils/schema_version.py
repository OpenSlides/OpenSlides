from typing import Optional

from django.db.models import Max
from mypy_extensions import TypedDict

from . import logging


logger = logging.getLogger(__name__)
SchemaVersion = TypedDict("SchemaVersion", {"migration": int, "config": int, "db": str})


class SchemaVersionHandler:
    """
    Handler for the schema version of this running OpenSlides instance.
    What is a schema version? This is an indictor of the current schema of the data
    in the database, config variables, and the database itself. E.b. with a migration,
    new/changed config variables or with a database change, the schema of the data changes.

    To detect this is needed to reset the cache, so it does not hold any old data. This
    affects the server cache, but also the client uses this technique to flush the cache.

    Get the current schema with `get`. The schema version is built just once. After a change
    in the schema, all workers needs a restart!
    """

    def __init__(self) -> None:
        self._schema_version: Optional[SchemaVersion] = None

    def get(self) -> SchemaVersion:
        if self._schema_version is not None:
            return self._schema_version

        from django.db.migrations.recorder import MigrationRecorder

        migration = MigrationRecorder.Migration.objects.aggregate(Max("id"))["id__max"]

        from openslides.core.config import ConfigStore

        try:
            config = ConfigStore.objects.get(key="config_version").value
        except ConfigStore.DoesNotExist:
            config = 0
        try:
            db = ConfigStore.objects.get(key="db_id").value
        except ConfigStore.DoesNotExist:
            db = ""

        self._schema_version = {"migration": migration, "config": config, "db": db}
        return self._schema_version

    def compare(self, other: Optional[SchemaVersion]) -> bool:
        current = self.get()

        if not other:
            logger.info("No old schema version")
            return False

        equal = True
        if current["db"] != other["db"]:
            other_db = other["db"] or "<empty>"
            logger.info(f"DB changed from {other_db} to {current['db']}")
            equal = False
        if current["config"] != other["config"]:
            other_config = other["config"] or "<empty>"
            logger.info(f"Config changed from {other_config} to {current['config']}")
            equal = False
        if current["migration"] != other["migration"]:
            logger.info(
                f"Migration changed from {other['migration']} to {current['migration']}"
            )
            equal = False
        return equal

    def log_current(self) -> None:
        current = self.get()
        logger.info(
            f"""Schema version:
    DB:        {current["db"]}
    migration: {current["migration"]}
    config:    {current["config"]}"""
        )


schema_version_handler = SchemaVersionHandler()
