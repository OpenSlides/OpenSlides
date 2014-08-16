from django.test.client import Client

from openslides.agenda.models import Item, Speaker
from openslides.assignment.models import Assignment
from openslides.participant.models import User
from openslides.utils.test import TestCase


class AssignmentModelTest(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_delete_with_related_item(self):
        assignment = Assignment.objects.create(name='assignment_name_fgdhensbch34zfu1284ds', posts=1)
        response = self.admin_client.get('/assignment/1/agenda/')
        self.assertRedirects(response, '/agenda/')
        self.assertEqual(Item.objects.get(pk=1).get_title(), 'assignment_name_fgdhensbch34zfu1284ds')
        assignment.delete()
        self.assertTrue(Item.objects.filter(pk=1).exists())

    def test_begin_speach(self):
        assignment = Assignment.objects.create(name='test_assignment_gjbnchs4620sdfhjfsksj1', posts=1)
        item = Item.objects.create(content_object=assignment)
        person_1 = User.objects.create(username='user_1_bnhdjgd8747djcbjd8fg')
        person_2 = User.objects.create(username='user_2_qmlkohid6qvx5q0fbmh9')
        person_3 = User.objects.create(username='user_3_nbjf74jf9bjag219ou96')
        assignment.run(person_1, person_1)
        assignment.run(person_2, person_2)
        assignment.run(person_3, person_3)
        Speaker.objects.add(person_1, item)
        self.assertEqual(item.speaker_set.count(), 1)

        assignment.gen_poll()
        self.assertTrue(item.speaker_set.filter(person=person_1).exists())
        self.assertTrue(item.speaker_set.filter(person=person_2).exists())
        self.assertTrue(item.speaker_set.filter(person=person_3).exists())
