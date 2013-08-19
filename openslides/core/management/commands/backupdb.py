import shutil
from optparse import make_option

import django.conf
import django.db
import django.db.transaction
from django.core.management.base import NoArgsCommand, CommandError


class Command(NoArgsCommand):
    help = "Backup the openslides database"
    option_list = NoArgsCommand.option_list + (
        make_option(
            "--destination", action="store",
            help="path to the backup database (will be overwritten)"),
    )

    def handle_noargs(self, *args, **kw):
        db_settings = django.conf.settings.DATABASES
        default = db_settings.get(django.db.DEFAULT_DB_ALIAS)
        if not default:
            raise CommandError("Default databases is not configured")

        if default.get("ENGINE") != "django.db.backends.sqlite3":
            raise CommandError(
                "Only sqlite3 databases can currently be backuped")

        src_path = default.get("NAME")
        if not src_path:
            raise CommandError("No path specified for default database")

        dest_path = kw.get("destination")
        if not dest_path:
            raise CommandError("--destination must be specified")

        self.do_backup(src_path, dest_path)

    @django.db.transaction.commit_manually
    def do_backup(self, src_path, dest_path):
        # perform a simple file-copy backup of the database
        # first we need a shared lock on the database, issuing a select()
        # will do this for us
        cursor = django.db.connection.cursor()
        cursor.execute("SELECT count(*) from sqlite_master")

        # now copy the file
        try:
            shutil.copy(src_path, dest_path)
        except IOError as e:
            raise CommandError("{0}\nDatabase backup failed!".format(e))

        # and release the lock again
        django.db.transaction.commit()
