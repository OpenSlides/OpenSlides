import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.motions.models import (
    Category,
    Motion,
    MotionBlock,
    MotionComment,
    MotionCommentSection,
    State,
    StatuteParagraph,
    Workflow,
)
from openslides.utils.auth import get_group_model
from openslides.utils.autoupdate import inform_changed_data
from tests.common_groups import GROUP_ADMIN_PK, GROUP_DELEGATE_PK, GROUP_STAFF_PK
from tests.count_queries import count_queries
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_category_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all categories.
    """
    for index in range(10):
        Category.objects.create(name=f"category{index}")

    assert count_queries(Category.get_elements)() == 1


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

    assert count_queries(StatuteParagraph.get_elements)() == 1


@pytest.mark.django_db(transaction=False)
def test_workflow_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the list of all workflows and
    * 1 request to get all states.
    """

    assert count_queries(Workflow.get_elements)() == 2


@pytest.mark.django_db(transaction=False)
def test_motion_block_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get all motion blocks
    * 1 request to get all agenda items
    * 1 request to get all lists of speakers
    * 1 request to get all motions
    """
    for i in range(5):
        motion_block = MotionBlock.objects.create(title=f"block{i}")
        for j in range(3):
            Motion.objects.create(
                title=f"motion{i}_{j}", text="text", motion_block=motion_block
            )

    assert count_queries(MotionBlock.get_elements)() == 4


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

    def test_wrong_data_type(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]), None
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
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "The comment should be a string.")

    def test_non_existing_section(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]), {"section_id": 42}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"], "A comment section with id {0} does not exist."
        )
        self.assertEqual(response.data["args"][0], "42")

    def test_create_comment(self):
        response = self.client.post(
            reverse("motion-manage-comments", args=[self.motion.pk]),
            {
                "section_id": self.section_read_write.pk,
                "comment": "test_comment_fk3jrnfwsdg%fj=feijf",
            },
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
        self.assertEqual(response.data["args"][0], '"test_title_SlqfMw(waso0saWMPqcZ"')
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


class TestMotionCommentSectionSorting(TestCase):
    """
    Tests sorting of comment sections.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.section1 = MotionCommentSection(name="test_name_hponzp<zp7NUJKLAykbX")
        self.section1.save()
        self.section2 = MotionCommentSection(name="test_name_eix,b<bojbP'JO;<kVKL")
        self.section2.save()
        self.section3 = MotionCommentSection(name="test_name_ojMOeigSIOfhmpouweqc")
        self.section3.save()

    def test_simple(self):
        response = self.client.post(
            reverse("motioncommentsection-sort"), {"ids": [3, 2, 1]}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        section1 = MotionCommentSection.objects.get(pk=1)
        self.assertEqual(section1.weight, 3)
        section2 = MotionCommentSection.objects.get(pk=2)
        self.assertEqual(section2.weight, 2)
        section3 = MotionCommentSection.objects.get(pk=3)
        self.assertEqual(section3.weight, 1)

    def test_wrong_data(self):
        response = self.client.post(
            reverse("motioncommentsection-sort"), {"ids": "some_string"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assert_not_changed()

    def test_wrong_id_type(self):
        response = self.client.post(
            reverse("motioncommentsection-sort"), {"ids": [1, 2, "some_string"]}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assert_not_changed()

    def test_missing_id(self):
        response = self.client.post(
            reverse("motioncommentsection-sort"), {"ids": [3, 1]}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assert_not_changed()

    def test_duplicate_id(self):
        response = self.client.post(
            reverse("motioncommentsection-sort"), {"ids": [3, 2, 1, 1]}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assert_not_changed()

    def test_wrong_id(self):
        response = self.client.post(
            reverse("motioncommentsection-sort"), {"ids": [3, 4, 1]}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assert_not_changed()

    def assert_not_changed(self):
        """ Asserts, that every comment section has the default weight of 10000. """
        for section in MotionCommentSection.objects.all():
            self.assertEqual(section.weight, 10000)


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
        self.assertEqual(response.data["args"][0], "3")
        self.assertEqual(response.data["args"][1], "6")

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


class NumberMotionsInCategories(TestCase):
    """
    Tests numbering motions in categories.

    Default test environment:
     - *without* blanks
     - 1 min digit

    Testdata. All names (and prefixes) are prefixed with "test_". The
    ordering is ensured with "category_weight".
    Category tree (with motions M and amendments A):
    A-A
      <M1>
      <M2-A2>
      B
        <M2-A1>
        <M3>
      C-C
        <M2>
        <M2-A1-A1>
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.A = Category.objects.create(name="test_A", prefix="test_A")
        self.B = Category.objects.create(name="test_B", parent=self.A)
        self.C = Category.objects.create(name="test_C", prefix="test_C", parent=self.A)

        self.M1 = Motion(
            title="test_title_Eeha8Haf6peulu8ooc0z",
            text="test_text_faghaZoov9ooV4Acaquk",
            category=self.A,
            category_weight=1,
        )
        self.M1.save()
        self.M1.identifier = ""
        self.M1.save()

        self.M2 = Motion(
            title="test_title_kuheih2eja2Saeshusha",
            text="test_text_Ha5ShaeraeSuthooP2Bu",
            category=self.C,
            category_weight=1,
        )
        self.M2.save()
        self.M2.identifier = ""
        self.M2.save()

        self.M2_A1 = Motion(
            title="test_title_av3ejIJvwon3jvnNVaie",
            text="test_text_FJPiejfwdcoiwjvijao1",
            category=self.B,
            category_weight=1,
            parent=self.M2,
        )
        self.M2_A1.save()
        self.M2_A1.identifier = ""
        self.M2_A1.save()

        self.M2_A1_A1 = Motion(
            title="test_title_ejvhwoxngixoqkxy.qfi",
            text="test_text_euh2gfaiaqfu3.f(3hgf",
            category=self.C,
            category_weight=2,
            parent=self.M2_A1,
        )
        self.M2_A1_A1.save()
        self.M2_A1_A1.identifier = ""
        self.M2_A1_A1.save()

        self.M2_A2 = Motion(
            title="test_title_xoerFiwebbpiUEeuvxMa",
            text="test_text_zbwZWPefiisdISfwLKqN",
            category=self.A,
            category_weight=2,
            parent=self.M2,
        )
        self.M2_A2.save()
        self.M2_A2.identifier = ""
        self.M2_A2.save()

        self.M3 = Motion(
            title="test_title_VWIVeiNVenudn(23J92§",
            text="test_text_VEDno328hn8/TBbScVEb",
            category=self.B,
            category_weight=2,
        )
        self.M3.save()
        self.M3.identifier = ""
        self.M3.save()

    def test_numbering(self):
        response = self.client.post(reverse("category-numbering", args=[self.A.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Motion.objects.get(pk=self.M1.pk).identifier, "test_A1")
        self.assertEqual(Motion.objects.get(pk=self.M3.pk).identifier, "test_A2")
        self.assertEqual(Motion.objects.get(pk=self.M2.pk).identifier, "test_C3")
        self.assertEqual(Motion.objects.get(pk=self.M2_A1.pk).identifier, "test_C3-2")
        self.assertEqual(
            Motion.objects.get(pk=self.M2_A1_A1.pk).identifier, "test_C3-2-1"
        )
        self.assertEqual(Motion.objects.get(pk=self.M2_A2.pk).identifier, "test_C3-1")

    def test_with_blanks_and_leading_zeros(self):
        config["motions_amendments_prefix"] = "-X"
        config["motions_identifier_with_blank"] = True
        config["motions_identifier_min_digits"] = 3
        response = self.client.post(reverse("category-numbering", args=[self.A.pk]))
        config["motions_identifier_with_blank"] = False
        config["motions_identifier_min_digits"] = 1

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Motion.objects.get(pk=self.M1.pk).identifier, "test_A 001")
        self.assertEqual(Motion.objects.get(pk=self.M3.pk).identifier, "test_A 002")
        self.assertEqual(Motion.objects.get(pk=self.M2.pk).identifier, "test_C 003")
        self.assertEqual(
            Motion.objects.get(pk=self.M2_A1.pk).identifier, "test_C 003 -X 002"
        )
        self.assertEqual(
            Motion.objects.get(pk=self.M2_A1_A1.pk).identifier,
            "test_C 003 -X 002 -X 001",
        )
        self.assertEqual(
            Motion.objects.get(pk=self.M2_A2.pk).identifier, "test_C 003 -X 001"
        )

    def test_existing_identifier_no_category(self):
        # config["motions_identifier_with_blank"] = True
        conflicting_motion = Motion(
            title="test_title_al2=2k21fjv1lsck3ehlWExg",
            text="test_text_3omvpEhnfg082ejplk1m",
        )
        conflicting_motion.save()
        conflicting_motion.identifier = "test_C3-2-1"
        conflicting_motion.save()
        response = self.client.post(reverse("category-numbering", args=[self.A.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual("test_C3-2-1", response.data["args"][0])

    def test_existing_identifier_with_category(self):
        conflicting_category = Category.objects.create(
            name="test_name_hpsodhakvjdbvkblwfjr"
        )
        conflicting_motion = Motion(
            title="test_title_al2=2k21fjv1lsck3ehlWExg",
            text="test_text_3omvpEhnfg082ejplk1m",
            category=conflicting_category,
        )
        conflicting_motion.save()
        conflicting_motion.identifier = "test_C3-2-1"
        conflicting_motion.save()
        response = self.client.post(reverse("category-numbering", args=[self.A.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual("test_C3-2-1", response.data["args"][0])
        self.assertEqual(conflicting_category.name, response.data["args"][1])

    def test_incomplete_amendment_tree(self):
        self.M2_A1.category = None
        self.M2_A1.save()
        response = self.client.post(reverse("category-numbering", args=[self.A.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.M2_A1_A1.title, response.data["args"][0])
        self.assertEqual(self.M2_A1.title, response.data["args"][1])


class TestMotionBlock(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def make_admin_delegate(self):
        admin = get_user_model().objects.get(username="admin")
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(admin)

    def test_creation(self):
        response = self.client.post(
            reverse("motionblock-list"), {"title": "test_title_r23098OMFwoqof3if3kO"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MotionBlock.objects.exists())
        self.assertEqual(
            MotionBlock.objects.get().title, "test_title_r23098OMFwoqof3if3kO"
        )

    def test_creation_no_data(self):
        response = self.client.post(reverse("motionblock-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionBlock.objects.exists())

    def test_creation_not_authenticated(self):
        self.make_admin_delegate()
        response = self.client.post(
            reverse("motionblock-list"), {"title": "test_title_2PFjpf39ap,38fuMPO§8"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionBlock.objects.exists())


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

    def test_delete_last_workflow(self):
        self.workflow.delete()
        other_workflow_pk = Workflow.objects.get().pk
        response = self.client.delete(
            reverse("workflow-detail", args=[other_workflow_pk])
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Workflow.objects.count(), 1)  # Just the other default one


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
