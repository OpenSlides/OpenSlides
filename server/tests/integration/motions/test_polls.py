from decimal import Decimal

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.motions.models import Motion, MotionOption, MotionPoll, MotionVote
from openslides.poll.models import BasePoll
from openslides.utils.auth import get_group_model
from openslides.utils.autoupdate import inform_changed_data
from tests.common_groups import GROUP_ADMIN_PK, GROUP_DEFAULT_PK, GROUP_DELEGATE_PK
from tests.count_queries import count_queries
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_motion_poll_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the polls,
    * 1 request to get all options for all polls,
    * 1 request to get all votes for all options,
    * 1 request to get all users for all votes,
    * 1 request to get all poll groups,
    = 5 queries
    """
    create_motion_polls()
    assert count_queries(MotionPoll.get_elements)() == 5


@pytest.mark.django_db(transaction=False)
def test_motion_vote_db_queries():
    """
    Tests that only 1 query is done when fetching MotionVotes
    """
    create_motion_polls()
    assert count_queries(MotionVote.get_elements)() == 1


@pytest.mark.django_db(transaction=False)
def test_motion_option_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the options,
    * 1 request to get all votes for all options,
    = 2 queries
    """
    create_motion_polls()
    assert count_queries(MotionOption.get_elements)() == 2


def create_motion_polls():
    """
    Creates 1 Motion with 5 polls with 5 options each which have 2 votes each
    """
    motion = Motion.objects.create(title="test_motion_wfLrsjEHXBmPplbvQ65N")
    group1 = get_group_model().objects.get(pk=1)
    group2 = get_group_model().objects.get(pk=2)

    for index in range(5):
        poll = MotionPoll.objects.create(
            motion=motion, title=f"test_title_{index}", pollmethod="YN", type="named"
        )
        poll.groups.add(group1)
        poll.groups.add(group2)

        for j in range(5):
            option = MotionOption.objects.create(poll=poll)

            for k in range(2):
                user = get_user_model().objects.create_user(
                    username=f"test_username_{index}{j}{k}",
                    password="test_password_kbzj5L8ZtVxBllZzoW6D",
                )
                MotionVote.objects.create(
                    user=user,
                    option=option,
                    value=("Y" if k == 0 else "N"),
                    weight=Decimal(1),
                )
            poll.voted.add(user)


