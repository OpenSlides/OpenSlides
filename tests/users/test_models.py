from openslides.users.api import gen_password, gen_username
from openslides.users.models import Group, User
from openslides.utils.test import TestCase


class UserTest(TestCase):
    def setUp(self):
        self.user1 = User()
        self.user1.first_name = 'Max'
        self.user1.last_name = 'Mustermann'
        self.user1.username = gen_username(
            self.user1.first_name, self.user1.last_name)
        self.user1.default_password = gen_password()
        self.user1.save()

    def test_str(self):
        self.assertEqual(str(self.user1), 'Max Mustermann')

    def test_name_suffix(self):
        self.user1.structure_level = 'München'
        self.user1.save()
        self.assertEqual(str(self.user1), 'Max Mustermann (München)')

    def test_reset_password(self):
        self.assertIsInstance(self.user1.default_password, str)
        self.assertEqual(len(self.user1.default_password), 8)
        self.user1.set_unusable_password()
        self.assertFalse(self.user1.check_password(self.user1.default_password))
        self.user1.reset_password()
        self.assertTrue(self.user1.check_password(self.user1.default_password))

    def test_get_absolute_url(self):
        urls = (('detail', '/user/2/'),
                ('update', '/user/2/edit/'),
                ('delete', '/user/2/del/'))
        for link, url in urls:
            self.assertEqual(self.user1.get_absolute_url(link), url)


class DefaultGroups(TestCase):

    def test_pks_of_default_groups(self):
        default_groups = ((1, 'Anonymous'),
                          (2, 'Registered'),
                          (3, 'Delegates'),
                          (4, 'Staff'))
        for pk, name in default_groups:
            self.assertEqual(Group.objects.get(pk=pk).name, name)

    def test_default_perms_anonymous(self):
        anonymous = Group.objects.get(pk=1)
        default_perms = ('core.can_see_projector',
                         'core.can_see_dashboard',
                         'agenda.can_see_agenda',
                         'agenda.can_see_orga_items',
                         'motion.can_see_motion',
                         'assignment.can_see_assignment',
                         'users.can_see_name',
                         'users.can_see_extra_data',
                         'mediafile.can_see')
        for perm_string in default_perms:
            perm_string_list = []
            for perm in anonymous.permissions.all():
                perm_string_list.append('%s.%s' % (perm.content_type.app_label, perm.codename))
            self.assertTrue(perm_string in perm_string_list)
