#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.management.commands.syncdb
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Overrides the Django syncdb command to setup the database.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.core.management.commands.syncdb import Command as _Command

from openslides.core.signals import post_database_setup


class Command(_Command):
    """
    Setup the database and sends the signal post_database_setup.
    """
    def handle_noargs(self, *args, **kwargs):
        return_value = super(Command, self).handle_noargs(*args, **kwargs)
        post_database_setup.send(sender=self)
        return return_value
