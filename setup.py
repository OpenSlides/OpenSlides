#!/usr/bin/env python

from setuptools import find_packages, setup

from openslides import __author__ as openslides_author
from openslides import __description__ as openslides_description
from openslides import __version__ as openslides_version

with open('README.rst') as readme:
    long_description = readme.read()

with open('requirements_production.txt') as requirements_production:
    install_requires = requirements_production.readlines()

setup(
    name='openslides',
    author=openslides_author,
    author_email='support@openslides.org',
    description=openslides_description,
    license='MIT',
    long_description=long_description,
    url='https://openslides.org',
    version=openslides_version,

    classifiers=[
        # http://pypi.python.org/pypi?%3Aaction=list_classifiers
        # 'Development Status :: 3 - Alpha',
        'Development Status :: 4 - Beta',
        # 'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Framework :: Django',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5', ],
    packages=find_packages(exclude=['tests', 'tests.*']),
    include_package_data=True,
    install_requires=install_requires,
    entry_points={'console_scripts': ['openslides = openslides.__main__:main']})
