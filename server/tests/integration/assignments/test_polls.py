import random
from decimal import Decimal
from typing import Any

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.assignments.models import (
    Assignment,
    AssignmentOption,
    AssignmentPoll,
    AssignmentVote,
)
from openslides.core.config import config
from openslides.poll.models import BasePoll
from openslides.utils.auth import get_group_model
from openslides.utils.autoupdate import inform_changed_data
from tests.common_groups import GROUP_ADMIN_PK, GROUP_DELEGATE_PK
from tests.count_queries import count_queries
from tests.test_case import TestCase


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
    assert count_queries(AssignmentPoll.get_elements)() == 6


@pytest.mark.django_db(transaction=False)
def test_assignment_vote_db_queries():
    """
    Tests that only 1 query is done when fetching AssignmentVotes
    """
    create_assignment_polls()
    assert count_queries(AssignmentVote.get_elements)() == 1


@pytest.mark.django_db(transaction=False)
def test_assignment_option_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the options,
    * 1 request to get all votes for all options,
    = 2 queries
    """
    create_assignment_polls()
    assert count_queries(AssignmentOption.get_elements)() == 2


def create_assignment_polls():
    """
    Creates 1 assignment with 3 candidates which has 5 polls in which each candidate got a random amount of votes between 0 and 10 from 3 users
    """
    assignment = Assignment(title="test_assignment_ohneivoh9caiB8Yiungo", open_posts=1)
    assignment.save(skip_autoupdate=True)

    group1 = get_group_model().objects.get(pk=1)
    group2 = get_group_model().objects.get(pk=2)
    for i in range(3):
        user = get_user_model().objects.create_user(
            username=f"test_username_{i}", password="test_password_UOrnlCZMD0lmxFGwEj54"
        )
        assignment.add_candidate(user)

    for i in range(5):
        poll = AssignmentPoll(
            assignment=assignment,
            title="test_title_UnMiGzEHmwqplmVBPNEZ",
            pollmethod=AssignmentPoll.POLLMETHOD_YN,
            type=AssignmentPoll.TYPE_NAMED,
        )
        poll.save(skip_autoupdate=True)
        poll.create_options(skip_autoupdate=True)
        poll.groups.add(group1)
        poll.groups.add(group2)

        for j in range(3):
            user = get_user_model().objects.create_user(
                username=f"test_username_{i}{j}",
                password="test_password_kbzj5L8ZtVxBllZzoW6D",
            )
            poll.voted.add(user)
            for option in poll.options.all():
                weight = random.randint(0, 10)
                if weight > 0:
                    AssignmentVote.objects.create(
                        user=user, option=option, value="Y", weight=Decimal(weight)
                    )


class CreateAssignmentPoll(TestCase):
    def advancedSetUp(self):
        self.assignment = Assignment.objects.create(
            title="test_assignment_ohneivoh9caiB8Yiungo", open_posts=1
        )
        self.assignment.add_candidate(self.admin)

    def test_simple(self):
        with self.assertNumQueries(40):
            response = self.client.post(
                reverse("assignmentpoll-list"),
                {
                    "title": "test_title_ailai4toogh3eefaa2Vo",
                    "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                    "type": "named",
                    "assignment_id": self.assignment.id,
                    "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                    "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                },
            )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        self.assertTrue(AssignmentPoll.objects.exists())
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_ailai4toogh3eefaa2Vo")
        self.assertEqual(poll.pollmethod, AssignmentPoll.POLLMETHOD_YNA)
        self.assertEqual(poll.type, "named")
        # Check defaults
        self.assertTrue(poll.global_no)
        self.assertTrue(poll.global_abstain)
        self.assertEqual(poll.amount_global_no, None)
        self.assertEqual(poll.amount_global_abstain, None)
        self.assertFalse(poll.allow_multiple_votes_per_candidate)
        self.assertEqual(poll.votes_amount, 1)
        self.assertEqual(poll.assignment.id, self.assignment.id)
        self.assertEqual(poll.description, "")
        self.assertTrue(poll.options.exists())
        option = AssignmentOption.objects.get()
        self.assertTrue(option.user.id, self.admin.id)

    def test_all_fields(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_ahThai4pae1pi4xoogoo",
                "pollmethod": AssignmentPoll.POLLMETHOD_YN,
                "type": "pseudoanonymous",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA,
                "majority_method": AssignmentPoll.MAJORITY_THREE_QUARTERS,
                "global_no": False,
                "global_abstain": False,
                "allow_multiple_votes_per_candidate": True,
                "votes_amount": 5,
                "description": "test_description_ieM8ThuasoSh8aecai8p",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        self.assertTrue(AssignmentPoll.objects.exists())
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_ahThai4pae1pi4xoogoo")
        self.assertEqual(poll.pollmethod, AssignmentPoll.POLLMETHOD_YN)
        self.assertEqual(poll.type, "pseudoanonymous")
        self.assertFalse(poll.global_no)
        self.assertFalse(poll.global_abstain)
        self.assertTrue(poll.allow_multiple_votes_per_candidate)
        self.assertEqual(poll.votes_amount, 5)
        self.assertEqual(poll.description, "test_description_ieM8ThuasoSh8aecai8p")

    def test_no_candidates(self):
        self.assignment.remove_candidate(self.admin)
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_eing5eipue5cha2Iefai",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_missing_keys(self):
        complete_request_data = {
            "title": "test_title_keugh8Iu9ciyooGaevoh",
            "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
            "type": "named",
            "assignment_id": self.assignment.id,
            "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
            "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
        }
        for key in complete_request_data.keys():
            request_data = {
                _key: value
                for _key, value in complete_request_data.items()
                if _key != key
            }
            response = self.client.post(reverse("assignmentpoll-list"), request_data)
            self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(AssignmentPoll.objects.exists())

    def test_with_groups(self):
        group1 = get_group_model().objects.get(pk=1)
        group2 = get_group_model().objects.get(pk=2)
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                "groups_id": [1, 2],
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertTrue(group1 in poll.groups.all())
        self.assertTrue(group2 in poll.groups.all())

    def test_with_empty_groups(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                "groups_id": [],
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertFalse(poll.groups.exists())

    def test_not_supported_type(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_yaiyeighoh0Iraet3Ahc",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": "not_existing",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_not_allowed_type(self):
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", False)
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_yaiyeighoh0Iraet3Ahc",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": AssignmentPoll.TYPE_NAMED,
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", True)

    def test_not_supported_pollmethod(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_SeVaiteYeiNgie5Xoov8",
                "pollmethod": "not_existing",
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_not_supported_onehundred_percent_base(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": "invalid base",
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_not_supported_majority_method(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YN,
                "majority_method": "invalid majority method",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())

    def test_wrong_pollmethod_onehundred_percent_base_combination_1(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_VOTES,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, AssignmentPoll.PERCENT_BASE_YNA)

    def test_wrong_pollmethod_onehundred_percent_base_combination_2(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": AssignmentPoll.POLLMETHOD_YN,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_VOTES,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, AssignmentPoll.PERCENT_BASE_YN)

    def test_wrong_pollmethod_onehundred_percent_base_combination_3(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": AssignmentPoll.POLLMETHOD_VOTES,
                "type": "named",
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(
            poll.onehundred_percent_base, AssignmentPoll.PERCENT_BASE_VOTES
        )

    def test_create_with_votes(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_dKbv5tV47IzY1oGHXdSz",
                "pollmethod": AssignmentPoll.POLLMETHOD_VOTES,
                "type": AssignmentPoll.TYPE_ANALOG,
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                "votes": {
                    "options": {"1": {"Y": 1}},
                    "votesvalid": "-2",
                    "votesinvalid": "-2",
                    "votescast": "-2",
                },
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_FINISHED)
        self.assertTrue(AssignmentVote.objects.exists())

    def test_create_with_votes2(self):
        user, _ = self.create_user()
        self.assignment.add_candidate(user)
        self.assignment.remove_candidate(self.admin)
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_dKbv5tV47IzY1oGHXdSz",
                "pollmethod": AssignmentPoll.POLLMETHOD_VOTES,
                "type": AssignmentPoll.TYPE_ANALOG,
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                "votes": {
                    "options": {"2": {"Y": 1}},
                    "votesvalid": "-2",
                    "votesinvalid": "-2",
                    "votescast": "-2",
                },
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_FINISHED)
        self.assertTrue(AssignmentVote.objects.exists())

    def test_create_with_votes_publish_immediately(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_dKbv5tV47IzY1oGHXdSz",
                "pollmethod": AssignmentPoll.POLLMETHOD_VOTES,
                "type": AssignmentPoll.TYPE_ANALOG,
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                "votes": {
                    "options": {"1": {"Y": 1}},
                    "votesvalid": "-2",
                    "votesinvalid": "-2",
                    "votescast": "-2",
                },
                "publish_immediately": "1",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_PUBLISHED)
        self.assertTrue(AssignmentVote.objects.exists())

    def test_create_with_invalid_votes(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_dKbv5tV47IzY1oGHXdSz",
                "pollmethod": AssignmentPoll.POLLMETHOD_VOTES,
                "type": AssignmentPoll.TYPE_ANALOG,
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                "votes": {
                    "options": {"1": {"Y": 1}},
                    "votesvalid": "-2",
                    "votesinvalid": "-2",
                },
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())
        self.assertFalse(AssignmentVote.objects.exists())

    def test_create_with_votes_wrong_type(self):
        response = self.client.post(
            reverse("assignmentpoll-list"),
            {
                "title": "test_title_dKbv5tV47IzY1oGHXdSz",
                "pollmethod": AssignmentPoll.POLLMETHOD_VOTES,
                "type": AssignmentPoll.TYPE_NAMED,
                "assignment_id": self.assignment.id,
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA,
                "majority_method": AssignmentPoll.MAJORITY_SIMPLE,
                "votes": {
                    "options": {"1": {"Y": 1}},
                    "votesvalid": "-2",
                    "votesinvalid": "-2",
                    "votescast": "-2",
                },
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.exists())
        self.assertFalse(AssignmentVote.objects.exists())


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
            pollmethod=AssignmentPoll.POLLMETHOD_VOTES,
            type=BasePoll.TYPE_NAMED,
            onehundred_percent_base=AssignmentPoll.PERCENT_BASE_VOTES,
            majority_method=AssignmentPoll.MAJORITY_SIMPLE,
        )
        self.poll.create_options()
        self.poll.groups.add(self.group)

    def test_patch_title(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"title": "test_title_Aishohh1ohd0aiSut7gi"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_Aishohh1ohd0aiSut7gi")

    def test_prevent_patching_assignment(self):
        assignment = Assignment(title="test_title_phohdah8quukooHeetuz", open_posts=1)
        assignment.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"assignment_id": assignment.id},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.assignment.id, self.assignment.id)  # unchanged

    def test_patch_pollmethod(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"pollmethod": AssignmentPoll.POLLMETHOD_YNA},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.pollmethod, AssignmentPoll.POLLMETHOD_YNA)
        self.assertEqual(poll.onehundred_percent_base, AssignmentPoll.PERCENT_BASE_YNA)

    def test_patch_invalid_pollmethod(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"pollmethod": "invalid"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.pollmethod, AssignmentPoll.POLLMETHOD_VOTES)

    def test_patch_type(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]), {"type": "analog"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.type, "analog")

    def test_patch_invalid_type(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]), {"type": "invalid"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.type, "named")

    def test_patch_not_allowed_type(self):
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", False)
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"type": BasePoll.TYPE_NAMED},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.type, BasePoll.TYPE_NAMED)
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", True)

    def test_patch_groups_to_empty(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]), {"groups_id": []}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertFalse(poll.groups.exists())

    def test_patch_groups(self):
        group2 = get_group_model().objects.get(pk=2)
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"groups_id": [group2.id]},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.groups.count(), 1)
        self.assertEqual(poll.groups.get(), group2)

    def test_patch_title_started(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"title": "test_title_Oophah8EaLaequu3toh8"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_Oophah8EaLaequu3toh8")

    def test_patch_wrong_state(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"type": BasePoll.TYPE_NAMED},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.type, BasePoll.TYPE_NAMED)

    def test_patch_100_percent_base(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": "cast"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, "cast")

    def test_patch_wrong_100_percent_base(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": "invalid"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(
            poll.onehundred_percent_base, AssignmentPoll.PERCENT_BASE_VOTES
        )

    def test_patch_majority_method(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"majority_method": AssignmentPoll.MAJORITY_TWO_THIRDS},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.majority_method, AssignmentPoll.MAJORITY_TWO_THIRDS)

    def test_patch_wrong_majority_method(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"majority_method": "invalid majority method"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.majority_method, AssignmentPoll.MAJORITY_SIMPLE)

    def test_patch_multiple_fields(self):
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {
                "title": "test_title_ees6Tho8ahheen4cieja",
                "pollmethod": AssignmentPoll.POLLMETHOD_VOTES,
                "global_no": True,
                "global_abstain": False,
                "allow_multiple_votes_per_candidate": True,
                "votes_amount": 42,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.title, "test_title_ees6Tho8ahheen4cieja")
        self.assertEqual(poll.pollmethod, AssignmentPoll.POLLMETHOD_VOTES)
        self.assertTrue(poll.global_no)
        self.assertFalse(poll.global_abstain)
        self.assertEqual(poll.amount_global_no, Decimal("0"))
        self.assertEqual(poll.amount_global_abstain, None)
        self.assertTrue(poll.allow_multiple_votes_per_candidate)
        self.assertEqual(poll.votes_amount, 42)

    def test_patch_majority_method_state_not_created(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"majority_method": "two_thirds"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.majority_method, "two_thirds")

    def test_patch_100_percent_base_state_not_created(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": "cast"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, "cast")

    def test_patch_wrong_100_percent_base_state_not_created(self):
        self.poll.state = 2
        self.poll.pollmethod = AssignmentPoll.POLLMETHOD_YN
        self.poll.save()
        response = self.client.patch(
            reverse("assignmentpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": AssignmentPoll.PERCENT_BASE_YNA},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, "YN")


class VoteAssignmentPollBaseTestClass(TestCase):
    def advancedSetUp(self):
        self.assignment = Assignment.objects.create(
            title="test_assignment_tcLT59bmXrXif424Qw7K", open_posts=1
        )
        self.assignment.add_candidate(self.admin)
        self.poll = self.create_poll()
        self.admin.is_present = True
        self.admin.save()
        self.poll.groups.add(GROUP_ADMIN_PK)
        self.poll.create_options()
        inform_changed_data(self.poll)

    def create_poll(self):
        # has to be implemented by subclasses
        raise NotImplementedError()

    def start_poll(self):
        self.poll.state = AssignmentPoll.STATE_STARTED
        self.poll.save()

    def add_candidate(self):
        user, _ = self.create_user()
        AssignmentOption.objects.create(user=user, poll=self.poll)


class VoteAssignmentPollAnalogYNA(VoteAssignmentPollBaseTestClass):
    def create_poll(self):
        return AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_04k0y4TwPLpJKaSvIGm1",
            pollmethod=AssignmentPoll.POLLMETHOD_YNA,
            type=BasePoll.TYPE_ANALOG,
        )

    def test_start_poll(self):
        response = self.client.post(
            reverse("assignmentpoll-start", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, None)
        self.assertEqual(poll.votesinvalid, None)
        self.assertEqual(poll.votescast, None)
        self.assertFalse(poll.get_votes().exists())

    def test_stop_poll(self):
        self.start_poll()
        response = self.client.post(reverse("assignmentpoll-stop", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.poll.state, AssignmentPoll.STATE_STARTED)

    def test_vote(self):
        self.add_candidate()
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
                "votescast": "-2",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(AssignmentVote.objects.count(), 6)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("4.64"))
        self.assertEqual(poll.votesinvalid, Decimal("-2"))
        self.assertEqual(poll.votescast, Decimal("-2"))
        self.assertEqual(poll.state, AssignmentPoll.STATE_FINISHED)
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("2.35"))
        self.assertEqual(option1.abstain, Decimal("-1"))
        self.assertEqual(option2.yes, Decimal("30"))
        self.assertEqual(option2.no, Decimal("-2"))
        self.assertEqual(option2.abstain, Decimal("8.93"))

    def test_vote_fractional_negative_values(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {
                "options": {"1": {"Y": "1", "N": "1", "A": "1"}},
                "votesvalid": "-1.5",
                "votesinvalid": "-2",
                "votescast": "-2",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

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
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_too_few_options(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": {"1": {"Y": "1", "N": "2.35", "A": "-1"}}},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_options(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {
                "options": {
                    "1": {"Y": "1", "N": "2.35", "A": "-1"},
                    "3": {"Y": "1", "N": "2.35", "A": "-1"},
                }
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_no_permissions(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_state(self):
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_data(self):
        self.start_poll()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_data_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), [1, 2, 5]
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_option_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": [1, "string"]},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_option_id_type(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": {"string": "some_other_string"}},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_vote_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"options": {"1": [None]}},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_vote_value(self):
        self.start_poll()
        for value in "YNA":
            data = {"options": {"1": {"Y": "1", "N": "3", "A": "-1"}}}
            del data["options"]["1"][value]
            response = self.client.post(
                reverse("assignmentpoll-vote", args=[self.poll.pk]), data
            )
            self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(AssignmentVote.objects.exists())

    def test_vote_state_finished(self):
        self.start_poll()
        self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {
                "options": {"1": {"Y": 5, "N": 0, "A": 1}},
                "votesvalid": "-2",
                "votesinvalid": "1",
                "votescast": "-1",
            },
        )
        self.poll.state = 3
        self.poll.save()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {
                "options": {"1": {"Y": 2, "N": 2, "A": 2}},
                "votesvalid": "4.64",
                "votesinvalid": "-2",
                "votescast": "3",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("4.64"))
        self.assertEqual(poll.votesinvalid, Decimal("-2"))
        self.assertEqual(poll.votescast, Decimal("3"))
        self.assertEqual(poll.get_votes().count(), 3)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("2"))
        self.assertEqual(option.no, Decimal("2"))
        self.assertEqual(option.abstain, Decimal("2"))


class VoteAssignmentPollNamedYNA(VoteAssignmentPollBaseTestClass):
    def create_poll(self):
        return AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_OkHAIvOSIcpFnCxbaL6v",
            pollmethod=AssignmentPoll.POLLMETHOD_YNA,
            type=BasePoll.TYPE_NAMED,
        )

    def test_start_poll(self):
        response = self.client.post(
            reverse("assignmentpoll-start", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, Decimal("0"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("0"))
        self.assertFalse(poll.get_votes().exists())

    def test_vote(self):
        self.add_candidate()
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y", "2": "N", "3": "A"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(AssignmentVote.objects.count(), 3)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("1"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.amount_users_voted_with_individual_weight(), Decimal("1"))
        self.assertTrue(self.admin in poll.voted.all())
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        option3 = poll.options.get(pk=3)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, Decimal("1"))
        self.assertEqual(option2.abstain, Decimal("0"))
        self.assertEqual(option3.yes, Decimal("0"))
        self.assertEqual(option3.no, Decimal("0"))
        self.assertEqual(option3.abstain, Decimal("1"))

    def test_vote_with_voteweight(self):
        config["users_activate_vote_weight"] = True
        self.admin.vote_weight = weight = Decimal("4.2")
        self.admin.save()
        self.add_candidate()
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y", "2": "N", "3": "A"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(AssignmentVote.objects.count(), 3)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, weight)
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.amount_users_voted_with_individual_weight(), weight)
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        option3 = poll.options.get(pk=3)
        self.assertEqual(option1.yes, weight)
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, weight)
        self.assertEqual(option2.abstain, Decimal("0"))
        self.assertEqual(option3.yes, Decimal("0"))
        self.assertEqual(option3.no, Decimal("0"))
        self.assertEqual(option3.abstain, weight)

    def test_vote_without_voteweight(self):
        self.admin.vote_weight = Decimal("4.2")
        self.admin.save()
        self.test_vote()

    def test_change_vote(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "N"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(AssignmentVote.objects.count(), 1)
        vote = AssignmentVote.objects.get()
        self.assertEqual(vote.value, "Y")

    def test_option_from_wrong_poll(self):
        self.poll2 = self.create_poll()
        self.poll2.create_options()
        inform_changed_data(self.poll2)
        # start both polls
        self.poll.state = AssignmentPoll.STATE_STARTED
        self.poll.save()
        self.poll2.state = AssignmentPoll.STATE_STARTED
        self.poll2.save()
        option2 = self.poll2.options.get()
        # Do request to poll with option2 (which is wrong...)
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {str(option2.id): "Y"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(AssignmentVote.objects.count(), 0)
        option = self.poll.options.get()
        option2 = self.poll2.options.get()
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("0"))
        self.assertEqual(option.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, Decimal("0"))
        self.assertEqual(option2.abstain, Decimal("0"))

    def test_too_many_options(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y", "2": "N"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_partial_vote(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertTrue(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_options(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y", "3": "N"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_no_permissions(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_anonymous(self):
        self.start_poll()
        gclient = self.create_guest_client()
        response = gclient.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_vote_not_present(self):
        self.start_poll()
        self.admin.is_present = False
        self.admin.save()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_state(self):
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_data(self):
        self.start_poll()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(
            response, status.HTTP_200_OK
        )  # new "feature" because of partial requests: empty requests work!
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_data_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            [1, 2, 5],
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_option_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "string"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_option_id_type(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"id": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_vote_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": [None]},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())


class VoteAssignmentPollNamedVotes(VoteAssignmentPollBaseTestClass):
    def create_poll(self):
        return AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_Zrvh146QAdq7t6iSDwZk",
            pollmethod=AssignmentPoll.POLLMETHOD_VOTES,
            type=BasePoll.TYPE_NAMED,
        )

    def setup_for_multiple_votes(self):
        self.poll.allow_multiple_votes_per_candidate = True
        self.poll.votes_amount = 3
        self.poll.save()
        self.add_candidate()

    def test_start_poll(self):
        response = self.client.post(
            reverse("assignmentpoll-start", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, Decimal("0"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("0"))
        self.assertFalse(poll.get_votes().exists())

    def test_vote(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 1, "2": 0},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(AssignmentVote.objects.count(), 1)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("1"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertTrue(self.admin in poll.voted.all())
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, Decimal("0"))
        self.assertEqual(option2.abstain, Decimal("0"))

    def test_change_vote(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 1, "2": 0},
            format="json",
        )
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 0, "2": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, Decimal("0"))
        self.assertEqual(option2.abstain, Decimal("0"))

    def test_global_no(self):
        self.poll.votes_amount = 2
        self.poll.save()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), "N"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        option = poll.options.get(pk=1)
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("1"))
        self.assertEqual(option.abstain, Decimal("0"))
        self.assertEqual(poll.amount_global_no, Decimal("1"))
        self.assertEqual(poll.amount_global_abstain, Decimal("0"))

    def test_global_no_forbidden(self):
        self.poll.global_no = False
        self.poll.save()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), "N"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())
        self.assertEqual(AssignmentPoll.objects.get().amount_global_no, None)

    def test_global_abstain(self):
        self.poll.votes_amount = 2
        self.poll.save()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), "A"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        option = poll.options.get(pk=1)
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("0"))
        self.assertEqual(option.abstain, Decimal("1"))
        self.assertEqual(poll.amount_global_no, Decimal("0"))
        self.assertEqual(poll.amount_global_abstain, Decimal("1"))

    def test_global_abstain_forbidden(self):
        self.poll.global_abstain = False
        self.poll.save()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), "A"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())
        self.assertEqual(AssignmentPoll.objects.get().amount_global_abstain, None)

    def test_negative_vote(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": -1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_multiple_votes(self):
        self.setup_for_multiple_votes()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 2, "2": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("2"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("1"))
        self.assertEqual(option2.no, Decimal("0"))
        self.assertEqual(option2.abstain, Decimal("0"))

    def test_multiple_votes_wrong_amount(self):
        self.setup_for_multiple_votes()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 2, "2": 2},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_too_many_options(self):
        self.setup_for_multiple_votes()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 1, "2": 1, "3": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_options(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"2": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_no_permissions(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_anonymous(self):
        self.start_poll()
        gclient = self.create_guest_client()
        response = gclient.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_vote_not_present(self):
        self.start_poll()
        self.admin.is_present = False
        self.admin.save()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_state(self):
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_data(self):
        self.start_poll()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_data_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            [1, 2, 5],
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_option_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "string"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_option_id_type(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"id": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_vote_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": [None]},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())


class VoteAssignmentPollPseudoanonymousYNA(VoteAssignmentPollBaseTestClass):
    def create_poll(self):
        return AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_OkHAIvOSIcpFnCxbaL6v",
            pollmethod=AssignmentPoll.POLLMETHOD_YNA,
            type=BasePoll.TYPE_PSEUDOANONYMOUS,
        )

    def test_start_poll(self):
        response = self.client.post(
            reverse("assignmentpoll-start", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, Decimal("0"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("0"))
        self.assertFalse(poll.get_votes().exists())

    def test_vote(self):
        self.add_candidate()
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y", "2": "N", "3": "A"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(AssignmentVote.objects.count(), 3)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("1"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        option3 = poll.options.get(pk=3)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, Decimal("1"))
        self.assertEqual(option2.abstain, Decimal("0"))
        self.assertEqual(option3.yes, Decimal("0"))
        self.assertEqual(option3.no, Decimal("0"))
        self.assertEqual(option3.abstain, Decimal("1"))

    def test_change_vote(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "N"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        option1 = poll.options.get(pk=1)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))

    def test_too_many_options(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y", "2": "N"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_partial_vote(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertTrue(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_options(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y", "3": "N"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_no_permissions(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_anonymous(self):
        self.start_poll()
        gclient = self.create_guest_client()
        response = gclient.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_vote_not_present(self):
        self.start_poll()
        self.admin.is_present = False
        self.admin.save()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_state(self):
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_data(self):
        self.start_poll()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_data_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            [1, 2, 5],
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_option_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "string"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_option_id_type(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"id": "Y"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_vote_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": [None]},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())


class VoteAssignmentPollPseudoanonymousVotes(VoteAssignmentPollBaseTestClass):
    def create_poll(self):
        return AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_Zrvh146QAdq7t6iSDwZk",
            pollmethod=AssignmentPoll.POLLMETHOD_VOTES,
            type=BasePoll.TYPE_PSEUDOANONYMOUS,
        )

    def setup_for_multiple_votes(self):
        self.poll.allow_multiple_votes_per_candidate = True
        self.poll.votes_amount = 3
        self.poll.save()
        self.add_candidate()

    def test_start_poll(self):
        response = self.client.post(
            reverse("assignmentpoll-start", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, Decimal("0"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("0"))
        self.assertFalse(poll.get_votes().exists())

    def test_vote(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 1, "2": 0},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(AssignmentVote.objects.count(), 1)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("1"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.state, AssignmentPoll.STATE_STARTED)
        self.assertTrue(self.admin in poll.voted.all())
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, Decimal("0"))
        self.assertEqual(option2.abstain, Decimal("0"))
        for vote in poll.get_votes():
            self.assertIsNone(vote.user)

    def test_change_vote(self):
        self.add_candidate()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 1, "2": 0},
            format="json",
        )
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 0, "2": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("1"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("0"))
        self.assertEqual(option2.no, Decimal("0"))
        self.assertEqual(option2.abstain, Decimal("0"))

    def test_negative_vote(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": -1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_multiple_votes(self):
        self.setup_for_multiple_votes()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 2, "2": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        option1 = poll.options.get(pk=1)
        option2 = poll.options.get(pk=2)
        self.assertEqual(option1.yes, Decimal("2"))
        self.assertEqual(option1.no, Decimal("0"))
        self.assertEqual(option1.abstain, Decimal("0"))
        self.assertEqual(option2.yes, Decimal("1"))
        self.assertEqual(option2.no, Decimal("0"))
        self.assertEqual(option2.abstain, Decimal("0"))
        for vote in poll.get_votes():
            self.assertIsNone(vote.user)

    def test_multiple_votes_wrong_amount(self):
        self.setup_for_multiple_votes()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 2, "2": 2},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_too_many_options(self):
        self.setup_for_multiple_votes()
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": 1, "2": 1, "3": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_options(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"2": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_no_permissions(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_anonymous(self):
        self.start_poll()
        gclient = self.create_guest_client()
        response = gclient.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_vote_not_present(self):
        self.start_poll()
        self.admin.is_present = False
        self.admin.save()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_state(self):
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": 1}, format="json"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_missing_data(self):
        self.start_poll()
        response = self.client.post(reverse("assignmentpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_data_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            [1, 2, 5],
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_option_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": "string"},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentPoll.objects.get().get_votes().exists())

    def test_wrong_option_id_type(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"id": 1},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())

    def test_wrong_vote_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]),
            {"1": [None]},
            format="json",
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AssignmentVote.objects.exists())


# test autoupdates
class VoteAssignmentPollAutoupdatesBaseClass(TestCase):
    poll_type = ""  # set by subclass, defines which poll type we use

    """
    3 important users:
    self.admin: manager, has can_see, can_manage, can_manage_polls (in admin group)
    self.user: votes, has can_see perms and in in delegate group
    self.other_user: Just has can_see perms and is NOT in the delegate group.
    """

    def advancedSetUp(self):
        self.delegate_group = get_group_model().objects.get(pk=GROUP_DELEGATE_PK)
        self.other_user, _ = self.create_user()
        inform_changed_data(self.other_user)

        self.user, user_password = self.create_user()
        self.user.groups.add(self.delegate_group)
        self.user.is_present = True
        self.user.save()
        self.user_client = APIClient()
        self.user_client.login(username=self.user.username, password=user_password)

        self.assignment = Assignment.objects.create(
            title="test_assignment_" + self._get_random_string(), open_posts=1
        )
        self.assignment.add_candidate(self.admin)
        self.description = "test_description_paiquei5ahpie1wu8ohW"
        self.poll = AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_" + self._get_random_string(),
            pollmethod=AssignmentPoll.POLLMETHOD_YNA,
            type=self.poll_type,
            state=AssignmentPoll.STATE_STARTED,
            onehundred_percent_base=AssignmentPoll.PERCENT_BASE_CAST,
            majority_method=AssignmentPoll.MAJORITY_TWO_THIRDS,
            description=self.description,
        )
        self.poll.create_options()
        self.poll.groups.add(self.delegate_group)


class VoteAssignmentPollNamedAutoupdates(VoteAssignmentPollAutoupdatesBaseClass):
    poll_type = AssignmentPoll.TYPE_NAMED

    def test_vote(self):
        response = self.user_client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": "A"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        vote = AssignmentVote.objects.get()

        # Expect the admin to see the full data in the autoupdate
        autoupdate = self.get_last_autoupdate(user=self.admin)
        self.assertEqual(
            autoupdate[0],
            {
                "assignments/assignment-poll:1": {
                    "allow_multiple_votes_per_candidate": False,
                    "assignment_id": 1,
                    "global_abstain": True,
                    "global_no": True,
                    "amount_global_abstain": None,
                    "amount_global_no": None,
                    "groups_id": [GROUP_DELEGATE_PK],
                    "id": 1,
                    "options_id": [1],
                    "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                    "state": AssignmentPoll.STATE_STARTED,
                    "title": self.poll.title,
                    "description": self.description,
                    "type": AssignmentPoll.TYPE_NAMED,
                    "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_CAST,
                    "majority_method": AssignmentPoll.MAJORITY_TWO_THIRDS,
                    "votes_amount": 1,
                    "votescast": "1.000000",
                    "votesinvalid": "0.000000",
                    "votesvalid": "1.000000",
                    "user_has_voted": False,
                    "voted_id": [self.user.id],
                },
                "assignments/assignment-option:1": {
                    "abstain": "1.000000",
                    "id": 1,
                    "no": "0.000000",
                    "poll_id": 1,
                    "pollstate": AssignmentPoll.STATE_STARTED,
                    "yes": "0.000000",
                    "user_id": 1,
                    "weight": 1,
                },
                "assignments/assignment-vote:1": {
                    "id": 1,
                    "option_id": 1,
                    "pollstate": AssignmentPoll.STATE_STARTED,
                    "user_id": self.user.id,
                    "value": "A",
                    "weight": "1.000000",
                },
            },
        )
        self.assertEqual(autoupdate[1], [])

        # Expect user to receive his vote
        autoupdate = self.get_last_autoupdate(user=self.user)
        self.assertEqual(
            autoupdate[0]["assignments/assignment-vote:1"],
            {
                "id": 1,
                "option_id": 1,
                "pollstate": AssignmentPoll.STATE_STARTED,
                "user_id": self.user.id,
                "value": "A",
                "weight": "1.000000",
            },
        )
        self.assertEqual(autoupdate[1], [])

        # Expect non-admins to get a restricted poll update
        for user in (self.user, self.other_user):
            self.assertAutoupdate(poll, user=user)
            autoupdate = self.get_last_autoupdate(user=user)
            self.assertEqual(
                autoupdate[0]["assignments/assignment-poll:1"],
                {
                    "allow_multiple_votes_per_candidate": False,
                    "assignment_id": 1,
                    "global_abstain": True,
                    "global_no": True,
                    "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                    "state": AssignmentPoll.STATE_STARTED,
                    "type": AssignmentPoll.TYPE_NAMED,
                    "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_CAST,
                    "majority_method": AssignmentPoll.MAJORITY_TWO_THIRDS,
                    "title": self.poll.title,
                    "description": self.description,
                    "groups_id": [GROUP_DELEGATE_PK],
                    "options_id": [1],
                    "id": 1,
                    "votes_amount": 1,
                    "user_has_voted": user == self.user,
                },
            )

        # Other users should not get a vote autoupdate
        self.assertNoAutoupdate(vote, user=self.other_user)
        self.assertNoDeletedAutoupdate(vote, user=self.other_user)

    def test_publish(self):
        option = self.poll.options.get()
        vote = AssignmentVote.objects.create(user=self.user, option=option)
        vote.value = "A"
        vote.weight = Decimal("1")
        vote.save(no_delete_on_restriction=True, skip_autoupdate=True)
        self.poll.voted.add(self.user.id)
        self.poll.state = AssignmentPoll.STATE_FINISHED
        self.poll.save(skip_autoupdate=True)
        response = self.client.post(
            reverse("assignmentpoll-publish", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        vote = AssignmentVote.objects.get()

        # Everyone should get the whole data
        for user in (
            self.admin,
            self.user,
            self.other_user,
        ):
            self.assertAutoupdate(poll, user=user)
            autoupdate = self.get_last_autoupdate(user=user)
            self.assertEqual(
                autoupdate[0]["assignments/assignment-poll:1"],
                {
                    "allow_multiple_votes_per_candidate": False,
                    "amount_global_abstain": None,
                    "amount_global_no": None,
                    "assignment_id": 1,
                    "description": "test_description_paiquei5ahpie1wu8ohW",
                    "global_abstain": True,
                    "global_no": True,
                    "groups_id": [GROUP_DELEGATE_PK],
                    "id": 1,
                    "majority_method": "two_thirds",
                    "onehundred_percent_base": "cast",
                    "options_id": [1],
                    "pollmethod": "YNA",
                    "state": 4,
                    "title": self.poll.title,
                    "type": "named",
                    "votes_amount": 1,
                    "votescast": "1.000000",
                    "votesinvalid": "0.000000",
                    "votesvalid": "1.000000",
                    "user_has_voted": user == self.user,
                    "voted_id": [self.user.id],
                },
            )
            self.assertEqual(
                autoupdate[0]["assignments/assignment-vote:1"],
                {
                    "pollstate": AssignmentPoll.STATE_PUBLISHED,
                    "id": 1,
                    "weight": "1.000000",
                    "value": "A",
                    "user_id": 3,
                    "option_id": 1,
                },
            )
            self.assertEqual(
                autoupdate[0]["assignments/assignment-option:1"],
                {
                    "abstain": "1.000000",
                    "id": 1,
                    "no": "0.000000",
                    "poll_id": 1,
                    "pollstate": AssignmentPoll.STATE_PUBLISHED,
                    "yes": "0.000000",
                    "user_id": 1,
                    "weight": 1,
                },
            )
            self.assertIn("users/user:3", autoupdate[0])


class VoteAssignmentPollPseudoanonymousAutoupdates(
    VoteAssignmentPollAutoupdatesBaseClass
):
    poll_type = AssignmentPoll.TYPE_PSEUDOANONYMOUS

    def test_vote(self):
        response = self.user_client.post(
            reverse("assignmentpoll-vote", args=[self.poll.pk]), {"1": "A"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        vote = AssignmentVote.objects.get()

        # Expect the admin to see the full data in the autoupdate
        autoupdate = self.get_last_autoupdate(user=self.admin)
        # TODO: mypy complains without the Any type; check why and fix it
        should_be: Any = {
            "assignments/assignment-poll:1": {
                "allow_multiple_votes_per_candidate": False,
                "assignment_id": 1,
                "global_abstain": True,
                "global_no": True,
                "amount_global_abstain": None,
                "amount_global_no": None,
                "groups_id": [GROUP_DELEGATE_PK],
                "id": 1,
                "options_id": [1],
                "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                "state": AssignmentPoll.STATE_STARTED,
                "title": self.poll.title,
                "description": self.description,
                "type": AssignmentPoll.TYPE_PSEUDOANONYMOUS,
                "user_has_voted": False,
                "voted_id": [self.user.id],
                "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_CAST,
                "majority_method": AssignmentPoll.MAJORITY_TWO_THIRDS,
                "votes_amount": 1,
                "votescast": "1.000000",
                "votesinvalid": "0.000000",
                "votesvalid": "1.000000",
            },
            "assignments/assignment-option:1": {
                "abstain": "1.000000",
                "id": 1,
                "no": "0.000000",
                "poll_id": 1,
                "pollstate": AssignmentPoll.STATE_STARTED,
                "yes": "0.000000",
                "user_id": 1,
                "weight": 1,
            },
            "assignments/assignment-vote:1": {
                "id": 1,
                "option_id": 1,
                "pollstate": AssignmentPoll.STATE_STARTED,
                "user_id": None,
                "value": "A",
                "weight": "1.000000",
            },
        }
        self.assertEqual(autoupdate[0], should_be)
        self.assertEqual(autoupdate[1], [])

        # Expect non-admins to get a restricted poll update and no autoupdate
        # for a changed vote nor a deleted one
        for user in (self.user, self.other_user):
            self.assertAutoupdate(poll, user=user)
            autoupdate = self.get_last_autoupdate(user=user)
            self.assertEqual(
                autoupdate[0]["assignments/assignment-poll:1"],
                {
                    "allow_multiple_votes_per_candidate": False,
                    "assignment_id": 1,
                    "global_abstain": True,
                    "global_no": True,
                    "pollmethod": AssignmentPoll.POLLMETHOD_YNA,
                    "state": AssignmentPoll.STATE_STARTED,
                    "type": AssignmentPoll.TYPE_PSEUDOANONYMOUS,
                    "onehundred_percent_base": AssignmentPoll.PERCENT_BASE_CAST,
                    "majority_method": AssignmentPoll.MAJORITY_TWO_THIRDS,
                    "title": self.poll.title,
                    "description": self.description,
                    "groups_id": [GROUP_DELEGATE_PK],
                    "options_id": [1],
                    "id": 1,
                    "votes_amount": 1,
                    "user_has_voted": user == self.user,
                },
            )

            self.assertNoAutoupdate(vote, user=user)
            self.assertNoDeletedAutoupdate(vote, user=user)

    def test_publish(self):
        option = self.poll.options.get()
        vote = AssignmentVote.objects.create(option=option)
        vote.value = "A"
        vote.weight = Decimal("1")
        vote.save(no_delete_on_restriction=True, skip_autoupdate=True)
        self.poll.voted.add(self.user.id)
        self.poll.state = AssignmentPoll.STATE_FINISHED
        self.poll.save(skip_autoupdate=True)
        response = self.client.post(
            reverse("assignmentpoll-publish", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        vote = AssignmentVote.objects.get()

        # Everyone should get the whole data
        for user in (
            self.admin,
            self.user,
            self.other_user,
        ):
            self.assertAutoupdate(poll, user=user)
            autoupdate = self.get_last_autoupdate(user=user)
            self.assertEqual(
                autoupdate[0],
                {
                    "assignments/assignment-poll:1": {
                        "allow_multiple_votes_per_candidate": False,
                        "amount_global_abstain": None,
                        "amount_global_no": None,
                        "assignment_id": 1,
                        "description": "test_description_paiquei5ahpie1wu8ohW",
                        "global_abstain": True,
                        "global_no": True,
                        "groups_id": [GROUP_DELEGATE_PK],
                        "id": 1,
                        "majority_method": "two_thirds",
                        "onehundred_percent_base": "cast",
                        "options_id": [1],
                        "pollmethod": "YNA",
                        "state": 4,
                        "title": self.poll.title,
                        "type": AssignmentPoll.TYPE_PSEUDOANONYMOUS,
                        "votes_amount": 1,
                        "votescast": "1.000000",
                        "votesinvalid": "0.000000",
                        "votesvalid": "1.000000",
                        "user_has_voted": user == self.user,
                        "voted_id": [self.user.id],
                    },
                    "assignments/assignment-vote:1": {
                        "pollstate": AssignmentPoll.STATE_PUBLISHED,
                        "id": 1,
                        "weight": "1.000000",
                        "value": "A",
                        "user_id": None,
                        "option_id": 1,
                    },
                    "assignments/assignment-option:1": {
                        "abstain": "1.000000",
                        "id": 1,
                        "no": "0.000000",
                        "poll_id": 1,
                        "pollstate": AssignmentPoll.STATE_PUBLISHED,
                        "yes": "0.000000",
                        "user_id": 1,
                        "weight": 1,
                    },
                },
            )


class PseudoanonymizeAssignmentPoll(TestCase):
    def advancedSetUp(self):
        self.assignment = Assignment.objects.create(
            title="test_assignment_QLydMOqkyOHG68yZFJxl", open_posts=1
        )
        self.assignment.add_candidate(self.admin)
        self.poll = AssignmentPoll.objects.create(
            assignment=self.assignment,
            title="test_title_3LbUCNirKirpJhRHRxzW",
            pollmethod=AssignmentPoll.POLLMETHOD_YNA,
            type=BasePoll.TYPE_NAMED,
            state=AssignmentPoll.STATE_FINISHED,
        )
        self.poll.groups.add(GROUP_ADMIN_PK)
        self.poll.create_options()

        self.option = self.poll.options.get()
        self.user1, _ = self.create_user()
        self.vote1 = AssignmentVote.objects.create(
            user=self.user1, option=self.option, value="Y", weight=Decimal(1)
        )
        self.poll.voted.add(self.user1)
        self.user2, _ = self.create_user()
        self.vote2 = AssignmentVote.objects.create(
            user=self.user2, option=self.option, value="N", weight=Decimal(1)
        )
        self.poll.voted.add(self.user2)

    def test_pseudoanonymize_poll(self):
        response = self.client.post(
            reverse("assignmentpoll-pseudoanonymize", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.get_votes().count(), 2)
        self.assertEqual(poll.amount_users_voted_with_individual_weight(), 2)
        self.assertEqual(poll.votesvalid, Decimal("2"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("2"))
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("1"))
        self.assertEqual(option.no, Decimal("1"))
        self.assertEqual(option.abstain, Decimal("0"))
        self.assertTrue(self.user1 in poll.voted.all())
        self.assertTrue(self.user2 in poll.voted.all())
        for vote in poll.get_votes().all():
            self.assertTrue(vote.user is None)

    def test_pseudoanonymize_wrong_state(self):
        self.poll.state = AssignmentPoll.STATE_CREATED
        self.poll.save()
        response = self.client.post(
            reverse("assignmentpoll-pseudoanonymize", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertTrue(poll.get_votes().filter(user=self.user1).exists())
        self.assertTrue(poll.get_votes().filter(user=self.user2).exists())

    def test_pseudoanonymize_wrong_type(self):
        self.poll.type = AssignmentPoll.TYPE_ANALOG
        self.poll.save()
        response = self.client.post(
            reverse("assignmentpoll-pseudoanonymize", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = AssignmentPoll.objects.get()
        self.assertTrue(poll.get_votes().filter(user=self.user1).exists())
        self.assertTrue(poll.get_votes().filter(user=self.user2).exists())
