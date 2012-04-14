#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.system.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the system app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from pickle import dumps, loads
import base64

from django.db import models
from utils.translation_ext import xugettext as _

DEFAULT_DATA  = {
    'event_name': 'OpenSlides',
    'event_description': 'Presentation and voting system',
    'agenda_countdown_time': 60,
    'application_min_supporters': 4,
    'application_preamble': 'Die Versammlung möge beschließen,',
    'application_pdf_ballot_papers_selection': '1',
    'application_pdf_title': _('Applications'),
    'assignment_pdf_ballot_papers_selection': '1',
    'assignment_pdf_title': _('Elections'),
    'system_url': 'http://127.0.0.1:8000',
    'system_welcometext': 'Welcome to OpenSlides!',
}

class ConfigStore(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.CharField(max_length=100)

    def __unicode__(self):
        return self.key

    class Meta:
        verbose_name = 'config'
        permissions = (
            ('can_manage_system', _("Can manage system configuration", fixstr=True)),
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
        try:
            return DEFAULT_DATA[key]
        except KeyError:
            return None

    def __setitem__(self, key, value):
        try:
            c = ConfigStore.objects.get(pk=key)
        except ConfigStore.DoesNotExist:
            c = ConfigStore(pk=key)
        c.value = base64.encodestring(dumps(value))
        c.save()
        self.config[key] = value

from django.dispatch import receiver
from django.core.urlresolvers import reverse
from django.utils.importlib import import_module
import settings

from openslides.utils.signals import template_manipulation



@receiver(template_manipulation, dispatch_uid="system_base_system")
def set_submenu(sender, request, context, **kwargs):
    if not request.path.startswith('/config/'):
        return None
    selected = True if request.path == reverse('config_general') else False
    menu_links = [
        (reverse('config_general'), _('General'), selected),
    ]
    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module(app + '.views')
            mod.Config
        except (ImportError, AttributeError):
            continue

        appname = mod.__name__.split('.')[0]
        selected = True if reverse('config_%s' % appname) == request.path else False
        menu_links.append(
            (reverse('config_%s' % appname), _(appname.title()), selected)
        )

    context.update({
        'menu_links': menu_links,
    })



