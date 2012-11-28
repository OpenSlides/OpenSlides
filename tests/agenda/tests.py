#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.tests
    ~~~~~~~~~~~~~~~~~~~~~~~

    Unit test for the agenda app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase
from django.test.client import Client
from django.db.models.query import EmptyQuerySet

from openslides.projector.api import get_active_slide
from openslides.participant.models import User
from openslides.agenda.models import Item
from openslides.agenda.slides import agenda_show

from .models import ReleatedItem


class ItemTest(TestCase):
    def setUp(self):
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')
        self.item3 = Item.objects.create(title='item1A', parent=self.item1)
        self.item4 = Item.objects.create(title='item1Aa', parent=self.item3)
        self.releated = ReleatedItem.objects.create(name='foo')
        self.item5 = Item.objects.create(title='item5', related_sid=self.releated.sid)

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

    def testRelated_sid(self):
        self.item1.related_sid = 'foobar'
        self.assertFalse(self.item1.get_related_slide() is None)

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

    def test_agenda_slide(self):
        data = agenda_show()
        self.assertEqual(list(data['items']), list(Item.objects.all().filter(parent=None)))
        self.assertEqual(data['template'], 'projector/AgendaSummary.html')
        self.assertEqual(data['title'], 'Agenda')

    def test_releated_item(self):
        self.assertEqual(self.item5.get_title(), self.releated.name)
        self.assertEqual(self.item5.get_title_supplement(), 'test item')
        self.assertEqual(self.item5.get_related_type(), 'releateditem')
        self.assertEqual(self.item5.print_related_type(), 'Releateditem')



class ViewTest(TestCase):
    def setUp(self):
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')
        self.refreshItems()

        self.admin, created = User.objects.get_or_create(username='testadmin')
        self.anonym, created = User.objects.get_or_create(username='testanonym')
        self.admin.reset_password('default')
        self.anonym.reset_password('default')

        self.admin.is_superuser = True
        self.admin.save()

    def refreshItems(self):
        self.item1 = Item.objects.get(pk=self.item1.id)
        self.item2 = Item.objects.get(pk=self.item2.id)

    @property
    def adminClient(self):
        c = Client()
        c.login(username='testadmin', password='default')
        return c

    @property
    def anonymClient(self):
        return Client()

    def testOverview(self):
        c = self.adminClient

        response = c.get('/agenda/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['items']), len(Item.objects.all()))

    def testActivate(self):
        c = self.adminClient

        response = c.get('/projector/activate/%s/' % self.item1.sid)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(self.item1.active)
        self.assertFalse(self.item2.active)

        response = c.get('/projector/activate/%s/' % 'agenda')
        self.assertEqual(response.status_code, 302)
        self.assertFalse(self.item2.active)
        self.assertFalse(self.item1.active)
        self.assertEqual(get_active_slide(only_sid=True), 'agenda')

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

        data = {'title': 'newitem1', 'text': 'item1-text', 'weight': '0'}
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
