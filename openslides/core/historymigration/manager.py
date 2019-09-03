from .loader import HistoryMigrationLoader


class HistoryMigrationManager:
    def __init__(self):
        pass

    def load_migrations(self):
        loader = HistoryMigrationLoader()
        self.migrations = loader.load_migrations()

    def get_current_migration_id(self):
        return len(self.migrations)
