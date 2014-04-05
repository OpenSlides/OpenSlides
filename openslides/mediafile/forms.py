# -*- coding: utf-8 -*-

from django.forms import ModelForm

from openslides.utils.forms import CssClassMixin

from .models import Mediafile


class MediafileFormMixin(object):
    """
    Mixin for mediafile forms. It is used to delete old files.
    """
    def save(self, *args, **kwargs):
        """
        Method to save the form. Here the override is to delete old files.
        """
        if self.instance.pk is not None:
            old_file = Mediafile.objects.get(pk=self.instance.pk).mediafile
            if not old_file == self.instance.mediafile:
                old_file.delete()
        return super(MediafileFormMixin, self).save(*args, **kwargs)


class MediafileNormalUserForm(MediafileFormMixin, CssClassMixin, ModelForm):
    """
    This form is only used by normal users, not by managers.
    """
    class Meta:
        model = Mediafile
        fields = ('mediafile', 'title', 'is_presentable')


class MediafileManagerForm(MediafileFormMixin, CssClassMixin, ModelForm):
    """
    This form is only used be managers, not by normal users.
    """
    class Meta:
        model = Mediafile
        fields = ('mediafile', 'title', 'uploader', 'is_presentable')
