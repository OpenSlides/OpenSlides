#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.management.commands.runserver
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Overrides the Django runserver command to start the tornado webserver.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.

"""

from django.core.management.base import BaseCommand

from openslides.main import main


class Command(BaseCommand):
    """
    Start the application using the tornado webserver
    """

    help = 'Start the application using the tornado webserver'

    def handle(self, *args, **options):
        main(manage_runserver=True)
