class BaseHistoryMigration:
    """ Base class """

    depends_on = None
    operations = []

    def __init__(self, name):
        self.name = name
        self.operations = list(self.__class__.operations)
