# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


def create_superadmin_group(apps, schema_editor):
    """
    Migrates the groups to create an admin group with all permissions
    granted. Replaces the delegate group to get pk=2.

    - Create new delegate group. Move users and permissions to it.
    - Rename the old delegate group to Admin and remove all permissions.
    - If a group with the name 'Admin' (probably with pk = 4) exists, move all
      users from it to the new superadmin group and delete it. If not, check for
      the staff group and assign all users to the superadmin group.

    In 0011_postgres_auth_group_id_sequence, the id sequence for this migration is
    restarted when using postgresql.
    """
    Group = apps.get_model("users", "Group")

    # If no groups exists at all, skip this migration
    if Group.objects.count() == 0:
        return

    # Get the new superadmin group (or the old delegates)
    # we cannot use Group.objects.get_or_create here, because this would trigger an autoupdate
    try:
        superadmin = Group.objects.get(pk=2)
        created_superadmin_group = False
    except Group.DoesNotExist:
        superadmin = Group(pk=2, name="__temp__")
        superadmin.save(skip_autoupdate=True)
        created_superadmin_group = True

    if not created_superadmin_group:
        new_delegate = Group(name="Delegates2")
        new_delegate.save(skip_autoupdate=True)
        new_delegate.permissions.set(superadmin.permissions.all())
        superadmin.permissions.set([])

        for user in superadmin.user_set.all():
            user.groups.add(new_delegate)
            user.groups.remove(superadmin)

    finished_moving_users = False
    try:
        admin = Group.objects.get(name="Admin")
        for user in admin.user_set.all():
            user.groups.add(superadmin)
            user.groups.remove(admin)
        admin.delete(skip_autoupdate=True)
        finished_moving_users = True
    except Group.DoesNotExist:
        pass

    if not finished_moving_users:
        try:
            staff = Group.objects.get(name="Staff")
            for user in staff.user_set.all():
                user.groups.add(superadmin)
        except Group.DoesNotExist:
            pass

    superadmin.name = "Admin"
    superadmin.save(skip_autoupdate=True)
    if not created_superadmin_group:
        new_delegate.name = "Delegates"
        new_delegate.save(skip_autoupdate=True)


class Migration(migrations.Migration):

    dependencies = [("users", "0006_user_email")]

    operations = [migrations.RunPython(create_superadmin_group)]
