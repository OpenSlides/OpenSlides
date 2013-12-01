# -*- coding: utf-8 -*-

from django.contrib.auth.models import AnonymousUser
from django.test.client import RequestFactory

from openslides.utils.test import TestCase
from openslides.utils.widgets import Widget


class WidgetObject(TestCase):
    request_factory = RequestFactory()

    def get_widget(self, name):
        request = self.request_factory.get('/')
        request.user = AnonymousUser()
        for widget in Widget.get_all(request):
            if widget.name == name:
                value = widget
                break
        else:
            value = False
        return value

    def test_connecting_signal(self):

        class TestWidgetOne(Widget):
            name = 'test_case_widget_begae7poh1Ahshohfi1r'

        self.assertTrue(self.get_widget('test_case_widget_begae7poh1Ahshohfi1r'))

    def test_not_connecting_signal(self):

        class TestWidgetTwo(Widget):
            name = 'test_case_widget_zuRietaewiCii9mahDah'

            @classmethod
            def get_dispatch_uid(cls):
                return None

        self.assertFalse(self.get_widget('test_case_widget_zuRietaewiCii9mahDah'))

    def test_missing_template(self):

        class TestWidgetThree(Widget):
            name = 'test_widget_raiLaiPhahQuahngeer4'

        widget = self.get_widget('test_widget_raiLaiPhahQuahngeer4')
        self.assertRaisesMessage(
            NotImplementedError,
            'A widget class must define either a get_html method or have template_name argument.',
            widget.get_html)
