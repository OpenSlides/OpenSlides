from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.core.config import config
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.rest_api import (
    GenericViewSet,
    ListModelMixin,
    Response,
    RetrieveModelMixin,
    UpdateModelMixin,
    ValidationError,
    detail_route,
    list_route,
)
from openslides.utils.views import BinaryTemplateView

from ..utils.auth import has_perm
from .access_permissions import ItemAccessPermissions
from .models import Item, Speaker


# Viewsets for the REST API

class ItemViewSet(ListModelMixin, RetrieveModelMixin, UpdateModelMixin, GenericViewSet):
    """
    API endpoint for agenda items.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy, manage_speaker, speak and tree.
    """
    access_permissions = ItemAccessPermissions()
    queryset = Item.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ('metadata', 'manage_speaker', 'tree'):
            result = has_perm(self.request.user, 'agenda.can_see')
            # For manage_speaker and tree requests the rest of the check is
            # done in the specific method. See below.
        elif self.action in ('partial_update', 'update', 'sort'):
            result = (has_perm(self.request.user, 'agenda.can_see') and
                      has_perm(self.request.user, 'agenda.can_see_internal_items') and
                      has_perm(self.request.user, 'agenda.can_manage'))
        elif self.action in ('speak', 'sort_speakers'):
            result = (has_perm(self.request.user, 'agenda.can_see') and
                      has_perm(self.request.user, 'agenda.can_manage_list_of_speakers'))
        elif self.action in ('numbering'):
            result = (has_perm(self.request.user, 'agenda.can_see') and
                      has_perm(self.request.user, 'agenda.can_manage'))
        else:
            result = False
        return result

    def update(self, *args, **kwargs):
        """
        Customized view endpoint to update all children if, the item type has changed.
        """
        old_type = self.get_object().type

        result = super().update(*args, **kwargs)

        # update all children, if the item type has changed
        item = self.get_object()

        if old_type != item.type:
            items_to_update = []

            # rekursively add children to items_to_update
            def add_item(item):
                items_to_update.append(item)
                for child in item.children.all():
                    add_item(child)

            add_item(item)
            inform_changed_data(items_to_update)

        return result

    @detail_route(methods=['POST', 'PATCH', 'DELETE'])
    def manage_speaker(self, request, pk=None):
        """
        Special view endpoint to add users to the list of speakers or remove
        them. Send POST {'user': <user_id>} to add a new speaker. Omit
        data to add yourself. Send DELETE {'speaker': <speaker_id>} or
        DELETE {'speaker': [<speaker_id>, <speaker_id>, ...]} to remove one or
        more speakers from the list of speakers. Omit data to remove yourself.
        Send PATCH {'user': <user_id>, 'marked': <bool>} to mark the speaker.

        Checks also whether the requesting user can do this. He needs at
        least the permissions 'agenda.can_see' (see
        self.check_view_permissions()). In case of adding himself the
        permission 'agenda.can_be_speaker' is required. In case of adding
        someone else the permission 'agenda.can_manage' is required. In
        case of removing someone else 'agenda.can_manage' is required. In
        case of removing himself no other permission is required.
        """
        # Retrieve item.
        item = self.get_object()

        if request.method == 'POST':
            # Retrieve user_id
            user_id = request.data.get('user')

            # Check permissions and other conditions. Get user instance.
            if user_id is None:
                # Add oneself
                if not has_perm(self.request.user, 'agenda.can_be_speaker'):
                    self.permission_denied(request)
                if item.speaker_list_closed:
                    raise ValidationError({'detail': _('The list of speakers is closed.')})
                user = self.request.user
            else:
                # Add someone else.
                if not has_perm(self.request.user, 'agenda.can_manage_list_of_speakers'):
                    self.permission_denied(request)
                try:
                    user = get_user_model().objects.get(pk=int(user_id))
                except (ValueError, get_user_model().DoesNotExist):
                    raise ValidationError({'detail': _('User does not exist.')})

            # Try to add the user. This ensurse that a user is not twice in the
            # list of coming speakers.
            try:
                Speaker.objects.add(user, item)
            except OpenSlidesError as e:
                raise ValidationError({'detail': str(e)})
            message = _('User %s was successfully added to the list of speakers.') % user

            # Send new speaker via autoupdate because users without permission
            # to see users may not have it but can get it now.
            inform_changed_data([user])

        # Toggle 'marked' for the speaker
        elif request.method == 'PATCH':
            # Check permissions
            if not has_perm(self.request.user, 'agenda.can_manage_list_of_speakers'):
                self.permission_denied(request)

            # Retrieve user_id
            user_id = request.data.get('user')
            try:
                user = get_user_model().objects.get(pk=int(user_id))
            except (ValueError, get_user_model().DoesNotExist):
                raise ValidationError({'detail': _('User does not exist.')})

            marked = request.data.get('marked')
            if not isinstance(marked, bool):
                raise ValidationError({'detail': _('Marked has to be a bool.')})

            queryset = Speaker.objects.filter(item=item, user=user)
            try:
                # We assume that there aren't multiple entries because this
                # is forbidden by the Manager's add method. We assume that
                # there is only one speaker instance or none.
                speaker = queryset.get()
            except Speaker.DoesNotExist:
                raise ValidationError({'detail': _('The user is not in the list of speakers.')})
            else:
                speaker.marked = marked
                speaker.save()
                if speaker.marked:
                    message = _('You are successfully marked the speaker.')
                else:
                    message = _('You are successfully unmarked the speaker.')

        else:
            # request.method == 'DELETE'
            speaker_ids = request.data.get('speaker')

            # Check permissions and other conditions. Get speaker instance.
            if speaker_ids is None:
                # Remove oneself
                queryset = Speaker.objects.filter(
                    item=item, user=self.request.user).exclude(weight=None)
                try:
                    # We assume that there aren't multiple entries because this
                    # is forbidden by the Manager's add method. We assume that
                    # there is only one speaker instance or none.
                    speaker = queryset.get()
                except Speaker.DoesNotExist:
                    raise ValidationError({'detail': _('You are not on the list of speakers.')})
                else:
                    speaker.delete()
                    message = _('You are successfully removed from the list of speakers.')
            else:
                # Remove someone else.
                if not has_perm(self.request.user, 'agenda.can_manage_list_of_speakers'):
                    self.permission_denied(request)
                if type(speaker_ids) is int:
                    speaker_ids = [speaker_ids]
                deleted_speaker_count = 0
                for speaker_id in speaker_ids:
                    try:
                        speaker = Speaker.objects.get(pk=int(speaker_id))
                    except (ValueError, Speaker.DoesNotExist):
                        pass
                    else:
                        speaker.delete(skip_autoupdate=True)
                        deleted_speaker_name = speaker
                        deleted_speaker_count += 1
                # send autoupdate if speakers are deleted
                if deleted_speaker_count > 0:
                    inform_changed_data(item)

                if deleted_speaker_count > 1:
                    message = str(deleted_speaker_count) + ' ' + _('speakers have been removed from the list of speakers.')
                elif deleted_speaker_count == 1:
                    message = _('User %s has been removed from the list of speakers.') % deleted_speaker_name
                else:
                    message = _('No speakers have been removed from the list of speakers.')
        # Initiate response.
        return Response({'detail': message})

    @detail_route(methods=['PUT', 'DELETE'])
    def speak(self, request, pk=None):
        """
        Special view endpoint to begin and end speech of speakers. Send PUT
        {'speaker': <speaker_id>} to begin speech. Omit data to begin speech of
        the next speaker. Send DELETE to end speech of current speaker.
        """
        # Retrieve item.
        item = self.get_object()

        if request.method == 'PUT':
            # Retrieve speaker_id
            speaker_id = request.data.get('speaker')
            if speaker_id is None:
                speaker = item.get_next_speaker()
                if speaker is None:
                    raise ValidationError({'detail': _('The list of speakers is empty.')})
            else:
                try:
                    speaker = Speaker.objects.get(pk=int(speaker_id))
                except (ValueError, Speaker.DoesNotExist):
                    raise ValidationError({'detail': _('Speaker does not exist.')})
            speaker.begin_speech()
            message = _('User is now speaking.')

        else:
            # request.method == 'DELETE'
            try:
                # We assume that there aren't multiple entries because this
                # is forbidden by the Model's begin_speech method. We assume that
                # there is only one speaker instance or none.
                current_speaker = Speaker.objects.filter(item=item, end_time=None).exclude(begin_time=None).get()
            except Speaker.DoesNotExist:
                raise ValidationError(
                    {'detail': _('There is no one speaking at the moment according to %(item)s.') % {'item': item}})
            current_speaker.end_speech()
            message = _('The speech is finished now.')

        # Initiate response.
        return Response({'detail': message})

    @detail_route(methods=['POST'])
    def sort_speakers(self, request, pk=None):
        """
        Special view endpoint to sort the list of speakers.

        Expects a list of IDs of the speakers.
        """
        # Retrieve item.
        item = self.get_object()

        # Check data
        speaker_ids = request.data.get('speakers')
        if not isinstance(speaker_ids, list):
            raise ValidationError(
                {'detail': _('Invalid data.')})

        # Get all speakers
        speakers = {}
        for speaker in item.speakers.filter(begin_time=None):
            speakers[speaker.pk] = speaker

        # Check and sort speakers
        valid_speakers = []
        for speaker_id in speaker_ids:
            if not isinstance(speaker_id, int) or speakers.get(speaker_id) is None:
                raise ValidationError(
                    {'detail': _('Invalid data.')})
            valid_speakers.append(speakers[speaker_id])
        weight = 0
        with transaction.atomic():
            for speaker in valid_speakers:
                speaker.weight = weight
                speaker.save(skip_autoupdate=True)
                weight += 1

        # send autoupdate
        inform_changed_data(item)

        # Initiate response.
        return Response({'detail': _('List of speakers successfully sorted.')})

    @list_route(methods=['post'])
    def numbering(self, request):
        """
        Auto numbering of the agenda according to the config. Manually added
        item numbers will be overwritten.
        """
        if not config['agenda_enable_numbering']:
            raise ValidationError({'detail': _('Numbering of agenda items is deactivated.')})

        Item.objects.number_all(numeral_system=config['agenda_numeral_system'])
        return Response({'detail': _('The agenda has been numbered.')})

    @list_route(methods=['post'])
    def sort(self, request):
        """
        Sort agenda items. Also checks parent field to prevent hierarchical
        loops.
        """
        nodes = request.data.get('nodes', [])
        parent_id = request.data.get('parent_id')
        items = []
        with transaction.atomic():
            for index, node in enumerate(nodes):
                item = Item.objects.get(pk=node['id'])
                item.parent_id = parent_id
                item.weight = index
                item.save(skip_autoupdate=True)
                items.append(item)

                # Now check consistency. TODO: Try to use less DB queries.
                item = Item.objects.get(pk=node['id'])
                ancestor = item.parent
                while ancestor is not None:
                    if ancestor == item:
                        raise ValidationError({'detail': _(
                            'There must not be a hierarchical loop. Please reload the page.')})
                    ancestor = ancestor.parent

        inform_changed_data(items)
        return Response({'detail': _('The agenda has been sorted.')})


# Special views
class AgendaDocxTemplateView(BinaryTemplateView):
    """
    Returns the template for motions docx export
    """
    template_name = 'templates/docx/agenda.docx'
