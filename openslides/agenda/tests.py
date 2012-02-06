#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.test
    ~~~~~~~~~~~~~~~~~~~~~~

    Unit test for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User

from openslides.agenda.models import Item, ItemText
from openslides.agenda.api import get_active_item, is_summary, children_list

class ItemTest(TestCase):
    def setUp(self):
        self.item1 = ItemText.objects.create(title='item1')
        self.item2 = ItemText.objects.create(title='item2')
        self.item3 = ItemText.objects.create(title='item1A', parent=self.item1)
        self.item4 = ItemText.objects.create(title='item1Aa', parent=self.item3)

    def testActive(self):
        with self.assertRaises(Item.DoesNotExist):
            get_active_item()
        self.assertTrue(is_summary())
        self.assertFalse(self.item4.active_parent)

        self.assertFalse(self.item1.active)

        self.item1.set_active()
        self.assertTrue(self.item1.active)
        self.assertTrue(self.item4.active_parent)

        self.assertEqual(get_active_item().cast(), self.item1)
        self.assertNotEqual(get_active_item().cast(), self.item2)

        self.assertFalse(is_summary())

        self.item2.set_active(summary=True)
        self.assertFalse(self.item1.active)
        self.assertTrue(is_summary())

    def testClosed(self):
        self.assertFalse(self.item1.closed)

        self.item1.set_closed()
        self.assertTrue(self.item1.closed)

        self.item1.set_closed(closed=False)
        self.assertFalse(self.item1.closed)

    def testParents(self):
        self.assertEqual(self.item1.parents, [])
        self.assertTrue(self.item1 in self.item3.parents)
        self.assertTrue(self.item1 in self.item4.parents)
        self.assertFalse(self.item2 in self.item4.parents)

    def testChildren(self):
        self.assertEqual(list(self.item2.children), [])
        self.assertTrue(self.item3 in [item.cast() for item  in self.item1.children])
        self.assertFalse(self.item4 in [item.cast() for item  in self.item1.children])

        l = children_list([self.item1, self.item2])
        self.assertEqual(str(l), "[<ItemText: item1>, <Item: item1A>, <Item: item1Aa>, <ItemText: item2>]")

    def testForms(self):
        for item in Item.objects.all():
            initial = item.weight_form.initial
            self.assertEqual(initial['self'], item.id)
            if item.parent:
                self.assertEqual(initial['parent'], item.parent.id)
            else:
                self.assertEqual(initial['parent'], 0)
            self.assertEqual(initial['weight'], item.weight)

            item.edit_form()

    def testtype(self):
        self.assertEqual(self.item1.type, 'ItemText')


class ViewTest(TestCase):
    def setUp(self):
        self.item1 = ItemText.objects.create(title='item1')
        self.item2 = ItemText.objects.create(title='item2')
        self.refreshItems()

        self.admin = User.objects.create_user('testadmin', '', 'default')
        self.anonym = User.objects.create_user('testanoym', '', 'default')

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

    def testActivate(self):
        c = self.adminClient

        response = c.get('/agenda/%d/activate/' % self.item1.id)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(self.item1.active)
        self.assertFalse(self.item2.active)
        self.assertFalse(is_summary())

        response = c.get('/agenda/%d/activate/summary/' % self.item2.id)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(self.item2.active)
        self.assertFalse(self.item1.active)
        self.assertTrue(is_summary())

        response = c.get('/agenda/%d/activate/' % 0)
        self.assertEqual(response.status_code, 302)
        self.assertFalse(self.item2.active)
        self.assertFalse(self.item1.active)
        with self.assertRaises(Item.DoesNotExist):
            get_active_item()

        response = c.get('/agenda/%d/activate/' % 10000)
        self.assertEqual(response.status_code, 302)
        self.assertFalse(self.item2.active)
        self.assertFalse(self.item1.active)

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
        self.assertEqual(response.status_code, 302)

    def testEdit(self):
        c = self.adminClient

        response = c.get('/agenda/%d/edit/' % self.item1.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['form'].instance, self.item1.cast())

        response = c.get('/agenda/%d/edit/' % 1000)
        self.assertEqual(response.status_code, 302)


        data = {'title': 'newitem1', 'text': 'item1-text', 'weight':'0'}
        response = c.post('/agenda/%d/edit/' % self.item1.id, data)
        self.assertEqual(response.status_code, 302)
        self.refreshItems()
        self.assertEqual(self.item1.cast().title, 'newitem1')
        self.assertEqual(self.item1.cast().text, 'item1-text')

        data = {'title': '', 'text': 'item1-text', 'weight': '0'}
        response = c.post('/agenda/%d/edit/' % self.item1.id, data)
        self.assertEqual(response.status_code, 200)
        self.refreshItems()
        self.assertEqual(self.item1.cast().title, 'newitem1')

    def testNew(self):
        pass

