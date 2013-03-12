#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.mediafile.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the mediafile app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import ModelForm

from openslides.utils.forms import CssClassMixin
from openslides.mediafile.models import Mediafile


class MediafileNormalCreateForm(CssClassMixin, ModelForm):
    """
    Form to create a media file as normal user.
    """
    class Meta:
        model = Mediafile
        exclude = ('uploader',)


class MediafileUpdateForm(CssClassMixin, ModelForm):
    """
    Form to edit mediafile entries.
    """
    class Meta:
        model = Mediafile

    def save(self, **kwargs):
        """
        Method to save the form.
        Here the overwrite is to delete old files.
        """
        if not self.instance.pk is None:
            old_file = Mediafile.objects.get(pk=self.instance.pk).mediafile
            if not old_file == self.instance.mediafile:
                old_file.delete()
        return super(MediafileUpdateForm, self).save(**kwargs)
