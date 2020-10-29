from decimal import Decimal
from typing import List, Set

import jsonschema
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Case, When
from django.db.models.deletion import ProtectedError
from django.db.utils import IntegrityError
from django.http.request import QueryDict
from rest_framework import status

from openslides.poll.views import BaseOptionViewSet, BasePollViewSet, BaseVoteViewSet

from ..core.config import config
from ..core.models import Tag
from ..utils.auth import has_perm, in_some_groups
from ..utils.autoupdate import inform_changed_data, inform_deleted_data
from ..utils.rest_api import (
    ModelViewSet,
    Response,
    ReturnDict,
    ValidationError,
    detail_route,
    list_route,
)
from ..utils.views import TreeSortMixin
from .access_permissions import (
    CategoryAccessPermissions,
    MotionAccessPermissions,
    MotionBlockAccessPermissions,
    MotionChangeRecommendationAccessPermissions,
    MotionCommentSectionAccessPermissions,
    StateAccessPermissions,
    StatuteParagraphAccessPermissions,
    WorkflowAccessPermissions,
)
from .models import (
    Category,
    Motion,
    MotionBlock,
    MotionChangeRecommendation,
    MotionComment,
    MotionCommentSection,
    MotionOption,
    MotionPoll,
    MotionVote,
    State,
    StatuteParagraph,
    Submitter,
    Workflow,
)
from .numbering import numbering


# Viewsets for the REST API


