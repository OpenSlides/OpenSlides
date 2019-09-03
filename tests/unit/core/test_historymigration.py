import pytest
from unittest.mock import patch
from openslides.core.historymigration import BaseHistoryMigration
from openslides.core.historymigration.loader import HistoryMigrationLoader
from openslides.core.historymigration.exceptions import BadHistoryMigrationError, InvalidMigrationNameError, DuplicateNumberError, MissingMigrationError

class THistoryMigration(BaseHistoryMigration):
    def __init__(self, name, depends_on):
        self.name = name
        self.depends_on = depends_on


def load_migrations(*migrations):
    loader = HistoryMigrationLoader()
    for migration in migrations:
        loader.migrations[migration.name] = migration
    return loader

@patch("importlib.import_module")
@patch("importlib.reload")
@patch("pkgutil.iter_modules")
def test_correct_migration_chain(mock_iter_modules, mock_reload, mock_import_module):
    mock_iter_modules.return_value = [
        (None, "1_initial", False),
        (None, "1_initial", False),
        (None, "1_initial", False),
    ]
    loader = load_migrations(migration1, migration2, migration3)

    loader.build_chain()
    assert loader.migration_chain == [migration1, migration2, migration3]

def test_no_migrations():
    loader = load_migrations()
    with pytest.raises(NoInitialMigrationError):
        loader.build_chain()

def test_not_existing_dependency_migration():
    migration = THistoryMigration("2_stuff", "1_initial")
    loader = load_migrations(migration)

    with pytest.raises(MigrationDoesNotExistsError):
        loader.build_chain()
