# TODO: Rename all views and template names

from cgi import escape
from collections import defaultdict
from json import dumps

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.template.loader import render_to_string
from django.utils.datastructures import SortedDict
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy
from reportlab.platypus import Paragraph

from openslides.config.api import config
from openslides.projector.api import (
    get_active_object,
    get_projector_overlays_js,
    get_overlays)
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.pdf import stylesheet
from openslides.utils.rest_api import (
    ModelViewSet,
    Response,
    ValidationError,
    detail_route,
    list_route,
)
from openslides.utils.views import (
    AjaxMixin,
    PDFView,
    RedirectView,
    SingleObjectMixin,
    TemplateView)

from .models import Item, Speaker
from .serializers import ItemSerializer


class CreateRelatedAgendaItemView(SingleObjectMixin, RedirectView):
    """
    View to create and agenda item for a related object.

    This view is only for subclassing in views of related apps. You
    have to define 'model = ....'
    """
    required_permission = 'agenda.can_manage'
    url_name = 'item_overview'
    url_name_args = []

    def pre_redirect(self, request, *args, **kwargs):
        """
        Create the agenda item.
        """
        self.item = Item.objects.create(content_object=self.get_object())


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


class CurrentListOfSpeakersProjectorView(AjaxMixin, TemplateView):
    """
    View with the current list of speakers depending on the active slide.
    Usefule for the projector.
    """
    template_name = 'agenda/current_list_of_speakers_projector.html'

    def get(self, request, *args, **kwargs):
        """
        Returns response object depending on request type (ajax or normal).
        """
        if request.is_ajax():
            value = self.ajax_get(request, *args, **kwargs)
        else:
            value = super(CurrentListOfSpeakersProjectorView, self).get(request, *args, **kwargs)
        return value

    def get_item(self):
        """
        Returns the item of the current slide is an agenda item slide or a
        slide of a related model else returns None.
        """
        slide_object = get_active_object()
        if slide_object is None or isinstance(slide_object, Item):
            item = slide_object
        else:
            # TODO: If there is more than one item, use the first one in the
            #       mptt tree that is not closed.
            try:
                item = Item.objects.filter(
                    content_type=ContentType.objects.get_for_model(slide_object),
                    object_id=slide_object.pk)[0]
            except IndexError:
                item = None
        return item

    def get_content(self):
        """
        Returns the content of this slide.
        """
        item = self.get_item()
        if item is None:
            content = mark_safe('<h1>%s</h1><i>%s</i>\n' % (_('List of speakers'), _('Not available.')))
        else:
            content_dict = {
                'title': item.get_title(),
                'item': item,
                'list_of_speakers': item.get_list_of_speakers(
                    old_speakers_count=config['agenda_show_last_speakers'])}
            content = render_to_string('agenda/item_slide_list_of_speaker.html', content_dict)
        return content

    def get_overlays_and_overlay_js(self):
        """
        Returns the overlays and their JavaScript for this slide as a
        two-tuple. The overlay 'agenda_speaker' is always excluded.

        The required JavaScript fot this view is inserted.
        """
        overlays = get_overlays(only_active=True)
        overlays.pop('agenda_speaker', None)
        overlay_js = get_projector_overlays_js(as_json=True)
        # Note: The JavaScript content of overlay 'agenda_speaker' is not
        #       excluded because this overlay has no such content at the moment.
        extra_js = SortedDict()
        extra_js['load_file'] = static('js/agenda_current_list_of_speakers_projector.js')
        extra_js['call'] = 'reloadListOfSpeakers();'
        extra_js = dumps(extra_js)
        overlay_js.append(extra_js)
        return overlays, overlay_js

    def get_context_data(self, **context):
        """
        Returns the context for the projector template. Contains the content
        of this slide.
        """
        overlays, overlay_js = self.get_overlays_and_overlay_js()
        return super(CurrentListOfSpeakersProjectorView, self).get_context_data(
            content=self.get_content(),
            overlays=overlays,
            overlay_js=overlay_js,
            **context)

    def get_ajax_context(self, **context):
        """
        Returns the context including the slide content for ajax response. The
        overlay 'agenda_speaker' is always excluded.
        """
        overlay_dict = {}
        for overlay in get_overlays().values():
            if overlay.is_active() and overlay.name != 'agenda_speaker':
                overlay_dict[overlay.name] = {
                    'html': overlay.get_projector_html(),
                    'javascript': overlay.get_javascript()}
            else:
                overlay_dict[overlay.name] = None
        return super(CurrentListOfSpeakersProjectorView, self).get_ajax_context(
            content=self.get_content(),
            overlays=overlay_dict,
            **context)


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
            message = _('User was successfully added to the list of speakers.')

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
                    speaker = Speaker.objects.get(pk=speaker_id)
                except Speaker.DoesNotExist:
                    raise ValidationError({'detail': _('Speaker does not exist.')})

            # Delete the speaker.
            speaker.delete()
            message = _('Speaker was successfully removed from the list of speakers.')

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
