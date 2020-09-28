from django.apps import apps
from django.contrib.auth.models import Permission
from django.db.models import Q

from openslides.utils.auth import GROUP_ADMIN_PK, GROUP_DEFAULT_PK
from openslides.utils.postgres import restart_id_sequence

from .models import Group, User


def get_permission_change_data(sender, permissions=None, **kwargs):
    """
    Yields all necessary collections if 'users.can_see_name' permission changes.
    """
    users_app = apps.get_app_config(app_label="users")
    for permission in permissions:
        # There could be only one 'users.can_see_name' and then we want to return data.
        if (
            permission.content_type.app_label == users_app.label
            and permission.codename == "can_see_name"
        ):
            yield from users_app.get_startup_elements()


def create_builtin_groups_and_admin(**kwargs):
    """
    Creates the builtin groups: Default, Delegates, Staff and Committees.

    Creates the builtin user: admin.
    """
    # Check whether there are groups in the database.
    if Group.objects.exists():
        # Do completely nothing if there are already some groups in the database.
        return

    permission_strings = (
        "agenda.can_be_speaker",
        "agenda.can_manage",
        "agenda.can_manage_list_of_speakers",
        "agenda.can_see",
        "agenda.can_see_internal_items",
        "agenda.can_see_list_of_speakers",
        "assignments.can_manage",
        "assignments.can_nominate_other",
        "assignments.can_nominate_self",
        "assignments.can_see",
        "core.can_manage_config",
        "core.can_manage_logos_and_fonts",
        "core.can_manage_projector",
        "core.can_manage_tags",
        "core.can_see_frontpage",
        "core.can_see_history",
        "core.can_see_projector",
        "core.can_see_autopilot",
        "mediafiles.can_manage",
        "mediafiles.can_see",
        "motions.can_create",
        "motions.can_create_amendments",
        "motions.can_manage",
        "motions.can_manage_metadata",
        "motions.can_see",
        "motions.can_see_internal",
        "motions.can_support",
        "users.can_change_password",
        "users.can_manage",
        "users.can_see_extra_data",
        "users.can_see_name",
    )
    permission_query = Q()
    permission_dict = {}

    # Load all permissions
    for permission_string in permission_strings:
        app_label, codename = permission_string.split(".")
        query_part = Q(content_type__app_label=app_label) & Q(codename=codename)
        permission_query = permission_query | query_part
    for permission in Permission.objects.select_related("content_type").filter(
        permission_query
    ):
        permission_string = ".".join(
            (permission.content_type.app_label, permission.codename)
        )
        permission_dict[permission_string] = permission

    # Default (pk 1 == GROUP_DEFAULT_PK)
    base_permissions = (
        permission_dict["agenda.can_see"],
        permission_dict["agenda.can_see_internal_items"],
        permission_dict["agenda.can_see_list_of_speakers"],
        permission_dict["assignments.can_see"],
        permission_dict["core.can_see_frontpage"],
        permission_dict["core.can_see_projector"],
        permission_dict["mediafiles.can_see"],
        permission_dict["motions.can_see"],
        permission_dict["users.can_see_name"],
        permission_dict["users.can_change_password"],
    )
    group_default = Group(pk=GROUP_DEFAULT_PK, name="Default")
    group_default.save(skip_autoupdate=True)
    group_default.permissions.add(*base_permissions)

    # Admin (pk 2 == GROUP_ADMIN_PK)
    group_admin = Group(pk=GROUP_ADMIN_PK, name="Admin")
    group_admin.save(skip_autoupdate=True)

    # Delegates (pk 3)
    delegates_permissions = (
        permission_dict["agenda.can_see"],
        permission_dict["agenda.can_see_internal_items"],
        permission_dict["agenda.can_be_speaker"],
        permission_dict["agenda.can_see_list_of_speakers"],
        permission_dict["assignments.can_see"],
        permission_dict["assignments.can_nominate_other"],
        permission_dict["assignments.can_nominate_self"],
        permission_dict["core.can_see_frontpage"],
        permission_dict["core.can_see_projector"],
        permission_dict["core.can_see_autopilot"],
        permission_dict["mediafiles.can_see"],
        permission_dict["motions.can_see"],
        permission_dict["motions.can_create"],
        permission_dict["motions.can_create_amendments"],
        permission_dict["motions.can_support"],
        permission_dict["users.can_see_name"],
        permission_dict["users.can_change_password"],
    )
    group_delegates = Group(pk=3, name="Delegates")
    group_delegates.save(skip_autoupdate=True)
    group_delegates.permissions.add(*delegates_permissions)

    # Staff (pk 4)
    staff_permissions = (
        permission_dict["agenda.can_see"],
        permission_dict["agenda.can_see_internal_items"],
        permission_dict["agenda.can_be_speaker"],
        permission_dict["agenda.can_manage"],
        permission_dict["agenda.can_see_list_of_speakers"],
        permission_dict["agenda.can_manage_list_of_speakers"],
        permission_dict["assignments.can_see"],
        permission_dict["assignments.can_manage"],
        permission_dict["assignments.can_nominate_other"],
        permission_dict["assignments.can_nominate_self"],
        permission_dict["core.can_see_frontpage"],
        permission_dict["core.can_see_history"],
        permission_dict["core.can_see_projector"],
        permission_dict["core.can_manage_projector"],
        permission_dict["core.can_manage_tags"],
        permission_dict["mediafiles.can_see"],
        permission_dict["mediafiles.can_manage"],
        permission_dict["motions.can_see"],
        permission_dict["motions.can_see_internal"],
        permission_dict["motions.can_create"],
        permission_dict["motions.can_create_amendments"],
        permission_dict["motions.can_manage"],
        permission_dict["motions.can_manage_metadata"],
        permission_dict["users.can_see_name"],
        permission_dict["users.can_manage"],
        permission_dict["users.can_see_extra_data"],
        permission_dict["users.can_change_password"],
    )
    group_staff = Group(pk=4, name="Staff")
    group_staff.save(skip_autoupdate=True)
    group_staff.permissions.add(*staff_permissions)

    # Committees (pk 5)
    committees_permissions = (
        permission_dict["agenda.can_see"],
        permission_dict["agenda.can_see_internal_items"],
        permission_dict["agenda.can_see_list_of_speakers"],
        permission_dict["assignments.can_see"],
        permission_dict["core.can_see_frontpage"],
        permission_dict["core.can_see_projector"],
        permission_dict["mediafiles.can_see"],
        permission_dict["motions.can_see"],
        permission_dict["motions.can_create"],
        permission_dict["motions.can_create_amendments"],
        permission_dict["motions.can_support"],
        permission_dict["users.can_see_name"],
        permission_dict["users.can_change_password"],
    )
    group_committee = Group(pk=5, name="Committees")
    group_committee.save(skip_autoupdate=True)
    group_committee.permissions.add(*committees_permissions)

    # Create or reset admin user
    User.objects.create_or_reset_admin_user(skip_autoupdate=True)

    # After each group was created, the permissions (many to many fields) where
    # added to the group. But we do not have to update the cache by calling
    # inform_changed_data() because the cache is updated on server start.

    # For postgres: After inserting the groups by id, the id sequence needs to be restarted.
    restart_id_sequence("auth_group")
