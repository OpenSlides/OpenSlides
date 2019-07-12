import os
import uuid
from typing import List, cast

from django.conf import settings
from django.db import models

from ..agenda.mixins import ListOfSpeakersMixin
from ..core.config import config
from ..utils.models import RESTModelMixin
from ..utils.rest_api import ValidationError
from .access_permissions import MediafileAccessPermissions


class MediafileManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """

    def get_full_queryset(self):
        """
        Returns the normal queryset with all mediafiles. In the background
        all related list of speakers are prefetched from the database.
        """
        return self.get_queryset().prefetch_related(
            "lists_of_speakers", "parent", "access_groups"
        )

    def delete(self, *args, **kwargs):
        raise RuntimeError(
            "Do not use the querysets delete function. Please delete every mediafile on it's own."
        )


def get_file_path(mediafile, filename):
    mediafile.original_filename = filename
    ext = filename.split(".")[-1]
    filename = "%s.%s" % (uuid.uuid4(), ext)
    return os.path.join("file", filename)


class Mediafile(RESTModelMixin, ListOfSpeakersMixin, models.Model):
    """
    Class for uploaded files which can be delivered under a certain url.
    """

    objects = MediafileManager()
    access_permissions = MediafileAccessPermissions()
    can_see_permission = "mediafiles.can_see"

    mediafile = models.FileField(upload_to=get_file_path, null=True)
    """
    See https://docs.djangoproject.com/en/dev/ref/models/fields/#filefield
    for more information.
    """

    title = models.CharField(max_length=255)
    """A string representing the title of the file."""

    original_filename = models.CharField(max_length=255)

    create_timestamp = models.DateTimeField(auto_now_add=True)
    """A DateTimeField to save the upload date and time."""

    is_directory = models.BooleanField(default=False)

    parent = models.ForeignKey(
        "self",
        # The on_delete should be CASCADE_AND_AUTOUPDATE, but we do
        # have to delete the actual file from every mediafile to ensure
        # cleaning up the server files. This is ensured by the custom delete
        # method of every mediafile. Do not use the delete method of the
        # mediafile manager.
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )

    access_groups = models.ManyToManyField(settings.AUTH_GROUP_MODEL, blank=True)

    class Meta:
        """
        Meta class for the mediafile model.
        """

        ordering = ("title",)
        default_permissions = ()
        permissions = (
            ("can_see", "Can see the list of files"),
            ("can_manage", "Can manage files"),
        )

    def create(self, *args, **kwargs):
        self.validate_unique()
        return super().create(*args, **kwargs)

    def save(self, *args, **kwargs):
        self.validate_unique()
        return super().save(*args, **kwargs)

    def validate_unique(self):
        """
        `unique_together` is not working with foreign keys with possible `null` values.
        So we do need to check this here.
        """
        if (
            Mediafile.objects.exclude(pk=self.pk)
            .filter(title=self.title, parent=self.parent)
            .exists()
        ):
            raise ValidationError(
                {"detail": "A mediafile with this title already exists in this folder."}
            )

    def __str__(self):
        """
        Method for representation.
        """
        return self.title

    def delete(self, skip_autoupdate=False):
        mediafiles_to_delete = self.get_children_deep()
        mediafiles_to_delete.append(self)
        for mediafile in mediafiles_to_delete:
            if mediafile.is_file:
                # To avoid Django calling save() and triggering autoupdate we do not
                # use the builtin method mediafile.mediafile.delete() but call
                # mediafile.mediafile.storage.delete(...) directly. This may have
                # unattended side effects so be careful especially when accessing files
                # on server via Django methods (file, open(), save(), ...).
                mediafile.mediafile.storage.delete(mediafile.mediafile.name)
            mediafile._db_delete(skip_autoupdate=skip_autoupdate)

    def _db_delete(self, *args, **kwargs):
        """ Captures the original .delete() method. """
        return super().delete(*args, **kwargs)

    def get_children_deep(self):
        """ Returns all children and all children of childrens and so forth. """
        children = []
        for child in self.children.all():
            children.append(child)
            children.extend(child.get_children_deep())
        return children

    @property
    def path(self):
        name = (self.title + "/") if self.is_directory else self.original_filename
        if self.parent:
            return self.parent.path + name
        else:
            return name

    @property
    def url(self):
        return settings.MEDIA_URL + self.path

    @property
    def inherited_access_groups_id(self):
        """
        True: all groups
        False: no permissions
        List[int]: Groups with permissions
        """
        own_access_groups = [group.id for group in self.access_groups.all()]
        if not self.parent:
            return own_access_groups or True  # either some groups or all

        access_groups = self.parent.inherited_access_groups_id
        if len(own_access_groups) > 0:
            if isinstance(access_groups, bool) and access_groups:
                return own_access_groups
            elif isinstance(access_groups, bool) and not access_groups:
                return False
            else:  # List[int]
                access_groups = [
                    id
                    for id in cast(List[int], access_groups)
                    if id in own_access_groups
                ]
                return access_groups or False
        else:
            return access_groups  # We do not have restrictions, copy from parent.

    def get_filesize(self):
        """
        Transforms bytes to kilobytes or megabytes. Returns the size as string.
        """
        # TODO: Read http://stackoverflow.com/a/1094933 and think about it.
        try:
            size = self.mediafile.size
        except OSError:
            size_string = "unknown"
        except ValueError:
            # happens, if this is a directory and no file exists
            return None
        else:
            if size < 1024:
                size_string = "< 1 kB"
            elif size >= 1024 * 1024:
                mB = size / 1024 / 1024
                size_string = "%d MB" % mB
            else:
                kB = size / 1024
                size_string = "%d kB" % kB
        return size_string

    @property
    def is_logo(self):
        if self.is_directory:
            return False
        for key in config["logos_available"]:
            if config[key]["path"] == self.url:
                return True
        return False

    @property
    def is_font(self):
        if self.is_directory:
            return False
        for key in config["fonts_available"]:
            if config[key]["path"] == self.url:
                return True
        return False

    @property
    def is_special_file(self):
        return self.is_logo or self.is_font

    @property
    def is_file(self):
        return not self.is_directory

    def get_list_of_speakers_title_information(self):
        return {"title": self.title}