class CreateMotionPoll(TestCase):
    """
    Tests creating polls of motions.
    """

    def advancedSetUp(self):
        self.motion = Motion(
            title="test_title_Aiqueigh2dae9phabiqu",
            text="test_text_Neekoh3zou6li5rue8iL",
        )
        self.motion.save()

    def test_simple(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_ailai4toogh3eefaa2Vo",
                "pollmethod": "YNA",
                "type": "named",
                "motion_id": self.motion.id,
                "onehundred_percent_base": "YN",
                "majority_method": "simple",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        self.assertTrue(MotionPoll.objects.exists())
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.title, "test_title_ailai4toogh3eefaa2Vo")
        self.assertEqual(poll.pollmethod, "YNA")
        self.assertEqual(poll.type, "named")
        self.assertEqual(poll.motion.id, self.motion.id)
        self.assertTrue(poll.options.exists())

    def test_default_method(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_ailai4toogh3eefaa2Vo",
                "type": "named",
                "motion_id": self.motion.id,
                "onehundred_percent_base": "YN",
                "majority_method": "simple",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        self.assertTrue(MotionPoll.objects.exists())
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.pollmethod, "YNA")

    def test_autoupdate(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_9Ce8OsdB8YWTVm5YOzqH",
                "pollmethod": "YNA",
                "type": "named",
                "motion_id": self.motion.id,
                "onehundred_percent_base": "YN",
                "majority_method": "simple",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)

        autoupdate = self.get_last_autoupdate(user=self.admin)
        self.assertEqual(
            autoupdate[0]["motions/motion-poll:1"],
            {
                "motion_id": 1,
                "pollmethod": MotionPoll.POLLMETHOD_YNA,
                "state": MotionPoll.STATE_CREATED,
                "type": MotionPoll.TYPE_NAMED,
                "title": "test_title_9Ce8OsdB8YWTVm5YOzqH",
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YN,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
                "groups_id": [],
                "votesvalid": "0.000000",
                "votesinvalid": "0.000000",
                "votescast": "0.000000",
                "options_id": [1],
                "id": 1,
                "voted_id": [],
                "user_has_voted": False,
            },
        )
        self.assertEqual(autoupdate[1], [])

    def test_missing_keys(self):
        complete_request_data = {
            "title": "test_title_OoCh9aitaeyaeth8nom1",
            "type": "named",
            "motion_id": self.motion.id,
            "onehundred_percent_base": "YN",
            "majority_method": "simple",
        }
        for key in complete_request_data.keys():
            request_data = {
                _key: value
                for _key, value in complete_request_data.items()
                if _key != key
            }
            response = self.client.post(reverse("motionpoll-list"), request_data)
            self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(MotionPoll.objects.exists())

    def test_with_groups(self):
        group1 = get_group_model().objects.get(pk=1)
        group2 = get_group_model().objects.get(pk=2)
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": "YNA",
                "type": "named",
                "motion_id": self.motion.id,
                "onehundred_percent_base": "YN",
                "majority_method": "simple",
                "groups_id": [1, 2],
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = MotionPoll.objects.get()
        self.assertTrue(group1 in poll.groups.all())
        self.assertTrue(group2 in poll.groups.all())

    def test_with_empty_groups(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_Thoo2eiphohhi1eeXoow",
                "pollmethod": MotionPoll.POLLMETHOD_YNA,
                "type": MotionPoll.TYPE_NAMED,
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YN,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
                "groups_id": [],
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = MotionPoll.objects.get()
        self.assertFalse(poll.groups.exists())

    def test_not_supported_type(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_yaiyeighoh0Iraet3Ahc",
                "pollmethod": MotionPoll.POLLMETHOD_YNA,
                "type": "not_existing",
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YN,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.exists())

    def test_not_allowed_type(self):
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", False)
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_3jdWIXbKBa7ZXutf3RYf",
                "pollmethod": MotionPoll.POLLMETHOD_YN,
                "type": MotionPoll.TYPE_NAMED,
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YN,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.exists())
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", True)

    def test_not_supported_pollmethod(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_SeVaiteYeiNgie5Xoov8",
                "pollmethod": "not_existing",
                "type": "named",
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YN,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.exists())

    def test_create_with_votes(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_0X5LifVkKiSh8OPGQM8e",
                "pollmethod": MotionPoll.POLLMETHOD_YN,
                "type": MotionPoll.TYPE_ANALOG,
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YNA,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
                "votes": {
                    "Y": 1,
                    "N": 2,
                    "votesvalid": "-2",
                    "votesinvalid": "-2",
                    "votescast": "-2",
                },
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.state, MotionPoll.STATE_FINISHED)
        self.assertTrue(MotionVote.objects.exists())

    def test_create_with_votes_publish_immediately(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_iXhJX0jmNl3Nvadsi8JO",
                "pollmethod": MotionPoll.POLLMETHOD_YN,
                "type": MotionPoll.TYPE_ANALOG,
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YNA,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
                "votes": {
                    "Y": 1,
                    "N": 2,
                    "votesvalid": "-2",
                    "votesinvalid": "-2",
                    "votescast": "-2",
                },
                "publish_immediately": "1",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_201_CREATED)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.state, MotionPoll.STATE_PUBLISHED)
        self.assertTrue(MotionVote.objects.exists())

    def test_create_with_invalid_votes(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_phSl1IALPIoDyM9uI2Kq",
                "pollmethod": MotionPoll.POLLMETHOD_YN,
                "type": MotionPoll.TYPE_ANALOG,
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YNA,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
                "votes": {"Y": 1, "N": 2, "votesvalid": "-2", "votesinvalid": "-2"},
                "publish_immediately": "1",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.exists())
        self.assertFalse(MotionVote.objects.exists())

    def test_create_with_votes_wrong_type(self):
        response = self.client.post(
            reverse("motionpoll-list"),
            {
                "title": "test_title_PgvqRIvuKuVImEpQJAMZ",
                "pollmethod": MotionPoll.POLLMETHOD_YN,
                "type": MotionPoll.TYPE_NAMED,
                "motion_id": self.motion.id,
                "onehundred_percent_base": MotionPoll.PERCENT_BASE_YNA,
                "majority_method": MotionPoll.MAJORITY_SIMPLE,
                "votes": {"Y": 1, "N": 2, "votesvalid": "-2", "votesinvalid": "-2"},
                "publish_immediately": "1",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.exists())
        self.assertFalse(MotionVote.objects.exists())


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
        self.group = get_group_model().objects.get(pk=1)
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_beeFaihuNae1vej2ai8m",
            pollmethod="YNA",
            type="named",
            onehundred_percent_base="YN",
            majority_method="simple",
        )
        self.poll.create_options()
        self.poll.groups.add(self.group)

    def test_patch_title(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"title": "test_title_Aishohh1ohd0aiSut7gi"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.title, "test_title_Aishohh1ohd0aiSut7gi")

    def test_prevent_patching_motion(self):
        motion = Motion(
            title="test_title_phohdah8quukooHeetuz",
            text="test_text_ue2yeisaech1ahBohhoo",
        )
        motion.save()
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]), {"motion_id": motion.id}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.motion.id, self.motion.id)  # unchanged

    def test_patch_pollmethod(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]), {"pollmethod": "YN"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.pollmethod, "YN")
        self.assertEqual(poll.onehundred_percent_base, "YN")

    def test_patch_invalid_pollmethod(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]), {"pollmethod": "invalid"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.pollmethod, "YNA")

    def test_patch_type(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]), {"type": "analog"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.type, "analog")

    def test_patch_invalid_type(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]), {"type": "invalid"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.type, "named")

    def test_patch_not_allowed_type(self):
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", False)
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"type": BasePoll.TYPE_NAMED},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.type, BasePoll.TYPE_NAMED)
        setattr(settings, "ENABLE_ELECTRONIC_VOTING", True)

    def test_patch_100_percent_base(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": "cast"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, "cast")

    def test_patch_wrong_100_percent_base(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": "invalid"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, "YN")

    def test_patch_majority_method(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"majority_method": "two_thirds"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.majority_method, "two_thirds")

    def test_patch_wrong_majority_method(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"majority_method": "invalid majority method"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.majority_method, "simple")

    def test_patch_groups_to_empty(self):
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]), {"groups_id": []}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertFalse(poll.groups.exists())

    def test_patch_groups(self):
        group2 = get_group_model().objects.get(pk=2)
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"groups_id": [group2.id]},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.groups.count(), 1)
        self.assertEqual(poll.groups.get(), group2)

    def test_patch_title_started(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"title": "test_title_1FjLGeQqsi9GgNzPp73S"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.title, "test_title_1FjLGeQqsi9GgNzPp73S")

    def test_patch_wrong_state(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"type": BasePoll.TYPE_NAMED},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.type, BasePoll.TYPE_NAMED)

    def test_patch_majority_method_state_not_created(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"majority_method": "two_thirds"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.majority_method, "two_thirds")

    def test_patch_100_percent_base_state_not_created(self):
        self.poll.state = 2
        self.poll.save()
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": "cast"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, "cast")

    def test_patch_wrong_100_percent_base_state_not_created(self):
        self.poll.state = 2
        self.poll.pollmethod = MotionPoll.POLLMETHOD_YN
        self.poll.save()
        response = self.client.patch(
            reverse("motionpoll-detail", args=[self.poll.pk]),
            {"onehundred_percent_base": MotionPoll.PERCENT_BASE_YNA},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.onehundred_percent_base, "YN")


