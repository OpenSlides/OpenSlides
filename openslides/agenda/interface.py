# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget
from openslides.projector.api import get_active_slide

from .models import Item


class AgendaWidget(Widget):
    """
    Widget for the agenda items.
    """
    name = 'agenda'
    display_name = _('Agenda')
    permission_required = 'projector.can_manage_projector'
    default_column = 1
    default_weight = 20
    template_name = 'agenda/widget.html'

    def get_context(self):
        active_slide = get_active_slide()
        if active_slide['callback'] == 'agenda':
            agenda_is_active = active_slide.get('pk', 'agenda') == 'agenda'
            active_type = active_slide.get('type', 'text')
        else:
            agenda_is_active = None
            active_type = None
        return {
            'agenda_is_active': agenda_is_active,
            'items': Item.objects.all(),
            'active_type': active_type}


class ListOfSpeakersWidget(Widget):
    """
    Widget to control the list of speakers.
    """
    name = 'append_to_list_of_speakers'
    display_name = _('List of speakers')
    permission_required = 'agenda.can_be_speaker'
    default_column = 1
    default_weight = 30
    template_name = 'agenda/speaker_widget.html'


# TODO: Add code for main meny entry (tab) here.
