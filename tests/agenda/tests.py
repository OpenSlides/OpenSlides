#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.tests
    ~~~~~~~~~~~~~~~~~~~~~~~

    Unit test for the agenda app.

    :copyright: 2011-2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client
from django.db.models.query import EmptyQuerySet

from openslides.utils.test import TestCase
from openslides.projector.api import get_active_slide, set_active_slide
from openslides.participant.models import User
from openslides.agenda.models import Item
from openslides.agenda.slides import agenda_slide

from .models import RelatedItem, BadRelatedItem


class ItemTest(TestCase):
    def setUp(self):
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')
        self.item3 = Item.objects.create(title='item1A', parent=self.item1)
        self.item4 = Item.objects.create(title='item1Aa', parent=self.item3)
        self.related = RelatedItem.objects.create(name='ekdfjen458gj1siek45nv')
        self.item5 = Item.objects.create(title='item5', content_object=self.related)

    def testClosed(self):
        self.assertFalse(self.item1.closed)

        self.item1.set_closed()
        self.assertTrue(self.item1.closed)

        self.item1.set_closed(closed=False)
        self.assertFalse(self.item1.closed)

    def testParents(self):
        self.assertEqual(type(self.item1.get_ancestors()), EmptyQuerySet)
        self.assertTrue(self.item1 in self.item3.get_ancestors())
        self.assertTrue(self.item1 in self.item4.get_ancestors())
        self.assertFalse(self.item2 in self.item4.get_ancestors())

    def testChildren(self):
        self.assertEqual(list(self.item2.get_children()), [])
        self.assertTrue(self.item3 in self.item1.get_children())
        self.assertFalse(self.item4 in self.item1.get_children())

    def testForms(self):
        for item in Item.objects.all():
            initial = item.weight_form.initial
            self.assertEqual(initial['self'], item.id)
            if item.parent:
                self.assertEqual(initial['parent'], item.parent.id)
            else:
                self.assertEqual(initial['parent'], 0)
            self.assertEqual(initial['weight'], item.weight)

    def test_title_supplement(self):
        self.assertEqual(self.item1.get_title_supplement(), '')

    def test_delete_item(self):
        new_item1 = Item.objects.create()
        new_item2 = Item.objects.create(parent=new_item1)
        new_item3 = Item.objects.create(parent=new_item2)
        new_item1.delete()
        self.assertTrue(new_item3 in Item.objects.all())
        new_item2.delete(with_children=True)
        self.assertFalse(new_item3 in Item.objects.all())

    def test_absolute_url(self):
        self.assertEqual(self.item1.get_absolute_url(), '/agenda/1/')
        self.assertEqual(self.item1.get_absolute_url('edit'), '/agenda/1/edit/')
        self.assertEqual(self.item1.get_absolute_url('delete'), '/agenda/1/del/')

    def test_related_item(self):
        self.assertEqual(self.item5.get_title(), self.related.name)
        self.assertEqual(self.item5.get_title_supplement(), 'test item')
        self.assertEqual(self.item5.content_type.name, 'Related Item CHFNGEJ5634DJ34F')

    def test_deleted_related_item(self):
        self.related.delete()
        self.assertFalse(RelatedItem.objects.all().exists())
        self.assertEqual(Item.objects.get(pk=self.item5.pk).title, '< Item for deleted slide (ekdfjen458gj1siek45nv) >')

    def test_bad_related_item(self):
        bad = BadRelatedItem.objects.create(name='dhfne94irkgl2047fzvb')
        item = Item.objects.create(title='item_jghfndzrh46w738kdmc', content_object=bad)
        self.assertRaisesMessage(
            NotImplementedError,
            'You have to provide a get_agenda_title method on your related model.',
            item.get_title)
        self.assertRaisesMessage(
            NotImplementedError,
            'You have to provide a get_agenda_title_supplement method on your related model.',
            item.get_title_supplement)