class VoteMotionPollAnalog(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_OoK9IeChe2Jeib9Deeji",
            text="test_text_eichui1oobiSeit9aifo",
        )
        self.motion.save()
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_tho8PhiePh8upaex6phi",
            pollmethod="YNA",
            type=BasePoll.TYPE_ANALOG,
        )
        self.poll.create_options()

    def start_poll(self):
        self.poll.state = MotionPoll.STATE_STARTED
        self.poll.save()

    def make_admin_delegate(self):
        admin = get_user_model().objects.get(username="admin")
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(admin)

    def test_start_poll(self):
        response = self.client.post(reverse("motionpoll-start", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.state, MotionPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, None)
        self.assertEqual(poll.votesinvalid, None)
        self.assertEqual(poll.votescast, None)
        self.assertFalse(poll.get_votes().exists())

    def test_stop_poll(self):
        self.start_poll()
        response = self.client.post(reverse("motionpoll-stop", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.poll.state, MotionPoll.STATE_STARTED)

    def test_vote(self):
        self.start_poll()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]),
            {
                "Y": "1",
                "N": "2.35",
                "A": "-1",
                "votesvalid": "4.64",
                "votesinvalid": "-2",
                "votescast": "-2",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("4.64"))
        self.assertEqual(poll.votesinvalid, Decimal("-2"))
        self.assertEqual(poll.votescast, Decimal("-2"))
        self.assertEqual(poll.get_votes().count(), 3)
        self.assertEqual(poll.state, MotionPoll.STATE_FINISHED)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("1"))
        self.assertEqual(option.no, Decimal("2.35"))
        self.assertEqual(option.abstain, Decimal("-1"))
        self.assertAutoupdate(poll)

    def test_vote_no_permissions(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_missing_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), {"Y": "4", "N": "22.6"}
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_wrong_data_format(self):
        self.start_poll()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), [1, 2, 5]
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_wrong_vote_data(self):
        self.start_poll()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]),
            {"Y": "some string", "N": "-2", "A": "3"},
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_state_finished(self):
        self.start_poll()
        self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]),
            {
                "Y": "3",
                "N": "1",
                "A": "5",
                "votesvalid": "-2",
                "votesinvalid": "1",
                "votescast": "-1",
            },
        )
        self.poll.state = 3
        self.poll.save()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]),
            {
                "Y": "1",
                "N": "2.35",
                "A": "-1",
                "votesvalid": "4.64",
                "votesinvalid": "-2",
                "votescast": "3",
            },
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("4.64"))
        self.assertEqual(poll.votesinvalid, Decimal("-2"))
        self.assertEqual(poll.votescast, Decimal("3"))
        self.assertEqual(poll.get_votes().count(), 3)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("1"))
        self.assertEqual(option.no, Decimal("2.35"))
        self.assertEqual(option.abstain, Decimal("-1"))


