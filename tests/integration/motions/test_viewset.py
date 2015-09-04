from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import Tag
from openslides.motions.models import Category, Motion
from openslides.utils.test import TestCase


class CreateMotion(TestCase):
    """
    Tests motion creation.
    """
    def setUp(self):
        self.client.login(username='admin', password='admin')

    def test_simple(self):
        """
        Tests that a motion is created with a specific title and text.

        The created motion should have an identifier and the admin user should
        be the submitter.
        """
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_OoCoo3MeiT9li5Iengu9',
             'text': 'test_text_thuoz0iecheiheereiCi'})

        motion = Motion.objects.get()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(motion.title, 'test_title_OoCoo3MeiT9li5Iengu9')
        self.assertEqual(motion.identifier, '1')
        self.assertTrue(motion.submitters.exists())
        self.assertEqual(motion.submitters.get().username, 'admin')

    def test_with_reason(self):
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_saib4hiHaifo9ohp9yie',
             'text': 'test_text_shahhie8Ej4mohvoorie',
             'reason': 'test_reason_Ou8GivahYivoh3phoh9c'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Motion.objects.get().reason, 'test_reason_Ou8GivahYivoh3phoh9c')

    def test_without_data(self):
        response = self.client.post(
            reverse('motion-list'),
            {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'title': ['This field is required.'], 'text': ['This field is required.']})

    def test_with_category(self):
        category = Category.objects.create(
            name='test_category_name_CiengahzooH4ohxietha',
            prefix='TEST_PREFIX_la0eadaewuec3seoxeiN')
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_Air0bahchaiph1ietoo2',
             'text': 'test_text_chaeF9wosh8OowazaiVu',
             'category_id': category.pk})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.category, category)
        self.assertEqual(motion.identifier, 'TEST_PREFIX_la0eadaewuec3seoxeiN 1')

    def test_with_submitters(self):
        submitter_1 = get_user_model().objects.create_user(
            username='test_username_ooFe6aebei9ieQui2poo',
            password='test_password_vie9saiQu5Aengoo9ku0')
        submitter_2 = get_user_model().objects.create_user(
            username='test_username_eeciengoc4aihie5eeSh',
            password='test_password_peik2Eihu5oTh7siequi')
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_pha7moPh7quoth4paina',
             'text': 'test_text_YooGhae6tiangung5Rie',
             'submitters_id': [submitter_1.pk, submitter_2.pk]})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.submitters.count(), 2)

    def test_with_one_supporter(self):
        supporter = get_user_model().objects.create_user(
            username='test_username_ahGhi4Quohyee7ohngie',
            password='test_password_Nei6aeh8OhY8Aegh1ohX')
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_Oecee4Da2Mu9EY6Ui4mu',
             'text': 'test_text_FbhgnTFgkbjdmvcjbffg',
             'supporters_id': [supporter.pk]})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.supporters.get().username, 'test_username_ahGhi4Quohyee7ohngie')

    def test_with_tag(self):
        tag = Tag.objects.create(name='test_tag_iRee3kiecoos4rorohth')
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_Hahke4loos4eiduNiid9',
             'text': 'test_text_johcho0Ucaibiehieghe',
             'tags_id': [tag.pk]})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.tags.get().name, 'test_tag_iRee3kiecoos4rorohth')

    def test_with_workflow(self):
        self.assertEqual(config['motions_workflow'], '1')
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_eemuR5hoo4ru2ahgh5EJ',
             'text': 'test_text_ohviePopahPhoili7yee',
             'workflow': '2'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.state.workflow.pk, 2)


