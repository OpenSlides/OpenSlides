from random import choice

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    Group,
    Permission,
    PermissionsMixin,
)
from django.db import models
from django.db.models import Q

from openslides.utils.search import user_name_helper

from ..core.config import config
from ..utils.models import RESTModelMixin
from .access_permissions import UserAccessPermissions


class UserManager(BaseUserManager):
    """
    Customized manager that creates new users only with a password and a
    username.
    """
    def create_user(self, username, password, **kwargs):
        """
        Creates a new user only with a password and a username.
        """
        user = self.model(username=username, **kwargs)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_or_reset_admin_user(self):
        """
        Creates an user with the username 'admin'. If such a user already
        exists, resets it. The password is (re)set to 'admin'. The user
        becomes member of the group 'Staff'. The two important permissions
        'users.can_see_name' and 'users.can_manage' are added to this group,
        so that the admin can manage all other permissions.
        """
        query_can_see_name = Q(content_type__app_label='users') & Q(codename='can_see_name')
        query_can_manage = Q(content_type__app_label='users') & Q(codename='can_manage')

        staff, _ = Group.objects.get_or_create(name='Staff')
        staff.permissions.add(Permission.objects.get(query_can_see_name))
        staff.permissions.add(Permission.objects.get(query_can_manage))

        admin, created = self.get_or_create(
            username='admin',
            defaults={'last_name': 'Administrator'})
        admin.default_password = 'admin'
        admin.password = make_password(admin.default_password, '', 'md5')
        admin.save()
        admin.groups.add(staff)
        return created

    def generate_username(self, first_name, last_name):
        """
        Generates a username from first name and last name.
        """
        first_name = first_name.strip()
        last_name = last_name.strip()

        if first_name and last_name:
            base_name = ' '.join((first_name, last_name))
        else:
            base_name = first_name or last_name
            if not base_name:
                raise ValueError("Either 'first_name' or 'last_name' must not be "
                                 "empty.")

        if not self.filter(username=base_name).exists():
            generated_username = base_name
        else:
            counter = 0
            while True:
                counter += 1
                test_name = '%s %d' % (base_name, counter)
                if not self.filter(username=test_name).exists():
                    generated_username = test_name
                    break

        return generated_username

    def generate_password(self):
        """
        Generates a random passwort. Do not use l, o, I, O, 1 or 0.
        """
        chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        size = 8
        return ''.join([choice(chars) for i in range(size)])


class User(RESTModelMixin, PermissionsMixin, AbstractBaseUser):
    """
    Model for users in OpenSlides. A client can login as an user with
    credentials. An user can also just be used as representation for a person
    in other OpenSlides apps like motion submitter or (assignment) election
    candidates.
    """
    access_permissions = UserAccessPermissions()

    USERNAME_FIELD = 'username'

    username = models.CharField(
        max_length=255,
        unique=True,
        blank=True)

    first_name = models.CharField(
        max_length=255,
        blank=True)

    last_name = models.CharField(
        max_length=255,
        blank=True)

    # TODO: Try to remove the default argument in the following fields.

    structure_level = models.CharField(
        max_length=255,
        blank=True,
        default='')

    title = models.CharField(
        max_length=50,
        blank=True,
        default='')

    number = models.CharField(
        max_length=50,
        blank=True,
        default='')

    about_me = models.TextField(
        blank=True,
        default='')

    comment = models.TextField(
        blank=True,
        default='')

    default_password = models.CharField(
        max_length=100,
        blank=True,
        default='')

    is_active = models.BooleanField(
        default=True)

    is_present = models.BooleanField(
        default=False)

    is_committee = models.BooleanField(
        default=False)

    objects = UserManager()

    class Meta:
        default_permissions = ()
        permissions = (
            ('can_see_name', 'Can see names of users'),
            ('can_see_extra_data', 'Can see extra data of users (e.g. present and comment)'),
            ('can_manage', 'Can manage users'),
        )
        ordering = ('last_name', 'first_name', 'username', )

    def __str__(self):
        return self.get_full_name()

    def get_full_name(self):
        """
        Returns a long form of the name.

        E. g.: * Dr. Max Mustermann (Villingen)
               * Professor Dr. Enders, Christoph (Leipzig)
        """
        structure = '(%s)' % self.structure_level if self.structure_level else ''
        return ' '.join((self.title, self.get_short_name(), structure)).strip()

    def get_short_name(self, sort_by_first_name=None):
        """
        Returns only the name of the user.

        E. g.: * Max Mustermann
               * Enders, Christoph
        """
        # Strip white spaces from the name parts
        first_name = self.first_name.strip()
        last_name = self.last_name.strip()

        # The user has a last_name and a first_name
        if first_name and last_name:
            if sort_by_first_name is None:
                sort_by_first_name = config['users_sort_users_by_first_name']
            if sort_by_first_name:
                name = ' '.join((first_name, last_name))
            else:
                name = ', '.join((last_name, first_name))

        # The user has only a first_name or a last_name or no name
        else:
            name = first_name or last_name or self.username

        # Return result
        return name

    def get_search_index_string(self):
        """
        Returns a string that can be indexed for the search.
        """
        return " ".join((
            user_name_helper(self),
            self.structure_level,
            self.about_me))
