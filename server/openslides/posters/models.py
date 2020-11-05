from django.db import models

from openslides.agenda.mixins import ListOfSpeakersMixin
from openslides.posters.access_permissions import PosterAccessPermissions
from openslides.utils.manager import BaseManager
from openslides.utils.models import RESTModelMixin


class PosterManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all posterss. In the background all
        related lists of speakers are prefetched from the database.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related("lists_of_speakers")
        )


class Poster(RESTModelMixin, ListOfSpeakersMixin, models.Model):
    """
    Model for slides with custom content. Used to be called custom slide.
    """

    access_permissions = PosterAccessPermissions()
    objects = PosterManager()

    title = models.CharField(max_length=256)
    xml = models.TextField(blank=True)
    published = models.BooleanField(default=False, blank=True, null=False)

    class Meta:
        default_permissions = ()
        permissions = (
            ("can_see", "Can see posters"),
            ("can_manage", "Can manage posters"),
        )
        verbose_name = "Poster"

    def __str__(self):
        return self.title

    def get_list_of_speakers_title_information(self):
        return {"title": self.title}
