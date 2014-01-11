# -*- coding: utf-8 -*-

import mimetypes

from django.core.urlresolvers import reverse
from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.projector.models import SlideMixin
from openslides.utils.models import AbsoluteUrlMixin
from openslides.utils.person.models import PersonField


class Mediafile(SlideMixin, AbsoluteUrlMixin, models.Model):
    """
    Class for uploaded files which can be delivered under a certain url.
    """
    slide_callback_name = 'mediafile'
    PRESENTABLE_FILE_TYPES = ['application/pdf']

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

    is_presentable = models.BooleanField(
        default=False,
        verbose_name=ugettext_lazy("Is Presentable"),
        help_text=ugettext_lazy("If checked, this file can be presented on the projector. "
                                "Currently, this is only possible for PDFs."))

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

    def get_absolute_url(self, link='update'):
        """
        Returns the URL to a mediafile. The link can be 'projector',
        'update' or 'delete'.
        """
        if link == 'update':
            url = reverse('mediafile_update', kwargs={'pk': str(self.pk)})
        elif link == 'delete':
            url = reverse('mediafile_delete', kwargs={'pk': str(self.pk)})
        else:
            url = super(Mediafile, self).get_absolute_url(link)
        return url

    def get_filesize(self):
        """
        Transforms bytes to kilobytes or megabytes. Returns the size as string.
        """
        # TODO: Read http://stackoverflow.com/a/1094933 and think about it.
        try:
            size = self.mediafile.size
        except OSError:
            size_string = _('unknown')
        else:
            if size < 1024:
                size_string = '< 1 kB'
            elif size >= 1024 * 1024:
                mB = size / 1024 / 1024
                size_string = '%d MB' % mB
            else:
                kB = size / 1024
                size_string = '%d kB' % kB
        return size_string
