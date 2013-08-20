#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.config
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from django import forms

from openslides.utils.test import TestCase
from openslides.participant.models import User
from openslides.config.api import config, ConfigGroupedPage, ConfigPage, ConfigGroup, ConfigVariable
from openslides.config.signals import config_signal
from openslides.config.exceptions import ConfigError, ConfigNotFound


class HandleConfigTest(TestCase):

    def get_config_var(self, key):
        return config[key]

    def test_get_config_default_value(self):
        self.assertEqual(config['string_var'], 'default_string_rien4ooCZieng6ah')
        self.assertTrue(config['bool_var'])
        self.assertEqual(config['integer_var'], 3)
        self.assertEqual(config['choices_var'], 1)
        self.assertEqual(config['none_config_var'], None)
        self.assertRaisesMessage(expected_exception=ConfigNotFound,
                                 expected_message='The config variable unknown_config_var was not found.',
                                 callable_obj=self.get_config_var, key='unknown_config_var')

    def test_get_multiple_config_var_error(self):
        config_signal.connect(set_simple_config_page_multiple_vars, dispatch_uid='set_simple_config_page_multiple_vars_for_testing')
        self.assertRaisesMessage(expected_exception=ConfigError,
                                 expected_message='Too many values for config variable multiple_config_var found.',
                                 callable_obj=config.setup_cache)
        config_signal.disconnect(set_simple_config_page_multiple_vars, dispatch_uid='set_simple_config_page_multiple_vars_for_testing')

    def test_database_queries(self):
        """
        Test that no database queries are send, after the cache was created.
        """
        config.setup_cache()
        self.assertNumQueries(0, self.get_config_var, key='string_var')

    def test_setup_config_var(self):
        self.assertRaises(TypeError, ConfigVariable)
        self.assertRaises(TypeError, ConfigVariable, name='foo')
        self.assertRaises(TypeError, ConfigVariable, default_value='foo')

    def test_change_config_value(self):
        self.assertEqual(config['string_var'], 'default_string_rien4ooCZieng6ah')
        config['string_var'] = 'other_special_unique_string dauTex9eAiy7jeen'
        self.assertEqual(config['string_var'], 'other_special_unique_string dauTex9eAiy7jeen')

    def test_missing_cache_(self):
        self.assertEqual(config['string_var'], 'default_string_rien4ooCZieng6ah')

    def test_config_contains(self):
        self.assertTrue('string_var' in config)
        self.assertFalse('unknown_config_var' in config)

    def test_set_value_before_getting_it(self):
        """
        Try to call __setitem__ before __getitem.
        """
        config['my_config_var'] = 'value'


