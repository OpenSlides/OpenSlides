# -*- coding: utf-8 -*-

from random import choice

from .models import Group, User


def gen_password():
    """
    Generates a random passwort.
    """
    chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    size = 8

    return ''.join([choice(chars) for i in range(size)])


def gen_username(first_name, last_name):
    """
    Generates a username from a first- and lastname.
    """
    first_name = first_name.strip()
    last_name = last_name.strip()

    if first_name and last_name:
        base_name = " ".join((first_name, last_name))
    else:
        base_name = first_name or last_name
        if not base_name:
            raise ValueError('Either \'first_name\' or \'last_name\' can not be '
                             'empty')

    if not User.objects.filter(username=base_name).exists():
        return base_name

    counter = 0
    while True:
        counter += 1
        test_name = "%s %d" % (base_name, counter)
        if not User.objects.filter(username=test_name).exists():
            return test_name


def get_registered_group():
    """
    Returns the group 'Registered' (pk=2).
    """
    return Group.objects.get(pk=2)


def create_or_reset_admin_user():
    group_staff = Group.objects.get(pk=4)
    try:
        admin = User.objects.get(username="admin")
    except User.DoesNotExist:
        admin = User()
        admin.username = 'admin'
        admin.last_name = 'Administrator'
        created = True
    else:
        created = False
    admin.default_password = 'admin'
    admin.set_password(admin.default_password)
    admin.save()
    admin.groups.add(group_staff)
    return created
