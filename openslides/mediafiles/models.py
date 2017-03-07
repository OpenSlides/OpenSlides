from django.conf import settings
from django.db import models
from django.utils.translation import ugettext as _

from ..utils.models import RESTModelMixin
from .access_permissions import MediafileAccessPermissions


class Mediafile(RESTModelMixin, models.Model):
    """
    Class for uploaded files which can be delivered under a certain url.
    """
    access_permissions = MediafileAccessPermissions()

    mediafile = models.FileField(upload_to='file')
    """
    See https://docs.djangoproject.com/en/dev/ref/models/fields/#filefield
    for more information.
    """

    title = models.CharField(max_length=255, unique=True)
    """A string representing the title of the file."""

    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True)
    """A user – the uploader of a file."""

    hidden = models.BooleanField(default=False)
    """Whether or not this mediafile should be marked as hidden"""

    timestamp = models.DateTimeField(auto_now_add=True)
    """A DateTimeField to save the upload date and time."""

    class Meta:
        """
        Meta class for the mediafile model.
        """
        ordering = ['title']
        default_permissions = ()
        permissions = (
            ('can_see', 'Can see the list of files'),
            ('can_see_hidden', 'Can see hidden files'),
            ('can_upload', 'Can upload files'),
            ('can_manage', 'Can manage files'))

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
