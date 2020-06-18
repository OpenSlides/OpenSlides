import sys
from collections import defaultdict
from typing import Dict, List

from django.apps import apps
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.dispatch import Signal

from ..utils import logging
from ..utils.autoupdate import AutoupdateElement, inform_elements


# This signal is send when the migrate command is done. That means it is sent
# after post_migrate sending and creating all Permission objects. Don't use it
# for other things than dealing with Permission objects.
post_permission_creation = Signal()

# This signal is sent if a permission is changed (e. g. a group gets a new
# permission). Connected receivers may yield Collections.
permission_change = Signal()


def delete_django_app_permissions(sender, **kwargs):
    """
    Deletes the permissions, Django creates by default. Only required
    for auth, contenttypes and sessions.
    """
    contenttypes = ContentType.objects.filter(
        Q(app_label="auth") | Q(app_label="contenttypes") | Q(app_label="sessions")
    )
    Permission.objects.filter(content_type__in=contenttypes).delete()


def cleanup_unused_permissions(sender, **kwargs):
    """
    Deletes all permissions, that are not defined in any model meta class
    """
    # Maps the content type id to codenames of perms for this content type.
    content_type_codename_mapping: Dict[int, List[str]] = defaultdict(list)

    # Maps content type ids to the content type.
    content_type_id_mapping = {}

    # Collect all perms from all apps.
    for model in apps.get_models():
        content_type = ContentType.objects.get_for_model(
            model, for_concrete_model=False
        )
        content_type_id_mapping[content_type.id] = content_type

        for perm in model._meta.permissions:
            content_type_codename_mapping[content_type.id].append(perm[0])

    # Cleanup perms per content type.
    logger = logging.getLogger("openslides.core.migrations")
    for content_type_id, codenames in content_type_codename_mapping.items():
        app_label = content_type_id_mapping[content_type_id].app_label
        unused_perms = Permission.objects.filter(
            content_type__pk=content_type_id
        ).exclude(codename__in=codenames)
        if unused_perms.exists():
            verbose_permissions = ", ".join(
                [f"{app_label}.{perm.codename}" for perm in unused_perms.all()]
            )
            logger.info(f"cleaning unused permissions: {verbose_permissions}")
            unused_perms.delete()


def get_permission_change_data(sender, permissions, **kwargs):
    """
    Yields all necessary Cachables if the respective permissions change.
    """
    core_app = apps.get_app_config(app_label="core")
    for permission in permissions:
        if permission.content_type.app_label == core_app.label:
            if permission.codename == "can_see_projector":
                yield core_app.get_model("Projector")
            elif permission.codename == "can_manage_projector":
                yield core_app.get_model("ProjectorMessage")
                yield core_app.get_model("Countdown")
                yield core_app.get_model("ProjectionDefault")


def autoupdate_for_many_to_many_relations(sender, instance, **kwargs):
    """
    Send autoupdate for many-to-many related objects if the other side
    is deleted.
    """
    # Hotfix for #4501: Skip autoupdate for many-to-many related objects
    # during migrations.
    if "migrate" in sys.argv:
        return

    m2m_fields = (
        field
        for field in instance._meta.get_fields(include_hidden=True)
        if field.many_to_many and field.auto_created
    )
    for field in m2m_fields:
        queryset = getattr(instance, field.get_accessor_name()).all()
        elements = []
        for related_instance in queryset:
            if hasattr(related_instance, "get_root_rest_element"):
                # The related instance is or has a root rest element.
                # So lets send it via autoupdate.
                root_rest_element = related_instance.get_root_rest_element()
                elements.append(
                    AutoupdateElement(
                        collection_string=root_rest_element.get_collection_string(),
                        id=root_rest_element.pk,
                    )
                )
        inform_elements(elements)
