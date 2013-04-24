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
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.utils.person.models import PersonField


class Mediafile(models.Model):
    """
    Class for uploaded files which can be delivered under a certain url.
    """

    mediafile = models.FileField(upload_to='file', verbose_name=ugettext_lazy("File"))
    """
    See https://docs.djangoproject.com/en/dev/ref/models/fields/#filefield
    for more information.
    """

    title = models.CharField(max_length=255, unique=True, verbose_name=ugettext_lazy("Title"))
    """A string representing the title of the file."""

    uploader = PersonField(blank=True, verbose_name=ugettext_lazy("Uploaded by"))
    """A person – the uploader of a file."""

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
        Method for representation.
        """
        return self.title

    def save(self, *args, **kwargs):
        """
        Method to read filetype and then save to the database.
        """
        if self.mediafile:
            self.filetype = mimetypes.guess_type(self.mediafile.path)[0] or ugettext_noop('unknown')
        else:
            self.filetype = ugettext_noop('unknown')
        return super(Mediafile, self).save(*args, **kwargs)

    @models.permalink
    def get_absolute_url(self, link='update'):
        """
        Returns the URL to a mediafile. The link can be 'update' or 'delete'.
        """
        if link == 'update' or link == 'edit':  # 'edit' ist only used until utils/views.py is fixed
            return ('mediafile_update', [str(self.id)])
        if link == 'delete':
            return ('mediafile_delete', [str(self.id)])

    def get_filesize(self):
        """
        Transforms Bytes to Kilobytes or Megabytes. Returns the size as string.
        """
        # TODO: Read http://stackoverflow.com/a/1094933 and think about it.
        size = self.mediafile.size
        if size < 1024:
            return '< 1 kB'
        if size >= 1024 * 1024:
            mB = size / 1024 / 1024
            return '%d MB' % mB
        else:
            kB = size / 1024
            return '%d kB' % kB
