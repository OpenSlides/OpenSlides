import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from openslides.agenda.models import Item, ListOfSpeakers, Speaker
from openslides.assignments.models import Assignment
from openslides.core.config import config
from openslides.core.models import Countdown
from openslides.mediafiles.models import Mediafile
from openslides.motions.models import Motion, MotionBlock
from openslides.topics.models import Topic
from openslides.users.models import Group
from openslides.utils.autoupdate import inform_changed_data
from tests.count_queries import count_queries
from tests.test_case import TestCase

from ...common_groups import GROUP_DEFAULT_PK


@pytest.mark.django_db(transaction=False)
def test_agenda_item_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the list of all agenda items,
    * 1 request to get all assignments,
    * 1 request to get all motions,
    * 1 request to get all topics,
    * 1 request to get all motion blocks and
    * 1 request to get all parents
    * 1 request to get all tags
    """
    parent = Topic.objects.create(title="parent").agenda_item
    for index in range(10):
        item = Topic.objects.create(title=f"topic{index}").agenda_item
        item.parent = parent
        item.save()
    Motion.objects.create(title="motion1")
    Motion.objects.create(title="motion2")
    Assignment.objects.create(title="assignment1", open_posts=5)
    Assignment.objects.create(title="assignment2", open_posts=5)
    MotionBlock.objects.create(title="block1")
    MotionBlock.objects.create(title="block1")

    assert count_queries(Item.get_elements)() == 7


@pytest.mark.django_db(transaction=False)
def test_list_of_speakers_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all lists of speakers
    * 1 request to get all speakers
    * 4 requests to get the assignments, motions, topics and mediafiles and
    """
    for index in range(10):
        Topic.objects.create(title=f"topic{index}")
    parent = Topic.objects.create(title="parent").agenda_item
    child = Topic.objects.create(title="child").agenda_item
    child.parent = parent
    child.save()
    Motion.objects.create(title="motion1")
    Motion.objects.create(title="motion2")
    Assignment.objects.create(title="assignment", open_posts=5)
    Mediafile.objects.create(
        title="mediafile", mediafile=SimpleUploadedFile("some_file", b"some content.")
    )

    assert count_queries(ListOfSpeakers.get_elements)() == 6


