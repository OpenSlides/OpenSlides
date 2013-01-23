# -*- coding: utf-8 -*-
"""
    Start script for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.

"""

from django.core.management.base import BaseCommand

from openslides.main import main


class Command(BaseCommand):
    '''
    Start the application using the tornado webserver
    '''

    help = 'Start the application using the tornado webserver'

    def handle(self, *args, **options):
        main(check_args=False)
