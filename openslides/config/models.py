#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the config app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from pickle import dumps, loads
import base64

from django.db import models
from django.dispatch import receiver

from utils.translation_ext import ugettext as _

from openslides.config.signals import default_config_value
import settings


class ConfigStore(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.CharField(max_length=100)

    def __unicode__(self):
        return self.key

    class Meta:
        verbose_name = 'config'
        permissions = (
            ('can_manage_config', _("Can manage configuration", fixstr=True)),
        )


# TODO:
# I used base64 to save pickled Data, there has to be another way see:
# http://stackoverflow.com/questions/2524970/djangounicodedecodeerror-while-storing-pickled-data

class Config(object):
    def load_config(self):
        self.config = {}
        for key, value in ConfigStore.objects.all().values_list():
            self.config[key] = loads(base64.decodestring(str(value)))

    def __getitem__(self, key):
        try:
            self.config
        except AttributeError:
            self.load_config()

        try:
            return self.config[key]
        except KeyError:
            pass

        for receiver, value in default_config_value.send(sender='config', key=key):
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
        c.value = base64.encodestring(dumps(value))
        c.save()
        try:
            self.config[key] = value
        except AttributeError:
            self.load_config()
            self.config[key] = value

config = Config()


@receiver(default_config_value, dispatch_uid="config_default_config")
def default_config(sender, key, **kwargs):
    return {
        'event_name': _('OpenSlides'),
        'event_description': _('Presentation and voting system'),
        'presentation': '',
        'frontpage_title': _('Welcome'),
        'frontpage_welcometext': _('Welcome to OpenSlides!'),
        'show_help_text': True,
        'help_text': _('If you need any help wieth OpenSlides, you can find commercial support on our <a href="http://openslides.org/en/support">Webpage</a>.'),
        'system_enable_anonymous': False,
    }.get(key)


from django.dispatch import receiver
from django.core.urlresolvers import reverse
from django.utils.importlib import import_module
import settings

from openslides.utils.signals import template_manipulation


@receiver(template_manipulation, dispatch_uid="config_submenu")
def set_submenu(sender, request, context, **kwargs):
    if not request.path.startswith('/config/'):
        return None
    menu_links = [
        (reverse('config_general'), _('General'), request.path == reverse('config_general') ),
    ]

    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module(app)
            views = mod.views
            views.Config
        except (ImportError, AttributeError):
            continue

        appname = mod.__name__.split('.')[0]
        selected = reverse('config_%s' % appname) == request.path
        try:
            title = mod.NAME
        except AttributeError:
            title = appname.title()
        menu_links.append(
            (reverse('config_%s' % appname), _(title), selected)
        )

    menu_links.append (
        (reverse('config_version'), _('Version'), request.path == reverse('config_version') )
    )

    context.update({
        'menu_links': menu_links,
    })