class VoteMotionPollNamed(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_OoK9IeChe2Jeib9Deeji",
            text="test_text_eichui1oobiSeit9aifo",
        )
        self.motion.save()
        self.group = get_group_model().objects.get(pk=GROUP_DELEGATE_PK)
        self.admin = get_user_model().objects.get(username="admin")
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_tho8PhiePh8upaex6phi",
            pollmethod="YNA",
            type=BasePoll.TYPE_NAMED,
        )
        self.poll.create_options()
        self.poll.groups.add(self.group)

    def start_poll(self):
        self.poll.state = MotionPoll.STATE_STARTED
        self.poll.save()

    def make_admin_delegate(self):
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

    def make_admin_present(self):
        self.admin.is_present = True
        self.admin.save()

    def test_start_poll(self):
        response = self.client.post(reverse("motionpoll-start", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.state, MotionPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, Decimal("0"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("0"))
        self.assertFalse(poll.get_votes().exists())

    def test_vote(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "N"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("1"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.get_votes().count(), 1)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("1"))
        self.assertEqual(option.abstain, Decimal("0"))
        vote = option.votes.get()
        self.assertEqual(vote.user, self.admin)
        self.assertEqual(vote.weight, Decimal("1"))

    def test_vote_with_voteweight(self):
        config["users_activate_vote_weight"] = True
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        self.admin.vote_weight = weight = Decimal("3.5")
        self.admin.save()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "A"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.votesvalid, weight)
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.get_votes().count(), 1)
        self.assertEqual(poll.amount_users_voted_with_individual_weight(), weight)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("0"))
        self.assertEqual(option.abstain, weight)
        vote = option.votes.get()
        self.assertEqual(vote.weight, weight)

    def test_vote_without_voteweight(self):
        self.admin.vote_weight = Decimal("3.5")
        self.admin.save()
        self.test_vote()

    def test_change_vote(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "N"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "A"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("1"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.get_votes().count(), 1)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("1"))
        self.assertEqual(option.abstain, Decimal("0"))
        vote = option.votes.get()
        self.assertEqual(vote.user, self.admin)

    def test_vote_anonymous(self):
        self.poll.groups.add(GROUP_DEFAULT_PK)
        self.start_poll()
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()
        response = guest_client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "Y"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    # TODO: Move to unit tests
    def test_not_set_vote_values(self):
        with self.assertRaises(ValueError):
            self.poll.votesvalid = Decimal("1")
        with self.assertRaises(ValueError):
            self.poll.votesinvalid = Decimal("1")
        with self.assertRaises(ValueError):
            self.poll.votescast = Decimal("1")

    def test_vote_wrong_state(self):
        self.make_admin_present()
        self.make_admin_delegate()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_wrong_group(self):
        self.start_poll()
        self.make_admin_present()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_not_present(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_missing_data(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_wrong_data_format(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), [1, 2, 5]
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())


class VoteMotionPollNamedAutoupdates(TestCase):
    """3 important users:
    self.admin: manager, has can_see, can_manage, can_manage_polls (in admin group)
    self.user1: votes, has can_see perms and in in delegate group
    self.other_user: Just has can_see perms and is NOT in the delegate group.
    """

    def advancedSetUp(self):
        self.motion = Motion(
            title="test_title_OoK9IeChe2Jeib9Deeji",
            text="test_text_eichui1oobiSeit9aifo",
        )
        self.motion.save()
        self.delegate_group = get_group_model().objects.get(pk=GROUP_DELEGATE_PK)
        self.other_user, _ = self.create_user()
        inform_changed_data(self.other_user)

        self.user, user_password = self.create_user()
        self.user.groups.add(self.delegate_group)
        self.user.is_present = True
        self.user.save()
        self.user_client = APIClient()
        self.user_client.login(username=self.user.username, password=user_password)

        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_tho8PhiePh8upaex6phi",
            pollmethod="YNA",
            type=BasePoll.TYPE_NAMED,
            state=MotionPoll.STATE_STARTED,
            onehundred_percent_base="YN",
            majority_method="simple",
        )
        self.poll.create_options()
        self.poll.groups.add(self.delegate_group)

    def test_vote(self):
        response = self.user_client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "A"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        vote = MotionVote.objects.get()

        # Expect the admin to see the full data in the autoupdate
        autoupdate = self.get_last_autoupdate(user=self.admin)
        self.assertEqual(
            autoupdate[0],
            {
                "motions/motion-poll:1": {
                    "motion_id": 1,
                    "pollmethod": "YNA",
                    "state": 2,
                    "type": "named",
                    "title": "test_title_tho8PhiePh8upaex6phi",
                    "onehundred_percent_base": "YN",
                    "majority_method": "simple",
                    "groups_id": [GROUP_DELEGATE_PK],
                    "votesvalid": "1.000000",
                    "votesinvalid": "0.000000",
                    "votescast": "1.000000",
                    "options_id": [1],
                    "id": 1,
                    "user_has_voted": False,
                    "voted_id": [self.user.id],
                },
                "motions/motion-vote:1": {
                    "pollstate": 2,
                    "id": 1,
                    "weight": "1.000000",
                    "value": "A",
                    "user_id": self.user.id,
                    "option_id": 1,
                },
                "motions/motion-option:1": {
                    "abstain": "1.000000",
                    "id": 1,
                    "no": "0.000000",
                    "poll_id": 1,
                    "pollstate": 2,
                    "yes": "0.000000",
                },
            },
        )
        self.assertEqual(autoupdate[1], [])

        # Expect user1 to receive his vote
        autoupdate = self.get_last_autoupdate(user=self.user)
        self.assertEqual(
            autoupdate[0]["motions/motion-vote:1"],
            {
                "pollstate": 2,
                "option_id": 1,
                "id": 1,
                "weight": "1.000000",
                "value": "A",
                "user_id": self.user.id,
            },
        )
        self.assertEqual(
            autoupdate[0]["motions/motion-option:1"],
            {"id": 1, "poll_id": 1, "pollstate": 2},
        )
        self.assertEqual(autoupdate[1], [])

        # Expect non-admins to get a restricted poll update
        for user in (self.user, self.other_user):
            self.assertAutoupdate(poll, user=user)
            autoupdate = self.get_last_autoupdate(user=user)
            self.assertEqual(
                autoupdate[0]["motions/motion-poll:1"],
                {
                    "motion_id": 1,
                    "pollmethod": "YNA",
                    "state": 2,
                    "type": "named",
                    "title": "test_title_tho8PhiePh8upaex6phi",
                    "onehundred_percent_base": "YN",
                    "majority_method": "simple",
                    "groups_id": [GROUP_DELEGATE_PK],
                    "options_id": [1],
                    "id": 1,
                    "user_has_voted": user == self.user,
                },
            )
            self.assertEqual(
                autoupdate[0]["motions/motion-option:1"],
                {
                    "id": 1,
                    "poll_id": 1,
                    "pollstate": 2,
                },  # noqa black and flake are no friends :(
            )

        # Other users should not get a vote autoupdate
        self.assertNoAutoupdate(vote, user=self.other_user)
        self.assertNoDeletedAutoupdate(vote, user=self.other_user)


