import json

from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import Tag
from openslides.motions.models import Category, Motion, State
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
        """
        Test to create a motion with a specific workflow.
        """
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_eemuR5hoo4ru2ahgh5EJ',
             'text': 'test_text_ohviePopahPhoili7yee',
             'workflow_id': '2'})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Motion.objects.get().state.workflow_id, 2)

    def test_non_admin(self):
        """
        Test to create a motion by a delegate, non staff user.
        """
        self.admin = get_user_model().objects.get(username='admin')
        self.admin.groups.add(3)
        self.admin.groups.remove(4)

        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_peiJozae0luew9EeL8bo',
             'text': 'test_text_eHohS8ohr5ahshoah8Oh'})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class RetrieveMotion(TestCase):
    """
    Tests retrieving a motion (with poll results).
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_uj5eeSiedohSh3ohyaaj',
            text='test_text_ithohchaeThohmae5aug')
        self.motion.save()
        self.motion.create_poll()

    def test_number_of_queries(self):
        with self.assertNumQueries(16):
            self.client.get(reverse('motion-detail', args=[self.motion.pk]))


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
        """
        Tests to only update the workflow of a motion.
        """
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            {'workflow_id': '2'})

        motion = Motion.objects.get()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(motion.title, 'test_title_aeng7ahChie3waiR8xoh')
        self.assertEqual(motion.workflow, 2)

    def test_patch_supporters(self):
        supporter = get_user_model().objects.create_user(
            username='test_username_ieB9eicah0uqu6Phoovo',
            password='test_password_XaeTe3aesh8ohg6Cohwo')
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            json.dumps({'supporters_id': [supporter.pk]}),
            content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, 'test_title_aeng7ahChie3waiR8xoh')
        self.assertEqual(motion.supporters.get().username, 'test_username_ieB9eicah0uqu6Phoovo')

    def test_patch_supporters_non_manager(self):
        non_admin = get_user_model().objects.create_user(
            username='test_username_uqu6PhoovieB9eicah0o',
            password='test_password_Xaesh8ohg6CoheTe3awo')
        self.client.login(
            username='test_username_uqu6PhoovieB9eicah0o',
            password='test_password_Xaesh8ohg6CoheTe3awo')
        motion = Motion.objects.get()
        motion.submitters.add(non_admin)
        motion.supporters.clear()
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            json.dumps({'supporters_id': [1]}),
            content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(motion.supporters.exists())

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

    def test_with_new_version(self):
        self.motion.set_state(State.objects.get(name='permitted'))
        self.motion.save()
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            {'text': 'test_text_aeb1iaghahChong5od3a'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.versions.count(), 2)

    def test_without_new_version(self):
        self.motion.set_state(State.objects.get(name='permitted'))
        self.motion.save()
        response = self.client.patch(
            reverse('motion-detail', args=[self.motion.pk]),
            {'text': 'test_text_aeThaeroneiroo7Iophu',
             'disable_versioning': True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.versions.count(), 1)


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


class CreateMotionPoll(TestCase):
    """
    Tests creating polls of motions.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_Aiqueigh2dae9phabiqu',
            text='test_text_Neekoh3zou6li5rue8iL')
        self.motion.save()

    def test_create_first_poll_with_values_then_second_poll_without(self):
        self.poll = self.motion.create_poll()
        self.poll.set_vote_objects_with_values(self.poll.get_options().get(), {'Yes': 42, 'No': 43, 'Abstain': 44})
        response = self.client.post(
            reverse('motion-create-poll', args=[self.motion.pk]))
        self.assertEqual(self.motion.polls.count(), 2)
        response = self.client.get(reverse('motion-detail', args=[self.motion.pk]))
        for key in ('yes', 'no', 'abstain'):
            self.assertTrue(response.data['polls'][1][key] is None, 'Vote value "{}" should be None.'.format(key))


class UpdateMotionPoll(TestCase):
    """
    Tests updating polls of motions.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_Aiqueigh2dae9phabiqu',
            text='test_text_Neekoh3zou6li5rue8iL')
        self.motion.save()
        self.poll = self.motion.create_poll()

    def test_invalid_votesvalid_value(self):
        response = self.client.put(
            reverse('motionpoll-detail', args=[self.poll.pk]),
            {'motion_id': self.motion.pk,
             'votesvalid': '-3'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_votesinvalid_value(self):
        response = self.client.put(
            reverse('motionpoll-detail', args=[self.poll.pk]),
            {'motion_id': self.motion.pk,
             'votesinvalid': '-3'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_votescast_value(self):
        response = self.client.put(
            reverse('motionpoll-detail', args=[self.poll.pk]),
            {'motion_id': self.motion.pk,
             'votescast': '-3'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_value_for_votesvalid(self):
        response = self.client.put(
            reverse('motionpoll-detail', args=[self.poll.pk]),
            {'motion_id': self.motion.pk,
             'votesvalid': ''})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class NumberMotionsInCategory(TestCase):
    """
    Tests numbering motions in a category.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.category = Category.objects.create(
            name='test_cateogory_name_zah6Ahd4Ifofaeree6ai',
            prefix='test_prefix_ahz6tho2mooH8')
        self.motion = Motion(
            title='test_title_Eeha8Haf6peulu8ooc0z',
            text='test_text_faghaZoov9ooV4Acaquk',
            category=self.category)
        self.motion.save()
        self.motion.identifier = ''
        self.motion.save()
        self.motion_2 = Motion(
            title='test_title_kuheih2eja2Saeshusha',
            text='test_text_Ha5ShaeraeSuthooP2Bu',
            category=self.category)
        self.motion_2.save()
        self.motion_2.identifier = ''
        self.motion_2.save()

    def test_numbering(self):
        response = self.client.post(
            reverse('category-numbering', args=[self.category.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'All motions in category test_cateogory_name_zah6Ahd4Ifofaeree6ai numbered successfully.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).identifier, 'test_prefix_ahz6tho2mooH8 1')
        self.assertEqual(Motion.objects.get(pk=self.motion_2.pk).identifier, 'test_prefix_ahz6tho2mooH8 2')

    def test_numbering_existing_identifier(self):
        self.motion_2.identifier = 'test_prefix_ahz6tho2mooH8 1'
        self.motion_2.save()
        response = self.client.post(
            reverse('category-numbering', args=[self.category.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'All motions in category test_cateogory_name_zah6Ahd4Ifofaeree6ai numbered successfully.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).identifier, 'test_prefix_ahz6tho2mooH8 1')
        self.assertEqual(Motion.objects.get(pk=self.motion_2.pk).identifier, 'test_prefix_ahz6tho2mooH8 2')

    def test_numbering_with_given_order(self):
        self.motion_3 = Motion(
            title='test_title_eeb0kua5ciike4su2auJ',
            text='test_text_ahshuGhaew3eim8yoht7',
            category=self.category)
        self.motion_3.save()
        self.motion_3.identifier = ''
        self.motion_3.save()
        response = self.client.post(
            reverse('category-numbering', args=[self.category.pk]),
            {'motions': [3, 2]},
            format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'All motions in category test_cateogory_name_zah6Ahd4Ifofaeree6ai numbered successfully.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).identifier, None)
        self.assertEqual(Motion.objects.get(pk=self.motion_2.pk).identifier, 'test_prefix_ahz6tho2mooH8 2')
        self.assertEqual(Motion.objects.get(pk=self.motion_3.pk).identifier, 'test_prefix_ahz6tho2mooH8 1')
