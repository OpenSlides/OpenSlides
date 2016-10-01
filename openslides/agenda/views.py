from html import escape

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy
from reportlab.platypus import Paragraph

from openslides.core.config import config
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.pdf import stylesheet
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
from openslides.utils.views import PDFView

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
            result = self.request.user.has_perm('agenda.can_see')
            # For manage_speaker and tree requests the rest of the check is
            # done in the specific method. See below.
        elif self.action in ('partial_update', 'update'):
            result = (self.request.user.has_perm('agenda.can_see') and
                      self.request.user.has_perm('agenda.can_see_hidden_items') and
                      self.request.user.has_perm('agenda.can_manage'))
        elif self.action in ('speak', 'sort_speakers', 'numbering'):
            result = (self.request.user.has_perm('agenda.can_see') and
                      self.request.user.has_perm('agenda.can_manage'))
        else:
            result = False
        return result

    @detail_route(methods=['POST', 'DELETE'])
    def manage_speaker(self, request, pk=None):
        """
        Special view endpoint to add users to the list of speakers or remove
        them. Send POST {'user': <user_id>} to add a new speaker. Omit
        data to add yourself. Send DELETE {'speaker': <speaker_id>} or
        DELETE {'speaker': [<speaker_id>, <speaker_id>, ...]} to remove one or
        more speakers from the list of speakers. Omit data to remove yourself.

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
                if not self.request.user.has_perm('agenda.can_be_speaker'):
                    self.permission_denied(request)
                if item.speaker_list_closed:
                    raise ValidationError({'detail': _('The list of speakers is closed.')})
                user = self.request.user
            else:
                # Add someone else.
                if not self.request.user.has_perm('agenda.can_manage'):
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
                if not self.request.user.has_perm('agenda.can_manage'):
                    self.permission_denied(request)
                if type(speaker_ids) is int:
                    speaker_ids = [speaker_ids]
                for speaker_id in speaker_ids:
                    try:
                        speaker = Speaker.objects.get(pk=int(speaker_id))
                    except (ValueError, Speaker.DoesNotExist):
                        raise ValidationError({'detail': _('Speaker does not exist.')})
                    # Delete the speaker.
                    speaker.delete()
                    message = _('Speaker %s was successfully removed from the list of speakers.') % speaker

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
                speaker.save()
                weight += 1

        # Initiate response.
        return Response({'detail': _('List of speakers successfully sorted.')})

    @list_route(methods=['post'])
    def numbering(self, request):
        """
        Auto numbering of the agenda according to the config. Manually added
        item numbers will be overwritten.
        """
        Item.objects.number_all(numeral_system=config['agenda_numeral_system'])
        return Response({'detail': _('The agenda has been numbered.')})


# Views to generate PDFs

class AgendaPDF(PDFView):
    """
    Create a full agenda-PDF.
    """
    required_permission = 'agenda.can_see'
    filename = ugettext_lazy('Agenda')
    document_title = ugettext_lazy('Agenda')

    def append_to_pdf(self, story):
        tree = Item.objects.get_tree(only_agenda_items=True, include_content=True)

        def walk_tree(tree, ancestors=0):
            """
            Generator that yields a two-element-tuple. The first element is an
            agenda-item and the second a number for steps to the root element.
            """
            for element in tree:
                yield element['item'], ancestors
                yield from walk_tree(element['children'], ancestors + 1)

        for item, ancestors in walk_tree(tree):
            item_number = "{} ".format(item.item_number) if item.item_number else ''
            if ancestors:
                space = "&nbsp;" * 6 * ancestors
                story.append(Paragraph(
                    "%s%s%s" % (space, item_number, escape(item.title)),
                    stylesheet['Subitem']))
            else:
                story.append(Paragraph(
                    "%s%s" % (item_number, escape(item.title)),
                    stylesheet['Item']))
