# -*- coding: utf-8 -*-

from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.template.loader import render_to_string

from openslides.config.api import config
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Overlay
from openslides.projector.signals import projector_overlays

from .models import Item


@receiver(projector_overlays, dispatch_uid="agenda_list_of_speakers")
def agenda_list_of_speakers(sender, **kwargs):
    """
    Receiver for the list of speaker overlay.
    """
    name = 'agenda_speaker'

    def get_widget_html():
        """
        Returns the the html-code to show in the overly-widget.
        """
        return render_to_string('agenda/overlay_speaker_widget.html')

    def get_projector_html():
        """
        Returns an html-code to show on the projector.

        The overlay is only shown on agenda-items and not on the
        list-of-speakers slide.
        """
        active_slide = get_active_slide()
        slide_type = active_slide.get('type', None)
        active_slide_pk = active_slide.get('pk', None)
        if (active_slide['callback'] == 'agenda' and
                slide_type != 'list_of_speakers' and
                active_slide_pk is not None):
            item = Item.objects.get(pk=active_slide_pk)
            list_of_speakers = item.get_list_of_speakers(
                old_speakers_count=config['agenda_show_last_speakers'],
                coming_speakers_count=5)
            context = {
                'list_of_speakers': list_of_speakers,
                'closed': item.speaker_list_closed,
            }
            return render_to_string('agenda/overlay_speaker_projector.html', context)
        else:
            return None

    return Overlay(name, get_widget_html, get_projector_html)


# TODO: Move this to models.py
@receiver(pre_delete)
def listen_to_related_object_delete_signal(sender, instance, **kwargs):
    """
    Receiver to listen whether a related item has been deleted.
    """
    if hasattr(instance, 'get_agenda_title'):
        for item in Item.objects.filter(content_type=ContentType.objects.get_for_model(sender), object_id=instance.pk):
            item.title = '< Item for deleted slide (%s) >' % instance.get_agenda_title()
            item.content_type = None
            item.object_id = None
            item.save()
