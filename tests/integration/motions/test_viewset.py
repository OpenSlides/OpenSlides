import json

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import Tag
from openslides.motions.models import (
    Category,
    Motion,
    MotionBlock,
    MotionChangeRecommendation,
    MotionComment,
    MotionCommentSection,
    State,
    StatuteParagraph,
    Submitter,
    Workflow,
)
from openslides.utils.auth import get_group_model
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.test import TestCase
from tests.common_groups import (
    GROUP_ADMIN_PK,
    GROUP_DEFAULT_PK,
    GROUP_DELEGATE_PK,
    GROUP_STAFF_PK,
)

from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_motion_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all motions,
    * 1 request to get the associated workflow
    * 1 request for all motion comments
    * 1 request for all motion comment sections required for the comments
    * 1 request for all users required for the read_groups of the sections
    * 1 request to get the agenda item,
    * 1 request to get the polls,
    * 1 request to get the attachments,
    * 1 request to get the tags,
    * 2 requests to get the submitters and supporters,
    * 1 request for change_recommendations.

    Two comment sections are created and for each motions two comments.
    """
    section1 = MotionCommentSection.objects.create(name="test_section")
    section2 = MotionCommentSection.objects.create(name="test_section")

    for index in range(10):
        motion = Motion.objects.create(title=f"motion{index}")

        MotionComment.objects.create(
            comment="test_comment", motion=motion, section=section1
        )
        MotionComment.objects.create(
            comment="test_comment2", motion=motion, section=section2
        )

        get_user_model().objects.create_user(
            username=f"user_{index}", password="password"
        )
    # TODO: Create some polls etc.

    assert count_queries(Motion.get_elements) == 12


@pytest.mark.django_db(transaction=False)
def test_category_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all categories.
    """
    for index in range(10):
        Category.objects.create(name=f"category{index}")

    assert count_queries(Category.get_elements) == 1


@pytest.mark.django_db(transaction=False)
def test_statute_paragraph_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all statute paragraphs.
    """
    for index in range(10):
        StatuteParagraph.objects.create(
            title=f"statute_paragraph{index}", text=f"text{index}"
        )

    assert count_queries(StatuteParagraph.get_elements) == 1


@pytest.mark.django_db(transaction=False)
def test_workflow_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all workflows,
    * 1 request to get all states and
    * 1 request to get the next states of all states.
    """

    assert count_queries(Workflow.get_elements) == 3


