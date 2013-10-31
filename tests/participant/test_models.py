# -*- coding: utf-8 -*-

from openslides.participant.api import gen_password, gen_username
from openslides.participant.models import Group, User
from openslides.utils.person import get_person, Persons
from openslides.utils.test import TestCase


class UserTest(TestCase):
    def setUp(self):
        self.user1 = User()
        self.user1.first_name = u'Max'
        self.user1.last_name = u'Mustermann'
        self.user1.username = gen_username(
            self.user1.first_name, self.user1.last_name)
        self.user1.default_password = gen_password()
        self.user1.save()
        self.django_user1 = self.user1.django_user

    def test_participant_user(self):
        self.assertEqual(self.django_user1.user, self.user1)
        self.assertEqual(self.django_user1, self.user1.django_user)

    def test_repr(self):
        self.assertEqual(unicode(self.user1), 'Max Mustermann')

    def test_name_suffix(self):
        self.user1.structure_level = u'München'
        self.user1.save()
        self.assertEqual(unicode(self.user1), u'Max Mustermann (München)')

    def test_reset_password(self):
        self.assertIsInstance(self.user1.default_password, basestring)
        self.assertEqual(len(self.user1.default_password), 8)
        self.user1.set_unusable_password()
        self.assertFalse(self.user1.check_password(self.user1.default_password))
        self.user1.reset_password()
        self.assertTrue(self.user1.check_password(self.user1.default_password))

    def test_person_api(self):
        self.assertTrue(hasattr(self.user1, 'person_id'))
        self.assertEqual(self.user1.person_id, 'user:2')
        self.assertEqual(get_person('user:2'), self.user1)
        self.assertEqual(len(Persons(person_prefix_filter='user')), 2)


class GroupTest(TestCase):
    def setUp(self):
        self.group1 = Group.objects.create(name='Test Group')
        self.django_group1 = self.group1.django_group

    def test_group_group(self):
        self.assertEqual(self.group1.django_group, self.django_group1)
        self.assertEqual(self.group1, self.django_group1.group)

    def test_person_api(self):
        self.assertTrue(hasattr(self.group1, 'person_id'))
        person_id = "group:%d" % self.group1.id
        self.assertEqual(self.group1.person_id, person_id)
        self.assertRaises(Group.DoesNotExist)
        self.group1.group_as_person = True
        self.group1.save()
        self.assertEqual(get_person(person_id), self.group1)


class DefaultGroups(TestCase):

    def test_pks_of_default_groups(self):
        default_groups = ((1, 'Anonymous'),
                          (2, 'Registered'),
                          (3, 'Delegates'),
                          (4, 'Staff'))
        for pk, name in default_groups:
            self.assertEquals(Group.objects.get(pk=pk).name, name)

    def test_default_perms_anonymous(self):
        anonymous = Group.objects.get(pk=1)
        default_perms = ('projector.can_see_projector',
                         'projector.can_see_dashboard',
                         'agenda.can_see_agenda',
                         'agenda.can_see_orga_items',
                         'motion.can_see_motion',
                         'assignment.can_see_assignment',
                         'participant.can_see_participant',
                         'mediafile.can_see')
        for perm_string in default_perms:
            perm_string_list = []
            for perm in anonymous.permissions.all():
                perm_string_list.append('%s.%s' % (perm.content_type.app_label, perm.codename))
            self.assertTrue(perm_string in perm_string_list)
