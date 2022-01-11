import base64
import re
from collections import defaultdict
from datetime import datetime
from typing import Any

from asgiref.sync import async_to_sync
from django.conf import settings
from django.db import connections

from openslides.mediafiles.models import Mediafile
from openslides.mediafiles.views import (
    mediafile_database_tablename,
    use_mediafile_database,
)
from openslides.motions.models import Motion
from openslides.users.views import demo_mode_users, is_demo_mode
from openslides.utils import logging
from openslides.utils.cache import element_cache


def copy(obj, *attrs):
    return {attr: obj[attr] for attr in attrs if attr in obj}


fromisoformat = getattr(datetime, "fromisoformat", None)  # type: ignore


def to_unix_time(datetime_str):
    if not datetime_str:
        return None
    if not fromisoformat:
        return 0  # Only available with python >=3.7...
    return int(fromisoformat(datetime_str).timestamp())


def max_or_zero(iterable):
    as_list = list(iterable)
    if len(as_list) == 0:
        return 0
    else:
        return max(as_list)


COLLECTION_MAPPING = {
    "agenda/item": "agenda_item",
    "agenda/list-of-speakers": "list_of_speakers",
    "assignments/assignment": "assignment",
    "assignments/assignment-option": "option",
    "assignments/assignment-poll": "poll",
    "assignments/assignment-vote": "vote",
    "chat/chat-group": "chat_group",
    "core/countdown": "projector_countdown",
    "core/projector": "projector",
    "core/projector-message": "projector_message",
    "mediafiles/mediafile": "mediafile",
    "motions/category": "motion_category",
    "motions/motion": "motion",
    "motions/motion-block": "motion_block",
    "motions/motion-change-recommendation": "motion_change_recommendation",
    "motions/motion-comment-section": "motion_comment_section",
    "motions/motion-option": "option",
    "motions/motion-poll": "poll",
    "motions/motion-vote": "vote",
    "motions/state": "motion_state",
    "motions/statute-paragraph": "motion_statute_paragraph",
    "motions/workflow": "motion_workflow",
    "topics/topic": "topic",
    "users/group": "group",
    "users/personal-note": "personal_note",
    "users/user": "user",
}


PERMISSION_MAPPING = {
    "agenda.can_see": "agenda_item.can_see",
    "agenda.can_see_internal_items": "agenda_item.can_see_internal",
    "agenda.can_manage": "agenda_item.can_manage",
    "assignments.can_see": "assignment.can_see",
    "assignments.can_manage": "assignment.can_manage",
    "assignments.can_nominate_other": "assignment.can_nominate_other",
    "assignments.can_nominate_self": "assignment.can_nominate_self",
    "chat.can_manage": "chat.can_manage",
    "agenda.can_see_list_of_speakers": "list_of_speakers.can_see",
    "agenda.can_manage_list_of_speakers": "list_of_speakers.can_manage",
    "agenda.can_be_speaker": "list_of_speakers.can_be_speaker",
    "mediafiles.can_see": "mediafile.can_see",
    "mediafiles.can_manage": "mediafile.can_manage",
    "core.can_manage_config": "meeting.can_manage_settings",
    "core.can_manage_logos_and_fonts": "meeting.can_manage_logos_and_fonts",
    "core.can_see_frontpage": "meeting.can_see_frontpage",
    "core.can_see_autopilot": "meeting.can_see_autopilot",
    "core.can_see_livestream": "meeting.can_see_livestream",
    "core.can_see_history": "meeting.can_see_history",
    "motions.can_see": "motion.can_see",
    "motions.can_see_internal": "motion.can_see_internal",
    "motions.can_manage": "motion.can_manage",
    "motions.can_manage_metadata": "motion.can_manage_metadata",
    "motions.can_manage_polls": "motion.can_manage_polls",
    "motions.can_create": "motion.can_create",
    "motions.can_create_amendments": "motion.can_create_amendments",
    "motions.can_support": "motion.can_support",
    "core.can_see_projector": "projector.can_see",
    "core.can_manage_projector": "projector.can_manage",
    "core.can_manage_tags": "projector.can_manage",
    "users.can_see_extra_data": "user.can_see_extra_data",
    "users.can_see_name": "user.can_see",
    "users.can_manage": "user.can_manage",
    "users.can_change_password": None,
}


PERMISSION_HIERARCHIE = {
    "agenda_item.can_manage": ["agenda_item.can_see_internal", "agenda_item.can_see"],
    "agenda_item.can_see_internal": ["agenda_item.can_see"],
    "assignment.can_manage": ["assignment.can_nominate_other", "assignment.can_see"],
    "assignment.can_nominate_other": ["assignment.can_see"],
    "assignment.can_nominate_self": ["assignment.can_see"],
    "list_of_speakers.can_manage": ["list_of_speakers.can_see"],
    "list_of_speakers.can_be_speaker": ["list_of_speakers.can_see"],
    "mediafile.can_manage": ["mediafile.can_see"],
    "motion.can_manage": [
        "motion.can_manage_metadata",
        "motion.can_manage_polls",
        "motion.can_see_internal",
        "motion.can_create",
        "motion.can_create_amendments",
        "motion.can_see",
    ],
    "motion.can_manage_metadata": ["motion.can_see"],
    "motion.can_manage_polls": ["motion.can_see"],
    "motion.can_see_internal": ["motion.can_see"],
    "motion.can_create": ["motion.can_see"],
    "motion.can_create_amendments": ["motion.can_see"],
    "motion.can_support": ["motion.can_see"],
    "projector.can_manage": ["projector.can_see"],
    "user.can_manage": ["user.can_see_extra_data", "user.can_see"],
    "user.can_see_extra_data": ["user.can_see"],
}


PROJECTION_DEFAULT_NAME_MAPPING = {
    "agenda_all_items": "agenda_all_items",
    "topics": "topics",
    "agenda_list_of_speakers": "list_of_speakers",
    "agenda_current_list_of_speakers": "current_list_of_speakers",
    "motions": "motion",
    "amendments": "amendment",
    "motionBlocks": "motion_block",
    "assignments": "assignment",
    "users": "user",
    "mediafiles": "mediafile",
    "messages": "projector_message",
    "countdowns": "projector_countdowns",
    "assignment_poll": "assignment_poll",
    "motion_poll": "motion_poll",
}


class OS4ExporterException(Exception):
    pass


