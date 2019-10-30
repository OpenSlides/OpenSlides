import random
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from openslides.assignments.models import (
    Assignment,
    AssignmentOption,
    AssignmentPoll,
    AssignmentVote,
)
from openslides.poll.models import BasePoll
from openslides.utils.auth import get_group_model
from tests.test_case import TestCase

from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_assignment_poll_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the polls,
    * 1 request to get all options for all polls,
    * 1 request to get all users for all options (candidates),
    * 1 request to get all votes for all options,
    * 1 request to get all users for all votes,
    * 1 request to get all poll groups,
    = 6 queries
    """
    create_assignment_polls()
    assert count_queries(AssignmentPoll.get_elements) == 6


@pytest.mark.django_db(transaction=False)
def test_assignment_vote_db_queries():
    """
    Tests that only 1 query is done when fetching AssignmentVotes
    """
    create_assignment_polls()
    assert count_queries(AssignmentVote.get_elements) == 1


def create_assignment_polls():
    """
    Creates 1 assignment with 3 candidates which has 5 polls in which each candidate got a random amount of votes between 0 and 10 from 3 users
    """
    assignment = Assignment.objects.create(
        title="test_assignment_ohneivoh9caiB8Yiungo", open_posts=1
    )
    group1 = get_group_model().objects.get(pk=1)
    group2 = get_group_model().objects.get(pk=2)
    for i in range(3):
        user = get_user_model().objects.create_user(
            username=f"test_username_{i}", password="test_password_UOrnlCZMD0lmxFGwEj54"
        )
        assignment.add_candidate(user)

    for i in range(5):
        poll = AssignmentPoll.objects.create(
            assignment=assignment,
            title="test_title_UnMiGzEHmwqplmVBPNEZ",
            pollmethod=AssignmentPoll.POLLMETHOD_YN,
            type=AssignmentPoll.TYPE_NAMED,
        )
        poll.create_options()
        poll.groups.add(group1)
        poll.groups.add(group2)

        for j in range(3):
            user = get_user_model().objects.create_user(
                username=f"test_username_{i}{j}",
                password="test_password_kbzj5L8ZtVxBllZzoW6D",
            )
            for option in poll.options.all():
                weight = random.randint(0, 10)
                if weight > 0:
                    AssignmentVote.objects.create(
                        user=user, option=option, value="Y", weight=Decimal(weight)
                    )
            poll.voted.add(user)


class CreateAssignmentPoll(TestCase):
    def advancedSetUp(self):
        self.assignment = Assignment.objects.create(
            title="test_assignment_ohneivoh9caiB8Yiungo", open_posts=1
        )
        self.assignment.add_candidate(self.admin)

    def test_simple(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_ailai4toogh3eefaa2Vo",
                "pollmethod": "YNA",
                "type": "named",
                "assignment_id": self.assignment.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AssignmentPoll.objects.exists())
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_ailai4toogh3eefaa2Vo")
        self.assertEqual(poll.pollmethod, "YNA")
        self.assertEqual(poll.type, "named")
        # Check defaults
        self.assertTrue(poll.global_no)
        self.assertTrue(poll.global_abstain)
        self.assertFalse(poll.allow_multiple_votes_per_candidate)
        self.assertEqual(poll.votes_amount, 1)
        self.assertEqual(poll.assignment.id, self.assignment.id)
        self.assertTrue(poll.options.exists())
        option = AssignmentOption.objects.get()
        self.assertTrue(option.user.id, self.admin.id)

    def test_all_fields(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_ahThai4pae1pi4xoogoo",
                "pollmethod": "YN",
                "type": "pseudoanonymous",
                "assignment_id": self.assignment.id,
                "global_no": False,
                "global_abstain": False,
                "allow_multiple_votes_per_candidate": True,
                "votes_amount": 5,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AssignmentPoll.objects.exists())
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_ahThai4pae1pi4xoogoo")
        self.assertEqual(poll.pollmethod, "YN")
        self.assertEqual(poll.type, "pseudoanonymous")
        self.assertFalse(poll.global_no)
        self.assertFalse(poll.global_abstain)
        self.assertTrue(poll.allow_multiple_votes_per_candidate)
        self.assertEqual(poll.votes_amount, 5)

    def test_no_candidates(self):
        self.assignment.remove_candidate(self.admin)
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_eing5eipue5cha2Iefai",
                "pollmethod": "YNA",
                "type": "named",
                "assignment_id": self.assignment.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_missing_title(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {"pollmethod": "YNA", "type": "named", "assignment_id": self.assignment.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_missing_pollmethod(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_OoCh9aitaeyaeth8nom1",
                "type": "named",
                "assignment_id": self.assignment.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_missing_type(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Ail9Eizohshim0fora6o",
                "pollmethod": "YNA",
                "assignment_id": self.assignment.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_missing_assignment_id(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_eic7ooxaht5mee3quohK",
                "pollmethod": "YNA",
                "type": "named",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_with_groups(self):
        group1 = get_group_model().objects.get(pk=1)
        group2 = get_group_model().objects.get(pk=2)
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": "YNA",
                "type": "named",
                "assignment_id": self.assignment.id,
                "groups_id": [1, 2],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertTrue(group1 in poll.groups.all())
        self.assertTrue(group2 in poll.groups.all())

    def test_with_empty_groups(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": "YNA",
                "type": "named",
                "assignment_id": self.assignment.id,
                "groups_id": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertFalse(poll.groups.exists())

    def test_not_supported_type(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_yaiyeighoh0Iraet3Ahc",
                "pollmethod": "YNA",
                "type": "not_existing",
                "assignment_id": self.assignment.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_not_supported_pollmethod(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_SeVaiteYeiNgie5Xoov8",
                "pollmethod": "not_existing",
                "type": "named",
                "assignment_id": self.assignment.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())


class UpdateAssignmentPoll(TestCase):
    """
    Tests updating polls of assignments.
    """

    def advancedSetUp(self):
        self.assignment = Assignment.objects.create(
            title="test_assignment_ohneivoh9caiB8Yiungo", open_posts=1
        )
        self.assignment.add_candidate(self.admin)
        self.group = get_group_model().objects.get(pk=1)
        self.poll = AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_beeFaihuNae1vej2ai8m",
            pollmethod="votes",
            type=BasePoll.TYPE_NAMED,
        )
        self.poll.create_options()
        self.poll.groups.add(self.group)

    def test_patch_title(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"title": "test_title_Aishohh1ohd0aiSut7gi"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_Aishohh1ohd0aiSut7gi")

    def test_prevent_patching_assignment(self):
        assignment = Assignment(title="test_title_phohdah8quukooHeetuz", open_posts=1)
        assignment.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"assignment_id": assignment.id},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.assignment.id, self.assignment.id)  # unchanged

    def test_patch_pollmethod(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]), {"pollmethod": "YNA"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.pollmethod, "YNA")

    def test_patch_invalid_pollmethod(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"pollmethod": "invalid"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.pollmethod, "votes")

    def test_patch_type(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]), {"type": "analog"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.type, "analog")

    def test_patch_invalid_type(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]), {"type": "invalid"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.type, "named")

    def test_patch_groups_to_empty(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"groups_id": []},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertFalse(poll.groups.exists())

    def test_patch_groups(self):
        group2 = get_group_model().objects.get(pk=2)
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"groups_id": [group2.id]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.groups.count(), 1)
        self.assertEqual(poll.groups.get(), group2)

    def test_patch_wrong_state(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"title": "test_title_Oophah8EaLaequu3toh8"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_beeFaihuNae1vej2ai8m")

    def test_patch_multiple_fields(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {
                "title": "test_title_ees6Tho8ahheen4cieja",
                "pollmethod": "votes",
                "global_no": True,
                "global_abstain": False,
                "allow_multiple_votes_per_candidate": True,
                "votes_amount": 42,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_ees6Tho8ahheen4cieja")
        self.assertEqual(poll.pollmethod, "votes")
        self.assertTrue(poll.global_no)
        self.assertFalse(poll.global_abstain)
        self.assertTrue(poll.allow_multiple_votes_per_candidate)
        self.assertEqual(poll.votes_amount, 42)


class VoteAssignmentPollAnalogYNA(TestCase):
    def advancedSetUp(self):
        self.assignment = Assignment.objects.create(
            title="test_assignment_ohneivoh9caiB8Yiungo", open_posts=1
        )
        self.assignment.add_candidate(self.admin)
        self.poll = AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_beeFaihuNae1vej2ai8m",
            pollmethod="YNA",
            type=BasePoll.TYPE_ANALOG,
        )
        self.poll.create_options()

    def start_poll(self):
        self.poll.state = AssignmentPoll.STATE_STARTED
        self.poll.save()

    def add_second_candidate(self):
        user, _ = self.create_user()
        AssignmentOption.objects.create(user=user, poll=self.poll)

    def test_start_poll(self):
        response = self.client.post(
            reverse("assignmentpoll-start", args=[self.poll.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, None)
        self.assertEqual(poll.votesinvalid, None)
        self.assertEqual(poll.votescast, None)
        self.assertFalse(poll.get_votes().exists())

    def test_vote(self):
        self.add_second_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {
                "options": {
                    "1": {"Y": "1", "N": "2.35", "A": "-1"},
                    "2": {"Y": "30", "N": "-2", "A": "8.93"},
                },
                "votesvalid": "4.64",
                "votesinvalid": "-2",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(AssignmentVote.objects.count(), 6)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("4.64"))
        self.assertEqual(poll.votesinvalid, Decimal("-2"))
        self.assertEqual(poll.votescast, None)
        self.assertEqual(poll.state, AssignmentPoll.STATE_FINISHED)
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("2.35"))
        self.assertEqual(option1.abstain, Decimal("-1"))
        self.assertEqual(option2.yes, Decimal("30"))
        self.assertEqual(option2.no, Decimal("-2"))
        self.assertEqual(option2.abstain, Decimal("8.93"))

    def test_too_many_options(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {
                "options": {
                    "1": {"Y": "1", "N": "2.35", "A": "-1"},
                    "2": {"Y": "1", "N": "2.35", "A": "-1"},
                }
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_too_few_options(self):
        self.add_second_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": {"1": {"Y": "1", "N": "2.35", "A": "-1"}}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_options(self):
        user, _ = self.create_user()
        self.assignment.add_candidate(user)
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {
                "options": {
                    "1": {"Y": "1", "N": "2.35", "A": "-1"},
                    "2": {"Y": "1", "N": "2.35", "A": "-1"},
                }
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_no_permissions(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_state(self):
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_data(self):
        self.start_poll()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_data_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            [1, 2, 5],
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_option_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": [1, "string"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_option_id_type(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": {"string": "some_other_string"}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_vote_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": {"1": [None]}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_vote_value(self):
        self.start_poll()
        for value in "YNA":
            data = {"options": {"1": {"Y": "1", "N": "3", "A": "-1"}}}
            del data["options"]["1"][value]
            response = self.client.post(
                reverse("assignmentpoll-vote", args=[self.poll.pk]), data, format="json"
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(AssignmentVote.objects.exists())