class VoteMotionPollPseudoanonymousAutoupdates(TestCase):
    """3 important users:
    self.admin: manager, has can_see, can_manage, can_manage_polls (in admin group)
    self.user: votes, has can_see perms and in in delegate group
    self.other_user: Just has can_see perms and is NOT in the delegate group.
    """

    def advancedSetUp(self):
        self.motion = Motion(
            title="test_title_OoK9IeChe2Jeib9Deeji",
            text="test_text_eichui1oobiSeit9aifo",
        )
        self.motion.save()
        self.delegate_group = get_group_model().objects.get(pk=GROUP_DELEGATE_PK)
        self.other_user, _ = self.create_user()
        inform_changed_data(self.other_user)

        self.user, user_password = self.create_user()
        self.user.groups.add(self.delegate_group)
        self.user.is_present = True
        self.user.save()
        self.user_client = APIClient()
        self.user_client.login(username=self.user.username, password=user_password)

        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_cahP1umooteehah2jeey",
            pollmethod="YNA",
            type=BasePoll.TYPE_PSEUDOANONYMOUS,
            state=MotionPoll.STATE_STARTED,
            onehundred_percent_base="YN",
            majority_method="simple",
        )
        self.poll.create_options()
        self.poll.groups.add(self.delegate_group)

    def test_vote(self):
        response = self.user_client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "A"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        vote = MotionVote.objects.get()

        # Expect the admin to see the full data in the autoupdate
        autoupdate = self.get_last_autoupdate(user=self.admin)
        self.assertEqual(
            autoupdate[0],
            {
                "motions/motion-poll:1": {
                    "motion_id": 1,
                    "pollmethod": "YNA",
                    "state": 2,
                    "type": "pseudoanonymous",
                    "title": "test_title_cahP1umooteehah2jeey",
                    "onehundred_percent_base": "YN",
                    "majority_method": "simple",
                    "groups_id": [GROUP_DELEGATE_PK],
                    "votesvalid": "1.000000",
                    "votesinvalid": "0.000000",
                    "votescast": "1.000000",
                    "options_id": [1],
                    "id": 1,
                    "user_has_voted": False,
                    "voted_id": [self.user.id],
                },
                "motions/motion-vote:1": {
                    "pollstate": 2,
                    "option_id": 1,
                    "id": 1,
                    "weight": "1.000000",
                    "value": "A",
                    "user_id": None,
                },
                "motions/motion-option:1": {
                    "abstain": "1.000000",
                    "id": 1,
                    "no": "0.000000",
                    "poll_id": 1,
                    "pollstate": 2,
                    "yes": "0.000000",
                },
            },
        )
        self.assertEqual(autoupdate[1], [])

        # Expect non-admins to get a restricted poll update and no autoupdate
        # for a changed vote nor a deleted one
        for user in (self.user, self.other_user):
            self.assertAutoupdate(poll, user=user)
            autoupdate = self.get_last_autoupdate(user=user)
            self.assertEqual(
                autoupdate[0]["motions/motion-poll:1"],
                {
                    "motion_id": 1,
                    "pollmethod": "YNA",
                    "state": 2,
                    "type": "pseudoanonymous",
                    "title": "test_title_cahP1umooteehah2jeey",
                    "onehundred_percent_base": "YN",
                    "majority_method": "simple",
                    "groups_id": [GROUP_DELEGATE_PK],
                    "options_id": [1],
                    "id": 1,
                    "user_has_voted": user == self.user,
                },
            )

            self.assertNoAutoupdate(vote, user=user)
            self.assertNoDeletedAutoupdate(vote, user=user)


