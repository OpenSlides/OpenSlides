#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.mediafile.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the mediafile app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import mimetypes

from django.db import models
from django.utils.translation import ugettext_noop


class Mediafile(models.Model):
    """
    Class for uploaded files which can be delivered under a certain url.
    """

    mediafile = models.FileField(upload_to='file')
    """A FileField, see https://docs.djangoproject.com/en/dev/ref/models/fields/#filefield for more information."""

    title = models.CharField(max_length=255, unique=True)
    """A string representing the title of the file."""

    uploader = models.CharField(max_length=255, blank=True)  # TODO: Use a PersonField here when the person api is cleaned up.
    """An optional string for the name of the uploader."""

    timestamp = models.DateTimeField(auto_now_add=True)
    """A DateTimeField to save the upload date and time."""

    filetype = models.CharField(max_length=255, editable=False)
    """A string used to show the type of the file."""

    class Meta:
        """
        Meta class for the mediafile model.
        """
        ordering = ['title']
        permissions = (
            ('can_see', ugettext_noop('Can see the list of files')),
            ('can_upload', ugettext_noop('Can upload files')),
            ('can_manage', ugettext_noop('Can manage files')),)

    def __unicode__(self):
        """
        Method for representation in Django.
        """
        return self.title

    def save(self, **kwargs):
        """
        Method to read filetype and then save to the database.
        """
        if self.mediafile:
            self.filetype = mimetypes.guess_type(self.mediafile.path)[0] or ugettext_noop('unknown')
        else:
            self.filetype = ugettext_noop('unknown')
        super(Mediafile, self).save(**kwargs)

    @models.permalink
    def get_absolute_url(self, link='update'):
        """
        Returns the URL to a mediafile. The link can be 'edit' or 'delete'.
        """
        if link == 'update' or link == 'edit':  # 'edit' ist only used until utils/views.py is fixed
            return ('mediafile_update', [str(self.id)])
        if link == 'delete':
            return ('mediafile_delete', [str(self.id)])

    def get_filesize(self):
        """
        Transforms Bytes to Kilobytes or Megabytes. Returns the size as string.
        """
        size = self.mediafile.size
        if size < 1024:
            return '< 1 kB'
        if size >= 1024 * 1024:
            mB = size / 1024 / 1024
            return '%d MB' % mB
        else:
            kB = size / 1024
            return '%d kB' % kB
        # TODO: Read http://stackoverflow.com/a/1094933 and think about it.
