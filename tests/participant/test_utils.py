#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for models of openslides.participant
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.test import TestCase

from openslides.participant.models import User
from openslides.participant.api import gen_username


class UserGenUsername(TestCase):
    """
    Tests for the function gen_username.
    """

    def test_base(self):
        self.assertEqual(gen_username('foo', 'bar'), 'foo bar')
        self.assertEqual(gen_username('foo ', '  bar\n'), 'foo bar')
        self.assertEqual(gen_username('foobar', ''), 'foobar')
        self.assertEqual(gen_username('', 'foobar'), 'foobar')
        self.assertRaises(ValueError, gen_username, '', '')

    def test_used_username(self):
        User.objects.create(username='user name')
        self.assertEqual(gen_username('user', 'name'), 'user name 1')

        User.objects.create(username='user name 1')
        self.assertEqual(gen_username('user', 'name'), 'user name 2')

    def test_umlauts(self):
        self.assertEqual(gen_username('äöü', 'ßüäö'), 'äöü ßüäö')