class VoteMotionPollPseudoanonymous(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_Chaebaenges1aebe8iev",
            text="test_text_cah2aigh6ahc8OhNguQu",
        )
        self.motion.save()
        self.group = get_group_model().objects.get(pk=GROUP_DELEGATE_PK)
        self.admin = get_user_model().objects.get(username="admin")
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_yohphei9Iegohqu9ki7m",
            pollmethod="YNA",
            type=BasePoll.TYPE_PSEUDOANONYMOUS,
        )
        self.poll.create_options()
        self.poll.groups.add(self.group)

    def start_poll(self):
        self.poll.state = MotionPoll.STATE_STARTED
        self.poll.save()

    def make_admin_delegate(self):
        self.admin.groups.add(GROUP_DELEGATE_PK)
        self.admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(self.admin)

    def make_admin_present(self):
        self.admin.is_present = True
        self.admin.save()

    def test_start_poll(self):
        response = self.client.post(reverse("motionpoll-start", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.state, MotionPoll.STATE_STARTED)
        self.assertEqual(poll.votesvalid, Decimal("0"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("0"))
        self.assertFalse(poll.get_votes().exists())

    def test_vote(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "N"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.votesvalid, Decimal("1"))
        self.assertEqual(poll.votesinvalid, Decimal("0"))
        self.assertEqual(poll.votescast, Decimal("1"))
        self.assertEqual(poll.get_votes().count(), 1)
        self.assertEqual(poll.amount_users_voted_with_individual_weight(), 1)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("1"))
        self.assertEqual(option.abstain, Decimal("0"))
        self.assertTrue(self.admin in poll.voted.all())
        vote = option.votes.get()
        self.assertEqual(vote.user, None)

    def test_change_vote(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "N"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "A"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        option = MotionPoll.objects.get().options.get()
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("1"))
        self.assertEqual(option.abstain, Decimal("0"))
        vote = option.votes.get()
        self.assertEqual(vote.user, None)

    def test_vote_anonymous(self):
        self.poll.groups.add(GROUP_DEFAULT_PK)
        self.start_poll()
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()
        response = guest_client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), "Y"
        )
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_wrong_state(self):
        self.make_admin_present()
        self.make_admin_delegate()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_wrong_group(self):
        self.start_poll()
        self.make_admin_present()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_not_present(self):
        self.start_poll()
        self.make_admin_delegate()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_403_FORBIDDEN)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_missing_data(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(reverse("motionpoll-vote", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())

    def test_vote_wrong_data_format(self):
        self.start_poll()
        self.make_admin_delegate()
        self.make_admin_present()
        response = self.client.post(
            reverse("motionpoll-vote", args=[self.poll.pk]), [1, 2, 5]
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(MotionPoll.objects.get().get_votes().exists())


class StopMotionPoll(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_eiri4iipeemaeGhahkae",
            text="test_text_eegh7quoochaiNgiyeix",
        )
        self.motion.save()
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_Hu9Miebopaighee3EDie",
            pollmethod="YNA",
            type=BasePoll.TYPE_NAMED,
        )
        self.poll.create_options()

    def test_stop_poll(self):
        self.poll.state = MotionPoll.STATE_STARTED
        self.poll.save()
        response = self.client.post(reverse("motionpoll-stop", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(MotionPoll.objects.get().state, MotionPoll.STATE_FINISHED)

    def test_stop_wrong_state(self):
        response = self.client.post(reverse("motionpoll-stop", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MotionPoll.objects.get().state, MotionPoll.STATE_CREATED)


class PublishMotionPoll(TestCase):
    def advancedSetUp(self):
        self.motion = Motion(
            title="test_title_lai8Ho5gai9aijahRasu",
            text="test_text_KieGhosh8ahWiguHeu2D",
        )
        self.motion.save()
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_Nufae0iew7Iorox2thoo",
            pollmethod="YNA",
            type=BasePoll.TYPE_PSEUDOANONYMOUS,
            onehundred_percent_base="YN",
            majority_method="simple",
        )
        self.poll.create_options()
        option = self.poll.options.get()
        self.user, _ = self.create_user()
        self.vote = MotionVote.objects.create(
            option=option, user=None, weight=Decimal(2), value="N"
        )

    def test_publish_poll(self):
        self.poll.state = MotionPoll.STATE_FINISHED
        self.poll.save()
        response = self.client.post(reverse("motionpoll-publish", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        self.assertEqual(MotionPoll.objects.get().state, MotionPoll.STATE_PUBLISHED)

        # Test autoupdates: Every user should get the full data
        for user in (self.admin, self.user):
            autoupdate = self.get_last_autoupdate(user=user)
            self.assertEqual(
                autoupdate[0],
                {
                    "motions/motion-poll:1": {
                        "motion_id": 1,
                        "pollmethod": "YNA",
                        "state": 4,
                        "type": "pseudoanonymous",
                        "title": "test_title_Nufae0iew7Iorox2thoo",
                        "onehundred_percent_base": "YN",
                        "majority_method": "simple",
                        "groups_id": [],
                        "votesvalid": "0.000000",
                        "votesinvalid": "0.000000",
                        "votescast": "0.000000",
                        "options_id": [1],
                        "id": 1,
                        "user_has_voted": False,
                        "voted_id": [],
                    },
                    "motions/motion-vote:1": {
                        "pollstate": 4,
                        "option_id": 1,
                        "id": 1,
                        "weight": "2.000000",
                        "value": "N",
                        "user_id": None,
                    },
                    "motions/motion-option:1": {
                        "abstain": "0.000000",
                        "id": 1,
                        "no": "2.000000",
                        "poll_id": 1,
                        "pollstate": 4,
                        "yes": "0.000000",
                    },
                },
            )
            self.assertEqual(autoupdate[1], [])

    def test_publish_wrong_state(self):
        response = self.client.post(reverse("motionpoll-publish", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MotionPoll.objects.get().state, MotionPoll.STATE_CREATED)


class PseudoanonymizeMotionPoll(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.motion = Motion(
            title="test_title_lai8Ho5gai9aijahRasu",
            text="test_text_KieGhosh8ahWiguHeu2D",
        )
        self.motion.save()
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_Nufae0iew7Iorox2thoo",
            pollmethod="YNA",
            type=BasePoll.TYPE_NAMED,
            state=MotionPoll.STATE_FINISHED,
        )
        self.poll.create_options()
        self.option = self.poll.options.get()
        self.user1, _ = self.create_user()
        self.vote1 = MotionVote.objects.create(
            user=self.user1, option=self.option, value="Y", weight=Decimal(1)
        )
        self.poll.voted.add(self.user1)
        self.user2, _ = self.create_user()
        self.vote2 = MotionVote.objects.create(
            user=self.user2, option=self.option, value="N", weight=Decimal(1)
        )
        self.poll.voted.add(self.user2)

    def test_pseudoanonymize_poll(self):
        response = self.client.post(
            reverse("motionpoll-pseudoanonymize", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
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
        self.poll.state = MotionPoll.STATE_CREATED
        self.poll.save()
        response = self.client.post(
            reverse("motionpoll-pseudoanonymize", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertTrue(poll.get_votes().filter(user=self.user1).exists())
        self.assertTrue(poll.get_votes().filter(user=self.user2).exists())

    def test_pseudoanonymize_wrong_type(self):
        self.poll.type = MotionPoll.TYPE_ANALOG
        self.poll.save()
        response = self.client.post(
            reverse("motionpoll-pseudoanonymize", args=[self.poll.pk])
        )
        self.assertHttpStatusVerbose(response, status.HTTP_400_BAD_REQUEST)
        poll = MotionPoll.objects.get()
        self.assertTrue(poll.get_votes().filter(user=self.user1).exists())
        self.assertTrue(poll.get_votes().filter(user=self.user2).exists())


class ResetMotionPoll(TestCase):
    def advancedSetUp(self):
        self.motion = Motion(
            title="test_title_cheiJ1ieph5ohng9queu",
            text="test_text_yahng6fiegaL7mooZ2of",
        )
        self.motion.save()
        self.poll = MotionPoll.objects.create(
            motion=self.motion,
            title="test_title_oozie2Ui9xie0chaghie",
            pollmethod="YNA",
            type=BasePoll.TYPE_ANALOG,
            state=MotionPoll.STATE_FINISHED,
        )
        self.poll.create_options()
        self.option = self.poll.options.get()
        self.user1, _ = self.create_user()
        self.vote1 = MotionVote.objects.create(
            user=self.user1, option=self.option, value="Y", weight=Decimal(1)
        )
        self.poll.voted.add(self.user1)
        self.user2, _ = self.create_user()
        self.vote2 = MotionVote.objects.create(
            user=self.user2, option=self.option, value="N", weight=Decimal(1)
        )
        self.poll.voted.add(self.user2)

    def test_reset_poll(self):
        response = self.client.post(reverse("motionpoll-reset", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        self.assertEqual(poll.get_votes().count(), 0)
        self.assertEqual(poll.amount_users_voted_with_individual_weight(), 0)
        self.assertEqual(poll.votesvalid, None)
        self.assertEqual(poll.votesinvalid, None)
        self.assertEqual(poll.votescast, None)
        option = poll.options.get()
        self.assertEqual(option.yes, Decimal("0"))
        self.assertEqual(option.no, Decimal("0"))
        self.assertEqual(option.abstain, Decimal("0"))
        self.assertFalse(option.votes.exists())

    def test_deleted_autoupdate(self):
        response = self.client.post(reverse("motionpoll-reset", args=[self.poll.pk]))
        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        poll = MotionPoll.objects.get()
        option = poll.options.get()
        self.assertAutoupdate(option, self.admin)
        for user in (self.admin, self.user1, self.user2):
            self.assertDeletedAutoupdate(self.vote1, user=user)
            self.assertDeletedAutoupdate(self.vote2, user=user)
