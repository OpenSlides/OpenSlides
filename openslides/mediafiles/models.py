from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.users.models import User
from openslides.utils.models import RESTModelMixin


class Mediafile(RESTModelMixin, models.Model):
    """
    Class for uploaded files which can be delivered under a certain url.
    """
    slide_callback_name = 'mediafile'

    mediafile = models.FileField(upload_to='file', verbose_name=ugettext_lazy('File'))
    """
    See https://docs.djangoproject.com/en/dev/ref/models/fields/#filefield
    for more information.
    """

    title = models.CharField(max_length=255, unique=True, blank=True, verbose_name=ugettext_lazy('Title'))
    """A string representing the title of the file."""

    uploader = models.ForeignKey(User, null=True, blank=True, verbose_name=ugettext_lazy('Uploaded by'))
    """A user – the uploader of a file."""

    timestamp = models.DateTimeField(auto_now_add=True)
    """A DateTimeField to save the upload date and time."""

    class Meta:
        """
        Meta class for the mediafile model.
        """
        ordering = ['title']
        permissions = (
            ('can_see', ugettext_noop('Can see the list of files')),
            ('can_upload', ugettext_noop('Can upload files')),
            ('can_manage', ugettext_noop('Can manage files')),)

    def __str__(self):
        """
        Method for representation.
        """
        return self.title

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
