import pkgutil
import sys
from importlib import import_module, reload

from .exceptions import (
    BadHistoryMigrationError,
    InvalidMigrationNameError,
    DuplicateNumberError,
    MissingMigrationError
)


BASE_MODULE = __name__.replace("loader", "migrations")


class HistoryMigrationLoader:
    migration_name_regex = re.compile("^(\d+)_.+$")

    def __init__(self):
        self.migrations = []


    def load_migrations(self):
        was_loaded = BASE_MODULE in sys.modules
        module = import_module(BASE_MODULE)
        # Force a reload if it's already loaded (tests need this)
        if was_loaded:
            reload(module)

        migration_names = {
            name
            for _, name, is_pkg in pkgutil.iter_modules(module.__path__)
            if not is_pkg and name[0] not in "_~"
        }

        # Verify naming schema
        number_name_mapping = {}
        for migration_name in migration_names:
            match = self.migration_name_regex.match(migration_name)
            if not match:
                raise InvalidMigrationNameError(f'Migration "{migration_name}" does not follow the naming schema "<number>_<description>"')
            number = int(match.groups()[0])
            if number in number_name_mapping:
                raise DuplicateNumberError(f"A migration with the number {number} already exists.")
            number_name_mapping[number] = migration_name

        # load migrations
        expected_max_number = len(number_name_mapping.keys())
        for expected_number in number_name_mapping.keys():
            if expected_number not in number_name_mapping:
                raise MissingMigrationError(f"Migration with number {expected_number} is missing")

            migration_name = number_name_mapping(expected_number)
            migration_path = f"{BASE_MODULE}.{migration_name}"
            migration_module = import_module(migration_path)
            if not hasattr(migration_module, "HistoryMigration"):
                raise BadHistoryMigrationError(
                    f"Migration {migration_name} has no HistoryMigration class"
                )
            self.migrations.append(migration_module.HistoryMigration(
                migration_name, expected_number
            ))
        return self.migration
