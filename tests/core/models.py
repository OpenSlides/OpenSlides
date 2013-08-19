from django.db import models


class TestModel(models.Model):
    name = models.CharField(max_length='255')

    def get_absolute_url(self, link='detail'):
        if link == 'detail':
            return 'detail-url-here'
        if link == 'delete':
            return 'delete-url-here'
        raise ValueError('No URL for %s' % link)
