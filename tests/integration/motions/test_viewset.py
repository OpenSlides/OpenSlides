import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import Tag
from openslides.motions.models import Category, Motion, MotionBlock, State
from openslides.utils.test import TestCase, use_cache


class TestMotionDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some objects are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        for index in range(10):
            Motion.objects.create(title='motion{}'.format(index))
        # TODO: Create some polls etc.

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 4 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all motions,
        * 1 request to get the motion versions,
        * 1 request to get the agenda item,
        * 1 request to get the motion log,
        * 1 request to get the polls,
        * 1 request to get the attachments,
        * 1 request to get the tags,
        * 2 requests to get the submitters and supporters and
        """
        self.client.force_login(get_user_model().objects.get(pk=1))
        with self.assertNumQueries(14):
            self.client.get(reverse('motion-list'))

    @use_cache()
    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 3 requests to get the permission for anonymous,
        * 2 requests to get the list of all motions,
        * 1 request to get the motion versions,
        * 1 request to get the agenda item,
        * 1 request to get the motion log,
        * 1 request to get the polls,
        * 1 request to get the attachments,
        * 1 request to get the tags,
        * 2 requests to get the submitters and supporters
        """
        with self.assertNumQueries(13):
            self.client.get(reverse('motion-list'))


class TestCategoryDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some objects are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        for index in range(10):
            Category.objects.create(name='category{}'.format(index))

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 4 requests to get the session an the request user with its permissions and
        * 2 requests to get the list of all categories.
        """
        self.client.force_login(get_user_model().objects.get(pk=1))
        with self.assertNumQueries(6):
            self.client.get(reverse('category-list'))

    @use_cache()
    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 3 requests to get the permission for anonymous (config and permissions)
        * 2 requests to get the list of all motions and
        """
        with self.assertNumQueries(5):
            self.client.get(reverse('category-list'))


class TestWorkflowDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        # There do not need to be more workflows

    @use_cache()
    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 4 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all workflows,
        * 1 request to get all states and
        * 1 request to get the next states of all states.
        """
        self.client.force_login(get_user_model().objects.get(pk=1))
        with self.assertNumQueries(8):
            self.client.get(reverse('workflow-list'))

    @use_cache()
    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 3 requests to get the permission for anonymous,
        * 2 requests to get the list of all workflows,
        * 1 request to get all states and
        * 1 request to get the next states of all states.
        """
        with self.assertNumQueries(7):
            self.client.get(reverse('workflow-list'))


