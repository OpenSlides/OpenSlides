#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.test
    ~~~~~~~~~~~~~~~~~~~~~

    Unit test class.

    :copyright: 2011-2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""


from django.test import TestCase as _TestCase

from openslides.core.signals import post_database_setup
from openslides.config.api import config


class TestCase(_TestCase):
    """
    Overwrites Django's TestCase class to call the post_database_setup
    signal after the preparation of every test. Also refreshs the config cache.
    """
    def _pre_setup(self, *args, **kwargs):
        return_value = super(TestCase, self)._pre_setup(*args, **kwargs)
        post_database_setup.send(sender=self)
        config.setup_cache()
        return return_value
