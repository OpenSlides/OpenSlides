from django.template import Context, Template

from openslides.config.api import config
from openslides.utils.test import TestCase


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
