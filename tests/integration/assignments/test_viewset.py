import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.assignments.models import Assignment
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.test import TestCase

from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_assignment_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all assignments,
    * 1 request to get all related users,
    * 1 request to get the agenda item,
    * 1 request to get the polls,
    * 1 request to get the tags and

    * 10 request to fetch each related user again.

    TODO: The last request are a bug.
    """
    for index in range(10):
        Assignment.objects.create(title=f"assignment{index}", open_posts=1)

    assert count_queries(Assignment.get_elements) == 15


class CanidatureSelf(TestCase):
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
        self.assignment.set_candidate(get_user_model().objects.get(username="admin"))

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
        self.assignment.set_candidate(get_user_model().objects.get(username="admin"))

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
        self.assignment.set_candidate(get_user_model().objects.get(username="admin"))
        self.assignment.set_phase(Assignment.PHASE_FINISHED)
        self.assignment.save()

        response = self.client.delete(
            reverse("assignment-candidature-self", args=[self.assignment.pk])
        )

        self.assertEqual(response.status_code, 400)

    def test_withdraw_self_during_voting(self):
        self.assignment.set_candidate(get_user_model().objects.get(username="admin"))
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
        self.assignment.set_candidate(get_user_model().objects.get(username="admin"))
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
        self.assignment.set_candidate(
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
        self.assignment.set_candidate(self.user)
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
        self.assignment.set_candidate(self.user)
        self.assignment.set_phase(Assignment.PHASE_FINISHED)
        self.assignment.save()

        response = self.client.delete(
            reverse("assignment-candidature-other", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 400)

    def test_delete_other_during_voting(self):
        self.assignment.set_candidate(self.user)
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
        self.assignment.set_candidate(self.user)
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


class MarkElectedOtherUser(TestCase):
    """
    Tests marking an elected user. We use an extra user here to show that
    admin can not only mark himself but also other users.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.assignment = Assignment.objects.create(
            title="test_assignment_Ierohsh8rahshofiejai", open_posts=1
        )
        self.user = get_user_model().objects.create_user(
            username="test_user_Oonei3rahji5jugh1eev",
            password="test_password_aiphahb5Nah0cie4iP7o",
        )

    def test_mark_elected(self):
        self.assignment.set_candidate(
            get_user_model().objects.get(username="test_user_Oonei3rahji5jugh1eev")
        )
        response = self.client.post(
            reverse("assignment-mark-elected", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Assignment.objects.get(pk=self.assignment.pk)
            .elected.filter(username="test_user_Oonei3rahji5jugh1eev")
            .exists()
        )

    def test_mark_unelected(self):
        user = get_user_model().objects.get(username="test_user_Oonei3rahji5jugh1eev")
        self.assignment.set_elected(user)
        response = self.client.delete(
            reverse("assignment-mark-elected", args=[self.assignment.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Assignment.objects.get(pk=self.assignment.pk)
            .elected.filter(username="test_user_Oonei3rahji5jugh1eev")
            .exists()
        )


class UpdateAssignmentPoll(TestCase):
    """
    Tests updating polls of assignments.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.assignment = Assignment.objects.create(
            title="test_assignment_ohneivoh9caiB8Yiungo", open_posts=1
        )
        self.assignment.set_candidate(get_user_model().objects.get(username="admin"))
        self.poll = self.assignment.create_poll()

    def test_invalid_votesvalid_value(self):
        response = self.client.put(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"assignment_id": self.assignment.pk, "votesvalid": "-3"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_votesinvalid_value(self):
        response = self.client.put(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"assignment_id": self.assignment.pk, "votesinvalid": "-3"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_votescast_value(self):
        response = self.client.put(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"assignment_id": self.assignment.pk, "votescast": "-3"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_value_for_votesvalid(self):
        response = self.client.put(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"assignment_id": self.assignment.pk, "votesvalid": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
