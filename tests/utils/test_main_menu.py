# -*- coding: utf-8 -*-

from django.contrib.auth.models import AnonymousUser
from django.test.client import RequestFactory

from openslides.utils.test import TestCase
from openslides.utils.main_menu import MainMenuEntry


class MainMenuEntryObject(TestCase):
    request_factory = RequestFactory()

    def get_entry(self, cls):
        request = self.request_factory.get('/')
        request.user = AnonymousUser()
        for entry in MainMenuEntry.get_all(request):
            if type(entry) == cls:
                value = entry
                break
        else:
            value = False
        return value

    def test_appearance(self):
        class TestMenuEntryOne(MainMenuEntry):
            pattern_name = 'core_version'
            verbose_name = 'Menu entry for testing gae2thooc4che4thaoNo'

        self.assertEqual(unicode(self.get_entry(TestMenuEntryOne)), u'Menu entry for testing gae2thooc4che4thaoNo')

    def test_missing_verbose_name(self):
        class TestMenuEntryBadOne(MainMenuEntry):
            pattern_name = 'core_version'

        entry = self.get_entry(TestMenuEntryBadOne)
        text = ('The main menu entry class TestMenuEntryBadOne must provide a '
                'verbose_name attribute or override the __unicode__ method.')
        self.assertRaisesMessage(NotImplementedError, text, unicode, entry)

    def test_missing_pattern_name(self):
        class TestMenuEntryBadTwo(MainMenuEntry):
            verbose_name = 'Menu entry for testing ahVeibai1iecaish2aeR'

        entry = self.get_entry(TestMenuEntryBadTwo)
        text = ('The main menu entry class TestMenuEntryBadTwo must provide a '
                'pattern_name attribute or override the get_url method.')
        self.assertRaisesMessage(NotImplementedError, text, entry.get_url)
