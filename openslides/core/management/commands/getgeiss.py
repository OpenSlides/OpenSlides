import json
import os
import stat
import sys
from urllib.request import urlopen, urlretrieve

from django.core.management.base import BaseCommand, CommandError

from openslides.utils.main import get_geiss_path


class Command(BaseCommand):
    """
    Command to get the latest release of Geiss from GitHub.
    """
    help = 'Get the latest Geiss release from GitHub.'

    def handle(self, *args, **options):
        geiss_github_name = self.get_geiss_github_name()
        download_file = get_geiss_path()

        if os.path.isfile(download_file):
            # Geiss does probably exist. Do nothing.
            # TODO: Add an update flag, that downloads geiss anyway.
            return

        response = urlopen(self.get_geiss_url()).read()
        release = json.loads(response.decode())
        download_url = None
        for asset in release['assets']:
            if asset['name'] == geiss_github_name:
                download_url = asset['browser_download_url']
                break
        if download_url is None:
            raise CommandError("Could not find download URL in release.")

        urlretrieve(download_url, download_file)

        # Set the executable bit on the file. This will do nothing on windows
        st = os.stat(download_file)
        os.chmod(download_file, st.st_mode | stat.S_IEXEC)

        self.stdout.write(self.style.SUCCESS('Geiss successfully downloaded.'))

    def get_geiss_url(self):
        """
        Returns the URL to the API which gives the information which Geiss
        binary has to be downloaded.

        Currently this is a static GitHub URL to the repository where geiss
        is hosted at the moment.
        """
        # TODO: Use a settings variable or a command line flag in the future.
        return 'https://api.github.com/repos/ostcar/geiss/releases/latest'

    def get_geiss_github_name(self):
        """
        Returns the name of the Geiss executable for the current operating
        system.

        For example geiss_windows_64 on a windows64 platform.
        """
        # This will be 32 if the current python interpreter has only
        # 32 bit, even if it is run on a 64 bit operating sysem.
        bits = '64' if sys.maxsize > 2**32 else '32'

        geiss_names = {
            'linux': 'geiss_linux_{bits}',
            'win32': 'geiss_windows_{bits}.exe',  # Yes, it is win32, even on a win64 system!
            'darwin': 'geiss_mac_{bits}'}

        try:
            return geiss_names[sys.platform].format(bits=bits)
        except KeyError:
            raise CommandError("Plattform {} is not supported by Geiss".format(sys.platform))
