# -*- coding: utf-8 -*-

from django.template import Context, Template

from openslides.config.api import config
from openslides.utils.test import TestCase

from .models import TestModel


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


class AbsoluteUrlFilter(TestCase):
    def setUp(self):
        self.model = TestModel.objects.create(name='test_model')

    def test_default_argument(self):
        """
        Test to call absolute_url without an argument.
        """
        t = Template("{% load tags %}URL: {{ model|absolute_url }}")
        html = t.render(Context({'model': self.model}))
        self.assertEqual(html, 'URL: detail-url-here')

    def test_with_argument(self):
        """
        Test to call absolute_url with an argument.
        """
        t = Template("{% load tags %}URL: {{ model|absolute_url:'delete' }}")
        html = t.render(Context({'model': self.model}))
        self.assertEqual(html, 'URL: delete-url-here')

    def test_wrong_argument(self):
        """
        Test to call absolute_url with a non existing argument.
        """
        t = Template("{% load tags %}URL: {{ model|absolute_url:'wrong' }}")
        html = t.render(Context({'model': self.model}))
        self.assertEqual(html, 'URL: ')
