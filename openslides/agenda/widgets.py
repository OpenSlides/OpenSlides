# -*- coding: utf-8 -*-

from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget
from openslides.projector.api import get_active_slide

from .models import Item


class AgendaWidget(Widget):
    """
    Agenda widget.
    """
    name = 'agenda'
    verbose_name = ugettext_lazy('Agenda')
    required_permission = 'core.can_manage_projector'
    default_column = 1
    default_weight = 20
    template_name = 'agenda/widget_item.html'
    icon_css_class = 'icon-calendar'
    more_link_pattern_name = 'item_overview'

    def get_context_data(self, **context):
        active_slide = get_active_slide()
        if active_slide['callback'] == 'agenda':
            agenda_is_active = active_slide.get('pk', 'agenda') == 'agenda'
            active_type = active_slide.get('type', 'text')
        else:
            agenda_is_active = None
            active_type = None
        context.update({
            'agenda_is_active': agenda_is_active,
            'items': Item.objects.all(),
            'active_type': active_type})
        return super(AgendaWidget, self).get_context_data(**context)


class ListOfSpeakersWidget(Widget):
    """
    Widget to control the list of speakers.
    """
    name = 'append_to_list_of_speakers'
    verbose_name = ugettext_lazy('List of speakers')
    default_column = 1
    default_weight = 30
    template_name = 'agenda/widget_list_of_speakers.html'
    icon_css_class = 'icon-bell'

    def check_permission(self):
        return (self.request.user.has_perm('agenda.can_manage_agenda') or
                self.request.user.has_perm('agenda.can_be_speaker'))
