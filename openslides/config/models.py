#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the config app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf import settings
from django.core.urlresolvers import reverse
from django.db import models
from django.dispatch import receiver
from django.utils.importlib import import_module
from django.utils.translation import ugettext_lazy as _, ugettext_noop

from openslides.utils.jsonfield import JSONField
from openslides.utils.signals import template_manipulation

from openslides.config.signals import default_config_value


class ConfigStore(models.Model):
    """
    Stores the config values.
    """
    key = models.CharField(max_length=100, primary_key=True)
    value = JSONField()

    def __unicode__(self):
        return self.key

    class Meta:
        verbose_name = 'config'
        permissions = (
            ('can_manage_config', ugettext_noop("Can manage configuration")),
        )


class Config(object):
    """
    Access the config values via config[...]
    """
    def __getitem__(self, key):
        try:
            return ConfigStore.objects.get(key=key).value
        except ConfigStore.DoesNotExist:
            pass

        for receiver, value in default_config_value.send(sender='config',
                                                         key=key):
            if value is not None:
                return value
        if settings.DEBUG:
            print "No default value for: %s" % key
        return None

    def __setitem__(self, key, value):
        try:
            c = ConfigStore.objects.get(pk=key)
        except ConfigStore.DoesNotExist:
            c = ConfigStore(pk=key)
        c.value = value
        c.save()

    def __contains__(self, item):
        return ConfigStore.objects.filter(key=item).exists()

config = Config()


@receiver(default_config_value, dispatch_uid="config_default_config")
def default_config(sender, key, **kwargs):
    """
    Global default values.
    """
    return {
        'event_name': 'OpenSlides',
        'event_description':
        _('Presentation and assembly system'),
        'event_date': '',
        'event_location': '',
        'event_organizer': '',
        'presentation': '',
        'welcome_title': _('Welcome to OpenSlides'),
        'welcome_text': _('[Place for your welcome text.]'),
        'system_enable_anonymous': False,
    }.get(key)


@receiver(template_manipulation, dispatch_uid="config_submenu")
def set_submenu(sender, request, context, **kwargs):
    """
    Submenu for the config tab.
    """
    if not request.path.startswith('/config/'):
        return None
    menu_links = [
        (reverse('config_general'), _('General'),
            request.path == reverse('config_general')),
    ]

    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module(app)
            views = mod.views
            views.Config
        except (ImportError, AttributeError):
            continue

        appname = mod.__name__.split('.')[-1]

        selected = reverse('config_%s' % appname) == request.path
        try:
            title = mod.NAME
        except AttributeError:
            title = appname.title()
        menu_links.append(
            (reverse('config_%s' % appname), _(title), selected)
        )

    menu_links.append((
        reverse('config_version'), _('Version'),
        request.path == reverse('config_version')))

    context.update({
        'menu_links': menu_links})