class UpdateMotion(TestCase):
    """
    Tests updating motions.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_aeng7ahChie3waiR8xoh',
            text='test_text_xeigheeha7thopubeu4U')
        self.motion.save()

    def test_simple_patch(self):
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            {'identifier': 'test_identifier_jieseghohj7OoSah1Ko9'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, 'test_title_aeng7ahChie3waiR8xoh')
        self.assertEqual(motion.identifier, 'test_identifier_jieseghohj7OoSah1Ko9')

    def test_patch_workflow(self):
        self.assertEqual(config['motions_workflow'], '1')
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            {'workflow': '2'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, 'test_title_aeng7ahChie3waiR8xoh')
        self.assertEqual(motion.workflow, 2)

    def test_patch_supporters(self):
        supporter = get_user_model().objects.create_user(
            username='test_username_ieB9eicah0uqu6Phoovo',
            password='test_password_XaeTe3aesh8ohg6Cohwo')
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            {'supporters_id': [supporter.pk]})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, 'test_title_aeng7ahChie3waiR8xoh')
        self.assertEqual(motion.supporters.get().username, 'test_username_ieB9eicah0uqu6Phoovo')

    def test_removal_of_supporters(self):
        admin = get_user_model().objects.get(username='admin')
        group_staff = admin.groups.get(name='Staff')
        admin.groups.remove(group_staff)
        self.motion.submitters.add(admin)
        supporter = get_user_model().objects.create_user(
            username='test_username_ahshi4oZin0OoSh9chee',
            password='test_password_Sia8ahgeenixu5cei2Ib')
        self.motion.supporters.add(supporter)
        config['motions_remove_supporters'] = True
        self.assertEqual(self.motion.supporters.count(), 1)

        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            {'title': 'new_title_ohph1aedie5Du8sai2ye'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, 'new_title_ohph1aedie5Du8sai2ye')
        self.assertEqual(motion.supporters.count(), 0)


class ManageVersion(TestCase):
    """
    Tests permitting and deleting versions.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_InieJ5HieZieg1Meid7K',
            text='test_text_daePhougho7EenguWe4g')
        self.motion.save()
        self.version_2 = self.motion.get_new_version(title='new_title_fee7tef0seechazeefiW')
        self.motion.save(use_version=self.version_2)

    def test_permit(self):
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).active_version.version_number, 2)
        response = self.client.put(
            reverse('motion-manage-version', args=[self.motion.pk]),
            {'version_number': '1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'Version 1 permitted successfully.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).active_version.version_number, 1)

    def test_permit_invalid_version(self):
        response = self.client.put(
            reverse('motion-manage-version', args=[self.motion.pk]),
            {'version_number': '3'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete(self):
        response = self.client.delete(
            reverse('motion-manage-version', args=[self.motion.pk]),
            {'version_number': '1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'Version 1 deleted successfully.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).versions.count(), 1)

    def test_delete_active_version(self):
        response = self.client.delete(
            reverse('motion-manage-version', args=[self.motion.pk]),
            {'version_number': '2'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'You can not delete the active version of a motion.'})


class SupportMotion(TestCase):
    """
    Tests supporting a motion.
    """
    def setUp(self):
        self.admin = get_user_model().objects.get(username='admin')
        self.admin.groups.add(3)
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_chee7ahCha6bingaew4e',
            text='test_text_birah1theL9ooseeFaip')
        self.motion.save()

    def test_support(self):
        config['motions_min_supporters'] = 1
        response = self.client.post(reverse('motion-support', args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'You have supported this motion successfully.'})

    def test_unsupport(self):
        config['motions_min_supporters'] = 1
        self.motion.supporters.add(self.admin)
        response = self.client.delete(reverse('motion-support', args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'You have unsupported this motion successfully.'})


class SetState(TestCase):
    """
    Tests setting a state.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_iac4ohquie9Ku6othieC',
            text='test_text_Xohphei6Oobee0Evooyu')
        self.motion.save()
        self.state_id_accepted = 2  # This should be the id of the state 'accepted'.

    def test_set_state(self):
        response = self.client.put(
            reverse('motion-set-state', args=[self.motion.pk]),
            {'state': self.state_id_accepted})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'The state of the motion was set to accepted.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).state.name, 'accepted')

    def test_set_state_with_string(self):
        # Using a string is not allowed even if it is the correct name of the state.
        response = self.client.put(
            reverse('motion-set-state', args=[self.motion.pk]),
            {'state': 'accepted'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'Invalid data. State must be an integer.'})

    def test_set_unknown_state(self):
        invalid_state_id = 0
        response = self.client.put(
            reverse('motion-set-state', args=[self.motion.pk]),
            {'state': invalid_state_id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'You can not set the state to %d.' % invalid_state_id})

    def test_reset(self):
        self.motion.set_state(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(reverse('motion-set-state', args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'The state of the motion was set to submitted.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).state.name, 'submitted')
