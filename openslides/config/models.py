# -*- coding: utf-8 -*-

from django.db import models
from django.utils.translation import ugettext_noop

from jsonfield import JSONField


class ConfigStore(models.Model):
    """
    A model class to store all config variables in the database.
    """

    key = models.CharField(max_length=255, unique=True, db_index=True)
    """A string, the key of the config variable."""

    value = JSONField()
    """The value of the config variable. """

    class Meta:
        permissions = (('can_manage', ugettext_noop('Can manage configuration')),)
