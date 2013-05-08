#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.motion.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os

from django.test.client import Client

from openslides.config.api import config
from openslides.utils.test import TestCase
from openslides.participant.models import User
from openslides.motion.models import Motion
from openslides.motion.csv_import import import_motions


class CSVImport(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.create_superuser('admin', 'admin@admin.admin', 'admin')
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_example_file(self):
        csv_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'extras', 'csv-examples')
        with open(csv_dir + '/motions-demo_de.csv') as f:
            import_motions(f)
        self.assertEqual(Motion.objects.count(), 4)


