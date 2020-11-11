import jsonschema
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.utils import IntegrityError

from openslides.core.config import config
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.rest_api import (
    GenericViewSet,
    ListModelMixin,
    ModelViewSet,
    Response,
    RetrieveModelMixin,
    UpdateModelMixin,
    ValidationError,
    detail_route,
    list_route,
    status,
)
from openslides.utils.views import TreeSortMixin

from ..utils.auth import has_perm
from ..utils.utils import get_model_from_collection_string
from .access_permissions import ItemAccessPermissions
from .models import Item, ListOfSpeakers, Speaker


# Viewsets for the REST API


class ItemViewSet(ModelViewSet, TreeSortMixin):
    """
    API endpoint for agenda items.

    There are some views, see check_view_permissions.
    """

    access_permissions = ItemAccessPermissions()
    queryset = Item.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve", "metadata"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in (
            "partial_update",
            "update",
            "destroy",
            "sort",
            "assign",
            "create",
        ):
            result = (
                has_perm(self.request.user, "agenda.can_see")
                and has_perm(self.request.user, "agenda.can_see_internal_items")
                and has_perm(self.request.user, "agenda.can_manage")
            )
        elif self.action in ("numbering",):
            result = has_perm(self.request.user, "agenda.can_see") and has_perm(
                self.request.user, "agenda.can_manage"
            )
        else:
            result = False
        return result

    def create(self, request, *args, **kwargs):
        """
        Creates an agenda item and adds the content object to the agenda.
        Request args should specify the content object:
        {
            "collection": <The collection string>,
            "id": <The content object id>
        }
        """
        collection = request.data.get("collection")
        id = request.data.get("id")

        if not isinstance(collection, str):
            raise ValidationError({"detail": "The collection needs to be a string"})
        if not isinstance(id, int):
            raise ValidationError({"detail": "The id needs to be an int"})

        try:
            model = get_model_from_collection_string(collection)
        except ValueError:
            raise ValidationError({"detail": "Invalid collection"})

        try:
            content_object = model.objects.get(pk=id)
        except model.DoesNotExist:
            raise ValidationError({"detail": "The id is invalid"})

        if not hasattr(content_object, "get_agenda_title_information"):
            raise ValidationError(
                {"detail": "The collection does not have agenda items"}
            )

        try:
            item = Item.objects.create(content_object=content_object)
        except IntegrityError:
            raise ValidationError({"detail": "The item is already in the agenda"})

        inform_changed_data(content_object)
        return Response({id: item.id})

    def destroy(self, request, *args, **kwargs):
        """
        Removes the item from the agenda. This does not delete the content
        object. Also, the deletion is denied for items with topics as content objects.
        """
        item = self.get_object()
        content_object = item.content_object
        if content_object.get_collection_string() == "topics/topic":
            raise ValidationError(
                {"detail": "You cannot delete the agenda item to a topic"}
            )

        item.delete()
        inform_changed_data(content_object)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, *args, **kwargs):
        """
        Customized view endpoint to update all children if the item type has changed.
        We do not check the level (affected by changing the parent) in fact that this
        change is currentl only done via the sort view.
        """
        old_type = self.get_object().type

        response = super().update(*args, **kwargs)

        # Update all children if the item type has changed.
        item = self.get_object()

        if old_type != item.type:
            items_to_update = []

            # Recursively add children to items_to_update.
            def add_item(item):
                items_to_update.append(item)
                for child in item.children.all():
                    add_item(child)

            add_item(item)
            inform_changed_data(items_to_update)

        return response

    @list_route(methods=["post"])
    def numbering(self, request):
        """
        Auto numbering of the agenda according to the config. Manually added
        item numbers will be overwritten.
        """
        if not config["agenda_enable_numbering"]:
            raise ValidationError(
                {"detail": "Numbering of agenda items is deactivated."}
            )

        Item.objects.number_all(numeral_system=config["agenda_numeral_system"])
        return Response({"detail": "The agenda has been numbered."})

    @list_route(methods=["post"])
    def sort(self, request):
        """
        Sorts the whole agenda represented in a tree of ids. The request data should be a list (the root)
        of all main agenda items. Each node is a dict with an id and optional children:
        {
            id: <the id>
            children: [
                <children, optional>
            ]
        }
        Every id has to be given.
        """
        return self.sort_tree(request, Item, "weight", "parent_id")

    @list_route(methods=["post"])
    @transaction.atomic
    def assign(self, request):
        """
        Assign multiple agenda items to a new parent item.

        Send POST {... see schema ...} to assign the new parent.

        This aslo checks the parent field to prevent hierarchical loops.
        """
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Agenda items assign new parent schema",
            "description": "An object containing an array of agenda item ids and the new parent id the items should be assigned to.",
            "type": "object",
            "propterties": {
                "items": {
                    "description": "An array of agenda item ids where the items should be assigned to the new parent id.",
                    "type": "array",
                    "items": {"type": "integer"},
                    "minItems": 1,
                    "uniqueItems": True,
                },
                "parent_id": {
                    "description": "The agenda item id of the new parent item.",
                    "type": "integer",
                },
            },
            "required": ["items", "parent_id"],
        }

        # Validate request data.
        try:
            jsonschema.validate(request.data, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})

        # Check parent item
        try:
            parent = Item.objects.get(pk=request.data["parent_id"])
        except Item.DoesNotExist:
            raise ValidationError(
                {
                    "detail": "Parent item {0} does not exist",
                    "args": [request.data["parent_id"]],
                }
            )

        # Collect ancestors
        ancestors = [parent.pk]
        grandparent = parent.parent
        while grandparent is not None:
            ancestors.append(grandparent.pk)
            grandparent = grandparent.parent

        # First validate all items before changeing them.
        items = []
        for item_id in request.data["items"]:
            # Prevent hierarchical loops.
            if item_id in ancestors:
                raise ValidationError(
                    {
                        "detail": "Assigning item {0} to one of its children is not possible.",
                        "args": [item_id],
                    }
                )

            # Check every item
            try:
                items.append(Item.objects.get(pk=item_id))
            except Item.DoesNotExist:
                raise ValidationError(
                    {"detail": "Item {0} does not exist", "args": [item_id]}
                )

        # OK, assign new parents.
        for item in items:
            # Assign new parent.
            item.parent = parent
            item.save(skip_autoupdate=True)

        # Now inform all clients.
        inform_changed_data(items)

        # Send response.
        return Response(
            {"detail": "{0} items successfully assigned.", "args": [len(items)]}
        )


