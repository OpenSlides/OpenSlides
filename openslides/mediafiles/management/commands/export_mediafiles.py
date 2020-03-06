import mimetypes
from typing import cast

from django.core.management.base import BaseCommand

from openslides.mediafiles.models import Mediafile


class Command(BaseCommand):
    help = "Exports all mediafiles for the external media service."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default="mediafiles.sql",
            help="Path for the mediafile sql file. (Default: mediafiles.sql).",
        )

    def handle(self, *args, **options):
        path = cast(str, options.get("path"))

        mediafile_count = 0
        with open(path, "w") as f:
            f.write("-- Generated file to import into the media service db\n")

            for mediafile in Mediafile.objects.filter(is_directory=False):
                mediafile_count += 1
                id = mediafile.id
                mimetype = mimetypes.guess_type(mediafile.mediafile.name)[0]
                f.write("\nINSERT INTO mediafile_data (id, mimetype, data) VALUES ")
                f.write(f"({id}, '{mimetype}', decode('")

                file_handle = open(mediafile.mediafile.path, "rb")
                for chunk in self.read_in_chunks(file_handle):
                    f.write(chunk.hex())
                f.write("', 'hex'));\n")

        self.stdout.write(
            self.style.SUCCESS(
                f"All {mediafile_count} mediafiles successfully exported into {path}."
            )
        )

    def read_in_chunks(self, file_handle, chunk_size=1024):
        """
        Generator to read a file piece by piece. Default chunk size is 1K
        """
        while True:
            data = file_handle.read(chunk_size)
            if not data:
                break
            yield data
