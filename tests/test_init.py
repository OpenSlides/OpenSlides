#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Unit test for OpenSlides __init__.py

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides import get_version, get_git_commit_id
from openslides.utils.test import TestCase


class InitTest(TestCase):
    def test_get_version(self):
        """
        Tests the method during development process and for releases.
        """
        self.assertEqual(get_version(version=(1, 3, 0, 'beta', 2), release=False), '1.3b2-dev')
        self.assertEqual(get_version(version=(1, 0, 0, 'final', 0), release=False), '1.0-dev')
        self.assertEqual(get_version(version=(2, 5, 3, 'alpha', 0), release=False), '2.5.3a0-dev')
        self.assertEqual(get_version(version=(1, 3, 0, 'beta', 2), release=True), '1.3b2')
        self.assertEqual(get_version(version=(1, 0, 0, 'final', 0), release=True), '1.0')
        self.assertEqual(get_version(version=(2, 5, 3, 'alpha', 0), release=True), '2.5.3a0')
        self.assertEqual(get_version(version=(2, 5, 3, 'final', 0), release=True), '2.5.3')

    def test_get_git_commit_id(self):
        """
        Tests the lenght of the git commit id.
        """
        git_commit_id = get_git_commit_id()
        if not git_commit_id == 'unknown':
            self.assertEqual(len(git_commit_id), 40)
