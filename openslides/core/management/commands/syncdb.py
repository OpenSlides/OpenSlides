# -*- coding: utf-8 -*-

from django.core.management.commands.syncdb import Command as _Command

from openslides.core.signals import post_database_setup


class Command(_Command):
    """
    Setup the database and sends the signal post_database_setup.
    """
    def handle_noargs(self, *args, **kwargs):
        """
        Calls Django's syncdb command but always in non-interactive mode. After
        this it sends our post_database_setup signal.
        """
        interactive = kwargs.get('interactive', False)
        kwargs['interactive'] = False
        return_value = super(Command, self).handle_noargs(*args, **kwargs)
        post_database_setup.send(sender=self)

        if interactive:
            print('Interactive mode (e. g. creating a superuser) is not possibile '
                  'in OpenSlides. A superuser is automaticly created.')
        return return_value
