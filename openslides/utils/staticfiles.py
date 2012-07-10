#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.staticfiles
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    StaticFiels fix for the django bug #18404.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os
import sys

from django.core.files.storage import FileSystemStorage
from django.utils.importlib import import_module
from django.contrib.staticfiles.finders import (
    AppDirectoriesFinder as _AppDirectoriesFinder)


# This is basically a copy of
# django.contrib.staticfiles.storage.AppStaticStorage
# with the fix for django bug #18404 applied
# see  https://code.djangoproject.com/ticket/18404 for details
class AppStaticStorage(FileSystemStorage):
    """
    A file system storage backend that takes an app module and works
    for the ``static`` directory of it.
    """
    prefix = None
    source_dir = 'static'

    def __init__(self, app, *args, **kwargs):
        """
        Returns a static file storage if available in the given app.
        """
        # app is the actual app module
        mod = import_module(app)
        mod_path = os.path.dirname(mod.__file__)
        location = os.path.join(mod_path, self.source_dir)
        fs_encoding = sys.getfilesystemencoding() or sys.getdefaultencoding()
        location = location.decode(fs_encoding)
        super(AppStaticStorage, self).__init__(location, *args, **kwargs)


class AppDirectoriesFinder(_AppDirectoriesFinder):
    storage_class = AppStaticStorage
