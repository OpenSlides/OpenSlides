import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.assignments.models import Assignment, AssignmentPoll
from openslides.core.models import Tag
from openslides.mediafiles.models import Mediafile
from openslides.utils.autoupdate import inform_changed_data
from tests.count_queries import count_queries
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_assignment_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all assignments,
    * 1 request to get all related users,
    * 1 request to get the agenda item,
    * 1 request to get the list of speakers,
    * 1 request to get the tags,
    * 1 request to get the attachments and
    * 1 Request to get the polls of the assignment
    * 1 Request to get the options of these polls
    """
    for index in range(10):
        assignment = Assignment.objects.create(title=f"assignment{index}", open_posts=1)
        for i in range(2):
            AssignmentPoll.objects.create(
                assignment=assignment,
                title="test_title_nah5Ahh6IkeeM8rah3ai",
                pollmethod=AssignmentPoll.POLLMETHOD_YN,
                type=AssignmentPoll.TYPE_NAMED,
            )

    assert count_queries(Assignment.get_elements)() == 8


class CreateAssignment(TestCase):
    """
    Tests basic creation of assignments.
    """

    def test_simple(self):
        response = self.client.post(
            reverse("assignment-list"),
            {"title": "test_title_ef3jpF)M329f30m)f82", "open_posts": 1},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assignment = Assignment.objects.get()
        self.assertEqual(assignment.title, "test_title_ef3jpF)M329f30m)f82")
        self.assertEqual(assignment.number_poll_candidates, False)

    def test_with_tags_and_mediafiles(self):
        Tag.objects.create(name="test_tag")
        Mediafile.objects.create(
            title="test_file", mediafile=SimpleUploadedFile("title.txt", b"content")
        )
        response = self.client.post(
            reverse("assignment-list"),
            {
                "title": "test_title_ef3jpF)M329f30m)f82",
                "open_posts": 1,
                "tags_id": [1],
                "attachments_id": [1],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assignment = Assignment.objects.get()
        self.assertEqual(assignment.title, "test_title_ef3jpF)M329f30m)f82")
        self.assertTrue(assignment.tags.exists())
        self.assertTrue(assignment.attachments.exists())

    def test_number_poll_candidates(self):
        response = self.client.post(
            reverse("assignment-list"),
            {
                "title": "test_title_EFBhGQkQciwZtjSc7BVy",
                "open_posts": 1,
                "number_poll_candidates": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        assignment = Assignment.objects.get()
        self.assertEqual(assignment.number_poll_candidates, True)


class CandidatureSelf(TestCase):
    """
    Tests self candidation view.
    """

    def setUp(self):
        self.client.login(username="admin", password="admin")
        self.assignment = Assignment.objects.create(
            title="test_assignment_oikaengeijieh3ughiX7", open_posts=1
        )

    def test_nominate_self(self):
        response = self.client.post(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Assignment.objects.get(pk=self.assignment.pk)
            .candidates.filter(username="admin")
            .exists()
        )

    def test_nominate_self_twice(self):
        self.assignment.add_candidate(get_user_model().objects.get(username="admin"))

        response = self.client.post(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Assignment.objects.get(pk=self.assignment.pk)
            .candidates.filter(username="admin")
            .exists()
        )

    def test_nominate_self_when_finished(self):
        self.assignment.set_phase(Assignment.PHASE_FINISHED)
        self.assignment.save()

        response = self.client.post(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 400)

    def test_nominate_self_during_voting(self):
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()

        response = self.client.post(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Assignment.objects.get(pk=self.assignment.pk).candidates.exists()
        )

    def test_nominate_self_during_voting_non_admin(self):
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()
        admin = get_user_model().objects.get(username="admin")
        group_admin = admin.groups.get(name="Admin")
        group_delegates = type(group_admin).objects.get(name="Delegates")
        admin.groups.add(group_delegates)
        admin.groups.remove(group_admin)
        inform_changed_data(admin)

        response = self.client.post(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 403)

    def test_withdraw_self(self):
        self.assignment.add_candidate(get_user_model().objects.get(username="admin"))

        response = self.client.delete(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Assignment.objects.get(pk=self.assignment.pk)
            .candidates.filter(username="admin")
            .exists()
        )

    def test_withdraw_self_twice(self):
        response = self.client.delete(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 400)

    def test_withdraw_self_when_finished(self):
        self.assignment.add_candidate(get_user_model().objects.get(username="admin"))
        self.assignment.set_phase(Assignment.PHASE_FINISHED)
        self.assignment.save()

        response = self.client.delete(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 400)

    def test_withdraw_self_during_voting(self):
        self.assignment.add_candidate(get_user_model().objects.get(username="admin"))
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()

        response = self.client.delete(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Assignment.objects.get(pk=self.assignment.pk).candidates.exists()
        )

    def test_withdraw_self_during_voting_non_admin(self):
        self.assignment.add_candidate(get_user_model().objects.get(username="admin"))
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()
        admin = get_user_model().objects.get(username="admin")
        group_admin = admin.groups.get(name="Admin")
        group_delegates = type(group_admin).objects.get(name="Delegates")
        admin.groups.add(group_delegates)
        admin.groups.remove(group_admin)
        inform_changed_data(admin)

        response = self.client.delete(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 403)


class CandidatureOther(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.assignment = Assignment.objects.create(
            title="test_assignment_leiD6tiojigh1vei1ait", open_posts=1
        )
        self.user = get_user_model().objects.create_user(
            username="test_user_eeheekai4Phue6cahtho",
            password="test_password_ThahXazeiV8veipeePh6",
        )

    def test_invalid_data_empty_dict(self):
        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]), {}
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_data_string_instead_of_integer(self):
        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": "string_instead_of_integer"},
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_data_user_does_not_exist(self):
        # ID of a user that does not exist.
        # Be careful: Here we do not test that the user does not exist.
        inexistent_user_pk = self.user.pk + 1000
        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": inexistent_user_pk},
        )

        self.assertEqual(response.status_code, 400)

    def test_nominate_other(self):
        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Assignment.objects.get(pk=self.assignment.pk)
            .candidates.filter(username="test_user_eeheekai4Phue6cahtho")
            .exists()
        )

    def test_nominate_other_twice(self):
        self.assignment.add_candidate(
            get_user_model().objects.get(username="test_user_eeheekai4Phue6cahtho")
        )
        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 400)

    def test_nominate_other_when_finished(self):
        self.assignment.set_phase(Assignment.PHASE_FINISHED)
        self.assignment.save()

        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 400)

    def test_nominate_other_during_voting(self):
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()

        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Assignment.objects.get(pk=self.assignment.pk)
            .candidates.filter(username="test_user_eeheekai4Phue6cahtho")
            .exists()
        )

    def test_nominate_other_during_voting_non_admin(self):
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()
        admin = get_user_model().objects.get(username="admin")
        group_admin = admin.groups.get(name="Admin")
        group_delegates = type(group_admin).objects.get(name="Delegates")
        admin.groups.add(group_delegates)
        admin.groups.remove(group_admin)
        inform_changed_data(admin)

        response = self.client.post(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 403)

    def test_delete_other(self):
        self.assignment.add_candidate(self.user)
        response = self.client.delete(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Assignment.objects.get(pk=self.assignment.pk)
            .candidates.filter(username="test_user_eeheekai4Phue6cahtho")
            .exists()
        )

    def test_delete_other_twice(self):
        response = self.client.delete(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 400)

    def test_delete_other_when_finished(self):
        self.assignment.add_candidate(self.user)
        self.assignment.set_phase(Assignment.PHASE_FINISHED)
        self.assignment.save()

        response = self.client.delete(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 400)

    def test_delete_other_during_voting(self):
        self.assignment.add_candidate(self.user)
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()

        response = self.client.delete(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Assignment.objects.get(pk=self.assignment.pk)
            .candidates.filter(username="test_user_eeheekai4Phue6cahtho")
            .exists()
        )

    def test_delete_other_during_voting_non_admin(self):
        self.assignment.add_candidate(self.user)
        self.assignment.set_phase(Assignment.PHASE_VOTING)
        self.assignment.save()
        admin = get_user_model().objects.get(username="admin")
        group_admin = admin.groups.get(name="Admin")
        group_delegates = type(group_admin).objects.get(name="Delegates")
        admin.groups.add(group_delegates)
        admin.groups.remove(group_admin)
        inform_changed_data(admin)

        response = self.client.delete(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 403)