class TestStatuteParagraphs(TestCase):
    """
    Tests all CRUD operations of statute paragraphs.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def create_statute_paragraph(self):
        self.title = "test_title_fiWs82D0D)2kje3KDm2s"
        self.text = "test_text_3jfjoDqm,S;cmor3DJwk"
        self.cp = StatuteParagraph.objects.create(title=self.title, text=self.text)

    def test_create_simple(self):
        response = self.client.post(
            reverse("statuteparagraph-list"),
            {
                "title": "test_title_f3FM328cq)tzdU238df2",
                "text": "test_text_2fb)BEjwdI38=kfemiRkcOW",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cp = StatuteParagraph.objects.get()
        self.assertEqual(cp.title, "test_title_f3FM328cq)tzdU238df2")
        self.assertEqual(cp.text, "test_text_2fb)BEjwdI38=kfemiRkcOW")

    def test_create_without_data(self):
        response = self.client.post(reverse("statuteparagraph-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"title": ["This field is required."], "text": ["This field is required."]},
        )

    def test_create_non_admin(self):
        self.admin = get_user_model().objects.get(username="admin")
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

        response = self.client.post(
            reverse("statuteparagraph-list"),
            {
                "title": "test_title_f3(Dj2jdP39fjW2kdcwe",
                "text": "test_text_vlC)=fwWmcwcpWMvnuw(",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_simple(self):
        self.create_statute_paragraph()
        response = self.client.get(
            reverse("statuteparagraph-detail", args=[self.cp.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            sorted(response.data.keys()), sorted(("id", "title", "text", "weight"))
        )

    def test_update_simple(self):
        self.create_statute_paragraph()
        response = self.client.patch(
            reverse("statuteparagraph-detail", args=[self.cp.pk]),
            {"text": "test_text_ke(czr/cwk1Sl2seeFwE"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cp = StatuteParagraph.objects.get()
        self.assertEqual(cp.title, self.title)
        self.assertEqual(cp.text, "test_text_ke(czr/cwk1Sl2seeFwE")

    def test_update_non_admin(self):
        self.admin = get_user_model().objects.get(username="admin")
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

        self.create_statute_paragraph()
        response = self.client.patch(
            reverse("statuteparagraph-detail", args=[self.cp.pk]),
            {"text": "test_text_ke(czr/cwk1Sl2seeFwE"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        cp = StatuteParagraph.objects.get()
        self.assertEqual(cp.text, self.text)

    def test_delete_simple(self):
        self.create_statute_paragraph()
        response = self.client.delete(
            reverse("statuteparagraph-detail", args=[self.cp.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(StatuteParagraph.objects.count(), 0)

    def test_delete_non_admin(self):
        self.admin = get_user_model().objects.get(username="admin")
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

        self.create_statute_paragraph()
        response = self.client.delete(
            reverse("statuteparagraph-detail", args=[self.cp.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(StatuteParagraph.objects.count(), 1)


class CreateMotion(TestCase):
    """
    Tests motion creation.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def test_simple(self):
        """
        Tests that a motion is created with a specific title and text.

        The created motion should have an identifier and the admin user should
        be the submitter.
        """
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_OoCoo3MeiT9li5Iengu9",
                "text": "test_text_thuoz0iecheiheereiCi",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, "test_title_OoCoo3MeiT9li5Iengu9")
        self.assertEqual(motion.identifier, "1")
        self.assertTrue(motion.submitters.exists())
        self.assertEqual(motion.submitters.get().user.username, "admin")

    def test_with_reason(self):
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_saib4hiHaifo9ohp9yie",
                "text": "test_text_shahhie8Ej4mohvoorie",
                "reason": "test_reason_Ou8GivahYivoh3phoh9c",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Motion.objects.get().reason, "test_reason_Ou8GivahYivoh3phoh9c"
        )

    def test_without_data(self):
        response = self.client.post(reverse("motion-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"title": ["This field is required."], "text": ["This field is required."]},
        )

    def test_with_category(self):
        category = Category.objects.create(
            name="test_category_name_CiengahzooH4ohxietha",
            prefix="TEST_PREFIX_la0eadaewuec3seoxeiN",
        )
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_Air0bahchaiph1ietoo2",
                "text": "test_text_chaeF9wosh8OowazaiVu",
                "category_id": category.pk,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.category, category)
        self.assertEqual(motion.identifier, "TEST_PREFIX_la0eadaewuec3seoxeiN 1")

    def test_with_submitters(self):
        submitter_1 = get_user_model().objects.create_user(
            username="test_username_ooFe6aebei9ieQui2poo",
            password="test_password_vie9saiQu5Aengoo9ku0",
        )
        submitter_2 = get_user_model().objects.create_user(
            username="test_username_eeciengoc4aihie5eeSh",
            password="test_password_peik2Eihu5oTh7siequi",
        )
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_pha7moPh7quoth4paina",
                "text": "test_text_YooGhae6tiangung5Rie",
                "submitters_id": [submitter_1.pk, submitter_2.pk],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.submitters.count(), 2)

    def test_with_one_supporter(self):
        supporter = get_user_model().objects.create_user(
            username="test_username_ahGhi4Quohyee7ohngie",
            password="test_password_Nei6aeh8OhY8Aegh1ohX",
        )
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_Oecee4Da2Mu9EY6Ui4mu",
                "text": "test_text_FbhgnTFgkbjdmvcjbffg",
                "supporters_id": [supporter.pk],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(
            motion.supporters.get().username, "test_username_ahGhi4Quohyee7ohngie"
        )

    def test_with_tag(self):
        tag = Tag.objects.create(name="test_tag_iRee3kiecoos4rorohth")
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_Hahke4loos4eiduNiid9",
                "text": "test_text_johcho0Ucaibiehieghe",
                "tags_id": [tag.pk],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertEqual(motion.tags.get().name, "test_tag_iRee3kiecoos4rorohth")

    def test_with_workflow(self):
        """
        Test to create a motion with a specific workflow.
        """
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_eemuR5hoo4ru2ahgh5EJ",
                "text": "test_text_ohviePopahPhoili7yee",
                "workflow_id": "2",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Motion.objects.get().state.workflow_id, 2)

    def test_non_admin(self):
        """
        Test to create a motion by a delegate, non staff user.
        """
        self.admin = get_user_model().objects.get(username="admin")
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_peiJozae0luew9EeL8bo",
                "text": "test_text_eHohS8ohr5ahshoah8Oh",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_amendment_motion(self):
        """
        Test to create a motion with a parent motion as staff user.
        """
        parent_motion = self.create_parent_motion()
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_doe93Jsjd2sW20dkSl20",
                "text": "test_text_feS20SksD8D25skmwD25",
                "parent_id": parent_motion.id,
            },
        )
        created_motion = Motion.objects.get(pk=int(response.data["id"]))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created_motion.parent, parent_motion)

    def test_amendment_motion_parent_not_exist(self):
        """
        Test to create an amendment motion with a non existing parent.
        """
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_gEjdkW93Wj23KS2s8dSe",
                "text": "test_text_lfwLIC&AjfsaoijOEusa",
                "parent_id": 100,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"detail": "The parent motion does not exist."})

    def test_amendment_motion_non_admin(self):
        """
        Test to create an amendment motion by a delegate. The parents
        category should be also set on the new motion.
        """
        parent_motion = self.create_parent_motion()
        category = Category.objects.create(
            name="test_category_name_Dslk3Fj8s8Ps36S3Kskw",
            prefix="TEST_PREFIX_L23skfmlq3kslamslS39",
        )
        parent_motion.category = category
        parent_motion.save()

        self.admin = get_user_model().objects.get(username="admin")
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_fk3a0slalms47KSewnWG",
                "text": "test_text_al3FMwSCNM31WOmw9ezx",
                "parent_id": parent_motion.id,
            },
        )
        created_motion = Motion.objects.get(pk=int(response.data["id"]))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created_motion.parent, parent_motion)
        self.assertEqual(created_motion.category, category)

    def create_parent_motion(self):
        """
        Returns a new created motion used for testing amendments.
        """
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_3leoeo2qac7830c92j9s",
                "text": "test_text_9dm3ks9gDuW20Al38L9w",
            },
        )
        return Motion.objects.get(pk=int(response.data["id"]))