class CreateMotion(TestCase):
    """
    Tests motion creation.
    """
    def setUp(self):
        self.client = APIClient()
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
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
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

    def test_with_multiple_comments(self):
        config['motions_comments'] = [
            {'name': 'comment1', 'public': True},
            {'name': 'comment2', 'public': False}]
        comments = ['comemnt1_sdpoiuffo3%7dwDwW)', 'comment2_iusd_D/TdskDWH(5DWas46WAd078']
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'title_test_sfdAaufd56HR7sd5FDq7av',
             'text': 'text_test_fiuhefF86()ew1Ef346AF6W',
             'comments': comments},
            format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.comments, comments)

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
        self.admin.groups.add(2)
        self.admin.groups.remove(3)

        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_peiJozae0luew9EeL8bo',
             'text': 'test_text_eHohS8ohr5ahshoah8Oh'})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_non_admin_with_comment_data(self):
        """
        Test to create a motion by a non staff user that has permission to
        manage motion comments and sends some additional fields.
        """
        self.admin = get_user_model().objects.get(username='admin')
        self.admin.groups.add(2)
        self.admin.groups.remove(3)
        group_delegate = self.admin.groups.get()
        group_delegate.permissions.add(Permission.objects.get(
            content_type__app_label='motions',
            codename='can_see_and_manage_comments',
        ))

        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_peiJozae0luew9EeL8bo',
             'text': 'test_text_eHohS8ohr5ahshoah8Oh',
             'comments': ['comment_for_field_one__xiek1Euhae9xah2wuuraaaa'],
             'comment_field_one': 'comment_for_field_one__xiek1Euhae9xah2wuuraaaa'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Motion.objects.get().comments, ['comment_for_field_one__xiek1Euhae9xah2wuuraaaa'])

    def test_amendment_motion(self):
        """
        Test to create a motion with a parent motion as staff user.
        """
        parent_motion = self.create_parent_motion()
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_doe93Jsjd2sW20dkSl20',
             'text': 'test_text_feS20SksD8D25skmwD25',
             'parent_id': parent_motion.id})
        created_motion = Motion.objects.get(pk=int(response.data['id']))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created_motion.parent, parent_motion)

    def test_amendment_motion_parent_not_exist(self):
        """
        Test to create an amendment motion with a non existing parent.
        """
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_gEjdkW93Wj23KS2s8dSe',
             'text': 'test_text_lfwLIC&AjfsaoijOEusa',
             'parent_id': 100})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'The parent motion does not exist.'})

    def test_amendment_motion_non_admin(self):
        """
        Test to create an amendment motion by a delegate. The parents
        category should be also set on the new motion.
        """
        parent_motion = self.create_parent_motion()
        category = Category.objects.create(
            name='test_category_name_Dslk3Fj8s8Ps36S3Kskw',
            prefix='TEST_PREFIX_L23skfmlq3kslamslS39')
        parent_motion.category = category
        parent_motion.save()

        self.admin = get_user_model().objects.get(username='admin')
        self.admin.groups.add(2)
        self.admin.groups.remove(3)

        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_fk3a0slalms47KSewnWG',
             'text': 'test_text_al3FMwSCNM31WOmw9ezx',
             'parent_id': parent_motion.id})
        created_motion = Motion.objects.get(pk=int(response.data['id']))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created_motion.parent, parent_motion)
        self.assertEqual(created_motion.category, category)

    def create_parent_motion(self):
        """
        Returns a new created motion used for testing amendments.
        """
        response = self.client.post(
            reverse('motion-list'),
            {'title': 'test_title_3leoeo2qac7830c92j9s',
             'text': 'test_text_9dm3ks9gDuW20Al38L9w'})
        return Motion.objects.get(pk=int(response.data['id']))


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

    @use_cache()
    def test_number_of_queries(self):
        with self.assertNumQueries(18):
            self.client.get(reverse('motion-detail', args=[self.motion.pk]))

    def test_guest_state_with_required_permission_to_see(self):
        config['general_system_enable_anonymous'] = True
        guest_client = APIClient()
        state = self.motion.state
        state.required_permission_to_see = 'permission_that_the_user_does_not_have_leeceiz9hi7iuta4ahY2'
        state.save()
        response = guest_client.get(reverse('motion-detail', args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_state_with_required_permission_to_see(self):
        state = self.motion.state
        state.required_permission_to_see = 'permission_that_the_user_does_not_have_coo1Iewu8Eing2xahfoo'
        state.save()
        response = self.client.get(reverse('motion-detail', args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_submitter_state_with_required_permission_to_see(self):
        state = self.motion.state
        state.required_permission_to_see = 'permission_that_the_user_does_not_have_eiW8af9caizoh1thaece'
        state.save()
        user = get_user_model().objects.create_user(
            username='username_ohS2opheikaSa5theijo',
            password='password_kau4eequaisheeBateef')
        self.motion.submitters.add(user)
        submitter_client = APIClient()
        submitter_client.force_login(user)
        response = submitter_client.get(reverse('motion-detail', args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


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
        self.admin.groups.add(2)
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


class SetRecommendation(TestCase):
    """
    Tests setting a recommendation.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.motion = Motion(
            title='test_title_ahfooT5leilahcohJ2uz',
            text='test_text_enoogh7OhPoo6eohoCus')
        self.motion.save()
        self.state_id_accepted = 2  # This should be the id of the state 'accepted'.

    def test_set_recommendation(self):
        response = self.client.put(
            reverse('motion-set-recommendation', args=[self.motion.pk]),
            {'recommendation': self.state_id_accepted})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'The recommendation of the motion was set to Acceptance.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).recommendation.name, 'accepted')

    def test_set_state_with_string(self):
        # Using a string is not allowed even if it is the correct name of the state.
        response = self.client.put(
            reverse('motion-set-recommendation', args=[self.motion.pk]),
            {'recommendation': 'accepted'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'Invalid data. Recommendation must be an integer.'})

    def test_set_unknown_recommendation(self):
        invalid_state_id = 0
        response = self.client.put(
            reverse('motion-set-recommendation', args=[self.motion.pk]),
            {'recommendation': invalid_state_id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'You can not set the recommendation to %d.' % invalid_state_id})

    def test_set_invalid_recommendation(self):
        # This is a valid state id, but this state is not recommendable because it belongs to a different workflow.
        invalid_state_id = 6  # State 'permitted'
        response = self.client.put(
            reverse('motion-set-recommendation', args=[self.motion.pk]),
            {'recommendation': invalid_state_id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'You can not set the recommendation to %d.' % invalid_state_id})

    def test_set_invalid_recommendation_2(self):
        # This is a valid state id, but this state is not recommendable because it has not recommendation label
        invalid_state_id = 1  # State 'submitted'
        self.motion.set_state(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(
            reverse('motion-set-recommendation', args=[self.motion.pk]),
            {'recommendation': invalid_state_id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'detail': 'You can not set the recommendation to %d.' % invalid_state_id})

    def test_reset(self):
        self.motion.set_recommendation(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(reverse('motion-set-recommendation', args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'The recommendation of the motion was set to None.'})
        self.assertTrue(Motion.objects.get(pk=self.motion.pk).recommendation is None)

    def test_set_recommendation_to_current_state(self):
        self.motion.set_state(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(
            reverse('motion-set-recommendation', args=[self.motion.pk]),
            {'recommendation': self.state_id_accepted})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'detail': 'The recommendation of the motion was set to Acceptance.'})
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).recommendation.name, 'accepted')


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


class FollowRecommendationsForMotionBlock(TestCase):
    """
    Tests following the recommendations of motions in an motion block.
    """
    def setUp(self):
        self.state_id_accepted = 2  # This should be the id of the state 'accepted'.
        self.state_id_rejected = 3  # This should be the id of the state 'rejected'.

        self.client = APIClient()
        self.client.login(username='admin', password='admin')

        self.motion_block = MotionBlock.objects.create(
            title='test_motion_block_name_Ufoopiub7quaezaepeic')

        self.motion = Motion(
            title='test_title_yo8ohy5eifeiyied2AeD',
            text='test_text_chi1aeth5faPhueQu8oh',
            motion_block=self.motion_block)
        self.motion.save()
        self.motion.set_recommendation(self.state_id_accepted)
        self.motion.save()

        self.motion_2 = Motion(
            title='test_title_eith0EemaW8ahZa9Piej',
            text='test_text_haeho1ohk3ou7pau2Jee',
            motion_block=self.motion_block)
        self.motion_2.save()
        self.motion_2.set_recommendation(self.state_id_rejected)
        self.motion_2.save()

    def test_follow_recommendations_for_motion_block(self):
        response = self.client.post(reverse('motionblock-follow-recommendations', args=[self.motion_block.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).state.id, self.state_id_accepted)
        self.assertEqual(Motion.objects.get(pk=self.motion_2.pk).state.id, self.state_id_rejected)
