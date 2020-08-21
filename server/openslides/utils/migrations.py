from typing import Any, Callable

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


def add_permission_to_groups_based_on_existing_permission(
    codename: str, model: str, app_label: str, new_codename: str, new_name: str
) -> Callable[[Any, Any], None]:
    """
    Creates the new permission given by new_codename and new_name to all groups,
    that have the base permission. This base permission is given by codename, model
    and app_label. The new permission will have the same content type as the base
    permission. The migration just runs, if the base permission and content type do
    exist, so this does not run for a fresh database.
    """

    def function(apps: Any, schema_editor: Any) -> None:
        content_type = ContentType.objects.filter(model=model, app_label=app_label)
        base_perm = Permission.objects.filter(
            codename=codename, content_type__in=content_type
        )

        if len(base_perm) == 1 and len(content_type) == 1:
            # get the actual content type and base permission
            base_perm = base_perm.get()
            content_type = content_type.get()

            # Save groups. list() is necessary to evaluate the database query right now.
            groups = list(base_perm.group_set.all())

            # Create new permission
            perm = Permission.objects.create(
                codename=new_codename, name=new_name, content_type=content_type
            )

            # Add this permission to all groups
            for group in groups:
                group.permissions.add(perm)
                group.save()

    return function
