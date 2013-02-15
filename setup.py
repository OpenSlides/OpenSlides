#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Setup script for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from setuptools import setup
from setuptools import find_packages
from openslides import get_version


with open('README.txt') as file:
    long_description = file.read()

setup(
    name='openslides',
    description='Presentation and assembly system',
    long_description=long_description,
    version=get_version(),
    url='http://openslides.org',
    author='OpenSlides-Team',
    author_email='support@openslides.org',
    license='GPL2+',
    packages=find_packages(exclude=['tests']),
    include_package_data = True,
    classifiers = [
        # http://pypi.python.org/pypi?%3Aaction=list_classifiers
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Intended Audience :: Other Audience',
        'Framework :: Django',
        'License :: OSI Approved :: GNU General Public License (GPL)',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
    ],
    setup_requires=[
        'versiontools >= 1.6',
    ],
    install_requires=[
        'django >= 1.5',
        'django-mptt',
        'reportlab',
        'pil',
    ],
    entry_points={
        'console_scripts': [
            'openslides = openslides.main:main',
        ],
    },
)
