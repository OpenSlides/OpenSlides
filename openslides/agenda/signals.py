from django.contrib.contenttypes.models import ContentType

from openslides.utils.autoupdate import inform_changed_data

from .models import Item


def listen_to_related_object_post_save(sender, instance, created, **kwargs):
    """
    Receiver function to create agenda items. It is connected to the signal
    django.db.models.signals.post_save during app loading.

    Do not run caching and autoupdate if the instance as an attribute
    skip_autoupdate (regardless of its truthy or falsy conent).
    """
    if hasattr(instance, 'get_agenda_title'):
        if created:
            # If the object is created, the related_object has to be sent again.
            Item.objects.create(content_object=instance)
            if not hasattr(instance, 'skip_autoupdate'):
                inform_changed_data(instance)
        elif not hasattr(instance, 'skip_autoupdate'):
            # If the object has changed, then also the agenda item has to be sent.
            inform_changed_data(instance.agenda_item)


def listen_to_related_object_post_delete(sender, instance, **kwargs):
    """
    Receiver function to delete agenda items. It is connected to the signal
    django.db.models.signals.post_delete during app loading.
    """
    if hasattr(instance, 'get_agenda_title'):
        content_type = ContentType.objects.get_for_model(instance)
        try:
            Item.objects.get(object_id=instance.pk, content_type=content_type).delete()
        except Item.DoesNotExist:
            # Item does not exist so we do not have to delete it.
            pass
