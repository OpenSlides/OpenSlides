#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Fabric file for OpenSlides developers.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os
import webbrowser

from fabric.api import local
from fabric.contrib import django


def test(module='tests'):
    """
    Runs all unit tests for OpenSlides using coverage.

    The settings file in the tests directory is used, therefor the
    environment variable DJANGO_SETTINGS_MODULE is set to 'tests.settings'.
    """
    django.settings_module('tests.settings')
    local('coverage run ./manage.py test %s' % module)


def coverage_report_plain():
    """
    Runs all tests and prints the coverage report.
    """
    test()
    local('coverage report -m')


def coverage():
    """
    Runs all tests and builds the coverage html files.

    The index of these files is opened in the webbrowser in the end.
    """
    test()
    local('coverage html')
    webbrowser.open(os.path.join(os.path.dirname(__file__), 'htmlcov', 'index.html'))


def pep8():
    """
    Checks for PEP 8 errors in openslides and in tests.
    """
    local('pep8 --max-line-length=150 --exclude="urls.py," --statistics openslides')
    local('pep8 --max-line-length=150 --statistics tests')


def prepare_commit():
    """
    Does everything before a commit should be done.

    At the moment it is running the tests and check for PEP 8 errors.
    """
    test()
    pep8()


def travis_ci():
    """
    Command that is run by Travis CI.
    """
    coverage_report_plain()
    pep8()