class OS4Exporter:
    def __init__(self):
        self.all_data = async_to_sync(element_cache.get_all_data_list)()
        self._all_data_dict = None
        self.data: Any = defaultdict(dict)
        self.meeting: Any = {"id": 1, "projection_ids": []}

    def get_data(self):
        self.modify_motion_poll_ids()
        self.fill_all_data_dict()

        self.set_model("meeting", self.meeting)
        self.migrate_agenda_items()
        self.migrate_topics()
        self.migrate_list_of_speakers()
        self.migrate_voting_system()
        self.migrate_tags()
        self.migrate_chat_groups()
        self.migrate_assignments()
        self.migrate_mediafiles()
        self.migrate_motions()
        self.migrate_motion_comment_sections()
        self.migrate_motion_blocks()
        self.migrate_motion_categories()
        self.migrate_motion_change_recommendations()
        self.migrate_motion_statute_paragraphs()
        self.migrate_motion_states()
        self.migrate_motion_workflows()
        self.migrate_projector_messages()
        self.migrate_projector_countdowns()
        self.migrate_personal_notes()
        self.migrate_users()
        self.migrate_groups()
        self.migrate_projectors()
        self.migrate_meeting()

        # Note: When returning self.all_data one has access to the original data to compare it to the export.
        # return {"all": self.all_data, "export": self.to_list_format()}
        return self.data

    def set_model(self, collection, model):
        if model["id"] in self.data[collection]:
            raise OS4ExporterException(f"Tried to overwrite {collection}/{model['id']}")
        self.data[collection][model["id"]] = model

    def get_model(self, collection, id):
        return self.data[collection][id]

    def exists_model(self, collection, id):
        return id in self.data[collection]

    def iter_collection(self, collection):
        return self.data[collection].values()

    def to_list_format(self):
        data = {}
        for collection, models in self.data.items():
            data[collection] = list(models.values())
        return data

    def fill_all_data_dict(self):
        self._all_data_dict = {
            "chat_message": {},  # not exported
        }
        for collection, models in self.all_data.items():
            self._all_data_dict[collection] = {model["id"]: model for model in models}

    def get_old_model(self, collection, id):
        if not self._all_data_dict:
            raise OS4ExporterException("Used too early!")
        return self._all_data_dict[collection][id]

    def get_collection(self, collection):
        return self.all_data.get(collection, [])

    def to_fqid(self, *args):
        """takes a {"collection": "..", "id": ..} dict or two params (collection, id) and converts it to an fqid"""
        if len(args) == 1:
            collection = args[0]["collection"]
            id = args[0]["id"]
        else:
            collection = args[0]
            id = args[1]
        id = self.to_new_id(collection, id)
        return f"{COLLECTION_MAPPING[collection]}/{id}"

    def to_new_id(self, collection, id):
        if collection == "motions/motion-poll":
            id += self.motion_poll_id_offset
        elif collection == "motions/motion-option":
            id += self.motion_option_id_offset
        elif collection == "motions/motion-vote":
            id += self.motion_vote_id_offset
        return id

    def get_generic_reverse_relation(self, this_id, field, collections):
        fqids = []
        for collection in collections:
            for model in self.get_collection(collection):
                ids = model.get(field, [])
                if this_id in ids:
                    fqids.append(self.to_fqid(collection, model["id"]))
        return fqids

    def modify_motion_poll_ids(self):
        """add max_or_zero(assignmentpoll_id) to every motion poll. The same for votes and options."""
        # poll
        self.motion_poll_id_offset = max_or_zero(
            [x["id"] for x in self.get_collection("assignments/assignment-poll")]
        )
        self.motion_option_id_offset = max_or_zero(
            [x["id"] for x in self.get_collection("assignments/assignment-option")]
        )
        self.motion_vote_id_offset = max_or_zero(
            [x["id"] for x in self.get_collection("assignments/assignment-vote")]
        )

        for motion_poll in self.get_collection("motions/motion-poll"):
            motion_poll["id"] += self.motion_poll_id_offset

        for motion_option in self.get_collection("motions/motion-option"):
            motion_option["id"] += self.motion_option_id_offset
            motion_option["poll_id"] += self.motion_poll_id_offset

        for motion_vote in self.get_collection("motions/motion-vote"):
            motion_vote["id"] += self.motion_vote_id_offset
            motion_vote["option_id"] += self.motion_option_id_offset

        self.option_id_counter = (
            max_or_zero([x["id"] for x in self.get_collection("motions/motion-option")])
            + 1
        )

    def migrate_agenda_items(self):
        for old in self.get_collection("agenda/item"):
            new = copy(
                old,
                "id",
                "item_number",
                "comment",
                "closed",
                "is_internal",
                "is_hidden",
                "level",
                "weight",
                "parent_id",
            )
            new["type"] = {1: "common", 2: "internal", 3: "hidden"}[old["type"]]
            new["duration"] = old.get("duration", 0)
            new["content_object_id"] = self.to_fqid(old["content_object"])
            new["child_ids"] = [
                x["id"]
                for x in self.get_collection("agenda/item")
                if x["parent_id"] == old["id"]
            ]
            new["tag_ids"] = old["tags_id"]
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("agenda_item", new)

    def migrate_topics(self):
        for old in self.get_collection("topics/topic"):
            new = copy(
                old, "id", "title", "text", "agenda_item_id", "list_of_speakers_id"
            )
            new["attachment_ids"] = old["attachments_id"]
            new["option_ids"] = []
            new["tag_ids"] = []
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("topic", new)

    def migrate_list_of_speakers(self):
        for old in self.get_collection("agenda/list-of-speakers"):
            new = copy(old, "id", "closed")
            new["content_object_id"] = self.to_fqid(old["content_object"])
            new["speaker_ids"] = self.create_speakers(old["speakers"], old["id"])
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("list_of_speakers", new)

    def create_speakers(self, speakers, los_id):
        ids = []
        for old in speakers:
            new = copy(
                old,
                "id",
                "note",
                "point_of_order",
                "user_id",
                "weight",
            )
            new["begin_time"] = to_unix_time(old["begin_time"])
            new["end_time"] = to_unix_time(old["end_time"])
            if old["marked"]:
                new["speech_state"] = "contribution"
            elif old["pro_speech"] is True:
                new["speech_state"] = "pro"
            elif old["pro_speech"] is False:
                new["speech_state"] = "contra"
            else:
                new["speech_state"] = None
            new["list_of_speakers_id"] = los_id
            new["meeting_id"] = 1
            ids.append(old["id"])
            self.set_model("speaker", new)
        return ids

    def migrate_voting_system(self):
        # reverse relations option/vote_ids and poll/option_ids are calculated at the end.
        self.migrate_votes("assignments/assignment-vote")
        self.migrate_votes("motions/motion-vote")
        self.migrate_options("assignments/assignment-option")
        self.migrate_options("motions/motion-option")
        self.migrate_polls("assignments/assignment-poll")
        self.migrate_polls("motions/motion-poll")
        # motion polls
        self.move_votes_to_global_options()
        self.calculate_poll_reverse_relations()

    def migrate_votes(self, collection):
        for old in self.get_collection(collection):
            new = copy(
                old,
                "id",
                "weight",
                "value",
                "user_token",
                "option_id",
                "user_id",
                "delegated_user_id",
            )
            new["meeting_id"] = 1
            self.set_model("vote", new)

    def migrate_options(self, collection):
        for old in self.get_collection(collection):
            new = copy(old, "id", "yes", "no", "abstain", "poll_id")
            if "assignment" in collection:
                new["content_object_id"] = self.to_fqid("users/user", old["user_id"])
            else:  # motion
                poll = self.get_old_model("motions/motion-poll", old["poll_id"])
                new["content_object_id"] = self.to_fqid(
                    "motions/motion", poll["motion_id"]
                )
            new["text"] = None
            new["weight"] = old.get("weight", 1)  # not defined for motion options
            new["used_as_global_option_in_poll_id"] = None
            new["meeting_id"] = 1
            self.set_model("option", new)

    def migrate_polls(self, collection):
        for old in self.get_collection(collection):
            new = copy(
                old,
                "id",
                "title",
                "type",
                "is_pseudoanonymized",
                "pollmethod",
                "onehundred_percent_base",
                "votesvalid",
                "votesinvalid",
                "votescast",
                "entitled_users_at_stop",
            )
            new["state"] = {1: "created", 2: "started", 3: "finished", 4: "published"}[
                old["state"]
            ]
            if "assignment" in collection:
                new["content_object_id"] = self.to_fqid(
                    "assignments/assignment", old["assignment_id"]
                )
            else:  # motion
                new["content_object_id"] = self.to_fqid(
                    "motions/motion", old["motion_id"]
                )

            # these fields are not set by motion polls.
            new["description"] = old.get("description", "")
            new["min_votes_amount"] = old.get("min_votes_amount", 1)
            new["max_votes_amount"] = old.get("max_votes_amount", 1)
            new["global_yes"] = old.get("global_yes", False)
            new["global_no"] = old.get("global_no", False)
            new["global_abstain"] = old.get("global_abstain", False)

            new["entitled_group_ids"] = old["groups_id"]
            new["backend"] = "fast"
            new["voted_ids"] = old["voted_id"]
            new["global_option_id"] = self.create_global_option(old)
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("poll", new)

    def create_global_option(self, poll):
        id = self.option_id_counter
        self.option_id_counter += 1
        option = {
            "id": id,
            "weight": 1,
            "text": None,
            "yes": poll.get("amount_global_yes", "0.000000"),
            "no": poll.get("amount_global_no", "0.000000"),
            "abstain": poll.get("amount_global_abstain", "0.000000"),
            "poll_id": None,
            "used_as_global_option_in_poll_id": poll["id"],
            "vote_ids": [],
            "content_object_id": None,
            "meeting_id": 1,
        }
        self.set_model("option", option)
        return id

    def move_votes_to_global_options(self):
        for vote in self.iter_collection("vote"):
            option = self.get_model("option", vote["option_id"])
            poll = self.get_model("poll", option["poll_id"])
            if vote["value"] not in poll["pollmethod"]:
                # this vote is not valied for the method -> it must be a global vote.
                # remove this vote from this option and add it to the global one.
                # Do not care about the reverse relations - they are done later.
                vote["option_id"] = poll["global_option_id"]

    def calculate_poll_reverse_relations(self):
        # poll/option_ids
        for poll in self.iter_collection("poll"):
            poll["option_ids"] = [
                x["id"]
                for x in self.iter_collection("option")
                if x["poll_id"] == poll["id"]
            ]
        # option/vote_ids
        for option in self.iter_collection("option"):
            option["vote_ids"] = [
                x["id"]
                for x in self.iter_collection("vote")
                if x["option_id"] == option["id"]
            ]

    def migrate_tags(self):
        for old in self.get_collection("core/tag"):
            new = copy(old, "id", "name")
            new["tagged_ids"] = self.get_generic_reverse_relation(
                old["id"],
                "tags_id",
                (
                    "agenda/item",
                    "topics/topic",
                    "motions/motion",
                    "assignments/assignment",
                ),
            )
            new["meeting_id"] = 1
            self.set_model("tag", new)

    def migrate_chat_groups(self):
        for old in self.get_collection("chat/chat-group"):
            new = copy(old, "id", "name")
            new["weight"] = old["id"]
            new["read_group_ids"] = old["read_groups_id"]
            new["write_group_ids"] = old["write_groups_id"]
            new["meeting_id"] = 1
            new["chat_message_ids"] = []
            self.set_model("chat_group", new)

    def migrate_assignments(self):
        for old in self.get_collection("assignments/assignment"):
            new = copy(
                old,
                "id",
                "title",
                "description",
                "open_posts",
                "default_poll_description",
                "number_poll_candidates",
                "agenda_item_id",
                "list_of_speakers_id",
            )
            new["phase"] = {0: "search", 1: "voting", 2: "finished"}[old["phase"]]
            new["candidate_ids"] = self.create_assignment_candidates(
                old["assignment_related_users"], old["id"]
            )
            new["poll_ids"] = [
                x["id"]
                for x in self.iter_collection("poll")
                if x["content_object_id"] == f"assignment/{old['id']}"
            ]
            new["attachment_ids"] = old["attachments_id"]
            new["tag_ids"] = old["tags_id"]
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("assignment", new)

    def create_assignment_candidates(self, assignment_candidates, assignment_id):
        ids = []
        for old in assignment_candidates:
            new = copy(old, "id", "weight", "user_id")
            new["assignment_id"] = assignment_id
            new["meeting_id"] = 1
            ids.append(old["id"])
            self.set_model("assignment_candidate", new)
        return ids

    def migrate_mediafiles(self):
        for old in self.get_collection("mediafiles/mediafile"):
            new = copy(
                old,
                "id",
                "title",
                "is_directory",
                "mimetype",
                "pdf_information",
                "parent_id",
                "list_of_speakers_id",
            )

            mediafile_blob_data = self.get_mediafile_blob_data(old)
            if not mediafile_blob_data:
                new["filename"] = old["title"]
                new["filesize"] = 0
                new["blob"] = None
            else:
                new["filename"], new["filesize"], new["blob"] = mediafile_blob_data

            new["create_timestamp"] = to_unix_time(old["create_timestamp"])

            new["access_group_ids"] = old["access_groups_id"]
            new["is_public"] = old["inherited_access_groups_id"] is True
            inherited_access_groups_id = old["inherited_access_groups_id"]
            if inherited_access_groups_id in (True, False):
                new["inherited_access_group_ids"] = []
            else:
                new["inherited_access_group_ids"] = inherited_access_groups_id
            new["child_ids"] = [
                x["id"]
                for x in self.get_collection("mediafiles/mediafile")
                if x["parent_id"] == old["id"]
            ]
            new["attachment_ids"] = self.get_generic_reverse_relation(
                old["id"],
                "attachments_id",
                (
                    "topics/topic",
                    "motions/motion",
                    "assignments/assignment",
                ),
            )
            new["projection_ids"] = []

            # will be set when migrating the meeting
            new["used_as_logo_$_in_meeting_id"] = []
            new["used_as_font_$_in_meeting_id"] = []

            new["meeting_id"] = 1
            self.set_model("mediafile", new)

    def get_mediafile_blob_data(self, old):
        """
        Returns the tuple (filename, filesize, blob) with blob being base64 encoded
        in a string. If there is an error or no mediafile, None is returned.
        """
        if old["is_directory"]:
            return None

        try:
            db_mediafile = Mediafile.objects.get(pk=old["id"])
        except Mediafile.DoesNotExist:
            return None
        filename = db_mediafile.original_filename

        if use_mediafile_database:
            with connections["mediafiles"].cursor() as cursor:
                cursor.execute(
                    f"SELECT data FROM {mediafile_database_tablename} WHERE id = %s",
                    [old["id"]],
                )
                row = cursor.fetchone()
                if row is None:
                    return None
                data = row[0]
        else:
            data = db_mediafile.mediafile.open().read()

        blob = base64.b64encode(data).decode("utf-8")
        return filename, len(data), blob

    def migrate_motions(self):
        recommendation_reference_motion_ids_regex = re.compile(
            r"\[motion:(?P<id>\d+)\]"
        )

        db_number_values = {}
        for motion in Motion.objects.all():
            db_number_values[motion.id] = motion.identifier_number
        for old in self.get_collection("motions/motion"):
            new = copy(
                old,
                "id",
                "title",
                "text",
                "modified_final_version",
                "reason",
                "category_weight",
                "state_extension",
                "recommendation_extension",
                "sort_weight",
                "state_id",
                "recommendation_id",
                "category_id",
                "statute_paragraph_id",
                "agenda_item_id",
                "list_of_speakers_id",
            )
            new["number"] = old["identifier"]
            new["number_value"] = db_number_values[old["id"]]
            new["sequential_number"] = old["id"]
            new["amendment_paragraph_$"] = []
            if old["amendment_paragraphs"]:
                for i, content in enumerate(old["amendment_paragraphs"]):
                    new["amendment_paragraph_$"].append(str(i + 1))
                    new[f"amendment_paragraph_${i+1}"] = content
            new["sort_weight"] = old["weight"]
            new["created"] = to_unix_time(old["created"])
            new["last_modified"] = to_unix_time(old["last_modified"])

            new["lead_motion_id"] = old["parent_id"]
            new["amendment_ids"] = [
                x["id"]
                for x in self.get_collection("motions/motion")
                if x["parent_id"] == old["id"]
            ]
            new["sort_parent_id"] = old["sort_parent_id"]
            new["sort_child_ids"] = [
                x["id"]
                for x in self.get_collection("motions/motion")
                if x["sort_parent_id"] == old["id"]
            ]
            new["origin_id"] = None
            new["derived_motion_ids"] = []
            new["all_origin_ids"] = []
            new["all_derived_motion_ids"] = []
            new["block_id"] = old["motion_block_id"]
            new["submitter_ids"] = self.create_motion_submitters(old["submitters"])
            new["supporter_ids"] = old["supporters_id"]
            new["poll_ids"] = [
                x["id"]
                for x in self.iter_collection("poll")
                if x["content_object_id"] == f"motion/{old['id']}"
            ]
            new["option_ids"] = [
                x["id"]
                for x in self.iter_collection("option")
                if x["content_object_id"] == f"motion/{old['id']}"
            ]
            new["change_recommendation_ids"] = old["change_recommendations_id"]
            new["comment_ids"] = self.create_motion_comments(old["comments"], old["id"])
            new["tag_ids"] = old["tags_id"]
            new["attachment_ids"] = old["attachments_id"]
            new[
                "personal_note_ids"
            ] = []  # will be filled later while migrating personal notes
            new["projection_ids"] = []
            new["meeting_id"] = 1

            new["recommendation_extension_reference_ids"] = []
            if new["recommendation_extension"]:

                def replace_fn(matchobj):
                    id = int(matchobj.group("id"))
                    new["recommendation_extension_reference_ids"].append(f"motion/{id}")
                    return f"[motion/{id}]"

                new[
                    "recommendation_extension"
                ] = recommendation_reference_motion_ids_regex.sub(
                    replace_fn, new["recommendation_extension"]
                )

            self.set_model("motion", new)

        for motion in self.iter_collection("motion"):
            motion["referenced_in_motion_recommendation_extension_ids"] = [
                x["id"]
                for x in self.iter_collection("motion")
                if f"motion/{motion['id']}"
                in x["recommendation_extension_reference_ids"]
            ]

    def create_motion_submitters(self, submitters):
        ids = []
        for old in submitters:
            new = copy(old, "id", "motion_id", "weight", "user_id")
            new["meeting_id"] = 1
            ids.append(old["id"])
            self.set_model("motion_submitter", new)
        return ids

    def create_motion_comments(self, comments, motion_id):
        ids = []
        for old in comments:
            new = copy(old, "id", "section_id", "comment")
            new["motion_id"] = motion_id
            new["meeting_id"] = 1
            ids.append(old["id"])
            self.set_model("motion_comment", new)
        return ids

    def migrate_motion_comment_sections(self):
        for old in self.get_collection("motions/motion-comment-section"):
            new = copy(
                old,
                "id",
                "name",
                "weight",
            )
            new["read_group_ids"] = old["read_groups_id"]
            new["write_group_ids"] = old["write_groups_id"]
            new["comment_ids"] = [
                x["id"]
                for x in self.iter_collection("motion_comment")
                if x["section_id"] == old["id"]
            ]
            new["meeting_id"] = 1
            self.set_model("motion_comment_section", new)

    def migrate_motion_blocks(self):
        for old in self.get_collection("motions/motion-block"):
            new = copy(
                old, "id", "title", "internal", "agenda_item_id", "list_of_speakers_id"
            )
            new["motion_ids"] = [
                x["id"]
                for x in self.get_collection("motions/motion")
                if x["motion_block_id"] == old["id"]
            ]
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("motion_block", new)

    def migrate_motion_categories(self):
        for old in self.get_collection("motions/category"):
            new = copy(old, "id", "name", "prefix", "weight", "level", "parent_id")

            new["child_ids"] = [
                x["id"]
                for x in self.get_collection("motions/category")
                if x["parent_id"] == old["id"]
            ]
            new["motion_ids"] = [
                x["id"]
                for x in self.get_collection("motions/motion")
                if x["category_id"] == old["id"]
            ]
            new["meeting_id"] = 1
            self.set_model("motion_category", new)

    def migrate_motion_change_recommendations(self):
        for old in self.get_collection("motions/motion-change-recommendation"):
            new = copy(
                old,
                "id",
                "rejected",
                "internal",
                "other_description",
                "line_from",
                "line_to",
                "text",
                "motion_id",
            )
            new["type"] = {0: "replacement", 1: "insertion", 2: "deletion", 3: "other"}[
                old["type"]
            ]
            new["creation_time"] = to_unix_time(old["creation_time"])
            new["meeting_id"] = 1
            self.set_model("motion_change_recommendation", new)

    def migrate_motion_statute_paragraphs(self):
        for old in self.get_collection("motions/statute-paragraph"):
            new = copy(old, "id", "title", "text", "weight")
            new["motion_ids"] = [
                x["id"]
                for x in self.get_collection("motions/motion")
                if x["statute_paragraph_id"] == old["id"]
            ]
            new["meeting_id"] = 1
            self.set_model("motion_statute_paragraph", new)

    def migrate_motion_states(self):
        for old in self.get_collection("motions/state"):
            new = copy(
                old,
                "id",
                "name",
                "recommendation_label",
                "allow_support",
                "allow_create_poll",
                "allow_submitter_edit",
                "show_state_extension_field",
                "show_recommendation_extension_field",
                "workflow_id",
            )
            if old["css_class"] in (
                "grey",
                "red",
                "green",
                "lightblue",
                "yellow",
            ):
                new["css_class"] = old["css_class"]
            else:
                new["css_class"] = "lightblue"
            new["weight"] = old["id"]

            new["restrictions"] = []
            restrictions_map = {
                "motions.can_see_internal": "motion.can_see_internal",
                "motions.can_manage_metadata": "motion.can_manage_metadata",
                "motions.can_manage": "motion.can_manage",
                "managers_only": "motion.can_manage",  # Should not exist any more since migration 0026, but does anyway...
                "is_submitter": "is_submitter",
            }
            for restriction in old["restriction"]:
                if restriction in restrictions_map:
                    new["restrictions"].append(restrictions_map[restriction])
                else:
                    logging.getLogger(__name__).warn(
                        f"Invalid restriction '{restriction}' for motion {old['id']} is ignored."
                    )

            new["set_number"] = not old["dont_set_identifier"]
            new["merge_amendment_into_final"] = {
                -1: "do_not_merge",
                0: "undefined",
                1: "do_merge",
            }[old["merge_amendment_into_final"]]

            new["next_state_ids"] = old["next_states_id"]
            new["previous_state_ids"] = [
                x["id"]
                for x in self.get_collection("motions/state")
                if old["id"] in x["next_states_id"]
            ]
            new["motion_ids"] = [
                x["id"]
                for x in self.get_collection("motions/motion")
                if x["state_id"] == old["id"]
            ]
            new["motion_recommendation_ids"] = [
                x["id"]
                for x in self.get_collection("motions/motion")
                if x["recommendation_id"] == old["id"]
            ]
            new[
                "first_state_of_workflow_id"
            ] = None  # will be set when migrating workflows.
            new["meeting_id"] = 1
            self.set_model("motion_state", new)

    def migrate_motion_workflows(self):
        for old in self.get_collection("motions/workflow"):
            new = copy(
                old,
                "id",
                "name",
                "first_state_id",
            )
            new["state_ids"] = old["states_id"]
            first_state = self.get_model("motion_state", old["first_state_id"])
            first_state["first_state_of_workflow_id"] = old["id"]
            # the following three will be set when migrating the meeting.
            new["default_workflow_meeting_id"] = None
            new["default_amendment_workflow_meeting_id"] = None
            new["default_statute_amendment_workflow_meeting_id"] = None
            new["meeting_id"] = 1
            self.set_model("motion_workflow", new)

    def migrate_projector_messages(self):
        for old in self.get_collection("core/projector-message"):
            new = copy(
                old,
                "id",
                "message",
            )
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("projector_message", new)

    def migrate_projector_countdowns(self):
        for old in self.get_collection("core/countdown"):
            new = copy(
                old,
                "id",
                "title",
                "description",
                "default_time",
                "countdown_time",
                "running",
            )
            new["used_as_list_of_speaker_countdown_meeting_id"] = None
            new["used_as_poll_countdown_meeting_id"] = None
            new["projection_ids"] = []
            new["meeting_id"] = 1
            self.set_model("projector_countdown", new)

        # Create two new countdowns: A LOS and a poll countdown
        max_countdown_id = max_or_zero(
            x["id"] for x in self.iter_collection("projector_countdown")
        )
        los_countdown = {
            "id": max_countdown_id + 1,
            "title": "list of speakers countdown",
            "description": "created at the migration from OS3 to OS4",
            "default_time": 60,
            "countdown_time": 60,
            "running": False,
            "used_as_list_of_speaker_countdown_meeting_id": 1,
            "used_as_poll_countdown_meeting_id": None,
            "projection_ids": [],
            "meeting_id": 1,
        }
        self.set_model("projector_countdown", los_countdown)
        self.meeting["list_of_speakers_countdown_id"] = max_countdown_id + 1

        poll_countdown = {
            "id": max_countdown_id + 2,
            "title": "poll countdown",
            "description": "created at the migration from OS3 to OS4",
            "default_time": 60,
            "countdown_time": 60,
            "running": False,
            "used_as_list_of_speaker_countdown_meeting_id": None,
            "used_as_poll_countdown_meeting_id": 1,
            "projection_ids": [],
            "meeting_id": 1,
        }
        self.set_model("projector_countdown", poll_countdown)
        self.meeting["poll_countdown_id"] = max_countdown_id + 2

    def migrate_personal_notes(self):
        id_counter = 1
        for old in self.get_collection("users/personal-note"):
            notes = old.get("notes", {}).get("motions/motion", {})
            for motion_id, note in notes.items():
                motion_id = int(motion_id)
                if not self.exists_model("motion", motion_id) or not isinstance(
                    note.get("note"), str
                ):
                    continue

                new = {
                    "id": id_counter,
                    "user_id": old["user_id"],
                    "content_object_id": f"motion/{motion_id}",
                    "note": note["note"],
                    "star": note.get("star", False),
                    "meeting_id": 1,
                }
                motion = self.get_model("motion", motion_id)
                motion["personal_note_ids"].append(id_counter)
                self.set_model("personal_note", new)
                id_counter += 1

    def migrate_users(self):
        for old in self.get_collection("users/user"):
            new = copy(
                old,
                "id",
                "username",
                "title",
                "first_name",
                "last_name",
                "is_active",
                "default_password",
                "gender",
                "email",
            )
            # remove invalid genders
            if new["gender"] not in ("male", "female", "diverse"):
                new["gender"] = None

            new["is_physical_person"] = not old["is_committee"]
            new["password"] = ""
            new["default_number"] = old["number"]
            new["default_structure_level"] = old["structure_level"]
            new["default_vote_weight"] = old["vote_weight"]
            new["last_email_send"] = to_unix_time(old["last_email_send"])

            new["is_demo_user"] = is_demo_mode and old["id"] in demo_mode_users
            new["organization_management_level"] = None
            new["is_present_in_meeting_ids"] = []
            if old["is_present"]:
                new["is_present_in_meeting_ids"].append(1)
            new["committee_ids"] = []
            new["committee_$_management_level"] = []
            new["comment_$"] = []
            new["number_$"] = []
            new["structure_level_$"] = []
            new["about_me_$"] = []
            new["vote_weight_$"] = []

            group_ids = old["groups_id"] or [
                1
            ]  # explicitly put users ion the default group if they do not have a group.
            self.set_template(new, "group_$_ids", group_ids)
            # check for permission
            new["can_change_own_password"] = False
            for group_id in group_ids:
                group = self.get_old_model("users/group", group_id)
                if group_id == 2 or "users.can_change_password" in group["permissions"]:
                    new["can_change_own_password"] = True
                    break

            self.set_template(
                new,
                "speaker_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("speaker")
                    if old["id"] == x["user_id"]
                ],
            )
            self.set_template(
                new,
                "personal_note_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("personal_note")
                    if old["id"] == x["user_id"]
                ],
            )
            self.set_template(
                new,
                "supported_motion_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("motion")
                    if old["id"] in x["supporter_ids"]
                ],
            )
            self.set_template(
                new,
                "submitted_motion_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("motion_submitter")
                    if old["id"] == x["user_id"]
                ],
            )
            self.set_template(
                new,
                "poll_voted_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("poll")
                    if old["id"] in x["voted_ids"]
                ],
            )
            self.set_template(
                new,
                "option_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("option")
                    if f"user/{old['id']}" == x["content_object_id"]
                ],
            )
            self.set_template(
                new,
                "vote_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("vote")
                    if old["id"] == x["user_id"]
                ],
            )
            self.set_template(
                new,
                "vote_delegated_vote_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("vote")
                    if old["id"] == x["delegated_user_id"]
                ],
            )
            self.set_template(
                new,
                "assignment_candidate_$_ids",
                [
                    x["id"]
                    for x in self.iter_collection("assignment_candidate")
                    if old["id"] == x["user_id"]
                ],
            )
            new["projection_$_ids"] = []
            self.set_template(
                new, "vote_delegated_$_to_id", old["vote_delegated_to_id"]
            )
            self.set_template(
                new, "vote_delegations_$_from_ids", old["vote_delegated_from_users_id"]
            )
            new["meeting_ids"] = [1]
            new["chat_message_$_ids"] = []

            self.set_model("user", new)

    def set_template(self, obj, field, value):
        if value:
            obj[field] = ["1"]
            parts = field.split("$")
            obj[f"{parts[0]}$1{parts[1]}"] = value
        else:
            obj[field] = []

    def migrate_groups(self):
        # important to do after users since the reverse relation to users depends on their migration.
        for old in self.get_collection("users/group"):
            new = copy(old, "id", "name")
            new["permissions"] = self.migrate_permissions(old["permissions"])

            new["user_ids"] = [
                x["id"]
                for x in self.iter_collection("user")
                if old["id"] in x["group_$1_ids"]
            ]
            new["default_group_for_meeting_id"] = (
                1 if old["id"] == 1 else None
            )  # default group
            new["admin_group_for_meeting_id"] = (
                1 if old["id"] == 2 else None
            )  # admin group
            new["mediafile_access_group_ids"] = [
                x["id"]
                for x in self.iter_collection("mediafile")
                if old["id"] in x["access_group_ids"]
            ]
            new["mediafile_inherited_access_group_ids"] = [
                x["id"]
                for x in self.iter_collection("mediafile")
                if old["id"] in x["inherited_access_group_ids"]
            ]
            new["read_comment_section_ids"] = [
                x["id"]
                for x in self.iter_collection("motion_comment_section")
                if old["id"] in x["read_group_ids"]
            ]
            new["write_comment_section_ids"] = [
                x["id"]
                for x in self.iter_collection("motion_comment_section")
                if old["id"] in x["write_group_ids"]
            ]
            new["read_chat_group_ids"] = [
                x["id"]
                for x in self.iter_collection("chat_group")
                if old["id"] in x["read_group_ids"]
            ]
            new["write_chat_group_ids"] = [
                x["id"]
                for x in self.iter_collection("chat_group")
                if old["id"] in x["write_group_ids"]
            ]
            new["poll_ids"] = [
                x["id"]
                for x in self.iter_collection("poll")
                if old["id"] in x["entitled_group_ids"]
            ]
            new[
                "used_as_motion_poll_default_id"
            ] = None  # Next 3 are set by meeting migrations
            new["used_as_assignment_poll_default_id"] = None
            new["used_as_poll_default_id"] = None
            new["meeting_id"] = 1
            self.set_model("group", new)
        self.meeting["default_group_id"] = 1
        self.meeting["admin_group_id"] = 2

    def migrate_permissions(self, perms):
        # Note that poll.can_manage is not added to any group since
        # stand-alone polls do not exist in OS3.
        perms = [
            PERMISSION_MAPPING[x] for x in perms if PERMISSION_MAPPING[x] is not None
        ]
        new_perms = set(perms)
        for perm in perms:
            new_perms -= set(PERMISSION_HIERARCHIE.get(perm, []))
        return list(new_perms)

    def migrate_projectors(self):
        self.projection_id_counter = 1
        for old in self.get_collection("core/projector"):
            new = copy(
                old,
                "id",
                "name",
                "scale",
                "scroll",
                "width",
                "aspect_ratio_numerator",
                "aspect_ratio_denominator",
                "color",
                "background_color",
                "header_background_color",
                "header_font_color",
                "header_h1_color",
                "chyron_background_color",
                "chyron_font_color",
                "show_header_footer",
                "show_title",
                "show_logo",
            )
            new["show_clock"] = False

            new["current_projection_ids"] = []
            new["preview_projection_ids"] = []
            new["history_projection_ids"] = []

            for i, element in enumerate(old["elements"]):
                if element["name"] == "core/clock":
                    new["show_clock"] = True
                    continue
                projection_id = self.create_projection_from_projector_element(
                    element, i + 1, "current", old["id"]
                )
                if projection_id > 0:
                    new["current_projection_ids"].append(projection_id)

            for i, element in enumerate(old["elements_preview"]):
                projection_id = self.create_projection_from_projector_element(
                    element, i + 1, "preview", old["id"]
                )
                if projection_id > 0:
                    new["preview_projection_ids"].append(projection_id)

            flat_history = [
                item for sublist in old["elements_history"] for item in sublist
            ]
            for i, element in enumerate(flat_history):
                projection_id = self.create_projection_from_projector_element(
                    element, i + 1, "history", old["id"]
                )
                if projection_id > 0:
                    new["history_projection_ids"].append(projection_id)

            if old["reference_projector_id"] == old["id"]:
                self.meeting["reference_projector_id"] = old["id"]
                new["used_as_reference_projector_meeting_id"] = 1
            else:
                new["used_as_reference_projector_meeting_id"] = None

            new[
                "used_as_default_$_in_meeting_id"
            ] = []  # will be filled when migrating the meeting

            new["meeting_id"] = 1
            self.set_model("projector", new)

    def create_projection_from_projector_element(
        self, element, weight, type, projector_id
    ):
        """
        type can be "current", "preview" or "history"
        registers the newly created projection and returns its id or returns -1 in case something went wrong
        """
        projection = {
            "id": self.projection_id_counter,
            "stable": element.get("stable", True),
            "weight": weight,
            "options": {},
            "current_projector_id": None,
            "preview_projector_id": None,
            "history_projector_id": None,
            "meeting_id": 1,
        }
        projection[f"{type}_projector_id"] = projector_id
        for k, v in element.items():
            if k not in ("id", "name", "stable"):
                projection["options"][k] = v

        collection = element["name"]
        if collection in COLLECTION_MAPPING:
            id = self.to_new_id(collection, element["id"])
            collection = COLLECTION_MAPPING[collection]
            projection["content_object_id"] = f"{collection}/{id}"
            projection["type"] = None
        elif collection == "agenda/item-list":
            collection = "meeting"
            id = 1
            projection["content_object_id"] = "meeting/1"
            projection["type"] = "agenda_item_list"
        elif collection in (
            "agenda/current-list-of-speakers",
            "agenda/current-list-of-speakers-overlay",
        ):
            collection = "meeting"
            id = 1
            projection["content_object_id"] = "meeting/1"
            projection["type"] = "current_list_of_speakers"
        elif collection == "agenda/current-speaker-chyron":
            collection = "meeting"
            id = 1
            projection["content_object_id"] = "meeting/1"
            projection["type"] = "current_speaker_chyron"
        elif collection == "core/clock":
            # somehow the clock got into the preview/history, just ignore
            return -1
        else:
            raise OS4ExporterException(f"Unknown slide {collection}")

        if not self.exists_model(collection, id):
            return -1
        content_object = self.get_model(collection, id)
        if collection != "user":
            content_object["projection_ids"].append(projection["id"])
        else:
            if not content_object["projection_$_ids"]:
                content_object["projection_$_ids"] = ["1"]
                content_object["projection_$1_ids"] = []
            content_object["projection_$1_ids"].append(projection["id"])

        self.projection_id_counter += 1
        self.set_model("projection", projection)
        return projection["id"]

    def migrate_meeting(self):
        configs = {
            config["key"]: config["value"]
            for config in self.get_collection("core/config")
        }

        self.meeting["welcome_title"] = configs["general_event_welcome_title"]
        self.meeting["welcome_text"] = configs["general_event_welcome_text"]

        self.meeting["name"] = configs["general_event_name"]
        self.meeting["description"] = configs["general_event_description"]
        self.meeting["location"] = configs["general_event_location"]
        self.meeting[
            "start_time"
        ] = 0  # Since it is a freehand field in OS3, it cannot be parsed
        self.meeting["end_time"] = 0

        self.meeting["jitsi_domain"] = getattr(settings, "JITSI_DOMAIN", None)
        self.meeting["jitsi_room_name"] = getattr(settings, "JITSI_ROOM_NAME", None)
        self.meeting["jitsi_room_password"] = getattr(
            settings, "JITSI_ROOM_PASSWORD", None
        )
        self.meeting["enable_chat"] = getattr(settings, "ENABLE_CHAT", False)
        self.meeting["imported_at"] = None

        self.meeting["url_name"] = None
        self.meeting["template_for_committee_id"] = None
        self.meeting["enable_anonymous"] = configs["general_system_enable_anonymous"]
        self.meeting["custom_translations"] = configs["translations"]

        self.meeting["conference_show"] = configs["general_system_conference_show"]
        self.meeting["conference_auto_connect"] = configs[
            "general_system_conference_auto_connect"
        ]
        self.meeting["conference_los_restriction"] = configs[
            "general_system_conference_los_restriction"
        ]
        self.meeting["conference_stream_url"] = configs["general_system_stream_url"]
        self.meeting["conference_stream_poster_url"] = configs[
            "general_system_stream_poster"
        ]
        self.meeting["conference_open_microphone"] = configs[
            "general_system_conference_open_microphone"
        ]
        self.meeting["conference_open_video"] = configs[
            "general_system_conference_open_video"
        ]
        self.meeting["conference_auto_connect_next_speakers"] = configs[
            "general_system_conference_auto_connect_next_speakers"
        ]
        self.meeting["conference_enable_helpdesk"] = configs[
            "general_system_conference_enable_helpdesk"
        ]

        self.meeting["applause_enable"] = configs["general_system_applause_enable"]
        self.meeting["applause_type"] = configs["general_system_applause_type"]
        self.meeting["applause_show_level"] = configs[
            "general_system_applause_show_level"
        ]
        self.meeting["applause_min_amount"] = configs[
            "general_system_applause_min_amount"
        ]
        self.meeting["applause_max_amount"] = configs[
            "general_system_applause_max_amount"
        ]
        self.meeting["applause_particle_image_url"] = configs[
            "general_system_applause_particle_image"
        ]
        self.meeting["applause_timeout"] = configs[
            "general_system_stream_applause_timeout"
        ]
        self.meeting["applause_timeout"] = configs[
            "general_system_stream_applause_timeout"
        ]

        self.meeting["projector_countdown_default_time"] = configs[
            "projector_default_countdown"
        ]
        self.meeting["projector_countdown_warning_time"] = configs[
            "agenda_countdown_warning_time"
        ]

        self.meeting["export_csv_encoding"] = configs["general_csv_encoding"]
        self.meeting["export_csv_separator"] = configs["general_csv_separator"]
        self.meeting["export_pdf_pagenumber_alignment"] = configs[
            "general_export_pdf_pagenumber_alignment"
        ]
        self.meeting["export_pdf_fontsize"] = int(
            configs["general_export_pdf_fontsize"]
        )
        self.meeting["export_pdf_pagesize"] = configs["general_export_pdf_pagesize"]

        self.meeting["agenda_show_subtitles"] = configs["agenda_show_subtitle"]
        self.meeting["agenda_enable_numbering"] = configs["agenda_enable_numbering"]
        prefix = configs["agenda_number_prefix"]
        self.meeting["agenda_number_prefix"] = (
            prefix if len(prefix) <= 20 else prefix[0:20]
        )
        self.meeting["agenda_numeral_system"] = configs["agenda_numeral_system"]
        self.meeting["agenda_item_creation"] = configs["agenda_item_creation"]
        self.meeting["agenda_new_items_default_visibility"] = {
            "1": "common",
            "2": "internal",
            "3": "hidden",
        }[configs["agenda_new_items_default_visibility"]]
        self.meeting["agenda_show_internal_items_on_projector"] = not configs[
            "agenda_hide_internal_items_on_projector"
        ]

        self.meeting["list_of_speakers_amount_last_on_projector"] = configs[
            "agenda_show_last_speakers"
        ]
        self.meeting["list_of_speakers_amount_next_on_projector"] = configs[
            "agenda_show_next_speakers"
        ]
        self.meeting["list_of_speakers_couple_countdown"] = configs[
            "agenda_couple_countdown_and_speakers"
        ]
        self.meeting["list_of_speakers_show_amount_of_speakers_on_slide"] = not configs[
            "agenda_hide_amount_of_speakers"
        ]
        self.meeting["list_of_speakers_present_users_only"] = configs[
            "agenda_present_speakers_only"
        ]
        self.meeting["list_of_speakers_show_first_contribution"] = configs[
            "agenda_show_first_contribution"
        ]
        self.meeting["list_of_speakers_enable_point_of_order_speakers"] = configs[
            "agenda_enable_point_of_order_speakers"
        ]
        self.meeting["list_of_speakers_enable_pro_contra_speech"] = configs[
            "agenda_list_of_speakers_enable_pro_contra_speech"
        ]
        self.meeting["list_of_speakers_can_set_contribution_self"] = configs[
            "agenda_list_of_speakers_can_set_mark_self"
        ]
        self.meeting["list_of_speakers_speaker_note_for_everyone"] = configs[
            "agenda_list_of_speakers_speaker_note_for_everyone"
        ]
        self.meeting["list_of_speakers_initially_closed"] = configs[
            "agenda_list_of_speakers_initially_closed"
        ]

        workflow_id = int(configs["motions_workflow"])
        workflow = self.get_model("motion_workflow", workflow_id)
        workflow["default_workflow_meeting_id"] = 1
        self.meeting["motions_default_workflow_id"] = workflow_id

        workflow_id = int(configs["motions_amendments_workflow"])
        workflow = self.get_model("motion_workflow", workflow_id)
        workflow["default_amendment_workflow_meeting_id"] = 1
        self.meeting["motions_default_amendment_workflow_id"] = workflow_id

        workflow_id = int(configs["motions_statute_amendments_workflow"])
        workflow = self.get_model("motion_workflow", workflow_id)
        workflow["default_statute_amendment_workflow_meeting_id"] = 1
        self.meeting["motions_default_statute_amendment_workflow_id"] = workflow_id

        self.meeting["motions_preamble"] = configs["motions_preamble"]
        self.meeting["motions_default_line_numbering"] = configs[
            "motions_default_line_numbering"
        ]
        self.meeting["motions_line_length"] = configs["motions_line_length"]
        self.meeting["motions_reason_required"] = configs["motions_reason_required"]
        self.meeting["motions_enable_text_on_projector"] = not configs[
            "motions_disable_text_on_projector"
        ]
        self.meeting["motions_enable_reason_on_projector"] = not configs[
            "motions_disable_reason_on_projector"
        ]
        self.meeting["motions_enable_sidebox_on_projector"] = not configs[
            "motions_disable_sidebox_on_projector"
        ]
        self.meeting["motions_enable_recommendation_on_projector"] = not configs[
            "motions_disable_recommendation_on_projector"
        ]
        self.meeting["motions_show_referring_motions"] = not configs[
            "motions_hide_referring_motions"
        ]
        self.meeting["motions_show_sequential_number"] = configs[
            "motions_show_sequential_numbers"
        ]
        self.meeting["motions_recommendations_by"] = configs[
            "motions_recommendations_by"
        ]
        self.meeting["motions_statute_recommendations_by"] = configs[
            "motions_statute_recommendations_by"
        ]
        self.meeting["motions_recommendation_text_mode"] = configs[
            "motions_recommendation_text_mode"
        ]
        self.meeting["motions_default_sorting"] = {
            "identifier": "number",
            "weight": "weight",
        }[configs["motions_motions_sorting"]]
        self.meeting["motions_number_type"] = configs["motions_identifier"]
        self.meeting["motions_number_min_digits"] = configs[
            "motions_identifier_min_digits"
        ]
        self.meeting["motions_number_with_blank"] = configs[
            "motions_identifier_with_blank"
        ]
        self.meeting["motions_statutes_enabled"] = configs["motions_statutes_enabled"]
        self.meeting["motions_amendments_enabled"] = configs[
            "motions_amendments_enabled"
        ]
        self.meeting["motions_amendments_in_main_list"] = configs[
            "motions_amendments_main_table"
        ]
        self.meeting["motions_amendments_of_amendments"] = configs[
            "motions_amendments_of_amendments"
        ]
        self.meeting["motions_amendments_prefix"] = configs["motions_amendments_prefix"]
        self.meeting["motions_amendments_text_mode"] = configs[
            "motions_amendments_text_mode"
        ]
        self.meeting["motions_amendments_multiple_paragraphs"] = configs[
            "motions_amendments_multiple_paragraphs"
        ]
        self.meeting["motions_supporters_min_amount"] = configs[
            "motions_min_supporters"
        ]
        self.meeting["motions_export_title"] = configs["motions_export_title"]
        self.meeting["motions_export_preamble"] = configs["motions_export_preamble"]
        self.meeting["motions_export_submitter_recommendation"] = configs[
            "motions_export_submitter_recommendation"
        ]
        self.meeting["motions_export_follow_recommendation"] = configs[
            "motions_export_follow_recommendation"
        ]

        self.meeting["motion_poll_ballot_paper_selection"] = configs[
            "motions_pdf_ballot_papers_selection"
        ]
        self.meeting["motion_poll_ballot_paper_number"] = configs[
            "motions_pdf_ballot_papers_number"
        ]
        self.meeting["motion_poll_default_type"] = configs["motion_poll_default_type"]
        self.meeting["motion_poll_default_100_percent_base"] = configs[
            "motion_poll_default_100_percent_base"
        ]
        self.meeting["motion_poll_default_backend"] = "fast"

        group_ids = configs["motion_poll_default_groups"]
        for group_id in group_ids:
            group = self.get_model("group", group_id)
            group["used_as_motion_poll_default_id"] = 1
        self.meeting["motion_poll_default_group_ids"] = group_ids

        self.meeting["users_sort_by"] = configs["users_sort_by"]
        self.meeting["users_enable_presence_view"] = configs[
            "users_enable_presence_view"
        ]
        self.meeting["users_enable_vote_weight"] = configs["users_activate_vote_weight"]
        self.meeting["users_allow_self_set_present"] = configs[
            "users_allow_self_set_present"
        ]
        self.meeting["users_pdf_welcometitle"] = configs["users_pdf_welcometitle"]
        self.meeting["users_pdf_welcometext"] = configs["users_pdf_welcometext"]
        self.meeting["users_pdf_url"] = configs["users_pdf_url"]
        self.meeting["users_pdf_wlan_ssid"] = configs["users_pdf_wlan_ssid"]
        self.meeting["users_pdf_wlan_password"] = configs["users_pdf_wlan_password"]
        self.meeting["users_pdf_wlan_encryption"] = configs["users_pdf_wlan_encryption"]
        self.meeting["users_email_sender"] = configs["users_email_sender"]
        self.meeting["users_email_replyto"] = configs["users_email_replyto"]
        self.meeting["users_email_subject"] = configs["users_email_subject"]
        self.meeting["users_email_body"] = configs["users_email_body"]

        self.meeting["assignments_export_title"] = configs["assignments_pdf_title"]
        self.meeting["assignments_export_preamble"] = configs[
            "assignments_pdf_preamble"
        ]

        self.meeting["assignment_poll_ballot_paper_selection"] = configs[
            "assignments_pdf_ballot_papers_selection"
        ]
        self.meeting["assignment_poll_ballot_paper_number"] = configs[
            "assignments_pdf_ballot_papers_number"
        ]
        self.meeting["assignment_poll_add_candidates_to_list_of_speakers"] = configs[
            "assignment_poll_add_candidates_to_list_of_speakers"
        ]
        self.meeting["assignment_poll_sort_poll_result_by_votes"] = configs[
            "assignment_poll_sort_poll_result_by_votes"
        ]
        self.meeting["assignment_poll_default_type"] = configs[
            "assignment_poll_default_type"
        ]
        self.meeting["assignment_poll_default_method"] = configs[
            "assignment_poll_method"
        ]
        self.meeting["assignment_poll_default_100_percent_base"] = configs[
            "assignment_poll_default_100_percent_base"
        ]
        self.meeting["assignment_poll_default_backend"] = "fast"

        group_ids = configs["assignment_poll_default_groups"]
        for group_id in group_ids:
            group = self.get_model("group", group_id)
            group["used_as_assignment_poll_default_id"] = 1
        self.meeting["assignment_poll_default_group_ids"] = group_ids

        self.meeting["poll_ballot_paper_selection"] = "CUSTOM_NUMBER"
        self.meeting["poll_ballot_paper_number"] = 8
        self.meeting["poll_sort_poll_result_by_votes"] = True
        self.meeting["poll_default_type"] = "analog"
        self.meeting["poll_default_method"] = "Y"
        self.meeting["poll_default_100_percent_base"] = "YNA"
        self.meeting["poll_default_backend"] = "fast"
        self.meeting["poll_default_group_ids"] = []
        self.meeting["poll_couple_countdown"] = True

        for collection in (
            "projector",
            "projector_message",
            "projector_countdown",
            "tag",
            "agenda_item",
            "list_of_speakers",
            "speaker",
            "topic",
            "group",
            "mediafile",
            "motion",
            "motion_comment_section",
            "motion_category",
            "motion_block",
            "motion_workflow",
            "motion_statute_paragraph",
            "motion_comment",
            "motion_submitter",
            "motion_change_recommendation",
            "motion_state",
            "poll",
            "option",
            "vote",
            "assignment",
            "assignment_candidate",
            "personal_note",
            "chat_group",
            "chat_message",
        ):
            self.meeting[f"{collection}_ids"] = [
                x["id"] for x in self.iter_collection(collection)
            ]

        self.meeting["all_projection_ids"] = [
            x["id"] for x in self.iter_collection("projection")
        ]
        # projection_ids was set when creating self.meeting

        self.migrate_logos_and_fonts(configs, "logo")
        self.migrate_logos_and_fonts(configs, "font")

        self.meeting["committee_id"] = None
        self.meeting["default_meeting_for_committee_id"] = None
        self.meeting["is_active_in_organization_id"] = None
        self.meeting["organization_tag_ids"] = []
        self.meeting["present_user_ids"] = [
            x["id"]
            for x in self.iter_collection("user")
            if 1 in x["is_present_in_meeting_ids"]
        ]
        self.meeting["user_ids"] = [x["id"] for x in self.iter_collection("user")]
        # reference_projector_id is set by the projector migration
        # list_of_speakers_countdown_id and poll_countdown_id are set by the countdown migration

        self.meeting["default_projector_$_id"] = []
        for pd in self.get_collection("core/projection-default"):
            name = PROJECTION_DEFAULT_NAME_MAPPING[pd["name"]]
            projector = self.get_model("projector", pd["projector_id"])
            projector["used_as_default_$_in_meeting_id"].append(name)
            projector[f"used_as_default_${name}_in_meeting_id"] = 1
            self.meeting["default_projector_$_id"].append(name)
            self.meeting[f"default_projector_${name}_id"] = pd["projector_id"]

        # Add "poll"
        projector_id = self.meeting["projector_ids"][0]  # get an arbitrary projector id
        projector = self.get_model("projector", projector_id)
        projector["used_as_default_$_in_meeting_id"].append("poll")
        projector["used_as_default_$poll_in_meeting_id"] = 1
        self.meeting["default_projector_$_id"].append("poll")
        self.meeting["default_projector_$poll_id"] = projector_id

        # default_group_id and admin_group_id are set by the group migration

    def migrate_logos_and_fonts(self, configs, type):
        self.meeting[f"{type}_$_id"] = []
        for place in configs[f"{type}s_available"]:
            path = configs[place].get("path", "")
            if not path:
                continue
            # find mediafile
            mediafile_id = None
            for m in self.get_collection("mediafiles/mediafile"):
                m_path = m["media_url_prefix"] + m["path"]
                if m_path == path:
                    mediafile_id = m["id"]
                    break
            if not mediafile_id:
                continue

            replacement = place.split("_", 2)[1]
            mediafile = self.get_model("mediafile", mediafile_id)
            mediafile[f"used_as_{type}_$_in_meeting_id"].append(replacement)
            mediafile[f"used_as_{type}_${replacement}_in_meeting_id"] = 1
            self.meeting[f"{type}_$_id"].append(replacement)
            self.meeting[f"{type}_${replacement}_id"] = mediafile_id
