#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides utils.utils
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    TODO: Move this test to the correct place when the projector app is cleaned up.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib.messages.storage import default_storage
from django.core.exceptions import ImproperlyConfigured
from django.core.urlresolvers import clear_url_caches
from django.dispatch import receiver
from django.http.response import HttpResponseNotAllowed
from django.test import RequestFactory
from django.test.client import Client
from django.test.utils import override_settings

from openslides.participant.models import User
from openslides.utils import views
from openslides.utils.signals import template_manipulation
from openslides.utils.test import TestCase

from . import views as test_views


@override_settings(ROOT_URLCONF='tests.utils.urls')
class ViewTestCase(TestCase):
    rf = RequestFactory()

    def setUp(self):
        # Clear the cache for the urlresolver, so the overriden settings works.
        clear_url_caches()


class LoginMixinTest(ViewTestCase):
    def test_dispatch(self):
        view = test_views.LoginMixinView.as_view()
        client = Client()
        response = client.get('/login_mixin/')
        self.assertEqual(response['Location'], 'http://testserver/login/?next=/login_mixin/')

        client.login(username='admin', password='admin')
        response = client.get('/login_mixin/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'Well done.')


class PermissionMixinTest(ViewTestCase):
    def test_dispatch(self):
        client = Client()

        # View without permission_required
        response = client.get('/permission_mixin1/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'Well done.')

        # View with permission_required without login
        response = client.get('/permission_mixin2/')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response['Location'], 'http://testserver/login/?next=/permission_mixin2/')

        # View with permission_required, with login, without permission
        client.login(username='admin', password='admin')
        response = client.get('/permission_mixin2/')
        self.assertEqual(response.status_code, 403)

        # View with permission_required, with login, with permission
        response = client.get('/permission_mixin3/')
        self.assertEqual(response.status_code, 200)


class AjaxMixinTest(ViewTestCase):
    def test_ajax_get(self):
        view = test_views.AjaxMixinView()
        ajax_get = view.ajax_get
        response = ajax_get(self.rf.get('/', {}))
        self.assertEqual(response.content, '{"new_context": "newer_context"}')

    def test_get_ajax_context(self):
        get_ajax_context = test_views.AjaxMixinView().get_ajax_context
        self.assertEqual(get_ajax_context()['new_context'], 'newer_context')
        self.assertEqual(
            get_ajax_context(test_content='some_content')['test_content'],
            'some_content')


class ExtraContextMixinTest(ViewTestCase):
    """
    Tests the ExtraContextMixin by testen the TemplateView
    """
    def test_get_context_data(self):
        view = views.TemplateView()
        get_context_data = view.get_context_data
        view.request = self.rf.get('/', {})

        context = get_context_data()
        self.assertIn('tabs', context)

        context = get_context_data(some_context='context')
        self.assertIn('tabs', context)
        self.assertIn('some_context', context)

        template_manipulation.connect(set_context, dispatch_uid='set_context_test')
        context = get_context_data()
        self.assertIn('tabs', context)
        self.assertIn('new_context', context)
        template_manipulation.disconnect(set_context, dispatch_uid='set_context_test')


class UrlMixinTest(ViewTestCase):
    def test_get_url(self):
        get_url = test_views.UrlMixinView().get_url

        # url_name has the higher priority
        self.assertEqual(get_url('test_url_mixin', 'view_url'),
                         '/url_mixin/')

        # If the url_name is none, return the second argument
        self.assertEqual(get_url(None, 'view_url'),
                         'view_url')

        # Test argument in url
        self.assertEqual(get_url('test_url_mixin_args', None,
                                 args=[1]),
                         '/url_mixin_args/1/')

        # No Url given.
        self.assertRaisesMessage(
            ImproperlyConfigured,
            'No url to redirect to. See openslides.utils.views.UrlMixin for more details.',
            get_url, None, None)

    def test_get_url_with_object(self):
        get_url = test_views.UrlMixinViewWithObject().get_url

        self.assertEqual(get_url(None, None),
                         'default_url')
        self.assertEqual(get_url(None, None, use_absolute_url_link='detail'),
                         'detail_url')

    def test_get_url_name_args(self):
        view = test_views.UrlMixinViewWithObject()
        get_url_name_args = view.get_url_name_args
        view.url_name_args = [1]

        self.assertEqual(get_url_name_args(), [1])

        view.url_name_args = None
        self.assertEqual(get_url_name_args(), [])

        view.object.pk = 5
        self.assertEqual(get_url_name_args(), [5])


## class QuestionMixinTest(ViewTestCase):
    ## def test_get_redirect_url(self):
        ## view = views.QuestionMixin()
        ## get_redirect_url = view.get_redirect_url
##
        ## view.request = self.rf.get('/')
        ## view.question_url = 'redirect_to_get_url'
        ## self.assertEqual(get_redirect_url(), 'redirect_to_get_url')
##
        ## view.request = self.rf.post('/')
        ## view.success_url = 'redirect_to_post_url'
        ## self.assertEqual(get_redirect_url(), 'redirect_to_post_url')
##
    ## def test_get_question(self):
        ## view = views.QuestionMixin()
        ## get_redirect_url = view.get_question
##
        ## self.assertEqual(get_redirect_url(), 'Are you sure?')
##
        ## view.question = 'new_question'
        ## self.assertEqual(get_redirect_url(), 'new_question')
##
    ## def test_get_answer_options(self):
        ## view = views.QuestionMixin()
        ## get_answer_options = view.get_answer_options
##
        ## self.assertIn('yes', dict(get_answer_options()))
        ## self.assertIn('no', dict(get_answer_options()))
##
        ## view.answer_options = [('new_answer', 'Answer')]
        ## self.assertNotIn('yes', dict(get_answer_options()))
        ## self.assertIn('new_answer', dict(get_answer_options()))
##
    ## def test_confirm_form(self):
        ## view = views.QuestionMixin()
        ## confirm_form = view.confirm_form
        ## view.request = self.rf.get('/')
        ## view.request._messages = default_storage(view.request)
##
        ## confirm_form()
        ## message = "".join(view.request._messages._queued_messages[0].message.split())
        ## self.assertEqual(
            ## message, 'Areyousure?<formaction="/"method="post">'
            ## '<inputtype="hidden"value="NOTPROVIDED"name="csrfmiddlewaretoken">' '<buttontype="submit"class="btnbtn-mini"name="yes">Yes</button>'
            ## '<buttontype="submit"class="btnbtn-mini"name="no">No</button></form>')


def set_context(sender, request, context, **kwargs):
    """
    receiver for testing the ExtraContextMixin
    """
    context.update({'new_context': 'some new context'})
