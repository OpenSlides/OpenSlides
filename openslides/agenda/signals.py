from typing import Iterable, Tuple

from django.apps import apps
from django.contrib.contenttypes.models import ContentType
from django.db import models

from ..utils.autoupdate import inform_changed_data
from .models import Item, ListOfSpeakers


def listen_to_related_object_post_save(sender, instance, created, **kwargs):
    """
    Receiver function to create agenda items. It is connected to the signal
    django.db.models.signals.post_save during app loading.

    The agenda_item_update_information container may have fields like type,
    parent_id, comment, duration, weight or skip_autoupdate.

    Do not run caching and autoupdate if the instance has a key
    skip_autoupdate in the agenda_item_update_information container.
    """
    instance_inform_changed_data = (
        False
    )  # evaluates, if the related_object has to be send again.
    # This is the case, if it was newly created and the autoupdate is not skipped with
    # agenda_item_skip_autoupdate or List_of_speakers_skip_autoupdate. If the related_object is
    # related to agenda items and list of speakers, the autoupdate is skipped, if one of the given
    # values is True.
    is_agenda_item_content_object = hasattr(instance, "get_agenda_title_information")
    is_list_of_speakers_content_object = hasattr(
        instance, "get_list_of_speakers_title_information"
    )

    if is_agenda_item_content_object:
        if created:
            attrs = {}
            for attr in ("type", "parent_id", "comment", "duration", "weight"):
                if instance.agenda_item_update_information.get(attr):
                    attrs[attr] = instance.agenda_item_update_information.get(attr)
            Item.objects.create(content_object=instance, **attrs)

            if not instance.agenda_item_skip_autoupdate:
                instance_inform_changed_data = True

        elif not instance.agenda_item_skip_autoupdate:
            # If the object has changed, then also the agenda item has to be sent.
            inform_changed_data(instance.agenda_item)

    if is_list_of_speakers_content_object:
        if created:
            ListOfSpeakers.objects.create(content_object=instance)
            if not instance.list_of_speakers_skip_autoupdate:
                instance_inform_changed_data = True

        elif not instance.list_of_speakers_skip_autoupdate:
            # If the object has changed, then also the list of speakers has to be sent.
            inform_changed_data(instance.list_of_speakers)

    # If the related_object is related to the angenda and list of speakers, check, if skip_autoupdate
    # is False for both,
    if created and is_agenda_item_content_object and is_list_of_speakers_content_object:
        instance_inform_changed_data = not (
            instance.agenda_item_skip_autoupdate
            or instance.list_of_speakers_skip_autoupdate
        )

    if instance_inform_changed_data:
        inform_changed_data(instance)


def listen_to_related_object_post_delete(sender, instance, **kwargs):
    """
    Receiver function to delete agenda items. It is connected to the signal
    django.db.models.signals.post_delete during app loading.
    """

    has_content_object_mapping: Iterable[Tuple[str, models.Model]] = (
        ("get_agenda_title_information", Item),
        ("get_list_of_speakers_title_information", ListOfSpeakers),
    )

    for (attr, Model) in has_content_object_mapping:
        if hasattr(instance, attr):
            content_type = ContentType.objects.get_for_model(instance)
            try:
                Model.objects.get(
                    object_id=instance.pk, content_type=content_type
                ).delete()
            except Model.DoesNotExist:
                # Model does not exist so we do not have to delete it.
                pass


def get_permission_change_data(sender, permissions, **kwargs):
    """
    Yields all necessary collections if 'agenda.can_see',
    'agenda.can_see_list_of_speakers', 'agenda.can_see_internal_items'
    or 'agenda.can_manage' permissions changes.
    """
    agenda_app = apps.get_app_config(app_label="agenda")
    for permission in permissions:
        # There could be only one 'agenda.can_see' and then we want to return data.
        if (
            permission.content_type.app_label == agenda_app.label
            and permission.codename
            in (
                "can_see",
                "can_see_list_of_speakers",
                "can_see_internal_items",
                "can_manage",
            )
        ):
            yield from agenda_app.get_startup_elements()
            break
