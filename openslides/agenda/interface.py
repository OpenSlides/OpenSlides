# -*- coding: utf-8 -*-

from django.utils.translation import ugettext as _

from openslides.core.widgets import Widget
from openslides.projector.api import get_active_slide

from .models import Item


def get_agenda_widget(sender, request, **kwargs):
    """
    Returns the agenda widget.
    """
    active_slide = get_active_slide()
    if active_slide['callback'] == 'agenda':
        agenda_is_active = active_slide.get('pk', 'agenda') == 'agenda'
        active_type = active_slide.get('type', 'text')
    else:
        agenda_is_active = None
        active_type = None

    return Widget(
        name='agenda',
        display_name=_('Agenda'),
        template='agenda/widget.html',
        context={
            'agenda_is_active': agenda_is_active,
            'items': Item.objects.all(),
            'active_type': active_type},
        request=request,
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=20)


def get_list_of_speakers_widget(sender, request, **kwargs):
    """
    Returns the list of speakers widget.
    """
    return Widget(
        name='append_to_list_of_speakers',
        display_name=_('List of speakers'),
        template='agenda/speaker_widget.html',
        request=request,
        permission_required='agenda.can_be_speaker',
        default_column=1,
        default_weight=30)


# TODO: Add code for main meny entry (tab) here.