class ContentObjects(TestCase):
    """
    Tests content objects with Topic as a content object of items and
    lists of speakers. Asserts, that it is recognizes as a content
    object and tests creation and deletion of it and the related item
    and list of speaker.
    Tests optional agenda items with motions, e.g. motion as a content
    object without an item.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def test_topic_is_agenda_item_content_object(self):
        assert hasattr(Topic(), "get_agenda_title_information")

    def test_topic_is_list_of_speakers_content_object(self):
        assert hasattr(Topic(), "get_list_of_speakers_title_information")

    def test_motion_is_agenda_item_content_object(self):
        assert hasattr(Motion(), "get_agenda_title_information")

    def test_motion_is_list_of_speakers_content_object(self):
        assert hasattr(Motion(), "get_list_of_speakers_title_information")

    def test_create_topic(self):
        # Disable autocreation. Topics should create agenda items anyways.
        config["agenda_item_creation"] = "never"
        topic = Topic.objects.create(title="test_title_fk3Oc209JDiunw2!wwoH")

        assert topic.agenda_item is not None
        assert topic.list_of_speakers is not None
        response = self.client.get(reverse("item-detail", args=[topic.agenda_item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(
            reverse("listofspeakers-detail", args=[topic.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_topic(self):
        topic = Topic.objects.create(title="test_title_lwOCK32jZGFb37DpmoP(")
        item_id = topic.agenda_item_id
        list_of_speakers_id = topic.list_of_speakers_id
        topic.delete()
        response = self.client.get(reverse("item-detail", args=[item_id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response = self.client.get(
            reverse("listofspeakers-detail", args=[list_of_speakers_id])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_prevent_removing_topic_from_agenda(self):
        topic = Topic.objects.create(title="test_title_lwOCK32jZGFb37DpmoP(")
        item_id = topic.agenda_item_id
        response = self.client.delete(reverse("item-detail", args=[item_id]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adding_topic_twice(self):
        topic = Topic.objects.create(title="test_title_lwOCK32jZGFb37DpmoP(")
        response = self.client.post(
            reverse("item-list"),
            {"collection": topic.get_collection_string(), "id": topic.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_enabled_auto_adding_item_for_motion(self):
        config["agenda_item_creation"] = "always"
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_F3pApc3em9zIGCie2iwf",
                "text": "test_text_wcnLVzezeLcnqlqlC(31",
                "agenda_create": False,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertTrue(motion.agenda_item is not None)
        self.assertEqual(motion.agenda_item_id, motion.agenda_item.id)

    def test_disabled_auto_adding_item_for_motion(self):
        config["agenda_item_creation"] = "never"
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_OoCoo3MeiT9li5Iengu9",
                "text": "test_text_thuoz0iecheiheereiCi",
                "agenda_create": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertTrue(motion.agenda_item is None)
        self.assertTrue(motion.agenda_item_id is None)

    def test_ask_auto_adding_item_for_motion(self):
        config["agenda_item_creation"] = "default_no"
        response = self.client.post(
            reverse("motion-list"),
            {
                "title": "test_title_wvlvowievgbpypoOV332",
                "text": "test_text_tvewpxxcw9r72qNVV3uq",
                "agenda_create": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        motion = Motion.objects.get()
        self.assertTrue(motion.agenda_item is not None)
        self.assertEqual(motion.agenda_item_id, motion.agenda_item.id)


class RetrieveItem(TestCase):
    """
    Tests retrieving items.
    """

    def setUp(self):
        self.client = APIClient()
        config["general_system_enable_anonymous"] = True
        self.item = Topic.objects.create(
            title="test_title_Idais2pheepeiz5uph1c"
        ).agenda_item

    def test_normal_by_anonymous_without_perm_to_see_internal_items(self):
        group = get_user_model().groups.field.related_model.objects.get(
            pk=GROUP_DEFAULT_PK
        )
        permission_string = "agenda.can_see_internal_items"
        app_label, codename = permission_string.split(".")
        permission = group.permissions.get(
            content_type__app_label=app_label, codename=codename
        )
        group.permissions.remove(permission)
        self.item.type = Item.AGENDA_ITEM
        self.item.save()
        response = self.client.get(reverse("item-detail", args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_hidden_by_anonymous_without_manage_perms(self):
        response = self.client.get(reverse("item-detail", args=[self.item.pk]))
        self.assertEqual(response.status_code, 404)

    def test_hidden_by_anonymous_with_manage_perms(self):
        group = Group.objects.get(pk=GROUP_DEFAULT_PK)
        permission_string = "agenda.can_manage"
        app_label, codename = permission_string.split(".")
        permission = Permission.objects.get(
            content_type__app_label=app_label, codename=codename
        )
        group.permissions.add(permission)
        inform_changed_data(group)
        response = self.client.get(reverse("item-detail", args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_internal_by_anonymous_without_perm_to_see_internal_items(self):
        group = Group.objects.get(pk=GROUP_DEFAULT_PK)
        permission_string = "agenda.can_see_internal_items"
        app_label, codename = permission_string.split(".")
        permission = group.permissions.get(
            content_type__app_label=app_label, codename=codename
        )
        group.permissions.remove(permission)
        inform_changed_data(group)
        self.item.type = Item.INTERNAL_ITEM
        self.item.save()
        response = self.client.get(reverse("item-detail", args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_normal_by_anonymous_cant_see_agenda_comments(self):
        self.item.type = Item.AGENDA_ITEM
        self.item.comment = "comment_gbiejd67gkbmsogh8374jf$kd"
        self.item.save()
        response = self.client.get(reverse("item-detail", args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("comment") is None)


class RetrieveListOfSpeakers(TestCase):
    """
    Tests retrieving list of speakers.
    """

    def setUp(self):
        self.client = APIClient()
        config["general_system_enable_anonymous"] = True
        self.list_of_speakers = Topic.objects.create(
            title="test_title_qsjem(ZUNfp7egnzp37n"
        ).list_of_speakers

    def test_simple(self):
        response = self.client.get(
            reverse("listofspeakers-detail", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_without_permission(self):
        group = Group.objects.get(pk=GROUP_DEFAULT_PK)
        permission_string = "agenda.can_see_list_of_speakers"
        app_label, codename = permission_string.split(".")
        permission = Permission.objects.get(
            content_type__app_label=app_label, codename=codename
        )
        group.permissions.remove(permission)
        inform_changed_data(group)
        response = self.client.get(
            reverse("listofspeakers-detail", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ManageSpeaker(TestCase):
    """
    Tests managing speakers.
    """

    def advancedSetUp(self):
        self.list_of_speakers = Topic.objects.create(
            title="test_title_aZaedij4gohn5eeQu8fe"
        ).list_of_speakers
        self.user, _ = self.create_user()

    def test_add_oneself_once(self):
        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Speaker.objects.all().exists())

    def test_add_oneself_twice(self):
        Speaker.objects.add(
            get_user_model().objects.get(username="admin"), self.list_of_speakers
        )
        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, 400)

    def test_add_oneself_when_closed(self):
        self.list_of_speakers.closed = True
        self.list_of_speakers.save()
        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, 400)

    def test_remove_oneself(self):
        Speaker.objects.add(
            get_user_model().objects.get(username="admin"), self.list_of_speakers
        )
        response = self.client.delete(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.all().exists())

    def test_remove_self_not_on_list(self):
        response = self.client.delete(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, 400)

    def test_add_someone_else(self):
        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"user": self.user.pk},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Speaker.objects.filter(
                list_of_speakers=self.list_of_speakers, user=self.user
            ).exists()
        )

    def test_invalid_data_string_instead_of_integer(self):
        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"user": "string_instead_of_integer"},
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_data_user_does_not_exist(self):
        # ID of a user that does not exist.
        # Be careful: Here we do not test that the user does not exist.
        inexistent_user_pk = self.user.pk + 1000
        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"user": inexistent_user_pk},
        )
        self.assertEqual(response.status_code, 400)

    def test_add_someone_else_twice(self):
        Speaker.objects.add(self.user, self.list_of_speakers)
        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"user": self.user.pk},
        )
        self.assertEqual(response.status_code, 400)

    def test_add_someone_else_non_admin(self):
        self.make_admin_delegate()

        response = self.client.post(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"user": self.user.pk},
        )
        self.assertEqual(response.status_code, 403)

    def test_remove_someone_else(self):
        speaker = Speaker.objects.add(self.user, self.list_of_speakers)
        response = self.client.delete(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"speaker": speaker.pk},
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            Speaker.objects.filter(
                list_of_speakers=self.list_of_speakers, user=self.user
            ).exists()
        )

    def test_remove_someone_else_not_on_list(self):
        response = self.client.delete(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"speaker": "1"},
        )
        self.assertEqual(response.status_code, 200)

    def test_remove_someone_else_invalid_data(self):
        response = self.client.delete(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"speaker": "invalid"},
        )
        self.assertEqual(response.status_code, 200)

    def test_remove_someone_else_non_admin(self):
        self.make_admin_delegate()
        speaker = Speaker.objects.add(self.user, self.list_of_speakers)

        response = self.client.delete(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"speaker": speaker.pk},
        )
        self.assertEqual(response.status_code, 403)

    def test_mark_speaker(self):
        Speaker.objects.add(self.user, self.list_of_speakers)
        response = self.client.patch(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"user": self.user.pk, "marked": True},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Speaker.objects.get().marked)

    def test_mark_speaker_non_admin(self):
        self.make_admin_delegate()
        Speaker.objects.add(self.user, self.list_of_speakers)

        response = self.client.patch(
            reverse("listofspeakers-manage-speaker", args=[self.list_of_speakers.pk]),
            {"user": self.user.pk},
        )

        self.assertEqual(response.status_code, 403)

    # re-add last speaker
    def util_add_user_as_last_speaker(self):
        speaker = Speaker.objects.add(self.user, self.list_of_speakers)
        speaker.begin_time = timezone.now()
        speaker.end_time = timezone.now()
        speaker.weight = None
        speaker.save()

    def test_readd_last_speaker_no_speaker(self):
        response = self.client.post(
            reverse(
                "listofspeakers-readd-last-speaker", args=[self.list_of_speakers.pk]
            )
        )
        self.assertEqual(response.status_code, 400)

    def test_readd_last_speaker_no_last_speaker(self):
        Speaker.objects.add(self.user, self.list_of_speakers)
        response = self.client.post(
            reverse(
                "listofspeakers-readd-last-speaker", args=[self.list_of_speakers.pk]
            )
        )
        self.assertEqual(response.status_code, 400)

    def test_readd_last_speaker_has_last_speaker_no_next_speaker(self):
        self.util_add_user_as_last_speaker()

        response = self.client.post(
            reverse(
                "listofspeakers-readd-last-speaker", args=[self.list_of_speakers.pk]
            )
        )
        self.assertEqual(response.status_code, 200)
        speaker = Speaker.objects.get()
        self.assertTrue(
            speaker.begin_time is None
            and speaker.end_time is None
            and speaker.weight is not None
        )

    def test_readd_last_speaker_has_last_speaker_and_next_speaker(self):
        self.util_add_user_as_last_speaker()
        user2 = get_user_model().objects.create_user(
            username="test_user_KLGHjkHJKBhjJHGGJKJn",
            password="test_password_JHt678VbhjuGhj76hjGA",
        )
        speaker2 = Speaker.objects.add(user2, self.list_of_speakers)

        response = self.client.post(
            reverse(
                "listofspeakers-readd-last-speaker", args=[self.list_of_speakers.pk]
            )
        )
        self.assertEqual(response.status_code, 200)
        speaker = Speaker.objects.get(user__pk=self.user.pk)
        self.assertTrue(
            speaker.begin_time is None
            and speaker.end_time is None
            and speaker.weight is not None
        )
        self.assertTrue(speaker.weight < speaker2.weight)

    def test_readd_last_speaker_no_admin(self):
        self.util_add_user_as_last_speaker()
        self.make_admin_delegate()

        response = self.client.post(
            reverse(
                "listofspeakers-readd-last-speaker", args=[self.list_of_speakers.pk]
            )
        )
        self.assertEqual(response.status_code, 403)


class Speak(TestCase):
    """
    Tests view to begin or end speech.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.list_of_speakers = Topic.objects.create(
            title="test_title_KooDueco3zaiGhiraiho"
        ).list_of_speakers
        self.user = get_user_model().objects.create_user(
            username="test_user_Aigh4vohb3seecha4aa4",
            password="test_password_eneupeeVo5deilixoo8j",
        )

    def test_begin_speech(self):
        Speaker.objects.add(self.user, self.list_of_speakers)
        speaker = Speaker.objects.add(
            get_user_model().objects.get(username="admin"), self.list_of_speakers
        )
        self.assertTrue(Speaker.objects.get(pk=speaker.pk).begin_time is None)
        response = self.client.put(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk]),
            {"speaker": speaker.pk},
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).begin_time is None)

    def test_begin_speech_next_speaker(self):
        speaker = Speaker.objects.add(self.user, self.list_of_speakers)
        Speaker.objects.add(
            get_user_model().objects.get(username="admin"), self.list_of_speakers
        )

        response = self.client.put(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk])
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).begin_time is None)

    def test_begin_speech_invalid_speaker_id(self):
        response = self.client.put(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk]),
            {"speaker": "1"},
        )
        self.assertEqual(response.status_code, 400)

    def test_begin_speech_invalid_data(self):
        response = self.client.put(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk]),
            {"speaker": "invalid"},
        )
        self.assertEqual(response.status_code, 400)

    def test_end_speech(self):
        speaker = Speaker.objects.add(
            get_user_model().objects.get(username="admin"), self.list_of_speakers
        )
        speaker.begin_speech()
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).begin_time is None)
        self.assertTrue(Speaker.objects.get(pk=speaker.pk).end_time is None)
        response = self.client.delete(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).end_time is None)

    def test_end_speech_no_current_speaker(self):
        response = self.client.delete(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk])
        )
        self.assertEqual(response.status_code, 400)

    def test_begin_speech_with_countdown(self):
        config["agenda_couple_countdown_and_speakers"] = True
        Speaker.objects.add(self.user, self.list_of_speakers)
        speaker = Speaker.objects.add(
            get_user_model().objects.get(username="admin"), self.list_of_speakers
        )
        self.client.put(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk]),
            {"speaker": speaker.pk},
        )
        # Countdown should be created with pk=1 and running
        self.assertEqual(Countdown.objects.all().count(), 1)
        countdown = Countdown.objects.get(pk=1)
        self.assertTrue(countdown.running)

    def test_end_speech_with_countdown(self):
        config["agenda_couple_countdown_and_speakers"] = True
        speaker = Speaker.objects.add(
            get_user_model().objects.get(username="admin"), self.list_of_speakers
        )
        speaker.begin_speech()
        self.client.delete(
            reverse("listofspeakers-speak", args=[self.list_of_speakers.pk])
        )
        # Countdown should be created with pk=1 and stopped
        self.assertEqual(Countdown.objects.all().count(), 1)
        countdown = Countdown.objects.get(pk=1)
        self.assertFalse(countdown.running)