class ListOfSpeakersViewSet(
    ListModelMixin, RetrieveModelMixin, UpdateModelMixin, TreeSortMixin, GenericViewSet
):
    """
    API endpoint for agenda items.

    There are some views, see check_view_permissions.
    """

    access_permissions = ItemAccessPermissions()
    queryset = ListOfSpeakers.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve", "metadata"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("manage_speaker",):
            result = has_perm(self.request.user, "agenda.can_see_list_of_speakers")
            # For manage_speaker requests the rest of the check is
            # done in the specific method. See below.
        elif self.action in (
            "update",
            "partial_update",
            "speak",
            "sort_speakers",
            "readd_last_speaker",
            "delete_all_speakers",
        ):
            result = has_perm(
                self.request.user, "agenda.can_see_list_of_speakers"
            ) and has_perm(self.request.user, "agenda.can_manage_list_of_speakers")
        else:
            result = False
        return result

    @detail_route(methods=["POST", "PATCH", "DELETE"])
    @transaction.atomic
    def manage_speaker(self, request, pk=None):
        """
        Special view endpoint to add users to the list of speakers or remove
        them. Send POST {'user': <user_id>} to add a new speaker.
        Send POST {'user': <user_id>, 'point_of_order': True } to add a point
        of order to the list of speakers.
        Omit data to add yourself. Send DELETE {'speaker': <speaker_id>} or
        DELETE {'speaker': [<speaker_id>, <speaker_id>, ...]} to remove one or
        more speakers from the list of speakers. Omit data to remove yourself.
        Send PATCH {'user': <user_id>, 'marked': <bool>} to mark the speaker.

        Checks also whether the requesting user can do this. He needs at
        least the permissions 'agenda.can_see_list_of_speakers' (see
        self.check_view_permissions()). In case of adding himself the
        permission 'agenda.can_be_speaker' is required. In case of adding
        or removing someone else the permission 'agenda.can_manage_list_of_speakers'
        is required. In case of removing himself no other permission is required.
        """
        # Retrieve list of speakers.
        list_of_speakers = self.get_object()

        if request.method == "POST":  # Add new speaker
            # Retrieve user_id
            user_id = request.data.get("user")
            point_of_order = request.data.get("point_of_order") or False
            if not isinstance(point_of_order, bool):
                raise ValidationError({"detail": "point_of_order has to be a bool."})

            # Check permissions and other conditions. Get user instance.
            if user_id is None:
                # Add oneself
                if not point_of_order and not has_perm(
                    self.request.user, "agenda.can_be_speaker"
                ):
                    self.permission_denied(request)
                # even if the list is closed, point of order has to be accepted
                if not point_of_order and list_of_speakers.closed:
                    raise ValidationError({"detail": "The list of speakers is closed."})
                user = self.request.user
            else:
                if not isinstance(user_id, int):
                    raise ValidationError({"detail": "user_id has to be an int."})

                point_of_order = False  # not for someone else
                # Add someone else.
                if not has_perm(
                    self.request.user, "agenda.can_manage_list_of_speakers"
                ):
                    self.permission_denied(request)
                try:
                    user = get_user_model().objects.get(pk=user_id)
                except get_user_model().DoesNotExist:
                    raise ValidationError({"detail": "User does not exist."})

            # Try to add the user. This ensurse that a user is not twice in the
            # list of coming speakers.
            try:
                speaker = Speaker.objects.add(
                    user, list_of_speakers, point_of_order=point_of_order
                )
            except OpenSlidesError as e:
                raise ValidationError({"detail": str(e)})

            # Send new speaker via autoupdate because users without permission
            # to see users may not have it but can get it now.
            inform_changed_data(user, disable_history=True)

        # Set 'marked' for the speaker
        elif request.method == "PATCH":
            # Check permissions
            if not has_perm(self.request.user, "agenda.can_manage_list_of_speakers"):
                self.permission_denied(request)

            # Retrieve user_id
            user_id = request.data.get("user")
            try:
                user = get_user_model().objects.get(pk=int(user_id))
            except (ValueError, get_user_model().DoesNotExist):
                raise ValidationError({"detail": "User does not exist."})

            marked = request.data.get("marked")
            if not isinstance(marked, bool):
                raise ValidationError({"detail": "Marked has to be a bool."})

            queryset = Speaker.objects.filter(
                list_of_speakers=list_of_speakers, user=user, begin_time=None
            )

            if not queryset.exists():
                raise ValidationError(
                    {"detail": "The user is not in the list of speakers."}
                )
            for speaker in queryset.all():
                speaker.marked = marked
                speaker.save()

        else:
            # request.method == 'DELETE'
            speaker_ids = request.data.get("speaker")

            # Check permissions and other conditions. Get speaker instance.
            if speaker_ids is None:
                point_of_order = request.data.get("point_of_order") or False
                if not isinstance(point_of_order, bool):
                    raise ValidationError(
                        {"detail": "point_of_order has to be a bool."}
                    )
                # Remove oneself
                queryset = Speaker.objects.filter(
                    list_of_speakers=list_of_speakers,
                    user=self.request.user,
                    point_of_order=point_of_order,
                ).exclude(weight=None)

                if not queryset.exists():
                    raise ValidationError(
                        {"detail": "The user is not in the list of speakers."}
                    )
                # We delete all() from the queryset and do not use get():
                # The Speaker.objects.add method should assert, that there
                # is only one speaker. But due to race conditions, sometimes
                # there are multiple ones. Using all() ensures, that there is
                # no server crash, if this happens.
                queryset.all().delete()
                inform_changed_data(list_of_speakers)
            else:
                # Remove someone else.
                if not has_perm(
                    self.request.user, "agenda.can_manage_list_of_speakers"
                ):
                    self.permission_denied(request)
                if isinstance(speaker_ids, int):
                    speaker_ids = [speaker_ids]
                deleted_some_speakers = False
                for speaker_id in speaker_ids:
                    try:
                        speaker = Speaker.objects.get(pk=int(speaker_id))
                    except (ValueError, Speaker.DoesNotExist):
                        pass
                    else:
                        speaker.delete(skip_autoupdate=True)
                        deleted_some_speakers = True
                # send autoupdate if speakers are deleted
                if deleted_some_speakers:
                    inform_changed_data(list_of_speakers)

        return Response()

    @detail_route(methods=["PUT", "DELETE"])
    def speak(self, request, pk=None):
        """
        Special view endpoint to begin and end speech of speakers. Send PUT
        {'speaker': <speaker_id>} to begin speech. Omit data to begin speech of
        the next speaker. Send DELETE to end speech of current speaker.
        """
        # Retrieve list_of_speakers.
        list_of_speakers = self.get_object()

        if request.method == "PUT":
            # Retrieve speaker_id
            speaker_id = request.data.get("speaker")
            if speaker_id is None:
                speaker = list_of_speakers.get_next_speaker()
                if speaker is None:
                    raise ValidationError({"detail": "The list of speakers is empty."})
            else:
                try:
                    speaker = Speaker.objects.get(pk=int(speaker_id))
                except (ValueError, Speaker.DoesNotExist):
                    raise ValidationError({"detail": "Speaker does not exist."})
            speaker.begin_speech()
            message = "User is now speaking."

        else:
            # request.method == 'DELETE'
            try:
                # We assume that there aren't multiple entries because this
                # is forbidden by the Model's begin_speech method. We assume that
                # there is only one speaker instance or none.
                current_speaker = (
                    Speaker.objects.filter(
                        list_of_speakers=list_of_speakers, end_time=None
                    )
                    .exclude(begin_time=None)
                    .get()
                )
            except Speaker.DoesNotExist:
                raise ValidationError(
                    {
                        "detail": "There is no one speaking at the moment according to {0}.",
                        "args": [list_of_speakers],
                    }
                )
            current_speaker.end_speech()
            message = "The speech is finished now."

        # Initiate response.
        return Response({"detail": message})

    @detail_route(methods=["POST"])
    def sort_speakers(self, request, pk=None):
        """
        Special view endpoint to sort the list of speakers.

        Expects a list of IDs of the speakers.
        """
        # Retrieve list_of_speakers.
        list_of_speakers = self.get_object()

        # Check data
        speaker_ids = request.data.get("speakers")
        if not isinstance(speaker_ids, list):
            raise ValidationError({"detail": "Invalid data."})

        # Get all speakers
        speakers = {}
        for speaker in list_of_speakers.speakers.filter(begin_time=None):
            speakers[speaker.pk] = speaker

        # Check and sort speakers
        valid_speakers = []
        for speaker_id in speaker_ids:
            if not isinstance(speaker_id, int) or speakers.get(speaker_id) is None:
                raise ValidationError({"detail": "Invalid data."})
            valid_speakers.append(speakers[speaker_id])
        weight = 1
        with transaction.atomic():
            for speaker in valid_speakers:
                speaker.weight = weight
                speaker.save(skip_autoupdate=True)
                weight += 1

        # send autoupdate
        inform_changed_data(list_of_speakers)

        # Initiate response.
        return Response({"detail": "List of speakers successfully sorted."})

    @detail_route(methods=["POST"])
    def readd_last_speaker(self, request, pk=None):
        """
        Special view endpoint to re-add the last finished speaker to the list of speakers.
        """
        list_of_speakers = self.get_object()

        # Retrieve speaker which spoke last and next speaker
        last_speaker = (
            list_of_speakers.speakers.exclude(end_time=None)
            .order_by("-end_time")
            .first()
        )
        if not last_speaker:
            raise ValidationError({"detail": "There is no last speaker at the moment."})

        if last_speaker.point_of_order:
            raise ValidationError(
                {"detail": "You cannot readd a point of order speaker."}
            )

        if list_of_speakers.speakers.filter(
            user=last_speaker.user, begin_time=None
        ).exists():
            raise ValidationError({"detail": "The last speaker is already waiting."})

        next_speaker = list_of_speakers.get_next_speaker()
        new_weight = 1
        # if there is a next speaker, insert last speaker before it
        if next_speaker:
            new_weight = next_speaker.weight - 1

        # reset times of last speaker and prepend it to the list of active speakers
        last_speaker.begin_time = last_speaker.end_time = None
        last_speaker.weight = new_weight
        last_speaker.save()

        return Response()

    @list_route(methods=["post"])
    def delete_all_speakers(self, request):
        Speaker.objects.all().delete()
        inform_changed_data(ListOfSpeakers.objects.all())
        return Response()