class RetrieveMotion(TestCase):
    """
    Tests retrieving a motion (with poll results).
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_uj5eeSiedohSh3ohyaaj",
            text="test_text_ithohchaeThohmae5aug",
        )
        self.motion.save()
        self.motion.create_poll()
        for index in range(10):
            get_user_model().objects.create_user(
                username=f"user_{index}", password="password"
            )

    def test_guest_state_with_restriction(self):
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()
        state = self.motion.state
        state.restriction = ["motions.can_manage"]
        state.save()
        # The cache has to be cleared, see:
        # https://github.com/OpenSlides/OpenSlides/issues/3396
        inform_changed_data(self.motion)

        response = guest_client.get(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, 404)

    def test_admin_state_with_restriction(self):
        state = self.motion.state
        state.restriction = ["motions.can_manage"]
        state.save()
        response = self.client.get(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_submitter_state_with_restriction(self):
        state = self.motion.state
        state.restriction = ["is_submitter"]
        state.save()
        user = get_user_model().objects.create_user(
            username="username_ohS2opheikaSa5theijo",
            password="password_kau4eequaisheeBateef",
        )
        Submitter.objects.add(user, self.motion)
        submitter_client = APIClient()
        submitter_client.force_login(user)
        response = submitter_client.get(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_without_can_see_user_permission_to_see_motion_and_submitter_data(
        self
    ):
        admin = get_user_model().objects.get(username="admin")
        Submitter.objects.add(admin, self.motion)
        group = get_group_model().objects.get(
            pk=GROUP_DEFAULT_PK
        )  # Group with pk 1 is for anonymous and default users.
        permission_string = "users.can_see_name"
        app_label, codename = permission_string.split(".")
        permission = group.permissions.get(
            content_type__app_label=app_label, codename=codename
        )
        group.permissions.remove(permission)
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()
        inform_changed_data(group)
        inform_changed_data(self.motion)

        response_1 = guest_client.get(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response_1.status_code, status.HTTP_200_OK)
        submitter_id = response_1.data["submitters"][0]["user_id"]
        response_2 = guest_client.get(reverse("user-detail", args=[submitter_id]))
        self.assertEqual(response_2.status_code, status.HTTP_200_OK)

        extra_user = get_user_model().objects.create_user(
            username="username_wequePhieFoom0hai3wa",
            password="password_ooth7taechai5Oocieya",
        )

        response_3 = guest_client.get(reverse("user-detail", args=[extra_user.pk]))
        self.assertEqual(response_3.status_code, 404)


class UpdateMotion(TestCase):
    """
    Tests updating motions.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_aeng7ahChie3waiR8xoh",
            text="test_text_xeigheeha7thopubeu4U",
        )
        self.motion.save()

    def test_simple_patch(self):
        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            {"identifier": "test_identifier_jieseghohj7OoSah1Ko9"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, "test_title_aeng7ahChie3waiR8xoh")
        self.assertEqual(motion.identifier, "test_identifier_jieseghohj7OoSah1Ko9")

    def test_patch_workflow(self):
        """
        Tests to only update the workflow of a motion.
        """
        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]), {"workflow_id": "2"}
        )

        motion = Motion.objects.get()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(motion.title, "test_title_aeng7ahChie3waiR8xoh")
        self.assertEqual(motion.workflow_id, 2)

    def test_patch_category(self):
        """
        Tests to only update the category of a motion. Expects the
        category_weight to be resetted.
        """
        category = Category.objects.create(
            name="test_category_name_FE3jO(Fm83doqqlwcvlv",
            prefix="test_prefix_w3ofg2mv79UGFqjk3f8h",
        )
        self.motion.category_weight = 1
        self.motion.save()
        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            {"category_id": category.pk},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.category, category)
        self.assertEqual(motion.category_weight, 10000)

    def test_patch_supporters(self):
        supporter = get_user_model().objects.create_user(
            username="test_username_ieB9eicah0uqu6Phoovo",
            password="test_password_XaeTe3aesh8ohg6Cohwo",
        )
        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            json.dumps({"supporters_id": [supporter.pk]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.title, "test_title_aeng7ahChie3waiR8xoh")
        self.assertEqual(
            motion.supporters.get().username, "test_username_ieB9eicah0uqu6Phoovo"
        )

    def test_patch_supporters_non_manager(self):
        non_admin = get_user_model().objects.create_user(
            username="test_username_uqu6PhoovieB9eicah0o",
            password="test_password_Xaesh8ohg6CoheTe3awo",
        )
        self.client.login(
            username="test_username_uqu6PhoovieB9eicah0o",
            password="test_password_Xaesh8ohg6CoheTe3awo",
        )
        motion = Motion.objects.get()
        Submitter.objects.add(non_admin, self.motion)
        motion.supporters.clear()
        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            json.dumps({"supporters_id": [1]}),
            content_type="application/json",
        )
        # Forbidden because of changed workflow state.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_removal_of_supporters(self):
        # No cache used here.
        admin = get_user_model().objects.get(username="admin")
        group_admin = admin.groups.get(name="Admin")
        admin.groups.remove(group_admin)
        Submitter.objects.add(admin, self.motion)
        supporter = get_user_model().objects.create_user(
            username="test_username_ahshi4oZin0OoSh9chee",
            password="test_password_Sia8ahgeenixu5cei2Ib",
        )
        self.motion.supporters.add(supporter)
        config["motions_remove_supporters"] = True
        self.assertEqual(self.motion.supporters.count(), 1)
        inform_changed_data((admin, self.motion))

        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            {"title": "new_title_ohph1aedie5Du8sai2ye"},
        )

        # Forbidden because of changed workflow state.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DeleteMotion(TestCase):
    """
    Tests deleting motions.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.admin = get_user_model().objects.get(username="admin")
        self.motion = Motion(
            title="test_title_acle3fa93l11lwlkcc31",
            text="test_text_f390sjfyycj29ss56sro",
        )
        self.motion.save()

    def test_simple_delete(self):
        response = self.client.delete(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        motions = Motion.objects.count()
        self.assertEqual(motions, 0)

    def make_admin_delegate(self):
        self.admin.groups.remove(GROUP_ADMIN_PK)
        self.admin.groups.add(GROUP_DELEGATE_PK)
        inform_changed_data(self.admin)

    def put_motion_in_complex_workflow(self):
        workflow = Workflow.objects.get(name="Complex Workflow")
        self.motion.reset_state(workflow=workflow)
        self.motion.save()

    def test_delete_foreign_motion_as_delegate(self):
        self.make_admin_delegate()
        self.put_motion_in_complex_workflow()

        response = self.client.delete(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_own_motion_as_delegate(self):
        self.make_admin_delegate()
        self.put_motion_in_complex_workflow()
        Submitter.objects.add(self.admin, self.motion)

        response = self.client.delete(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        motions = Motion.objects.count()
        self.assertEqual(motions, 0)

    def test_delete_with_two_change_recommendations(self):
        self.cr1 = MotionChangeRecommendation.objects.create(
            motion=self.motion, internal=False, line_from=1, line_to=1
        )
        self.cr2 = MotionChangeRecommendation.objects.create(
            motion=self.motion, internal=False, line_from=2, line_to=2
        )
        response = self.client.delete(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        motions = Motion.objects.count()
        self.assertEqual(motions, 0)


class ManageMultipleSubmitters(TestCase):
    """
    Tests adding and removing of submitters.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

        self.admin = get_user_model().objects.get()
        self.motion1 = Motion(
            title="test_title_SlqfMw(waso0saWMPqcZ",
            text="test_text_f30skclqS9wWF=xdfaSL",
        )
        self.motion1.save()
        self.motion2 = Motion(
            title="test_title_f>FLEim38MC2m9PFp2jG",
            text="test_text_kg39KFGm,ao)22FK9lLu",
        )
        self.motion2.save()

    def test_set_submitters(self):
        response = self.client.post(
            reverse("motion-manage-multiple-submitters"),
            json.dumps(
                {
                    "motions": [
                        {"id": self.motion1.id, "submitters": [self.admin.pk]},
                        {"id": self.motion2.id, "submitters": [self.admin.pk]},
                    ]
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.motion1.submitters.count(), 1)
        self.assertEqual(self.motion2.submitters.count(), 1)
        self.assertEqual(
            self.motion1.submitters.get().user.pk, self.motion2.submitters.get().user.pk
        )

    def test_non_existing_user(self):
        response = self.client.post(
            reverse("motion-manage-multiple-submitters"),
            {"motions": [{"id": self.motion1.id, "submitters": [1337]}]},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.motion1.submitters.count(), 0)

    def test_add_user_no_data(self):
        response = self.client.post(reverse("motion-manage-multiple-submitters"))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.motion1.submitters.count(), 0)
        self.assertEqual(self.motion2.submitters.count(), 0)

    def test_add_user_invalid_data(self):
        response = self.client.post(
            reverse("motion-manage-multiple-submitters"), {"motions": ["invalid_str"]}
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.motion1.submitters.count(), 0)
        self.assertEqual(self.motion2.submitters.count(), 0)

    def test_add_without_permission(self):
        admin = get_user_model().objects.get(username="admin")
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(admin)

        response = self.client.post(
            reverse("motion-manage-multiple-submitters"),
            {"motions": [{"id": self.motion1.id, "submitters": [self.admin.pk]}]},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.motion1.submitters.count(), 0)
        self.assertEqual(self.motion2.submitters.count(), 0)


class ManageComments(TestCase):
    """
    Tests the manage_comment view.

    Tests creation/updating and deletion of motion comments.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

        self.admin = get_user_model().objects.get()
        self.group_out = get_group_model().objects.get(
            pk=GROUP_DELEGATE_PK
        )  # The admin should not be in this group

        # Put the admin into the staff group, becaust in the admin group, he has all permissions for
        # every single comment section.
        self.admin.groups.add(GROUP_STAFF_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)
        self.group_in = get_group_model().objects.get(pk=GROUP_STAFF_PK)

        self.motion = Motion(
            title="test_title_SlqfMw(waso0saWMPqcZ",
            text="test_text_f30skclqS9wWF=xdfaSL",
        )
        self.motion.save()

        self.section_no_groups = MotionCommentSection(
            name='test_name_gj4F§(fj"(edm"§F3f3fs'
        )
        self.section_no_groups.save()

        self.section_read = MotionCommentSection(name="test_name_2wv30(d2S&kvelkakl39")
        self.section_read.save()
        self.section_read.read_groups.add(
            self.group_in, self.group_out
        )  # Group out for testing multiple groups
        self.section_read.write_groups.add(self.group_out)

        self.section_read_write = MotionCommentSection(
            name="test_name_a3m9sd0(Mw2%slkrv30,"
        )
        self.section_read_write.save()
        self.section_read_write.read_groups.add(self.group_in)
        self.section_read_write.write_groups.add(self.group_in)

    def test_retrieve_comment(self):
        comment = MotionComment(
            motion=self.motion,
            section=self.section_read_write,
            comment="test_comment_gwic37Csc&3lf3eo2",
        )
        comment.save()

        response = self.client.get(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("comments" in response.data)
        comments = response.data["comments"]
        self.assertTrue(isinstance(comments, list))
        self.assertEqual(len(comments), 1)
        self.assertEqual(comments[0]["comment"], "test_comment_gwic37Csc&3lf3eo2")

    def test_retrieve_comment_no_read_permission(self):
        comment = MotionComment(
            motion=self.motion,
            section=self.section_no_groups,
            comment="test_comment_fgkj3C7veo3ijWE(j2DJ",
        )
        comment.save()

        response = self.client.get(reverse("motion-detail", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("comments" in response.data)
        comments = response.data["comments"]
        self.assertTrue(isinstance(comments, list))
        self.assertEqual(len(comments), 0)

    def test_wrong_data_type(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            None,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"], "You have to provide a section_id of type int."
        )

    def test_wrong_comment_data_type(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {
                "section_id": self.section_read_write.id,
                "comment": [32, "no_correct_data"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "The comment should be a string.")

    def test_non_existing_section(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {"section_id": 42},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"], "A comment section with id 42 does not exist."
        )

    def test_create_comment(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {
                "section_id": self.section_read_write.pk,
                "comment": "test_comment_fk3jrnfwsdg%fj=feijf",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(MotionComment.objects.count(), 1)
        comment = MotionComment.objects.get()
        self.assertEqual(comment.comment, "test_comment_fk3jrnfwsdg%fj=feijf")

    def test_update_comment(self):
        comment = MotionComment(
            motion=self.motion,
            section=self.section_read_write,
            comment="test_comment_fji387fqwdf&ff=)Fe3j",
        )
        comment.save()

        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {
                "section_id": self.section_read_write.pk,
                "comment": "test_comment_fk3jrnfwsdg%fj=feijf",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comment = MotionComment.objects.get()
        self.assertEqual(comment.comment, "test_comment_fk3jrnfwsdg%fj=feijf")

    def test_delete_comment(self):
        comment = MotionComment(
            motion=self.motion,
            section=self.section_read_write,
            comment='test_comment_5CJ"8f23jd3j2,r93keZ',
        )
        comment.save()

        response = self.client.delete(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {"section_id": self.section_read_write.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(MotionComment.objects.count(), 0)

    def test_delete_not_existing_comment(self):
        """
        This should fail silently; no error, if the user wants to delete
        a not existing comment.
        """
        response = self.client.delete(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {"section_id": self.section_read_write.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(MotionComment.objects.count(), 0)

    def test_create_comment_no_write_permission(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {
                "section_id": self.section_read.pk,
                "comment": "test_comment_f38jfwqfj830fj4j(FU3",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MotionComment.objects.count(), 0)
        self.assertEqual(
            response.data["detail"],
            "You are not allowed to see or write to the comment section.",
        )

    def test_update_comment_no_write_permission(self):
        comment = MotionComment(
            motion=self.motion,
            section=self.section_read,
            comment="test_comment_jg38dwiej2D832(D§dk)",
        )
        comment.save()

        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {
                "section_id": self.section_read.pk,
                "comment": "test_comment_fk3jrnfwsdg%fj=feijf",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        comment = MotionComment.objects.get()
        self.assertEqual(comment.comment, "test_comment_jg38dwiej2D832(D§dk)")

    def test_delete_comment_no_write_permission(self):
        comment = MotionComment(
            motion=self.motion,
            section=self.section_read,
            comment="test_comment_fej(NF§kfePOF383o8DN",
        )
        comment.save()

        response = self.client.delete(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {"section_id": self.section_read.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MotionComment.objects.count(), 1)
        comment = MotionComment.objects.get()
        self.assertEqual(comment.comment, "test_comment_fej(NF§kfePOF383o8DN")


class TestMotionCommentSection(TestCase):
    """
    Tests creating, updating and deletion of comment sections.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

        self.admin = get_user_model().objects.get()
        self.admin.groups.add(
            GROUP_STAFF_PK
        )  # Put the admin in a groiup with limited permissions for testing.
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)
        self.group_in = get_group_model().objects.get(pk=GROUP_STAFF_PK)
        self.group_out = get_group_model().objects.get(
            pk=GROUP_DELEGATE_PK
        )  # The admin should not be in this group

    def test_retrieve(self):
        """
        Checks, if the sections can be seen by a manager.
        """
        section = MotionCommentSection(name="test_name_f3jOF3m8fp.<qiqmf32=")
        section.save()

        response = self.client.get(reverse("motioncommentsection-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "test_name_f3jOF3m8fp.<qiqmf32=")

    def test_retrieve_non_manager_with_read_permission(self):
        """
        Checks, if the sections can be seen by a non manager, but he is in
        one of the read_groups.
        """
        self.admin.groups.remove(
            self.group_in
        )  # group_in has motions.can_manage permission
        self.admin.groups.add(self.group_out)  # group_out does not.
        inform_changed_data(self.admin)

        section = MotionCommentSection(name="test_name_f3mMD28LMcm29Coelwcm")
        section.save()
        section.read_groups.add(self.group_out, self.group_in)
        inform_changed_data(section)

        response = self.client.get(reverse("motioncommentsection-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "test_name_f3mMD28LMcm29Coelwcm")

    def test_retrieve_non_manager_no_read_permission(self):
        """
        Checks, if sections are removed, if the user is a non manager and is in
        any of the read_groups.
        """
        self.admin.groups.remove(self.group_in)
        inform_changed_data(self.admin)

        section = MotionCommentSection(name="test_name_f3jOF3m8fp.<qiqmf32=")
        section.save()
        section.read_groups.add(self.group_out)

        response = self.client.get(reverse("motioncommentsection-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
        self.assertEqual(len(response.data), 0)

    def test_create(self):
        """
        Create a section just with a name.
        """
        response = self.client.post(
            reverse("motioncommentsection-list"),
            {"name": "test_name_ekjfen3n)F§zn83f§Fge"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MotionCommentSection.objects.count(), 1)
        self.assertEqual(
            MotionCommentSection.objects.get().name, "test_name_ekjfen3n)F§zn83f§Fge"
        )

    def test_create_no_permission(self):
        """
        Try to create a section without can_manage permissions.
        """
        self.admin.groups.remove(self.group_in)
        inform_changed_data(self.admin)

        response = self.client.post(
            reverse("motioncommentsection-list"),
            {"name": "test_name_wfl3jlkcmlq23ucn7eiq"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(MotionCommentSection.objects.count(), 0)

    def test_create_no_name(self):
        """
        Create a section without a name. This should fail, because a name is required.
        """
        response = self.client.post(reverse("motioncommentsection-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MotionCommentSection.objects.count(), 0)
        self.assertEqual(response.data["name"][0], "This field is required.")

    def test_create_with_groups(self):
        """
        Create a section with name and both groups.
        """
        response = self.client.post(
            reverse("motioncommentsection-list"),
            {
                "name": "test_name_fg4kmFn73FhFk327f/3h",
                "read_groups_id": [2, 3],
                "write_groups_id": [3, 4],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MotionCommentSection.objects.count(), 1)
        comment = MotionCommentSection.objects.get()
        self.assertEqual(comment.name, "test_name_fg4kmFn73FhFk327f/3h")
        self.assertEqual(list(comment.read_groups.values_list("pk", flat=True)), [2, 3])
        self.assertEqual(
            list(comment.write_groups.values_list("pk", flat=True)), [3, 4]
        )

    def test_create_with_one_group(self):
        """
        Create a section with a name and write_groups.
        """
        response = self.client.post(
            reverse("motioncommentsection-list"),
            {"name": "test_name_ekjfen3n)F§zn83f§Fge", "write_groups_id": [1, 3]},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MotionCommentSection.objects.count(), 1)
        comment = MotionCommentSection.objects.get()
        self.assertEqual(comment.name, "test_name_ekjfen3n)F§zn83f§Fge")
        self.assertEqual(comment.read_groups.count(), 0)
        self.assertEqual(
            list(comment.write_groups.values_list("pk", flat=True)), [1, 3]
        )

    def test_create_with_non_existing_group(self):
        """
        Create a section with some non existing groups. This should fail.
        """
        response = self.client.post(
            reverse("motioncommentsection-list"),
            {"name": "test_name_4gnUVnF§29FnH3287fhG", "write_groups_id": [42, 1, 8]},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MotionCommentSection.objects.count(), 0)
        self.assertEqual(
            response.data["write_groups_id"][0],
            'Invalid pk "42" - object does not exist.',
        )

    def test_update(self):
        """
        Update a section name.
        """
        section = MotionCommentSection(name="test_name_dlfgNDf37ND(g3fNf43g")
        section.save()

        response = self.client.put(
            reverse("motioncommentsection-detail", args=[section.pk]),
            {"name": "test_name_ekjfen3n)F§zn83f§Fge"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(MotionCommentSection.objects.count(), 1)
        self.assertEqual(
            MotionCommentSection.objects.get().name, "test_name_ekjfen3n)F§zn83f§Fge"
        )

    def test_update_groups(self):
        """
        Update one of the groups.
        """
        section = MotionCommentSection(name="test_name_f3jFq3hShf/(fh2qlPOp")
        section.save()
        section.read_groups.add(2)
        section.write_groups.add(3)

        response = self.client.patch(
            reverse("motioncommentsection-detail", args=[section.pk]),
            {"name": "test_name_gkk3FhfhpmQMhC,Y378c", "read_groups_id": [2, 4]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(MotionCommentSection.objects.count(), 1)
        comment = MotionCommentSection.objects.get()
        self.assertEqual(comment.name, "test_name_gkk3FhfhpmQMhC,Y378c")
        self.assertEqual(list(comment.read_groups.values_list("pk", flat=True)), [2, 4])
        self.assertEqual(list(comment.write_groups.values_list("pk", flat=True)), [3])

    def test_update_no_permission(self):
        """
        Try to update a section without can_manage permissions.
        """
        self.admin.groups.remove(self.group_in)

        section = MotionCommentSection(name="test_name_wl2oxmmhe/2kd92lwPSi")
        section.save()

        response = self.client.patch(
            reverse("motioncommentsection-list"),
            {"name": "test_name_2slmDMwmqqcmC92mcklw"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(MotionCommentSection.objects.count(), 1)
        self.assertEqual(
            MotionCommentSection.objects.get().name, "test_name_wl2oxmmhe/2kd92lwPSi"
        )

    def test_delete(self):
        """
        Delete a section.
        """
        section = MotionCommentSection(name="test_name_ecMCq;ymwuZZ723kD)2k")
        section.save()

        response = self.client.delete(
            reverse("motioncommentsection-detail", args=[section.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MotionCommentSection.objects.count(), 0)

    def test_delete_non_existing_section(self):
        """
        Delete a non existing section.
        """
        response = self.client.delete(reverse("motioncommentsection-detail", args=[2]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(MotionCommentSection.objects.count(), 0)

    def test_delete_with_existing_comments(self):
        """
        Delete a section with existing comments. This should fail, because sections
        are protected.
        """
        section = MotionCommentSection(name="test_name_ecMCq;ymwuZZ723kD)2k")
        section.save()

        motion = Motion(
            title="test_title_SlqfMw(waso0saWMPqcZ",
            text="test_text_f30skclqS9wWF=xdfaSL",
        )
        motion.save()

        comment = MotionComment(
            comment="test_comment_dlkMD23m)(D9020m0/Zd", motion=motion, section=section
        )
        comment.save()

        response = self.client.delete(
            reverse("motioncommentsection-detail", args=[section.pk])
        )
        self.assertTrue("test_title_SlqfMw(waso0saWMPqcZ" in response.data["detail"])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MotionCommentSection.objects.count(), 1)

    def test_delete_no_permission(self):
        """
        Try to delete a section without can_manage permissions
        """
        self.admin.groups.remove(self.group_in)
        inform_changed_data(self.admin)

        section = MotionCommentSection(name="test_name_wl2oxmmhe/2kd92lwPSi")
        section.save()

        response = self.client.delete(
            reverse("motioncommentsection-detail", args=[section.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(MotionCommentSection.objects.count(), 1)


class RetrieveMotionChangeRecommendation(TestCase):
    """
    Tests retrieving motion change recommendations.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

        motion = Motion(
            title="test_title_3kd)K23,c9239mdj2wcG",
            text="test_text_f8FLP,gvprC;wovVEwlQ",
        )
        motion.save()

        self.public_cr = MotionChangeRecommendation(
            motion=motion, internal=False, line_from=1, line_to=1
        )
        self.public_cr.save()

        self.internal_cr = MotionChangeRecommendation(
            motion=motion, internal=True, line_from=2, line_to=2
        )
        self.internal_cr.save()

    def test_simple(self):
        """
        Test retrieving all change recommendations.
        """
        response = self.client.get(reverse("motionchangerecommendation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_non_admin(self):
        """
        Test retrieving of all change recommendations that are public, if the user
        has no manage perms.
        """
        self.admin = get_user_model().objects.get(username="admin")
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

        response = self.client.get(reverse("motionchangerecommendation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.public_cr.id)


class CreateMotionChangeRecommendation(TestCase):
    """
    Tests motion change recommendation creation.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

        self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_OoCoo3MeiT9li5Iengu9",
                "text": "test_text_thuoz0iecheiheereiCi",
            },
        )

    def test_simple(self):
        """
        Creating a change plain, simple change recommendation
        """
        response = self.client.post(
            reverse("motionchangerecommendation-list"),
            {
                "line_from": "5",
                "line_to": "7",
                "motion_id": "1",
                "text": "<p>New test</p>",
                "type": "0",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_collission(self):
        """
        Two change recommendations with overlapping lines should lead to a Bad Request
        """
        response = self.client.post(
            reverse("motionchangerecommendation-list"),
            {
                "line_from": "5",
                "line_to": "7",
                "motion_id": "1",
                "text": "<p>New test</p>",
                "type": "0",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            reverse("motionchangerecommendation-list"),
            {
                "line_from": "3",
                "line_to": "6",
                "motion_id": "1",
                "text": "<p>New test</p>",
                "type": "0",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "detail": "The recommendation collides with an existing one (line 3 - 6)."
            },
        )

    def test_no_collission_different_motions(self):
        """
        Two change recommendations with overlapping lines, but affecting different motions, should not interfere
        """
        self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_OoCoo3MeiT9li5Iengu9",
                "text": "test_text_thuoz0iecheiheereiCi",
            },
        )

        response = self.client.post(
            reverse("motionchangerecommendation-list"),
            {
                "line_from": "5",
                "line_to": "7",
                "motion_id": "1",
                "text": "<p>New test</p>",
                "type": "0",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            reverse("motionchangerecommendation-list"),
            {
                "line_from": "3",
                "line_to": "6",
                "motion_id": "2",
                "text": "<p>New test</p>",
                "type": "0",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class SupportMotion(TestCase):
    """
    Tests supporting a motion.
    """

    def setUp(self):
        self.admin = get_user_model().objects.get(username="admin")
        self.admin.groups.add(GROUP_DELEGATE_PK)
        inform_changed_data(self.admin)
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_chee7ahCha6bingaew4e",
            text="test_text_birah1theL9ooseeFaip",
        )
        self.motion.save()

    def test_support(self):
        config["motions_min_supporters"] = 1

        response = self.client.post(reverse("motion-support", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"detail": "You have supported this motion successfully."}
        )

    def test_unsupport(self):
        config["motions_min_supporters"] = 1
        self.motion.supporters.add(self.admin)
        response = self.client.delete(reverse("motion-support", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"detail": "You have unsupported this motion successfully."}
        )


class SetState(TestCase):
    """
    Tests setting a state.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_iac4ohquie9Ku6othieC",
            text="test_text_Xohphei6Oobee0Evooyu",
        )
        self.motion.save()
        self.state_id_accepted = 2  # This should be the id of the state 'accepted'.

    def test_set_state(self):
        response = self.client.put(
            reverse("motion-set-state", args=[self.motion.pk]),
            {"state": self.state_id_accepted},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"detail": "The state of the motion was set to accepted."}
        )
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).state.name, "accepted")

    def test_set_state_with_string(self):
        # Using a string is not allowed even if it is the correct name of the state.
        response = self.client.put(
            reverse("motion-set-state", args=[self.motion.pk]), {"state": "accepted"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data, {"detail": "Invalid data. State must be an integer."}
        )

    def test_set_unknown_state(self):
        invalid_state_id = 0
        response = self.client.put(
            reverse("motion-set-state", args=[self.motion.pk]),
            {"state": invalid_state_id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"detail": "You can not set the state to %d." % invalid_state_id},
        )

    def test_reset(self):
        self.motion.set_state(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(reverse("motion-set-state", args=[self.motion.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"detail": "The state of the motion was set to submitted."}
        )
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).state.name, "submitted")


class SetRecommendation(TestCase):
    """
    Tests setting a recommendation.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_ahfooT5leilahcohJ2uz",
            text="test_text_enoogh7OhPoo6eohoCus",
        )
        self.motion.save()
        self.state_id_accepted = 2  # This should be the id of the state 'accepted'.

    def test_set_recommendation(self):
        response = self.client.put(
            reverse("motion-set-recommendation", args=[self.motion.pk]),
            {"recommendation": self.state_id_accepted},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"detail": "The recommendation of the motion was set to Acceptance."},
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion.pk).recommendation.name, "accepted"
        )

    def test_set_state_with_string(self):
        # Using a string is not allowed even if it is the correct name of the state.
        response = self.client.put(
            reverse("motion-set-recommendation", args=[self.motion.pk]),
            {"recommendation": "accepted"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"detail": "Invalid data. Recommendation must be an integer."},
        )

    def test_set_unknown_recommendation(self):
        invalid_state_id = 0
        response = self.client.put(
            reverse("motion-set-recommendation", args=[self.motion.pk]),
            {"recommendation": invalid_state_id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"detail": "You can not set the recommendation to %d." % invalid_state_id},
        )

    def test_set_invalid_recommendation(self):
        # This is a valid state id, but this state is not recommendable because it belongs to a different workflow.
        invalid_state_id = 6  # State 'permitted'
        response = self.client.put(
            reverse("motion-set-recommendation", args=[self.motion.pk]),
            {"recommendation": invalid_state_id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"detail": "You can not set the recommendation to %d." % invalid_state_id},
        )

    def test_set_invalid_recommendation_2(self):
        # This is a valid state id, but this state is not recommendable because it has not recommendation label
        invalid_state_id = 1  # State 'submitted'
        self.motion.set_state(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(
            reverse("motion-set-recommendation", args=[self.motion.pk]),
            {"recommendation": invalid_state_id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"detail": "You can not set the recommendation to %d." % invalid_state_id},
        )

    def test_reset(self):
        self.motion.set_recommendation(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(
            reverse("motion-set-recommendation", args=[self.motion.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"detail": "The recommendation of the motion was set to None."},
        )
        self.assertTrue(Motion.objects.get(pk=self.motion.pk).recommendation is None)

    def test_set_recommendation_to_current_state(self):
        self.motion.set_state(self.state_id_accepted)
        self.motion.save()
        response = self.client.put(
            reverse("motion-set-recommendation", args=[self.motion.pk]),
            {"recommendation": self.state_id_accepted},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"detail": "The recommendation of the motion was set to Acceptance."},
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion.pk).recommendation.name, "accepted"
        )


class CreateMotionPoll(TestCase):
    """
    Tests creating polls of motions.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_Aiqueigh2dae9phabiqu",
            text="test_text_Neekoh3zou6li5rue8iL",
        )
        self.motion.save()

    def test_create_first_poll_with_values_then_second_poll_without(self):
        self.poll = self.motion.create_poll()
        self.poll.set_vote_objects_with_values(
            self.poll.get_options().get(), {"Yes": 42, "No": 43, "Abstain": 44}
        )
        response = self.client.post(
            reverse("motion-create-poll", args=[self.motion.pk])
        )
        self.assertEqual(self.motion.polls.count(), 2)
        response = self.client.get(reverse("motion-detail", args=[self.motion.pk]))
        for key in ("yes", "no", "abstain"):
            self.assertTrue(
                response.data["polls"][1][key] is None,
                f"Vote value '{key}' should be None.",
            )


class UpdateMotionPoll(TestCase):
    """
    Tests updating polls of motions.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_Aiqueigh2dae9phabiqu",
            text="test_text_Neekoh3zou6li5rue8iL",
        )
        self.motion.save()
        self.poll = self.motion.create_poll()

    def test_invalid_votesvalid_value(self):
        response = self.client.put(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"motion_id": self.motion.pk, "votesvalid": "-3"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_votesinvalid_value(self):
        response = self.client.put(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"motion_id": self.motion.pk, "votesinvalid": "-3"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_votescast_value(self):
        response = self.client.put(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"motion_id": self.motion.pk, "votescast": "-3"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_value_for_votesvalid(self):
        response = self.client.put(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"motion_id": self.motion.pk, "votesvalid": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class NumberMotionsInCategory(TestCase):
    """
    Tests numbering motions in a category.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.category = Category.objects.create(
            name="test_cateogory_name_zah6Ahd4Ifofaeree6ai",
            prefix="test_prefix_ahz6tho2mooH8",
        )
        self.motion = Motion(
            title="test_title_Eeha8Haf6peulu8ooc0z",
            text="test_text_faghaZoov9ooV4Acaquk",
            category=self.category,
        )
        self.motion.save()
        self.motion.identifier = ""
        self.motion.save()
        self.motion_2 = Motion(
            title="test_title_kuheih2eja2Saeshusha",
            text="test_text_Ha5ShaeraeSuthooP2Bu",
            category=self.category,
        )
        self.motion_2.save()
        self.motion_2.identifier = ""
        self.motion_2.save()

    def test_numbering(self):
        response = self.client.post(
            reverse("category-numbering", args=[self.category.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "detail": "All motions in category test_cateogory_name_zah6Ahd4Ifofaeree6ai numbered successfully."
            },
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion.pk).identifier,
            "test_prefix_ahz6tho2mooH8 1",
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion_2.pk).identifier,
            "test_prefix_ahz6tho2mooH8 2",
        )

    def test_numbering_existing_identifier(self):
        self.motion_2.identifier = "test_prefix_ahz6tho2mooH8 1"
        self.motion_2.save()
        response = self.client.post(
            reverse("category-numbering", args=[self.category.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "detail": "All motions in category test_cateogory_name_zah6Ahd4Ifofaeree6ai numbered successfully."
            },
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion.pk).identifier,
            "test_prefix_ahz6tho2mooH8 1",
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion_2.pk).identifier,
            "test_prefix_ahz6tho2mooH8 2",
        )

    def test_numbering_with_given_order(self):
        self.motion_3 = Motion(
            title="test_title_eeb0kua5ciike4su2auJ",
            text="test_text_ahshuGhaew3eim8yoht7",
            category=self.category,
        )
        self.motion_3.save()
        self.motion_3.identifier = ""
        self.motion_3.save()
        response = self.client.post(
            reverse("category-numbering", args=[self.category.pk]),
            {"motions": [3, 2]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "detail": "All motions in category test_cateogory_name_zah6Ahd4Ifofaeree6ai numbered successfully."
            },
        )
        self.assertEqual(Motion.objects.get(pk=self.motion.pk).identifier, None)
        self.assertEqual(
            Motion.objects.get(pk=self.motion_2.pk).identifier,
            "test_prefix_ahz6tho2mooH8 2",
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion_3.pk).identifier,
            "test_prefix_ahz6tho2mooH8 1",
        )


class FollowRecommendationsForMotionBlock(TestCase):
    """
    Tests following the recommendations of motions in an motion block.
    """

    def setUp(self):
        self.state_id_accepted = 2  # This should be the id of the state 'accepted'.
        self.state_id_rejected = 3  # This should be the id of the state 'rejected'.

        self.client = APIClient()
        self.client.login(username="admin", password="admin")

        self.motion_block = MotionBlock.objects.create(
            title="test_motion_block_name_Ufoopiub7quaezaepeic"
        )

        self.motion = Motion(
            title="test_title_yo8ohy5eifeiyied2AeD",
            text="test_text_chi1aeth5faPhueQu8oh",
            motion_block=self.motion_block,
        )
        self.motion.save()
        self.motion.set_recommendation(self.state_id_accepted)
        self.motion.save()

        self.motion_2 = Motion(
            title="test_title_eith0EemaW8ahZa9Piej",
            text="test_text_haeho1ohk3ou7pau2Jee",
            motion_block=self.motion_block,
        )
        self.motion_2.save()
        self.motion_2.set_recommendation(self.state_id_rejected)
        self.motion_2.save()

    def test_follow_recommendations_for_motion_block(self):
        response = self.client.post(
            reverse("motionblock-follow-recommendations", args=[self.motion_block.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Motion.objects.get(pk=self.motion.pk).state.id, self.state_id_accepted
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion_2.pk).state.id, self.state_id_rejected
        )


class CreateWorkflow(TestCase):
    """
    Tests the creating of workflows.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def test_creation(self):
        Workflow.objects.all().delete()
        response = self.client.post(
            reverse("workflow-list"), {"name": "test_name_OoCoo3MeiT9li5Iengu9"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        workflow = Workflow.objects.get()
        self.assertEqual(workflow.name, "test_name_OoCoo3MeiT9li5Iengu9")
        first_state = workflow.first_state
        self.assertEqual(type(first_state), State)


class UpdateWorkflow(TestCase):
    """
    Tests the updating of workflows.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.workflow = Workflow.objects.first()

    def test_rename_workflow(self):
        response = self.client.patch(
            reverse("workflow-detail", args=[self.workflow.pk]),
            {"name": 'test_name_wofi38DiWLT"8d3lwfo3'},
        )

        workflow = Workflow.objects.get(pk=self.workflow.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(workflow.name, 'test_name_wofi38DiWLT"8d3lwfo3')


class DeleteWorkflow(TestCase):
    """
    Tests the deletion of workflows.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.workflow = Workflow.objects.first()

    def test_simple_delete(self):
        response = self.client.delete(
            reverse("workflow-detail", args=[self.workflow.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Workflow.objects.count(), 1)  # Just the other default one

    def test_delete_with_assigned_motions(self):
        self.motion = Motion(
            title="test_title_chee7ahCha6bingaew4e",
            text="test_text_birah1theL9ooseeFaip",
        )
        self.motion.reset_state(self.workflow)
        self.motion.save()

        response = self.client.delete(
            reverse("workflow-detail", args=[self.workflow.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Workflow.objects.count(), 2)


class DeleteCategory(TestCase):
    """
    Tests the deletion of categories.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.category = Category.objects.create(
            name="test_name_dacei2iiTh", prefix="test_prefix_lahngoaW9L"
        )

    def test_simple_delete_category_with_two_motions(self):
        self.motion1 = Motion.objects.create(
            title="test_title_fieB5ko4ahGeex5ohsh7",
            text="test_text_EFoh6Ahtho9eihei1xua",
            category=self.category,
        )
        self.motion2 = Motion.objects.create(
            title="test_title_ahboo8eerohchuoD7sut",
            text="test_text_pahghah9iuM9moo8Ohve",
            category=self.category,
        )
        response = self.client.delete(
            reverse("category-detail", args=[self.category.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.exists())
