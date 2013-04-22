#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.utils.templatetags.tags
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.template import Template, Context

from openslides.utils.test import TestCase
from openslides.config.api import config


class ConfigTagAndFilter(TestCase):
    def test_config_tag(self):
        config['taiNg3reQuooGha4'] = 'iWoor0caThieK7yi'
        template = Template("{% load tags %} The config var is {% get_config 'taiNg3reQuooGha4' %}.")
        self.assertTrue('The config var is iWoor0caThieK7yi.' in template.render(Context({})))

    def test_config_filter(self):
        config['fkjTze56ncuejWqs'] = 'REG56Hnmfk9TdfsD'
        template = Template("{% load tags %} The config var is {{ 'fkjTze56ncuejWqs'|get_config }}.")
        self.assertTrue('The config var is REG56Hnmfk9TdfsD.' in template.render(Context({})))

    def test_both_in_one(self):
        config['jfhsnezfh452w6Fg'] = True
        config['sdmvldkfgj4534gk'] = 'FdgfkR04jtg9f8bq'
        template_code = """{% load tags %}
            {% if 'jfhsnezfh452w6Fg'|get_config %}
                {% get_config 'sdmvldkfgj4534gk' %}
            {% else %}
                bad_e0fvkfHFD
            {% endif %}"""
        template = Template(template_code)
        self.assertTrue('FdgfkR04jtg9f8bq' in template.render(Context({})))
        self.assertFalse('bad_e0fvkfHFD' in template.render(Context({})))
