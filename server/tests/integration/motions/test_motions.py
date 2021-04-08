import json

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
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
    MotionPoll,
    Submitter,
    Workflow,
)
from openslides.poll.models import BasePoll
from openslides.utils.auth import get_group_model
from openslides.utils.autoupdate import inform_changed_data
from tests.common_groups import GROUP_ADMIN_PK, GROUP_DELEGATE_PK
from tests.count_queries import count_queries
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_motion_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all motions,
    * 1 request to get the associated workflow
    * 1 request for all motion comments
    * 1 request for all motion comment sections required for the comments
    * 1 request for all users required for the read_groups of the sections
    * 1 request to get all amendments of all motions
    * 1 request to get the agenda item,
    * 1 request to get the list of speakers,
    * 1 request to get the attachments,
    * 1 request to get the tags,
    * 2 requests to get the submitters and supporters,
    * 1 request for change_recommendations.

    Two comment sections are created and for each motions two comments.
    """
    section1 = MotionCommentSection.objects.create(name="test_section")
    section2 = MotionCommentSection.objects.create(name="test_section")

    user1 = get_user_model().objects.create_user(
        username="test_username_Iena7vahyaiphaangeaV",
        password="test_password_oomie4jahNgook1ooDee",
    )
    user2 = get_user_model().objects.create_user(
        username="test_username_ohj4eiN3ejali9ahng6e",
        password="test_password_Coo3ong1cheeveiD3sho",
    )
    user3 = get_user_model().objects.create_user(
        username="test_username_oe2Yei9Tho8see1Reija",
        password="test_password_faij5aeBingaec5Jeila",
    )

    for index in range(10):
        motion = Motion.objects.create(title=f"motion{index}")

        motion.supporters.add(user1, user2)
        Submitter.objects.add(user2, motion)
        Submitter.objects.add(user3, motion)

        MotionComment.objects.create(
            comment="test_comment", motion=motion, section=section1
        )
        MotionComment.objects.create(
            comment="test_comment2", motion=motion, section=section2
        )

        block = MotionBlock.objects.create(title=f"block_{index}")
        motion.motion_block = block
        category = Category.objects.create(name=f"category_{index}")
        motion.category = category
        motion.save()

        # Create a poll:
        poll = MotionPoll.objects.create(
            motion=motion,
            title="test_title_XeejaeFez3chahpei9qu",
            pollmethod="YNA",
            type=BasePoll.TYPE_NAMED,
        )
        poll.create_options()

    assert count_queries(Motion.get_elements)() == 13


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
        with self.assertNumQueries(54):
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
        self.assertTrue("title" in response.data)

    def test_without_text(self):
        response = self.client.post(
            reverse("motion-list"), {"title": "test_title_dlofp23m9O(ZD2d1lwHG"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            str(response.data["detail"][0]), "The text field may not be blank."
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
        self.assertEqual(motion.identifier, "TEST_PREFIX_la0eadaewuec3seoxeiN1")

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

    def test_patch_as_anonymous_without_manage_perms(self):
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()
        response = guest_client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            {"identifier": "test_identifier_4g2jgj1wrnmvvIRhtqqPO84WD"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        motion = Motion.objects.get()
        self.assertEqual(motion.identifier, "1")

    def test_patch_empty_text(self):
        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]), {"text": ""}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        motion = Motion.objects.get()
        self.assertEqual(motion.text, "test_text_xeigheeha7thopubeu4U")

    def test_patch_amendment_paragraphs_no_manage_perms(self):
        admin = get_user_model().objects.get(username="admin")
        admin.groups.remove(GROUP_ADMIN_PK)
        admin.groups.add(GROUP_DELEGATE_PK)
        Submitter.objects.add(admin, self.motion)
        self.motion.state.allow_submitter_edit = True
        self.motion.state.save()
        inform_changed_data(admin)

        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            {"amendment_paragraphs": ["test_paragraph_39fo8qcpcaFMmjfaD2Lb"]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertTrue(isinstance(motion.amendment_paragraphs, list))
        self.assertEqual(len(motion.amendment_paragraphs), 1)
        self.assertEqual(
            motion.amendment_paragraphs[0], "test_paragraph_39fo8qcpcaFMmjfaD2Lb"
        )
        self.assertEqual(motion.text, "")

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

    def test_patch_recommendation_extension(self):
        group = get_group_model().objects.get(pk=GROUP_DELEGATE_PK)
        group.permissions.clear()
        group.permissions.add(
            Permission.objects.get(
                content_type__app_label="motions",
                codename="can_see",
            ),
            Permission.objects.get(
                content_type__app_label="motions",
                codename="can_manage_metadata",
            ),
        )
        group.save()
        password = "test_password_lln8tep0UdxDvFDW"
        user = get_user_model().objects.create_user(
            username="test_username_cuZUI20g3AUbcFVC",
            password=password,
        )
        user.groups.add(group)
        user.save()
        self.client.login(username=user.username, password=password)

        response = self.client.patch(
            reverse("motion-detail", args=[self.motion.pk]),
            {"recommendation_extension": "extension"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        motion = Motion.objects.get()
        self.assertEqual(motion.recommendation_extension, "extension")


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
            {
                "detail": "You can not set the state to {0}.",
                "args": [str(invalid_state_id)],
            },
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
            {
                "detail": "The recommendation of the motion was set to {0}.",
                "args": ["Acceptance"],
            },
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
            {
                "detail": "You can not set the recommendation to {0}.",
                "args": [str(invalid_state_id)],
            },
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
            {
                "detail": "You can not set the recommendation to {0}.",
                "args": [str(invalid_state_id)],
            },
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
            {
                "detail": "You can not set the recommendation to {0}.",
                "args": [str(invalid_state_id)],
            },
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
            {
                "detail": "The recommendation of the motion was set to {0}.",
                "args": ["None"],
            },
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
            {
                "detail": "The recommendation of the motion was set to {0}.",
                "args": ["Acceptance"],
            },
        )
        self.assertEqual(
            Motion.objects.get(pk=self.motion.pk).recommendation.name, "accepted"
        )
