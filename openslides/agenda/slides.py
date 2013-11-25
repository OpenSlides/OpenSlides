# -*- coding: utf-8 -*-

from django.template.loader import render_to_string

from openslides.config.api import config
from openslides.projector.api import get_projector_content, register_slide

from .models import Item


def agenda_slide(**kwargs):
    """
    Return the html code for all slides of the agenda app.

    If no id is given, show a summary of all parent items.

    If an id is given, show the item depending of the argument 'type'.

    If 'type' is not set, show only the item.

    If 'type' is 'summary', show a summary of all children of the item.

    If 'type' is 'list_of_speakers', show the list of speakers for the item.
    """
    item_pk = kwargs.get('pk', None)
    slide_type = kwargs.get('type', None)

    try:
        item = Item.objects.get(pk=item_pk)
    except Item.DoesNotExist:
        item = None

    if slide_type == 'summary' or item is None:
        context = {}
        if item is None:
            items = Item.objects.filter(parent=None, type__exact=Item.AGENDA_ITEM)
        else:
            items = item.get_children().filter(type__exact=Item.AGENDA_ITEM)
            context['title'] = item.get_title()
        context['items'] = items
        slide = render_to_string('agenda/item_slide_summary.html', context)

    elif slide_type == 'list_of_speakers':
        list_of_speakers = item.get_list_of_speakers(
            old_speakers_count=config['agenda_show_last_speakers'])
        context = {'title': item.get_title(),
                   'item': item,
                   'list_of_speakers': list_of_speakers}
        slide = render_to_string('agenda/item_slide_list_of_speaker.html', context)

    elif item.content_object:
        slide_dict = {
            'callback': item.content_object.slide_callback_name,
            'pk': item.content_object.pk}
        slide = get_projector_content(slide_dict)

    else:
        context = {'item': item}
        slide = render_to_string('agenda/item_slide.html', context)
    return slide


register_slide('agenda', agenda_slide, Item)
