import os
from typing import Any, Dict

from django.conf import settings
from django.contrib.staticfiles.management.commands.collectstatic import \
    Command as CollectStatic
from django.core.management.base import CommandError
from django.db.utils import OperationalError

from ...views import WebclientJavaScriptView


class Command(CollectStatic):
    """
    Custom collectstatic command.
    """
    realms = ['site', 'projector']
    js_filename = 'webclient-{}.js'

    def handle(self, **options: Any) -> str:
        try:
            self.view = WebclientJavaScriptView()
        except OperationalError:
            raise CommandError('You have to run OpenSlides first to create a ' +
                               'database before collecting staticfiles.')
        return super().handle(**options)

    def collect(self) -> Dict[str, Any]:
        try:
            destination_dir = os.path.join(settings.STATICFILES_DIRS[0], 'js')
        except IndexError:
            # If the user does not want do have staticfiles, he should not get
            # the webclient files either.
            pass
        else:
            if not os.path.exists(destination_dir):
                os.makedirs(destination_dir)

            for realm in self.realms:
                filename = self.js_filename.format(realm)
                content = self.view.get(realm=realm).content
                path = os.path.join(destination_dir, filename)
                with open(path, 'wb+') as f:
                    f.write(content)
                self.stdout.write("Written WebclientJavaScriptView for realm {} to '{}'".format(
                    realm,
                    path))

        return super().collect()
