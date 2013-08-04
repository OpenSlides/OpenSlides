from django.db import models


class RelatedItem(models.Model):
    name = models.CharField(max_length='255')

    class Meta:
        verbose_name = 'Related Item CHFNGEJ5634DJ34F'

    def get_agenda_title(self):
        return self.name

    def get_agenda_title_supplement(self):
        return 'test item'

    def get_absolute_url(self, *args, **kwargs):
        return '/absolute-url-here/'


class BadRelatedItem(models.Model):
    name = models.CharField(max_length='255')