class MotionViewSet(TreeSortMixin, ModelViewSet):
    """
    API endpoint for motions.

    There are a lot of views. See check_view_permissions().
    """

    access_permissions = MotionAccessPermissions()
    queryset = Motion.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("metadata", "partial_update", "update", "destroy"):
            result = has_perm(self.request.user, "motions.can_see")
            # For partial_update, update and destroy requests the rest of the check is
            # done in the update method. See below.
        elif self.action in ("create", "set_state", "manage_comments"):
            result = has_perm(self.request.user, "motions.can_see")
            # The rest of the check is done in the respective method. See below.
        elif self.action in (
            "manage_multiple_category",
            "manage_multiple_motion_block",
            "manage_multiple_state",
            "set_recommendation",
            "manage_multiple_recommendation",
            "follow_recommendation",
            "manage_multiple_submitters",
            "manage_multiple_tags",
        ):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage_metadata"
            )
        elif self.action == "sort":
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        elif self.action == "support":
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_support"
            )
        else:
            result = False
        return result

    def destroy(self, request, *args, **kwargs):
        """
        Destroy is allowed if the user has manage permissions, or he is the submitter and
        the current state allows to edit the motion.
        """
        motion = self.get_object()

        if not (
            (
                has_perm(request.user, "motions.can_manage")
                or motion.is_submitter(request.user)
                and motion.state.allow_submitter_edit
            )
        ):
            self.permission_denied(request)

        result = super().destroy(request, *args, **kwargs)

        # Fire autoupdate again to save information to OpenSlides history.
        inform_deleted_data(
            [(motion.get_collection_string(), motion.pk)],
            information=["Motion deleted"],
            user_id=request.user.pk,
        )

        # inform parents/blocks of deletion
        if motion.parent:
            inform_changed_data(motion.parent)
        if motion.motion_block:
            inform_changed_data(motion.motion_block)

        return result

    def create(self, request, *args, **kwargs):
        """
        Customized view endpoint to create a new motion.
        """
        # This is a hack to make request.data mutable. Otherwise fields can not be deleted.
        if isinstance(request.data, QueryDict):
            request.data._mutable = True

        # Check if amendment request and if parent motion exists. Check also permissions.
        if request.data.get("parent_id") is not None:
            # Amendment
            if not has_perm(self.request.user, "motions.can_create_amendments"):
                self.permission_denied(request)
            try:
                parent_motion = Motion.objects.get(pk=request.data["parent_id"])
            except Motion.DoesNotExist:
                raise ValidationError({"detail": "The parent motion does not exist."})
        else:
            # Common motion
            if not has_perm(self.request.user, "motions.can_create"):
                self.permission_denied(request)
            parent_motion = None

        # Check permission to send some data.
        if not has_perm(request.user, "motions.can_manage"):
            # Remove fields that the user is not allowed to send.
            # The list() is required because we want to use del inside the loop.
            keys = list(request.data.keys())
            whitelist = [
                "title",
                "text",
                "reason",
                "category_id",
                "statute_paragraph_id",
                "workflow_id",
            ]
            if parent_motion is not None:
                # For creating amendments.
                whitelist.extend(
                    [
                        "parent_id",
                        "amendment_paragraphs",
                        "motion_block_id",  # This and the category_id will be set to the matching
                        # values from parent_motion.
                    ]
                )
                request.data["category_id"] = parent_motion.category_id
                request.data["motion_block_id"] = parent_motion.motion_block_id
            for key in keys:
                if key not in whitelist:
                    del request.data[key]

        # Validate data and create motion.
        # Attention: Even user without permission can_manage_metadata is allowed
        # to create a new motion and set such metadata like category, motion block and origin.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        motion = serializer.save(request_user=request.user)

        # Check for submitters and make ids unique
        if isinstance(request.data, QueryDict):
            submitters_id = request.data.getlist("submitters_id")
        else:
            submitters_id = request.data.get("submitters_id", [])
        if not isinstance(submitters_id, list):
            raise ValidationError(
                {"detail": "If submitters_id is given, it has to be a list."}
            )

        submitters_id_unique = set()
        for id in submitters_id:
            try:
                submitters_id_unique.add(int(id))
            except ValueError:
                continue

        submitters = []
        for submitter_id in submitters_id_unique:
            try:
                submitters.append(get_user_model().objects.get(pk=submitter_id))
            except get_user_model().DoesNotExist:
                continue  # Do not add users that do not exist

        # Add the request user, if he is authenticated and no submitters were given:
        if not submitters and request.user.is_authenticated:
            submitters.append(request.user)

        # create all submitters
        for submitter in submitters:
            Submitter.objects.add(submitter, motion)

        # Send new submitters and supporters via autoupdate because users
        # without permission to see users may not have them but can get it now.
        # TODO: Skip history.
        new_users = list(motion.submitters.all())
        new_users.extend(motion.supporters.all())
        inform_changed_data(new_users)

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            motion, information=["Motion created"], user_id=request.user.pk
        )

        headers = self.get_success_headers(serializer.data)
        # Strip out response data so nobody gets unrestricted data.
        data = ReturnDict(id=serializer.data.get("id"), serializer=serializer)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """
        Customized view endpoint to update a motion.

        Checks also whether the requesting user can update the motion. He
        needs at least the permissions 'motions.can_see' (see
        self.check_view_permissions()). Also check manage permission or
        submitter and state.
        """
        # This is a hack to make request.data mutable. Otherwise fields can not be deleted.
        if isinstance(request.data, QueryDict):
            request.data._mutable = True

        # Get motion.
        motion = self.get_object()

        # Check permissions.
        if (
            not has_perm(request.user, "motions.can_manage")
            and not has_perm(request.user, "motions.can_manage_metadata")
            and not (
                motion.is_submitter(request.user) and motion.state.allow_submitter_edit
            )
        ):
            self.permission_denied(request)

        # Check permission to send only some data.
        # Attention: Users with motions.can_manage permission can change all
        #            fields even if they do not have motions.can_manage_metadata
        #            permission.
        if not has_perm(request.user, "motions.can_manage"):
            # Remove fields that the user is not allowed to change.
            # The list() is required because we want to use del inside the loop.
            keys = list(request.data.keys())
            whitelist: List[str] = []
            # Add title, text and reason to the whitelist only, if the user is the submitter.
            if motion.is_submitter(request.user) and motion.state.allow_submitter_edit:
                whitelist.extend(("title", "text", "reason", "amendment_paragraphs"))

            if has_perm(request.user, "motions.can_manage_metadata"):
                whitelist.extend(
                    ("category_id", "motion_block_id", "origin", "supporters_id")
                )

            for key in keys:
                if key not in whitelist:
                    del request.data[key]

        # Validate data and update motion.
        serializer = self.get_serializer(
            motion, data=request.data, partial=kwargs.get("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        updated_motion = serializer.save()

        # Check removal of supporters and initiate response.
        if (
            config["motions_remove_supporters"]
            and updated_motion.state.allow_support
            and not has_perm(request.user, "motions.can_manage")
        ):
            updated_motion.supporters.clear()

        # Send new supporters via autoupdate because users
        # without permission to see users may not have them but can get it now.
        # TODO: Skip history.
        new_users = list(updated_motion.supporters.all())
        inform_changed_data(new_users)

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            updated_motion, information=["Motion updated"], user_id=request.user.pk
        )

        # We do not add serializer.data to response so nobody gets unrestricted data here.
        return Response()

    @list_route(methods=["post"])
    def sort(self, request):
        """
        Sorts all motions represented in a tree of ids. The request data should be a list (the root)
        of all motions. Each node is a dict with an id and optional children:
        {
            id: <the id>
            children: [
                <children, optional>
            ]
        }
        Every id has to be given.
        """
        return self.sort_tree(request, Motion, "weight", "sort_parent_id")

    @detail_route(methods=["POST", "DELETE"])
    def manage_comments(self, request, pk=None):
        """
        Create, update and delete motion comments.

        Send a POST request with {'section_id': <id>, 'comment': '<comment>'}
        to create a new comment or update an existing comment.

        Send a DELETE request with just {'section_id': <id>} to delete the comment.
        For every request, the user must have read and write permission for the given field.
        """
        motion = self.get_object()

        # Get the comment section
        section_id = request.data.get("section_id")
        if not section_id or not isinstance(section_id, int):
            raise ValidationError(
                {"detail": "You have to provide a section_id of type int."}
            )

        try:
            section = MotionCommentSection.objects.get(pk=section_id)
        except MotionCommentSection.DoesNotExist:
            raise ValidationError(
                {
                    "detail": "A comment section with id {0} does not exist.",
                    "args": [section_id],
                }
            )

        # the request user needs to see and write to the comment section
        if not in_some_groups(
            request.user, list(section.read_groups.values_list("pk", flat=True))
        ) or not in_some_groups(
            request.user, list(section.write_groups.values_list("pk", flat=True))
        ):
            raise ValidationError(
                {
                    "detail": "You are not allowed to see or write to the comment section."
                }
            )

        if request.method == "POST":  # Create or update
            # validate comment
            comment_value = request.data.get("comment", "")
            if not isinstance(comment_value, str):
                raise ValidationError({"detail": "The comment should be a string."})

            comment, created = MotionComment.objects.get_or_create(
                motion=motion, section=section, defaults={"comment": comment_value}
            )
            if not created:
                comment.comment = comment_value
                comment.save()

            message = ["Comment {arg1} updated", section.name]
        else:  # DELETE
            try:
                comment = MotionComment.objects.get(motion=motion, section=section)
            except MotionComment.DoesNotExist:
                # Be silent about not existing comments.
                pass
            else:
                comment.delete()
            message = ["Comment {arg1} deleted", section.name]

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(motion, information=message, user_id=request.user.pk)

        return Response({"detail": message})

    @list_route(methods=["post"])
    @transaction.atomic
    def manage_multiple_submitters(self, request):
        """
        Set or reset submitters of multiple motions.

        Send POST {"motions": [... see schema ...]} to changed the submitters.
        """
        motions = request.data.get("motions")

        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Motion manage multiple submitters schema",
            "description": "An array of motion ids with the respective user ids that should be set as submitter.",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"description": "The id of the motion.", "type": "integer"},
                    "submitters": {
                        "description": "An array of user ids the should become submitters. Use an empty array to clear submitter field.",
                        "type": "array",
                        "items": {"type": "integer"},
                        "uniqueItems": True,
                    },
                },
                "required": ["id", "submitters"],
            },
            "uniqueItems": True,
        }

        # Validate request data.
        try:
            jsonschema.validate(motions, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})

        motion_result = []
        new_submitters = []
        for item in motions:
            # Get motion.
            try:
                motion = Motion.objects.get(pk=item["id"])
            except Motion.DoesNotExist:
                raise ValidationError(
                    {"detail": "Motion {0} does not exist", "args": [item["id"]]}
                )

            # Remove all submitters.
            Submitter.objects.filter(motion=motion).delete()

            # Set new submitters.
            for submitter_id in item["submitters"]:
                try:
                    submitter = get_user_model().objects.get(pk=submitter_id)
                except get_user_model().DoesNotExist:
                    raise ValidationError(
                        {
                            "detail": "Submitter {0} does not exist",
                            "args": [submitter_id],
                        }
                    )
                Submitter.objects.add(submitter, motion)
                new_submitters.append(submitter)

            # Finish motion.
            motion_result.append(motion)

        # Now inform all clients.
        inform_changed_data(
            motion_result, information=["Submitters changed"], user_id=request.user.pk
        )

        # Also send all new submitters via autoupdate because users without
        # permission to see users may not have them but can get it now.
        # TODO: Skip history.
        inform_changed_data(new_submitters)

        # Send response.
        return Response(
            {
                "detail": "{0} motions successfully updated.",
                "args": [len(motion_result)],
            }
        )

    @detail_route(methods=["post", "delete"])
    def support(self, request, pk=None):
        """
        Special view endpoint to support a motion or withdraw support
        (unsupport).

        Send POST to support and DELETE to unsupport.
        """
        # Retrieve motion and allowed actions.
        motion = self.get_object()

        # Support or unsupport motion.
        if request.method == "POST":
            # Support motion.
            if not (
                motion.state.allow_support
                and config["motions_min_supporters"] > 0
                and not motion.is_submitter(request.user)
                and not motion.is_supporter(request.user)
            ):
                raise ValidationError({"detail": "You can not support this motion."})
            try:
                motion.supporters.add(request.user)
            except IntegrityError:
                raise ValidationError({"detail": "You are already a supporter."})
            # Send new supporter via autoupdate because users without permission
            # to see users may not have it but can get it now.
            # TODO: Skip history.
            inform_changed_data([request.user])
            message = "You have supported this motion successfully."
        else:
            # Unsupport motion.
            # request.method == 'DELETE'
            if not motion.state.allow_support or not motion.is_supporter(request.user):
                raise ValidationError({"detail": "You can not unsupport this motion."})
            motion.supporters.remove(request.user)
            message = "You have unsupported this motion successfully."

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            motion, information=["Supporters changed"], user_id=request.user.pk
        )

        # Initiate response.
        return Response({"detail": message})

    @list_route(methods=["post"])
    @transaction.atomic
    def manage_multiple_category(self, request):
        """
        Set categories of multiple motions.

        Send POST {"motions": [... see schema ...]} to changed the categories.
        """
        motions = request.data.get("motions")

        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Motion manage multiple categories schema",
            "description": "An array of motion ids with the respective category id that should be set as category.",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"description": "The id of the motion.", "type": "integer"},
                    "category": {
                        "description": "The id for the category that should become the new category.",
                        "anyOf": [{"type": "number", "minimum": 1}, {"type": "null"}],
                    },
                },
                "required": ["id", "category"],
            },
            "uniqueItems": True,
        }

        # Validate request data.
        try:
            jsonschema.validate(motions, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})

        motion_result = []
        for item in motions:
            # Get motion.
            try:
                motion = Motion.objects.get(pk=item["id"])
            except Motion.DoesNotExist:
                raise ValidationError(
                    {"detail": "Motion {0} does not exist", "args": [item["id"]]}
                )

            # Get category
            category = None
            if item["category"] is not None:
                try:
                    category = Category.objects.get(pk=item["category"])
                except Category.DoesNotExist:
                    raise ValidationError(
                        {
                            "detail": "Category {0} does not exist",
                            "args": [item["category"]],
                        }
                    )

            # Set category
            motion.category = category

            # Save motion.
            motion.save(
                update_fields=["category", "last_modified"], skip_autoupdate=True
            )

            # Fire autoupdate again to save information to OpenSlides history.
            information = (
                ["Category removed"]
                if category is None
                else ["Category set to {arg1}", category.name]
            )
            inform_changed_data(
                motion, information=information, user_id=request.user.pk
            )

            # Finish motion.
            motion_result.append(motion)

        # Send response.
        return Response(
            {
                "detail": "Category of {0} motions successfully set.",
                "args": [len(motion_result)],
            }
        )

    @list_route(methods=["post"])
    @transaction.atomic
    def manage_multiple_motion_block(self, request):
        """
        Set motion blocks of multiple motions.

        Send POST {"motions": [... see schema ...]} to changed the motion blocks.
        """
        motions = request.data.get("motions")

        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Motion manage multiple motion blocks schema",
            "description": "An array of motion ids with the respective motion block id that should be set as motion block.",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"description": "The id of the motion.", "type": "integer"},
                    "motion_block": {
                        "description": "The id for the motion block that should become the new motion block.",
                        "anyOf": [{"type": "number", "minimum": 1}, {"type": "null"}],
                    },
                },
                "required": ["id", "motion_block"],
            },
            "uniqueItems": True,
        }

        # Validate request data.
        try:
            jsonschema.validate(motions, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})

        motion_result = []
        for item in motions:
            # Get motion.
            try:
                motion = Motion.objects.get(pk=item["id"])
            except Motion.DoesNotExist:
                raise ValidationError(
                    {"detail": "Motion {0} does not exist", "args": [item["id"]]}
                )

            # Get motion block
            motion_block = None
            if item["motion_block"] is not None:
                try:
                    motion_block = MotionBlock.objects.get(pk=item["motion_block"])
                except MotionBlock.DoesNotExist:
                    raise ValidationError(
                        {
                            "detail": "MotionBlock {0} does not exist",
                            "args": [item["motion_block"]],
                        }
                    )

            # inform old motion block
            if motion.motion_block:
                inform_changed_data(motion.motion_block)
            # inform new motion block
            if motion_block:
                inform_changed_data(motion_block)

            # Set motion bock
            motion.motion_block = motion_block

            # Save motion.
            motion.save(
                update_fields=["motion_block", "last_modified"], skip_autoupdate=True
            )

            # Fire autoupdate again to save information to OpenSlides history.
            information = (
                ["Motion block removed"]
                if motion_block is None
                else ["Motion block set to {arg1}", motion_block.title]
            )
            inform_changed_data(
                motion, information=information, user_id=request.user.pk
            )

            # Finish motion.
            motion_result.append(motion)

        # Send response.
        return Response(
            {
                "detail": "Motion block of {0} motions successfully set.",
                "args": [len(motion_result)],
            }
        )

    @detail_route(methods=["put"])
    def set_state(self, request, pk=None):
        """
        Special view endpoint to set and reset a state of a motion.

        Send PUT {'state': <state_id>} to set and just PUT {} to reset the
        state. Only managers can use this view.

        If a state is given, it must be a next or previous state.
        """
        # Retrieve motion and state.
        motion = self.get_object()
        state = request.data.get("state")

        # Set or reset state.
        if state is not None:
            # Check data and set state.
            if not has_perm(request.user, "motions.can_manage_metadata") and not (
                motion.is_submitter(request.user) and motion.state.allow_submitter_edit
            ):
                self.permission_denied(request)
            try:
                state_id = int(state)
            except ValueError:
                raise ValidationError(
                    {"detail": "Invalid data. State must be an integer."}
                )
            if not motion.state.is_next_or_previous_state_id(state_id):
                raise ValidationError(
                    {"detail": "You can not set the state to {0}.", "args": [state_id]}
                )
            motion.set_state(state_id)
        else:
            # Reset state.
            if not has_perm(self.request.user, "motions.can_manage_metadata"):
                self.permission_denied(request)
            motion.reset_state()

        # Save motion.
        motion.save(
            update_fields=["state", "identifier", "identifier_number", "last_modified"],
            skip_autoupdate=True,
        )
        message = f"The state of the motion was set to {motion.state.name}."

        # Send submitters and supporters via autoupdate because users without
        # users.can_see may see them now.
        inform_changed_data(map(lambda s: s.user, motion.submitters.all()))
        inform_changed_data(motion.supporters.all())

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            motion,
            information=["State set to {arg1}", motion.state.name],
            user_id=request.user.pk,
        )

        return Response({"detail": message})

    @list_route(methods=["post"])
    @transaction.atomic
    def manage_multiple_state(self, request):
        """
        Set or reset states of multiple motions.

        Send POST {"motions": [... see schema ...]} to changed the states.
        """
        motions = request.data.get("motions")

        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Motion manage multiple state schema",
            "description": "An array of motion ids with the respective state ids that should be set as new state.",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"description": "The id of the motion.", "type": "integer"},
                    "state": {
                        "description": "The state id the should become the new state.",
                        "type": "integer",
                        "minimum": 1,
                    },
                },
                "required": ["id", "state"],
            },
            "uniqueItems": True,
        }

        # Validate request data.
        try:
            jsonschema.validate(motions, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})

        motion_result = []
        for item in motions:
            # Get motion.
            try:
                motion = Motion.objects.get(pk=item["id"])
            except Motion.DoesNotExist:
                raise ValidationError(
                    {"detail": "Motion {0} does not exist", "args": [item["id"]]}
                )

            # Set or reset state.
            state_id = item["state"]
            valid_states = State.objects.filter(workflow=motion.workflow_id)
            if state_id not in [item.id for item in valid_states]:
                # States of different workflows are not allowed.
                raise ValidationError(
                    {"detail": "You can not set the state to {0}.", "args": [state_id]}
                )
            motion.set_state(state_id)

            # Save motion.
            motion.save(
                update_fields=[
                    "state",
                    "identifier",
                    "identifier_number",
                    "last_modified",
                ],
                skip_autoupdate=True,
            )

            # Send submitters and supporters via autoupdate because users without
            # users.can_see may see them now.
            inform_changed_data(map(lambda s: s.user, motion.submitters.all()))
            inform_changed_data(motion.supporters.all())

            # Fire autoupdate again to save information to OpenSlides history.
            inform_changed_data(
                motion,
                information=["State set to {arg1}", motion.state.name],
                user_id=request.user.pk,
            )

            # Finish motion.
            motion_result.append(motion)

        # Send response.
        return Response(
            {
                "detail": "State of {0} motions successfully set.",
                "args": [len(motion_result)],
            }
        )

    @detail_route(methods=["put"])
    def set_recommendation(self, request, pk=None):
        """
        Special view endpoint to set a recommendation of a motion.

        Send PUT {'recommendation': <state_id>} to set and just PUT {} to
        reset the recommendation. Only managers can use this view.
        """
        # Retrieve motion and recommendation state.
        motion = self.get_object()
        recommendation_state = request.data.get("recommendation")

        # Set or reset recommendation.
        if recommendation_state is not None:
            # Check data and set recommendation.
            try:
                recommendation_state_id = int(recommendation_state)
            except ValueError:
                raise ValidationError(
                    {"detail": "Invalid data. Recommendation must be an integer."}
                )
            recommendable_states = State.objects.filter(
                workflow=motion.workflow_id, recommendation_label__isnull=False
            )
            if recommendation_state_id not in [
                item.id for item in recommendable_states
            ]:
                raise ValidationError(
                    {
                        "detail": "You can not set the recommendation to {0}.",
                        "args": [recommendation_state_id],
                    }
                )
            motion.set_recommendation(recommendation_state_id)
        else:
            # Reset recommendation.
            motion.recommendation = None

        # Save motion.
        motion.save(
            update_fields=["recommendation", "last_modified"], skip_autoupdate=True
        )
        label = (
            motion.recommendation.recommendation_label
            if motion.recommendation
            else "None"
        )

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            motion,
            information=["Recommendation set to {arg1}", label],
            user_id=request.user.pk,
        )

        return Response(
            {
                "detail": "The recommendation of the motion was set to {0}.",
                "args": [label],
            }
        )

    @list_route(methods=["post"])
    @transaction.atomic
    def manage_multiple_recommendation(self, request):
        """
        Set or reset recommendations of multiple motions.

        Send POST {"motions": [... see schema ...]} to changed the recommendations.
        """
        motions = request.data.get("motions")

        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Motion manage multiple recommendations schema",
            "description": "An array of motion ids with the respective state ids that should be set as recommendation.",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"description": "The id of the motion.", "type": "integer"},
                    "recommendation": {
                        "description": "The state id the should become recommendation. Use 0 to clear recommendation field.",
                        "type": "integer",
                    },
                },
                "required": ["id", "recommendation"],
            },
            "uniqueItems": True,
        }

        # Validate request data.
        try:
            jsonschema.validate(motions, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})

        motion_result = []
        for item in motions:
            # Get motion.
            try:
                motion = Motion.objects.get(pk=item["id"])
            except Motion.DoesNotExist:
                raise ValidationError(
                    {"detail": "Motion {0} does not exist", "args": [item["id"]]}
                )

            # Set or reset recommendation.
            recommendation_state_id = item["recommendation"]
            if recommendation_state_id == 0:
                # Reset recommendation.
                motion.recommendation = None
            else:
                # Check data and set recommendation.
                recommendable_states = State.objects.filter(
                    workflow=motion.workflow_id, recommendation_label__isnull=False
                )
                if recommendation_state_id not in [
                    item.id for item in recommendable_states
                ]:
                    raise ValidationError(
                        {
                            "detail": "You can not set the recommendation to {0}.",
                            "args": [recommendation_state_id],
                        }
                    )
                motion.set_recommendation(recommendation_state_id)

            # Save motion.
            motion.save(
                update_fields=["recommendation", "last_modified"], skip_autoupdate=True
            )
            label = (
                motion.recommendation.recommendation_label
                if motion.recommendation
                else "None"
            )

            # Fire autoupdate and save information to OpenSlides history.
            inform_changed_data(
                motion,
                information=["Recommendation set to {arg1}", label],
                user_id=request.user.pk,
            )

            # Finish motion.
            motion_result.append(motion)

        # Send response.
        return Response(
            {
                "detail": "{0} motions successfully updated.",
                "args": [len(motion_result)],
            }
        )

    @detail_route(methods=["post"])
    def follow_recommendation(self, request, pk=None):
        motion = self.get_object()
        if motion.recommendation is None:
            raise ValidationError({"detail": "Cannot set an empty recommendation."})

        motion.follow_recommendation()

        motion.save(
            update_fields=[
                "state",
                "identifier",
                "identifier_number",
                "state_extension",
                "last_modified",
            ],
            skip_autoupdate=True,
        )

        # Now send all changes to the clients.
        inform_changed_data(
            motion,
            information=["State set to {arg1}", motion.state.name],
            user_id=request.user.pk,
        )

        return Response({"detail": "Recommendation followed successfully."})

    @list_route(methods=["post"])
    @transaction.atomic
    def manage_multiple_tags(self, request):
        """
        Set or reset tags of multiple motions.

        Send POST {"motions": [... see schema ...]} to changed the tags.
        """
        motions = request.data.get("motions")

        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Motion manage multiple tags schema",
            "description": "An array of motion ids with the respective tags ids that should be set as tag.",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"description": "The id of the motion.", "type": "integer"},
                    "tags": {
                        "description": "An array of tag ids the should become tags. Use an empty array to clear tag field.",
                        "type": "array",
                        "items": {"type": "integer"},
                        "uniqueItems": True,
                    },
                },
                "required": ["id", "tags"],
            },
            "uniqueItems": True,
        }

        # Validate request data.
        try:
            jsonschema.validate(motions, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})

        motion_result = []
        for item in motions:
            # Get motion.
            try:
                motion = Motion.objects.get(pk=item["id"])
            except Motion.DoesNotExist:
                raise ValidationError(
                    {"detail": "Motion {0} does not exist", "args": [item["id"]]}
                )

            # Set new tags
            for tag_id in item["tags"]:
                if not Tag.objects.filter(pk=tag_id).exists():
                    raise ValidationError(
                        {"detail": "Tag {0} does not exist", "args": [tag_id]}
                    )
            motion.tags.set(item["tags"])

            # Finish motion.
            motion_result.append(motion)

        # Now inform all clients.
        inform_changed_data(motion_result)

        # Send response.
        return Response(
            {
                "detail": "{0} motions successfully updated.",
                "args": [len(motion_result)],
            }
        )


