from django.db import models

from openslides.projector.models import SlideMixin


class RelatedItem(SlideMixin, models.Model):
    slide_callback_name = 'test_related_item'
    name = models.CharField(max_length='255')

    class Meta:
        verbose_name = 'Related Item CHFNGEJ5634DJ34F'

    def get_agenda_title(self):
        return self.name

    def get_agenda_title_supplement(self):
        return 'test item'

    def get_absolute_url(self, link=None):
        if link is None:
            value = '/absolute-url-here/'
        else:
            value = super(RelatedItem, self).get_absolute_url(link)
        return value


class BadRelatedItem(models.Model):
    name = models.CharField(max_length='255')