class Numbering(TestCase):
    """
    Tests view to number the agenda
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.item_1 = Topic.objects.create(
            title="test_title_thuha8eef7ohXar3eech"
        ).agenda_item
        self.item_1.type = Item.AGENDA_ITEM
        self.item_1.weight = 1
        self.item_1.save()
        self.item_2 = Topic.objects.create(
            title="test_title_eisah7thuxa1eingaeLo"
        ).agenda_item
        self.item_2.type = Item.AGENDA_ITEM
        self.item_2.weight = 2
        self.item_2.save()
        self.item_2_1 = Topic.objects.create(
            title="test_title_Qui0audoaz5gie1phish"
        ).agenda_item
        self.item_2_1.type = Item.AGENDA_ITEM
        self.item_2_1.parent = self.item_2
        self.item_2_1.save()
        self.item_3 = Topic.objects.create(
            title="test_title_ah7tphisheineisgaeLo"
        ).agenda_item
        self.item_3.type = Item.AGENDA_ITEM
        self.item_3.weight = 3
        self.item_3.save()

    def test_numbering(self):
        response = self.client.post(reverse("item-numbering"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, "1")
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, "2")
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, "2.1")
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, "3")

    def test_deactivated_numbering(self):
        config["agenda_enable_numbering"] = False

        response = self.client.post(reverse("item-numbering"))
        self.assertEqual(response.status_code, 400)

    def test_roman_numbering(self):
        config["agenda_numeral_system"] = "roman"

        response = self.client.post(reverse("item-numbering"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, "I")
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, "II")
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, "II.1")
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, "III")

    def test_with_internal_item(self):
        self.item_2.type = Item.INTERNAL_ITEM
        self.item_2.save()

        response = self.client.post(reverse("item-numbering"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, "1")
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, "")
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, "")
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, "2")

    def test_reset_numbering_with_internal_item(self):
        self.item_2.item_number = "test_number_Cieghae6ied5ool4hiem"
        self.item_2.type = Item.INTERNAL_ITEM
        self.item_2.save()
        self.item_2_1.item_number = "test_number_roQueTohg7fe1Is7aemu"
        self.item_2_1.save()

        response = self.client.post(reverse("item-numbering"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, "1")
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, "")
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, "")
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, "2")