class ConfigFormTest(TestCase):

    def setUp(self):
        # Setup the permission
        ct = ContentType.objects.get(app_label='config', model='configstore')
        perm = Permission.objects.get(content_type=ct, codename='can_manage')

        # Setup two users
        self.manager = User.objects.create(username='config_test_manager')
        self.manager.reset_password('default')
        self.manager.user_permissions.add(perm)

        self.normal_user = User.objects.create(username='config_test_normal_user')
        self.normal_user.reset_password('default')

        # Login
        self.client_manager = Client()
        self.client_manager.login(username='config_test_manager', password='default')
        self.client_normal_user = Client()
        self.client_normal_user.login(username='config_test_normal_user', password='default')

    def test_get_config_form_overview(self):
        response = self.client_manager.get('/config/')
        self.assertRedirects(response=response, expected_url='/config/general/',
                             status_code=302, target_status_code=200)
        bad_client = Client()
        response = bad_client.get('/config/', follow=True)
        self.assertRedirects(response=response, expected_url='/login/?next=/config/general/',
                             status_code=302, target_status_code=200)

    def test_get_config_form_testgroupedpage1_manager_client(self):
        response = self.client_manager.get('/config/testgroupedpage1/')
        self.assertContains(response=response, text='default_string_rien4ooCZieng6ah', status_code=200)
        self.assertTemplateUsed(response=response, template_name='base.html')
        self.assertTemplateUsed(response=response, template_name='config/config_form.html')
        self.assertTemplateNotUsed(response=response, template_name='form.html')
        self.assertTemplateUsed(response=response, template_name='formbuttons_save.html')

    def test_get_config_form_testgroupedpage1_grouping(self):
        response = self.client_manager.get('/config/testgroupedpage1/')
        self.assertContains(response=response, text='Group 1 aiYeix2mCieQuae3', status_code=200)
        self.assertContains(response=response, text='Group 2 Toongai7ahyahy7B', status_code=200)

    def test_get_config_form_testgroupedpage1_other_clients(self):
        response = self.client_normal_user.get('/config/testgroupedpage1/')
        self.assertEqual(response.status_code, 403)
        bad_client = Client()
        response = bad_client.get('/config/testgroupedpage1/')
        self.assertRedirects(response=response, expected_url='/login/?next=/config/testgroupedpage1/',
                             status_code=302, target_status_code=200)

    def test_get_config_form_testsimplepage1_other_clients(self):
        response = self.client_normal_user.get('/config/testsimplepage1/')
        self.assertNotContains(response=response, text='BaeB0ahcMae3feem', status_code=200)
        self.assertTemplateUsed(response=response, template_name='base.html')
        self.assertTemplateUsed(response=response, template_name='config/config_form.html')
        self.assertTemplateUsed(response=response, template_name='form.html')
        self.assertTemplateUsed(response=response, template_name='formbuttons_save.html')
        bad_client = Client()
        response = bad_client.get('/config/testsimplepage1/')
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response=response, text='BaeB0ahcMae3feem', status_code=200)

    def test_get_config_form_testgroupedpage1_initial(self):
        config['string_var'] = 'something unique AChie6eeiDie3Ieciy1bah4I'
        response = self.client_manager.get('/config/testgroupedpage1/')
        self.assertContains(response=response, text='AChie6eeiDie3Ieciy1bah4I', status_code=200)

    def test_get_config_form_testgroupedpage1_choices(self):
        response = self.client_manager.get('/config/testgroupedpage1/')
        self.assertContains(response=response, text='Ughoch4ocoche6Ee', status_code=200)
        self.assertContains(response=response, text='Vahnoh5yalohv5Eb', status_code=200)

    def test_post_config_form_configtest1(self):
        response = self.client_manager.post(
            '/config/testgroupedpage1/',
            {'string_var': 'other_special_unique_string faiPaid4utie6eeL',
             'integer_var': 3,
             'choices_var': 2})
        self.assertRedirects(response=response, expected_url='/config/testgroupedpage1/',
                             status_code=302, target_status_code=200)
        self.assertEqual(config['string_var'], 'other_special_unique_string faiPaid4utie6eeL')
        self.assertFalse(config['bool_var'])
        self.assertEqual(config['integer_var'], 3)
        self.assertEqual(config['choices_var'], 2)

    def test_post_config_form_error(self):
        response = self.client_manager.post(
            '/config/testgroupedpage1/',
            {'integer_var': 'bad_string_value'})
        self.assertContains(response=response, text='errorlist', status_code=200)

    def test_disabled_config_page(self):
        response = self.client_manager.get('/config/testsimplepage3/')
        self.assertEqual(response.status_code, 404)
        response = self.client_manager.get('/config/testgroupedpage1/')
        self.assertNotContains(response=response, text='Ho5iengaoon5Hoht', status_code=200)

    def test_extra_stylefiles(self):
        response = self.client_manager.get('/config/testgroupedpage1/')
        text = '<link href="/static/styles/test-config-sjNN56dFGDrg2.css" type="text/css" rel="stylesheet" />'
        self.assertContains(response=response, text=text, status_code=200)

    def test_extra_javascript(self):
        response = self.client_manager.get('/config/testgroupedpage1/')
        text = '<script src="/static/javascript/test-config-djg4dFGVslk4209f.js" type="text/javascript"></script>'
        self.assertContains(response=response, text=text, status_code=200)