class MotionPollViewSet(BasePollViewSet):
    """
    API endpoint for motion polls.

    There are the following views: update, partial_update and destroy.
    """

    queryset = MotionPoll.objects.all()

    required_analog_fields = ["Y", "N", "votescast", "votesvalid", "votesinvalid"]

    def has_manage_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        return has_perm(self.request.user, "motions.can_see") and has_perm(
            self.request.user, "motions.can_manage"
        )

    def create(self, request, *args, **kwargs):
        # set default pollmethod to YNA
        if "pollmethod" not in request.data:
            # hack to make request.data mutable. Otherwise fields cannot be changed.
            if isinstance(request.data, QueryDict):
                request.data._mutable = True
            request.data["pollmethod"] = MotionPoll.POLLMETHOD_YNA
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        motion = serializer.validated_data["motion"]
        if not motion.state.allow_create_poll:
            raise ValidationError(
                {"detail": "You can not create a poll in this motion state."}
            )

        super().perform_create(serializer)

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            motion, information=["Poll created"], user_id=self.request.user.pk
        )

    def update(self, *args, **kwargs):
        """
        Customized view endpoint to update a motion poll.
        """
        response = super().update(*args, **kwargs)

        # Fire autoupdate again to save information to OpenSlides history.
        poll = self.get_object()
        inform_changed_data(
            poll.motion, information=["Poll updated"], user_id=self.request.user.pk
        )

        return response

    def destroy(self, *args, **kwargs):
        """
        Customized view endpoint to delete a motion poll.
        """
        poll = self.get_object()
        result = super().destroy(*args, **kwargs)

        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            poll.motion, information=["Poll deleted"], user_id=self.request.user.pk
        )

        return result

    def handle_analog_vote(self, data, poll):
        option = poll.options.get()
        vote, _ = MotionVote.objects.get_or_create(option=option, value="Y")
        vote.weight = data["Y"]
        vote.save()
        vote, _ = MotionVote.objects.get_or_create(option=option, value="N")
        vote.weight = data["N"]
        vote.save()
        if poll.pollmethod == MotionPoll.POLLMETHOD_YNA:
            vote, _ = MotionVote.objects.get_or_create(option=option, value="A")
            vote.weight = data["A"]
            vote.save()
        inform_changed_data(option)

        for field in ["votesvalid", "votesinvalid", "votescast"]:
            setattr(poll, field, data.get(field))

        poll.save()

    def validate_vote_data(self, data, poll):
        """
        Request data for analog:
        { "Y": <amount>, "N": <amount>, ["A": <amount>],
          ["votesvalid": <amount>], ["votesinvalid": <amount>], ["votescast": <amount>]}
        All amounts are decimals as strings
        Request data for named/pseudoanonymous is just "Y" | "N" [| "A"]
        """
        if poll.type == MotionPoll.TYPE_ANALOG:
            if not isinstance(data, dict):
                raise ValidationError({"detail": "Data must be a dict"})

            for field in ["Y", "N", "votesvalid", "votesinvalid", "votescast"]:
                data[field] = self.parse_vote_value(data, field)
            if poll.pollmethod == MotionPoll.POLLMETHOD_YNA:
                data["A"] = self.parse_vote_value(data, "A")

        else:
            if poll.pollmethod == MotionPoll.POLLMETHOD_YNA and data not in (
                "Y",
                "N",
                "A",
            ):
                raise ValidationError("Data must be Y, N or A")
            elif poll.pollmethod == MotionPoll.POLLMETHOD_YN and data not in ("Y", "N"):
                raise ValidationError("Data must be Y or N")

    def add_user_to_voted_array(self, user, poll):
        VotedModel = MotionPoll.voted.through
        VotedModel.objects.create(motionpoll=poll, user=user)

    def handle_named_vote(self, data, poll, vote_user, request_user):
        self.handle_named_and_pseudoanonymous_vote(
            data,
            poll,
            weight_user=vote_user,
            vote_user=vote_user,
            request_user=request_user,
        )

    def handle_pseudoanonymous_vote(self, data, poll, user):
        self.handle_named_and_pseudoanonymous_vote(data, poll, user, None, None)

    def handle_named_and_pseudoanonymous_vote(
        self, data, poll, weight_user, vote_user, request_user
    ):
        option = poll.options.get()
        vote = MotionVote.objects.create(
            user=vote_user, delegated_user=request_user, option=option
        )
        vote.value = data
        vote.weight = (
            weight_user.vote_weight
            if config["users_activate_vote_weight"]
            else Decimal(1)
        )
        vote.save(no_delete_on_restriction=True)
        inform_changed_data(option)


