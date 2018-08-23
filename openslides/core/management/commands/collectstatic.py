import os
from typing import Any, Dict

from django.conf import settings
from django.contrib.staticfiles.management.commands.collectstatic import \
    Command as CollectStatic
from django.contrib.staticfiles.utils import matches_patterns
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
        if options['link']:
            raise CommandError("Option 'link' is not supported.")
        try:
            self.view = WebclientJavaScriptView()
        except OperationalError:
            raise CommandError('You have to run OpenSlides first to create a ' +
                               'database before collecting staticfiles.')
        return super().handle(**options)

    def collect(self) -> Dict[str, Any]:
        result = super().collect()

        try:
            destination_dir = os.path.join(settings.STATIC_ROOT, 'js')
        except IndexError:
            # If the user does not want do have staticfiles, he should not get
            # the webclient files either.
            pass
        else:
            if self.dry_run:
                self.log('Pretending to write WebclientJavaScriptView for all realms.', level=1)
            else:
                if not os.path.exists(destination_dir):
                    os.makedirs(destination_dir)

                for realm in self.realms:
                    filename = self.js_filename.format(realm)
                    # Matches only the basename.
                    if matches_patterns(filename, self.ignore_patterns):
                        continue
                    path = os.path.join(destination_dir, filename)
                    if matches_patterns(path, self.ignore_patterns):
                        continue

                    content = self.view.get(realm=realm).content
                    with open(path, 'wb+') as f:
                        f.write(content)
                    message = "Written WebclientJavaScriptView for realm {} to '{}'".format(
                        realm,
                        path)
                    self.log(message, level=1)
                    result['modified'].append(path)

        return result
