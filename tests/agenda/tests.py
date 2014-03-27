# -*- coding: utf-8 -*-

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.client import Client
from mock import patch

from openslides.agenda.models import Item
from openslides.agenda.slides import agenda_slide
from openslides.participant.models import User
from openslides.projector.api import set_active_slide
from openslides.utils.test import TestCase

from .models import BadRelatedItem, RelatedItem


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
        self.assertFalse(self.item1.get_ancestors())
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
        self.assertEqual(self.item1.get_absolute_url('update'), '/agenda/1/edit/')
        self.assertEqual(self.item1.get_absolute_url('delete'), '/agenda/1/del/')

    def test_related_item(self):
        self.assertEqual(self.item5.get_title(), self.related.name)
        self.assertEqual(self.item5.get_title_supplement(), 'test item')
        self.assertEqual(self.item5.content_type.name, 'Related Item CHFNGEJ5634DJ34F')

    def test_deleted_related_item(self):
        self.related.delete()
        self.assertFalse(RelatedItem.objects.all().exists())
        self.assertEqual(Item.objects.get(pk=self.item5.pk).title,
                         '< Item for deleted slide (ekdfjen458gj1siek45nv) >')

    def test_related_item_get_absolute_url(self):
        """
        Tests that the get_absolute_url method with the link 'projector'
        and 'projector_preview' returns the absolute_url for the related
        item.
        """
        self.assertEqual(self.item5.get_absolute_url('projector'),
                         '/projector/activate/test_related_item/?pk=1')
        self.assertEqual(self.item5.get_absolute_url('projector_preview'),
                         '/projector/preview/test_related_item/?pk=1')

    def test_activate_related_item(self):
        """
        The agenda item has to be active, if its related item is.
        """
        set_active_slide('test_related_item', pk=1)
        self.assertTrue(self.item5.is_active_slide())

    def test_is_active_related_item_list_of_speakers(self):
        """
        Test the method 'is_active_slide' if the item is related but the list
        of speakers is shown on the projector.
        """
        set_active_slide('agenda', type='list_of_speakers', pk=5)
        self.assertTrue(self.item5.is_active_slide())

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

    def test_delete(self):
        response = self.adminClient.get('/agenda/%s/del/' % self.item1.pk)
        self.assertRedirects(response, '/agenda/')
        response = self.adminClient.post('/agenda/%s/del/' % self.item1.pk, {'yes': 1})
        self.assertRedirects(response, '/agenda/')
        self.assertFalse(Item.objects.filter(pk=1).exists())

    def test_delete_item_with_children(self):
        item1 = Item.objects.create(title='item1')
        item2 = Item.objects.create(title='item2', parent=item1)

        self.adminClient.post('/agenda/%d/del/' % item1.pk, {'all': 'all'})
        query = Item.objects.filter(pk__in=[item1.pk, item2.pk])
        self.assertFalse(query)

    def test_delete_item_with_wrong_answer(self):
        response = self.adminClient.post(
            '/agenda/%s/del/' % self.item1.pk,
            {'unknown_answer_aicipohc1Eeph2chaeng': 1})
        self.assertRedirects(response, '/agenda/')
        self.assertTrue(Item.objects.filter(pk=self.item1.pk).exists())

    def test_orga_item_permission(self):
        # Prepare
        self.item1.type = Item.ORGANIZATIONAL_ITEM
        self.item1.save()
        user = User.objects.create(username='testuser_EeBoPh5uyookoowoodii')
        user.reset_password('default')
        client = Client()
        client.login(username='testuser_EeBoPh5uyookoowoodii', password='default')
        # Test view with permission
        self.assertTrue(user.has_perm('agenda.can_see_orga_items'))
        self.assertContains(client.get('/agenda/1/'), 'item1')
        # Remove permission
        orga_perm = Permission.objects.get(
            content_type=ContentType.objects.get_for_model(Item),
            codename='can_see_orga_items')
        user.groups.get(name='Registered').permissions.remove(orga_perm)
        # Reload user
        user = User.objects.get(username=user.username)
        # Test view without permission
        self.assertFalse(user.has_perm('agenda.can_see_orga_items'))
        response = client.get('/agenda/1/')
        self.assertEqual(response.status_code, 403)
        response = client.get('/agenda/2/')
        self.assertEqual(response.status_code, 200)

    def test_csv_import(self):
        item_number = Item.objects.all().count()
        new_csv_file = SimpleUploadedFile(
            name='new_csv_file.csv',
            content='Title,text,duration\nTitle thei5KieK6ohphuilahs,Text Chai1ioWae3ASh0Eloh1,42\n,Bad line\n')
        self.adminClient.post('/agenda/csv_import/', {'csvfile': new_csv_file})
        self.assertEqual(Item.objects.all().count(), item_number + 1)
        item = Item.objects.get(pk=3)
        self.assertEqual(item.title, 'Title thei5KieK6ohphuilahs')
        self.assertEqual(item.text, 'Text Chai1ioWae3ASh0Eloh1')
        self.assertEqual(item.duration, '42')


class ConfigTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create(username='config_test_admin')
        self.admin.reset_password('default')
        self.admin.is_superuser = True
        self.admin.save()
        self.client = Client()
        self.client.login(username='config_test_admin', password='default')

    def test_config_collection_css_javascript(self):
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


@patch('openslides.agenda.slides.render_to_string')
class SlideTest(TestCase):
    """
    Test the agenda slide.
    """

    def setUp(self):
        self.item1 = Item.objects.create(title='first slide')
        Item.objects.create(title='second slide')
        Item.objects.create(title='first child', parent=self.item1)
        Item.objects.create(title='second child', parent=self.item1)

    def test_full_agenda_summary(self, mock_render_to_string):
        agenda_slide()
        self.assertTrue(mock_render_to_string.called)
        self.assertEqual(mock_render_to_string.call_args[0][0], 'agenda/item_slide_summary.html')
        query = mock_render_to_string.call_args[0][1]['items']
        self.assertEqual(repr(query), repr(Item.objects.filter(pk__in=[1, 2])))

    def test_item_summary(self, mock_render_to_string):
        agenda_slide(type='summary', pk=1)
        self.assertTrue(mock_render_to_string.called)
        self.assertEqual(mock_render_to_string.call_args[0][0], 'agenda/item_slide_summary.html')
        self.assertEqual(mock_render_to_string.call_args[0][1]['title'], self.item1.get_title())
        query = mock_render_to_string.call_args[0][1]['items']
        self.assertEqual(repr(query), repr(Item.objects.filter(pk__in=[3, 4])))

    def test_normal_slide(self, mock_render_to_string):
        agenda_slide(pk=1)
        self.assertTrue(mock_render_to_string.called)
        self.assertEqual(mock_render_to_string.call_args[0][0], 'agenda/item_slide.html')
        item = mock_render_to_string.call_args[0][1]['item']
        self.assertEqual(item, Item.objects.get(pk=1))
