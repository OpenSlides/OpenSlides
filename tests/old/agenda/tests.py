from unittest.mock import patch
from unittest import skip

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.client import Client

from openslides.agenda.models import Item
from openslides.agenda.slides import agenda_slide
from openslides.users.models import User
from openslides.utils.test import TestCase


class ViewTest(TestCase):
    def setUp(self):
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')
        self.refreshItems()

        self.admin = User.objects.get(pk=1)
        self.anonym = User.objects.create_user('testanonym', 'default')

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

    @skip
    def testOverview(self):
        c = self.adminClient

        response = c.get('/agenda/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['items']), len(Item.objects.all()))

    @skip
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

    @skip
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

    @skip
    def test_view(self):
        item = Item.objects.create(title='quai5OTeephaequ0xei0')
        c = self.adminClient
        response = c.get('/agenda/%s/' % item.id)
        self.assertContains(response, 'quai5OTeephaequ0xei0')
        self.assertTemplateUsed(response, 'agenda/view.html')
        # Test it twice for former error in the template
        response = c.get('/agenda/%s/' % item.id)
        self.assertContains(response, 'quai5OTeephaequ0xei0')

    @skip
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

    @skip
    def test_change_item_order_with_orga_item(self):
        self.item1.type = 2
        self.item1.save()

        data = {
            'i1-self': 1,
            'i1-weight': 50,
            'i1-parent': 0,
            'i2-self': 2,
            'i2-weight': 50,
            'i2-parent': 1}
        response = self.adminClient.post('/agenda/', data)

        self.assertNotEqual(Item.objects.get(pk=2).parent_id, 1)
        self.assertContains(response, 'Agenda items can not be child elements of an organizational item.')

    def test_change_item_order_with_form_error(self):
        """
        Sends invalid data to the view. The expected behavior is to change
        nothing.
        """
        data = {
            'i1-self': 1,
            'i1-weight': 50,
            'i1-parent': 2,
            'i2-self': 2,
            'i2-weight': "invalid",
            'i2-parent': "invalid"}

        self.adminClient.post('/agenda/', data)

        self.assertIsNone(Item.objects.get(pk=1).parent_id, 0)
        self.assertIsNone(Item.objects.get(pk=2).parent_id, 0)

    @skip('Check the tree for integrety in the openslides code')
    def test_change_item_order_with_tree_error(self):
        """
        Sends invalid data to the view. The expected behavior is to change
        nothing.
        """
        data = {
            'i1-self': 1,
            'i1-weight': 50,
            'i1-parent': 2,
            'i2-self': 2,
            'i2-weight': 50,
            'i2-parent': 1}

        self.adminClient.post('/agenda/', data)

        self.assertEqual(Item.objects.get(pk=1).parent_id, 0)
        self.assertEqual(Item.objects.get(pk=2).parent_id, 0)

    @skip
    def test_delete(self):
        response = self.adminClient.get('/agenda/%s/del/' % self.item1.pk)
        self.assertRedirects(response, '/agenda/')
        response = self.adminClient.post('/agenda/%s/del/' % self.item1.pk, {'yes': 1})
        self.assertRedirects(response, '/agenda/')
        self.assertFalse(Item.objects.filter(pk=1).exists())

    @skip
    def test_delete_item_with_children(self):
        item1 = Item.objects.create(title='item1')
        item2 = Item.objects.create(title='item2', parent=item1)

        self.adminClient.post('/agenda/%d/del/' % item1.pk, {'all': 'all'})
        query = Item.objects.filter(pk__in=[item1.pk, item2.pk])
        self.assertFalse(query)

    @skip
    def test_delete_item_with_wrong_answer(self):
        response = self.adminClient.post(
            '/agenda/%s/del/' % self.item1.pk,
            {'unknown_answer_aicipohc1Eeph2chaeng': 1})
        self.assertRedirects(response, '/agenda/')
        self.assertTrue(Item.objects.filter(pk=self.item1.pk).exists())

    @skip
    def test_orga_item_permission(self):
        # Prepare
        self.item1.type = Item.ORGANIZATIONAL_ITEM
        self.item1.save()
        user = User.objects.create_user('testuser_EeBoPh5uyookoowoodii', 'default')
        client = Client()
        client.login(username='testuser_EeBoPh5uyookoowoodii', password='default')
        # Test view with permission
        self.assertTrue(user.has_perm('agenda.can_see_orga_items'))
        self.assertContains(client.get('/agenda/1/'), 'item1')
        # Remove permission
        orga_perm = Permission.objects.get(
            content_type=ContentType.objects.get_for_model(Item),
            codename='can_see_orga_items')
        user.groups.model.objects.get(name='Registered').permissions.remove(orga_perm)
        # Reload user
        user = User.objects.get(username=user.username)
        # Test view without permission
        self.assertFalse(user.has_perm('agenda.can_see_orga_items'))
        response = client.get('/agenda/1/')
        self.assertEqual(response.status_code, 403)
        response = client.get('/agenda/2/')
        self.assertEqual(response.status_code, 200)

    @skip
    def test_orga_item_with_orga_parent_one(self):
        item1 = Item.objects.create(title='item1_Taeboog1de1sahSeiM8y', type=2)
        response = self.adminClient.post(
            '/agenda/new/',
            {'title': 'item2_faelohD2uK7ohNgeepi2',
             'type': '1',
             'parent': item1.pk})
        self.assertFormError(
            response,
            'form',
            None,
            'Agenda items can not be child elements of an organizational item.')

    @skip
    def test_orga_item_with_orga_parent_two(self):
        item1 = Item.objects.create(title='item1_aeNg4Heibee8ULooneep')
        Item.objects.create(title='item2_fooshaeroo7Ohvoow0hoo', parent=item1)
        response = self.adminClient.post(
            '/agenda/%s/edit/' % item1.pk,
            {'title': 'item1_aeNg4Heibee8ULooneep_changed',
             'type': '2'})
        self.assertFormError(
            response,
            'form',
            None,
            'Organizational items can not have agenda items as child elements.')

    @skip
    def test_csv_import(self):
        """
        Test to upload a csv file.
        """
        new_csv_file = SimpleUploadedFile(
            name='new_csv_file.csv',
            content=bytes('Title,text,duration\nTitle thei5KieK6ohphuilahs,Text Chai1ioWae3ASh0Eloh1,42\n,Bad line\n', 'UTF-8'))

        self.adminClient.post('/agenda/csv_import/', {'csvfile': new_csv_file})

        self.assertEqual(Item.objects.all().count(), 3)
        item = Item.objects.get(pk=3)
        self.assertEqual(item.title, 'Title thei5KieK6ohphuilahs')
        self.assertEqual(item.text, 'Text Chai1ioWae3ASh0Eloh1')
        self.assertEqual(item.duration, '42')


class ConfigTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.client.login(username='admin', password='admin')

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