class ViewTest(TestCase):
    def setUp(self):
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')
        self.refreshItems()

        self.admin = User.objects.get(pk=1)
        self.anonym, created = User.objects.get_or_create(username='testanonym')
        self.anonym.reset_password('default')

    def refreshItems(self):
        self.item1 = Item.objects.get(pk=self.item1.id)
        self.item2 = Item.objects.get(pk=self.item2.id)

    @property
    def adminClient(self):
        c = Client()
        c.login(username='admin', password='admin')
        return c

    @property
    def anonymClient(self):
        return Client()

    def testOverview(self):
        c = self.adminClient

        response = c.get('/agenda/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['items']), len(Item.objects.all()))

    def testClose(self):
        c = self.adminClient

        response = c.get('/agenda/%d/close/' % self.item1.id)
        self.refreshItems()
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Item.objects.get(pk=self.item1.id).closed)

        response = c.get('/agenda/%d/open/' % self.item1.id)
        self.refreshItems()
        self.assertEqual(response.status_code, 302)
        self.assertFalse(self.item1.closed)

        response = c.get('/agenda/%d/open/' % 1000)
        self.refreshItems()
        self.assertEqual(response.status_code, 404)

        # Test ajax
        response = c.get('/agenda/%d/close/' % self.item1.id,
                         HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)
        response = c.get('/agenda/%d/open/' % self.item1.id,
                         HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)

    def testEdit(self):
        c = self.adminClient

        response = c.get('/agenda/%d/edit/' % self.item1.id)
        self.assertEqual(response.status_code, 200)

        response = c.get('/agenda/%d/edit/' % 1000)
        self.assertEqual(response.status_code, 404)

        data = {'title': 'newitem1', 'text': 'item1-text', 'weight': '0',
                'type': 1}
        response = c.post('/agenda/%d/edit/' % self.item1.id, data)
        self.assertEqual(response.status_code, 302)
        self.refreshItems()
        self.assertEqual(self.item1.title, 'newitem1')
        self.assertEqual(self.item1.text, 'item1-text')

        data = {'title': '', 'text': 'item1-text', 'weight': '0'}
        response = c.post('/agenda/%d/edit/' % self.item1.id, data)
        self.assertEqual(response.status_code, 200)
        self.refreshItems()
        self.assertEqual(self.item1.title, 'newitem1')

    def test_view(self):
        item = Item.objects.create(title='quai5OTeephaequ0xei0')
        c = self.adminClient
        response = c.get('/agenda/%s/' % item.id)
        self.assertContains(response, 'quai5OTeephaequ0xei0')
        self.assertTemplateUsed(response, 'agenda/view.html')
        # Test it twice for former error in the template
        response = c.get('/agenda/%s/' % item.id)
        self.assertContains(response, 'quai5OTeephaequ0xei0')

    def test_change_item_order(self):
        data = {
            'i1-self': 1,
            'i1-weight': 50,
            'i1-parent': 0,
            'i2-self': 2,
            'i2-weight': 50,
            'i2-parent': 1}
        response = self.adminClient.post('/agenda/', data)

        # Test values in response.
        items = response.context['items']
        self.assertIsNone(items[0].parent)
        self.assertEqual(items[1].parent_id, 1)

        # Test values in DB
        self.assertIsNone(Item.objects.get(pk=1).parent)
        self.assertEqual(Item.objects.get(pk=2).parent_id, 1)


class ConfigTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create(username='config_test_admin')
        self.admin.reset_password('default')
        self.admin.is_superuser = True
        self.admin.save()
        self.client = Client()
        self.client.login(username='config_test_admin', password='default')

    def test_config_page_css_javascript(self):
        response = self.client.get('/config/agenda/')
        self.assertContains(response, 'timepicker.css', status_code=200)
        self.assertContains(response, 'jquery-ui-timepicker-addon.min.js', status_code=200)

    def test_wrong_input(self):
        response = self.client.post(
            '/config/agenda/',
            {'agenda_start_event_date_time': 'wrong_format',
             'agenda_show_last_speakers': '3'})
        self.assertFormError(response, form='form',
                             field='agenda_start_event_date_time',
                             errors='Invalid input.')
