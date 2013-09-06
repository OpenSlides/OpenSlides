from django.db import models

from openslides.projector.projector import SlideMixin
from openslides.projector.api import register_slidemodel


class ReleatedItem(SlideMixin, models.Model):
    prefix = 'releateditem'

    name = models.CharField(max_length='255')

    class Meta:
        verbose_name = 'Releated Item CHFNGEJ5634DJ34F'

    def get_agenda_title(self):
        return self.name

    def get_agenda_title_supplement(self):
        return 'test item'

    def get_absolute_url(self, *args, **kwargs):
        return '/absolute-url-here/'


class BadReleatedItem(SlideMixin, models.Model):
    prefix = 'badreleateditem'

    name = models.CharField(max_length='255')


register_slidemodel(ReleatedItem)
register_slidemodel(BadReleatedItem)
