from cgi import escape
from collections import defaultdict

from django.contrib.auth import get_user_model
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy
from reportlab.platypus import Paragraph

from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.pdf import stylesheet
from openslides.utils.rest_api import (
    ModelViewSet,
    Response,
    ValidationError,
    detail_route,
    list_route,
)
from openslides.utils.views import PDFView

from .models import Item, Speaker
from .serializers import ItemSerializer


class AgendaPDF(PDFView):
    """
    Create a full agenda-PDF.
    """
    required_permission = 'agenda.can_see'
    filename = ugettext_lazy('Agenda')
    document_title = ugettext_lazy('Agenda')

    def append_to_pdf(self, story):
        for item in Item.objects.filter(type__exact=Item.AGENDA_ITEM):
            ancestors = item.get_ancestors()
            if ancestors:
                space = "&nbsp;" * 6 * ancestors.count()
                story.append(Paragraph(
                    "%s%s" % (space, escape(item.get_title())),
                    stylesheet['Subitem']))
            else:
                story.append(Paragraph(escape(item.get_title()), stylesheet['Item']))


class ItemViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and destroy agenda items.
    """
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see the agenda and in case of create, update or destroy
        requests the permission to manage the agenda and to see organizational
        items.
        """
        if (not request.user.has_perm('agenda.can_see') or
                (self.action in ('create', 'update', 'destroy') and not
                 (request.user.has_perm('agenda.can_manage') and
                  request.user.has_perm('agenda.can_see_orga_items')))):
            self.permission_denied(request)

    def check_object_permissions(self, request, obj):
        """
        Checks if the requesting user has permission to see also an
        organizational item if it is one.
        """
        if obj.type == obj.ORGANIZATIONAL_ITEM and not request.user.has_perm('agenda.can_see_orga_items'):
            self.permission_denied(request)

    def get_queryset(self):
        """
        Filters organizational items if the user has no permission to see them.
        """
        queryset = super().get_queryset()
        if not self.request.user.has_perm('agenda.can_see_orga_items'):
            queryset = queryset.exclude(type__exact=Item.ORGANIZATIONAL_ITEM)
        return queryset

    @detail_route(methods=['POST', 'DELETE'])
    def manage_speaker(self, request, pk=None):
        """
        Special view endpoint to add users to the list of speakers or remove
        them. Send POST {'user': <user_id>} to add a new speaker. Omit
        data to add yourself. Send DELETE {'speaker': <speaker_id>} to remove
        someone from the list of speakers. Omit data to remove yourself.

        Checks also whether the requesting user can do this. He needs at
        least the permissions 'agenda.can_see' (see
        self.check_permission()). In case of adding himself the permission
        'agenda.can_be_speaker' is required. In case of adding someone else
        the permission 'agenda.can_manage' is required. In case of removing
        someone else 'agenda.can_manage' is required. In case of removing
        himself no other permission is required.
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
                raise ValidationError({'detail': e})
            message = _('User %s was successfully added to the list of speakers.') % user

        else:
            # request.method == 'DELETE'
            # Retrieve speaker_id
            speaker_id = request.data.get('speaker')

            # Check permissions and other conditions. Get speaker instance.
            if speaker_id is None:
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
                # Remove someone else.
                if not self.request.user.has_perm('agenda.can_manage'):
                    self.permission_denied(request)
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
        Special view endpoint to begin and end speach of speakers. Send PUT
        {'speaker': <speaker_id>} to begin speach. Omit data to begin speach of
        the next speaker. Send DELETE to end speach of current speaker.

        Checks also whether the requesting user can do this. He needs at
        least the permissions 'agenda.can_see' (see
        self.check_permission()). Also the permission 'agenda.can_manage'
        is required.
        """
        # Check permission.
        if not self.request.user.has_perm('agenda.can_manage'):
            self.permission_denied(request)

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
            speaker.begin_speach()
            message = _('User is now speaking.')

        else:
            # request.method == 'DELETE'
            try:
                # We assume that there aren't multiple entries because this
                # is forbidden by the Model's begin_speach method. We assume that
                # there is only one speaker instance or none.
                current_speaker = Speaker.objects.filter(item=item, end_time=None).exclude(begin_time=None).get()
            except Speaker.DoesNotExist:
                raise ValidationError(
                    {'detail': _('There is no one speaking at the moment according to %(item)s.') % {'item': item}})
            current_speaker.end_speach()
            message = _('The speach is finished now.')

        # Initiate response.
        return Response({'detail': message})

    @list_route(methods=['get', 'put'])
    def tree(self, request):
        """
        Returns or sets the agenda tree.
        """
        if request.method == 'PUT':
            if not (request.user.has_perm('agenda.can_manage') and
                    request.user.has_perm('agenda.can_see_orga_items')):
                self.permission_denied(request)
            return self.set_tree(request.data['tree'])
        return self.get_tree()

    def get_tree(self):
        """
        Returns the agenda tree.
        """
        item_list = Item.objects.order_by('weight')

        # Index the items to get the children for each item
        item_children = defaultdict(list)
        for item in item_list:
            if item.parent:
                item_children[item.parent_id].append(item)

        def get_children(item):
            """
            Returns a list with all the children for item.

            Returns an empty list if item has no children.
            """
            return [dict(id=child.pk, children=get_children(child))
                    for child in item_children[item.pk]]

        return Response(dict(id=item.pk, children=get_children(item))
                        for item in item_list if not item.parent)

    def set_tree(self, tree):
        """
        Sets the agenda tree.

        The tree has to be a nested object. For example:
        [{"id": 1}, {"id": 2, "children": [{"id": 3}]}]
        """

        def walk_items(tree, parent=None):
            """
            Generator that returns each item in the tree as tuple.

            This tuples have tree values. The item id, the item parent and the
            weight of the item.
            """
            for weight, element in enumerate(tree):
                yield (element['id'], parent, weight)
                yield from walk_items(element.get('children', []), element['id'])

        touched_items = set()
        for item_pk, parent_pk, weight in walk_items(tree):
            # Check that the item is only once in the tree to prevent invalid trees
            if item_pk in touched_items:
                detail = "Item %d is more then once in the tree" % item_pk
                break
            touched_items.add(item_pk)

            Item.objects.filter(pk=item_pk).update(
                parent_id=parent_pk,
                weight=weight)
        else:
            # Everithing is fine. Return a response with status_code 200 an no content
            return Response()
        return Response({'detail': detail}, status=400)
