#!/usr/bin/env python
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages
from openslides import get_version


with open('README.rst') as readme:
    long_description = readme.read()


with open('requirements_production.txt') as requirements_production:
    install_requires = requirements_production.readlines()


# For Python 2.6 support
install_requires.append('argparse==1.2.1')


setup(
    name='openslides',
    version=get_version(),
    author='OpenSlides-Team',
    author_email='support@openslides.org',
    url='http://openslides.org',
    description='Presentation and assembly system',
    long_description=long_description,
    classifiers=[
        # http://pypi.python.org/pypi?%3Aaction=list_classifiers
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Intended Audience :: Other Audience',
        'Framework :: Django',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
    ],
    license='MIT',
    packages=find_packages(exclude=['tests', 'tests.*']),
    include_package_data=True,
    install_requires=install_requires,
    entry_points={'console_scripts': ['openslides = openslides.__main__:main']})