class MotionOptionViewSet(BaseOptionViewSet):
    queryset = MotionOption.objects.all()

    def check_view_permissions(self):
        return has_perm(self.request.user, "motions.can_see")


class MotionVoteViewSet(BaseVoteViewSet):
    queryset = MotionVote.objects.all()

    def check_view_permissions(self):
        return has_perm(self.request.user, "motions.can_see")


class MotionChangeRecommendationViewSet(ModelViewSet):
    """
    API endpoint for motion change recommendations.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    access_permissions = MotionChangeRecommendationAccessPermissions()
    queryset = MotionChangeRecommendation.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == "metadata":
            result = has_perm(self.request.user, "motions.can_see")
        elif self.action in ("create", "destroy", "partial_update", "update"):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        else:
            result = False
        return result

    def perform_create(self, serializer):
        """
        Customized method to add history information.
        """
        instance = serializer.save()
        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            instance,
            information=["Motion change recommendation created"],
            user_id=self.request.user.pk,
        )

    def perform_update(self, serializer):
        """
        Customized method to add history information.
        """
        instance = serializer.save()
        # Fire autoupdate again to save information to OpenSlides history.
        inform_changed_data(
            instance,
            information=["Motion change recommendation updated"],
            user_id=self.request.user.pk,
        )

    def destroy(self, request, *args, **kwargs):
        """
        Customized method to add history information.
        """
        instance = self.get_object()

        result = super().destroy(request, *args, **kwargs)

        # Fire autoupdate again to save information to OpenSlides history.
        inform_deleted_data(
            [(instance.get_collection_string(), instance.pk)],
            information=["Motion change recommendation deleted"],
            user_id=request.user.pk,
        )

        return result


class MotionCommentSectionViewSet(ModelViewSet):
    """
    API endpoint for motion comment fields.
    """

    access_permissions = MotionCommentSectionAccessPermissions()
    queryset = MotionCommentSection.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("create", "destroy", "update", "partial_update", "sort"):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        else:
            result = False
        return result

    def destroy(self, *args, **kwargs):
        """
        Customized view endpoint to delete a motion comment section. Will return
        an error for the user, if still comments for this section exist.
        """
        try:
            result = super().destroy(*args, **kwargs)
        except ProtectedError as err:
            # The protected objects can just be motion comments.
            motions = [f'"{comment.motion}"' for comment in err.protected_objects.all()]
            count = len(motions)
            motions_verbose = ", ".join(motions[:3])
            if count > 3:
                motions_verbose += ", ..."

            if count == 1:
                msg = "This section has still comments in motion {0}."
            else:
                msg = "This section has still comments in motions {0}."

            msg += " " + "Please remove all comments before deletion."
            raise ValidationError({"detail": msg, "args": [motions_verbose]})
        return result

    def update(self, *args, **kwargs):
        response = super().update(*args, **kwargs)
        # Update all affected motioncomments to update their `read_groups_id` field,
        # which is taken from the updated section.
        section = self.get_object()
        inform_changed_data(MotionComment.objects.filter(section=section))
        return response

    @list_route(methods=["post"])
    def sort(self, request, *args, **kwargs):
        """
        Changes the sorting of comment sections. Every id must be given exactly once.
        Expected data: { ids: [<id>, <id>, ...] }
        """
        # Check request data format
        ids = request.data.get("ids")
        if not isinstance(ids, list):
            raise ValidationError({"detail": "ids must be a list"})
        for id in ids:
            if not isinstance(id, int):
                raise ValidationError({"detail": "every id must be an int"})

        # Validate, that every id is given exactly once.
        ids_set = set(ids)
        if len(ids_set) != len(ids):
            raise ValidationError({"detail": "only unique ids are expected"})
        db_ids_set = set(
            list(MotionCommentSection.objects.all().values_list(flat=True))
        )
        if ids_set != db_ids_set:
            raise ValidationError({"detail": "every id must be given"})

        # Ids are ok.
        preserved = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
        queryset = MotionCommentSection.objects.filter(pk__in=ids).order_by(preserved)
        for index, section in enumerate(queryset):
            section.weight = index + 1
            section.save()

        return Response()


class StatuteParagraphViewSet(ModelViewSet):
    """
    API endpoint for statute paragraphs.

    There are the following views: list, retrieve, create,
    partial_update, update and destroy.
    """

    access_permissions = StatuteParagraphAccessPermissions()
    queryset = StatuteParagraph.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("create", "partial_update", "update", "destroy"):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        else:
            result = False
        return result


class CategoryViewSet(TreeSortMixin, ModelViewSet):
    """
    API endpoint for categories.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy and numbering.
    """

    access_permissions = CategoryAccessPermissions()
    queryset = Category.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve", "metadata"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in (
            "create",
            "partial_update",
            "update",
            "destroy",
            "sort_categories",
            "sort_motions",
            "numbering",
        ):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        else:
            result = False
        return result

    @list_route(methods=["post"])
    def sort_categories(self, request):
        """
        Sorts all categoreis represented in a tree of ids. The request data should be
        a list (the root) of all categories. Each node is a dict with an id and optional
        children:
        {
            id: <the id>
            children: [
                <children, optional>
            ]
        }
        Every id has to be given.
        """
        return self.sort_tree(request, Category, "weight", "parent_id")

    @detail_route(methods=["post"])
    @transaction.atomic
    def sort_motions(self, request, pk=None):
        """
        Endpoint to sort all motions in the category.

        Send POST {'motions': [<list of motion ids>]} to sort the given
        motions in the given order. Ids of motions with another category or
        non existing motions are ignored, but all motions of this category
        have to be send.
        """
        category = self.get_object()

        ids = request.data.get("motions", None)
        if not isinstance(ids, list):
            raise ValidationError("The ids must be a list.")

        motions = []
        motion_ids: Set[int] = set()  # To detect duplicated
        for id in ids:
            if not isinstance(id, int):
                raise ValidationError("All ids must be int.")

            if id in motion_ids:
                continue  # Duplicate id

            try:
                motion = Motion.objects.get(pk=id)
            except Motion.DoesNotExist:
                continue  # Ignore invalid ids.

            if motion.category is not None and motion.category.pk == category.pk:
                motions.append(motion)
                motion_ids.add(id)

        if Motion.objects.filter(category=category).count() != len(motions):
            raise ValidationError("Not all motions for this category are given")

        # assign the category_weight field:
        for weight, motion in enumerate(motions, start=1):
            motion.category_weight = weight
            motion.save(skip_autoupdate=True)

        inform_changed_data(motions)
        return Response()

    @detail_route(methods=["post"])
    def numbering(self, request, pk=None):
        """
        Special view endpoint to number all motions in this category and all
        subcategories. Only managers can use this view. For the actual numbering,
        see `numbering.py`.

        Request args: None (implicit: the main category via URL)
        """
        main_category = self.get_object()
        changed_instances = numbering(main_category)
        inform_changed_data(
            changed_instances, information=["Number set"], user_id=request.user.pk
        )
        return Response(
            {
                "detail": "All motions in category {0} numbered successfully.",
                "args": [str(main_category)],
            }
        )


class MotionBlockViewSet(ModelViewSet):
    """
    API endpoint for motion blocks.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    access_permissions = MotionBlockAccessPermissions()
    queryset = MotionBlock.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == "metadata":
            result = has_perm(self.request.user, "motions.can_see")
        elif self.action in (
            "create",
            "partial_update",
            "update",
            "destroy",
            "follow_recommendations",
        ):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        else:
            result = False
        return result

    def perform_create(self, serializer):
        serializer.save(request_user=self.request.user)

    @detail_route(methods=["post"])
    def follow_recommendations(self, request, pk=None):
        """
        View to set the states of all motions of this motion block each to
        its recommendation. It is a POST request without any data.
        """
        motion_block = self.get_object()
        with transaction.atomic():
            for motion in motion_block.motion_set.all():
                # Follow recommendation.
                motion.follow_recommendation()
                motion.save(skip_autoupdate=True)
                # Fire autoupdate and save information to OpenSlides history.
                inform_changed_data(
                    motion,
                    information=["State set to {arg1}", motion.state.name],
                    user_id=request.user.pk,
                )
        return Response({"detail": "Followed recommendations successfully."})