class ConfigWeightTest(TestCase):

    def setUp(self):
        # Setup the permission
        ct = ContentType.objects.get(app_label='config', model='configstore')
        perm = Permission.objects.get(content_type=ct, codename='can_manage')

        # Setup two users
        self.manager = User.objects.create(username='config_test_manager')
        self.manager.reset_password('default')
        self.manager.user_permissions.add(perm)

        # Login
        self.client_manager = Client()
        self.client_manager.login(username='config_test_manager', password='default')

    def test_order_of_config_pages_abstract(self):
        config_page_dict = {}
        for receiver, config_page in config_signal.send(sender=self):
            config_page_dict[receiver.__name__] = config_page
        self.assertGreater(config_page_dict['set_grouped_config_page'].weight, config_page_dict['set_simple_config_page'].weight)

    def test_order_of_config_pages_on_view(self):
        response = self.client_manager.get('/config/testgroupedpage1/')
        import re
        m1 = re.search('<a href="/config/testgroupedpage1/" class="btn btn-mini active">Config vars for testing 1</a>', response.content)
        m2 = re.search('<a href="/config/testsimplepage1/" class="btn btn-mini ">Config vars for testing 2</a>', response.content)
        self.assertGreater(m1.start(), m2.start())


@receiver(config_signal, dispatch_uid='set_grouped_config_page_for_testing')
def set_grouped_config_page(sender, **kwargs):
    """
    Sets a grouped config page which can be reached under the url
    '/config/testgroupedpage1/'. There are some variables, one variable
    with a string as default value, one with a boolean as default value,
    one with an integer as default value, one with choices and one
    hidden variable. These variables are grouped in two groups.
    """
    string_var = ConfigVariable(
        name='string_var',
        default_value='default_string_rien4ooCZieng6ah',
        form_field=forms.CharField())
    bool_var = ConfigVariable(
        name='bool_var',
        default_value=True,
        form_field=forms.BooleanField(required=False))
    integer_var = ConfigVariable(
        name='integer_var',
        default_value=3,
        form_field=forms.IntegerField())
    group_1 = ConfigGroup(title='Group 1 aiYeix2mCieQuae3', variables=(string_var, bool_var, integer_var))

    hidden_var = ConfigVariable(
        name='hidden_var',
        default_value='hidden_value')
    choices_var = ConfigVariable(
        name='choices_var',
        default_value=1,
        form_field=forms.ChoiceField(choices=((1, 'Choice One Ughoch4ocoche6Ee'), (2, 'Choice Two Vahnoh5yalohv5Eb'))))
    group_2 = ConfigGroup(title='Group 2 Toongai7ahyahy7B', variables=(hidden_var, choices_var))

    return ConfigGroupedPage(title='Config vars for testing 1',
                             url='testgroupedpage1',
                             required_permission='config.can_manage',
                             weight=10000,
                             groups=(group_1, group_2),
                             extra_context={'extra_stylefiles': ['styles/test-config-sjNN56dFGDrg2.css'],
                                            'extra_javascript': ['javascript/test-config-djg4dFGVslk4209f.js']})


@receiver(config_signal, dispatch_uid='set_simple_config_page_for_testing')
def set_simple_config_page(sender, **kwargs):
    """
    Sets a simple config page with some config variables but without
    grouping.
    """
    return ConfigPage(title='Config vars for testing 2',
                      url='testsimplepage1',
                      required_permission='No permission required',
                      variables=(ConfigVariable(name='additional_config_var', default_value='BaeB0ahcMae3feem'),
                                 ConfigVariable(name='additional_config_var_2', default_value='', form_field=forms.CharField()),
                                 ConfigVariable(name='none_config_var', default_value=None)))


# Do not connect to the signal now but later inside the test.
def set_simple_config_page_multiple_vars(sender, **kwargs):
    """
    Sets a bad config page with some multiple config vars.
    """
    return ConfigPage(title='Config vars for testing 3',
                      url='testsimplepage2',
                      required_permission='No permission required',
                      variables=(ConfigVariable(name='multiple_config_var', default_value='foobar1'),
                                 ConfigVariable(name='multiple_config_var', default_value='foobar2')))


@receiver(config_signal, dispatch_uid='set_simple_config_page_disabled_page_for_testing')
def set_simple_config_page_disabled_page(sender, **kwargs):
    return ConfigPage(title='Ho5iengaoon5Hoht',
                      url='testsimplepage3',
                      required_permission='No permission required',
                      variables=(ConfigVariable(name='hidden_config_var_2', default_value=''),))