class ProtectedErrorMessageMixin:
    def raiseProtectedError(self, name, error):
        # The protected objects can just be motions..
        motions = ['"' + str(m) + '"' for m in error.protected_objects.all()]
        count = len(motions)
        motions_verbose = ", ".join(motions[:3])
        if count > 3:
            motions_verbose += ", ..."

        if count == 1:
            msg = f"This {0} is assigned to motion {1}."
        else:
            msg = f"This {0} is assigned to motions {1}."
        raise ValidationError(
            {
                "detail": f"{msg} Please remove all assignments before deletion.",
                "args": [name, motions_verbose],
            }
        )


class WorkflowViewSet(ModelViewSet, ProtectedErrorMessageMixin):
    """
    API endpoint for workflows.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    access_permissions = WorkflowAccessPermissions()
    queryset = Workflow.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve", "metadata"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("create", "partial_update", "update", "destroy"):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        else:
            result = False
        return result

    @transaction.atomic
    def destroy(self, *args, **kwargs):
        """
        Customized view endpoint to delete a workflow.
        """
        workflow_pk = self.get_object().pk
        if not Workflow.objects.exclude(pk=workflow_pk).exists():
            raise ValidationError({"detail": "You cannot delete the last workflow."})

        try:
            result = super().destroy(*args, **kwargs)
        except ProtectedError as err:
            self.raiseProtectedError("workflow", err)

        # Change motion default workflows in the config
        if int(config["motions_workflow"]) == workflow_pk:
            config["motions_workflow"] = str(Workflow.objects.first().pk)
        if int(config["motions_statute_amendments_workflow"]) == workflow_pk:
            config["motions_statute_amendments_workflow"] = str(
                Workflow.objects.first().pk
            )

        return result


class StateViewSet(ModelViewSet, ProtectedErrorMessageMixin):
    """
    API endpoint for workflow states.

    There are the following views: create, update, partial_update and destroy.
    """

    queryset = State.objects.all()
    access_permissions = StateAccessPermissions()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve", "metadata"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("create", "partial_update", "update", "destroy"):
            result = has_perm(self.request.user, "motions.can_see") and has_perm(
                self.request.user, "motions.can_manage"
            )
        else:
            result = False
        return result

    def destroy(self, *args, **kwargs):
        """
        Customized view endpoint to delete a state.
        """
        state = self.get_object()
        workflow = state.workflow
        if state.workflow.first_state.pk == state.pk:
            # is this the first state of the workflow?
            raise ValidationError(
                {"detail": "You cannot delete the first state of the workflow."}
            )
        try:
            result = super().destroy(*args, **kwargs)
        except ProtectedError as err:
            self.raiseProtectedError("workflow", err)
        inform_changed_data(workflow)
        return result

    def create(self, request, *args, **kwargs):
        result = super().create(request, *args, **kwargs)
        workflow_id = request.data[
            "workflow_id"
        ]  # This must be correct, if the state was created successfully
        inform_changed_data(Workflow.objects.get(pk=workflow_id))
        return result

    def update(self, *args, **kwargs):
        """
        Sends autoupdate for all motions that are affected by the state change.
        Maybe the restriction was changed, so the view permission for some
        motions could have been changed.
        """
        result = super().update(*args, **kwargs)
        state = self.get_object()
        inform_changed_data(Motion.objects.filter(state=state))
        return result
