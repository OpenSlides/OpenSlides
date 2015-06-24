# TODO: Check every app, that they do not import Group or User from here.

from random import choice

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import (  # noqa
    AbstractBaseUser,
    BaseUserManager,
    Group,
    Permission,
    PermissionsMixin,
)
from django.db import models
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import config
from openslides.projector.models import SlideMixin
from openslides.utils.rest_api import RESTModelMixin

from .exceptions import UserError


class UserManager(BaseUserManager):
    """
    UserManager that creates new users only with a password and a username.
    """
    def create_user(self, username, password, **kwargs):
        user = self.model(username=username, **kwargs)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_or_reset_admin_user(self):
        """
        Creates an user with the username admin. If such a user exists, resets
        it. The password is (re)set to 'admin'. The user becomes member of the
        group 'Staff' (pk=4).
        """
        try:
            staff = Group.objects.get(pk=4)
        except Group.DoesNotExist:
            raise UserError("Admin user can not be created or reset because "
                            "the group 'Staff' is not available.")
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
                                 "empty")

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
        Generates a random passwort.
        """
        chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        size = 8
        return ''.join([choice(chars) for i in range(size)])


class User(RESTModelMixin, SlideMixin, PermissionsMixin, AbstractBaseUser):
    """
    Model for users in OpenSlides. A client can login as a user with
    credentials. A user can also just be used as representation for a person
    in other OpenSlides app like motion submitter or (assignment) election
    candidates.
    """
    USERNAME_FIELD = 'username'
    slide_callback_name = 'user'

    username = models.CharField(
        ugettext_lazy('Username'), max_length=255, unique=True, blank=True)

    first_name = models.CharField(
        ugettext_lazy('First name'), max_length=255, blank=True)

    last_name = models.CharField(
        ugettext_lazy('Last name'), max_length=255, blank=True)

    # TODO: try to remove the default argument in the following fields
    structure_level = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name=ugettext_lazy('Structure level'),
        help_text=ugettext_lazy('Will be shown after the name.'))

    title = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name=ugettext_lazy('Title'),
        help_text=ugettext_lazy('Will be shown before the name.'))

    about_me = models.TextField(
        blank=True, default='', verbose_name=ugettext_lazy('About me'),
        help_text=ugettext_lazy('Your profile text'))

    comment = models.TextField(
        blank=True, default='', verbose_name=ugettext_lazy('Comment'),
        help_text=ugettext_lazy('Only for notes.'))

    default_password = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name=ugettext_lazy('Default password'))

    is_active = models.BooleanField(
        ugettext_lazy('active'), default=True,
        help_text=ugettext_lazy(
            'Designates whether this user should be treated as '
            'active. Unselect this instead of deleting accounts.'))

    is_present = models.BooleanField(
        ugettext_lazy('present'), default=False,
        help_text=ugettext_lazy('Designates whether this user is in the room '
                                'or not.'))

    objects = UserManager()

    class Meta:
        permissions = (
            ('can_see_name', ugettext_noop('Can see names of users')),
            ('can_see_extra_data', ugettext_noop('Can see extra data of users')),
            ('can_manage', ugettext_noop('Can manage users')),
        )
        ordering = ('last_name',)

    def __str__(self):
        return self.get_full_name()

    def get_slide_context(self, **context):
        """
        Returns the context for the user slide.
        """
        # Does not call super. In this case the context would override the name
        # 'user'.
        return {'shown_user': self}

    def get_full_name(self):
        """
        Returns a long form of the name.

        E. g.: * Dr. Max Mustermann (Villingen)
               * Professor Dr. Enders, Christoph (Leipzig)
        """
        structure = '(%s)' % self.structure_level if self.structure_level else ''

        return ' '.join((self.title, self.get_short_name(), structure)).strip()

    def get_short_name(self):
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
            if config['users_sort_users_by_first_name']:
                name = ' '.join((first_name, last_name))
            else:
                name = ', '.join((last_name, first_name))

        # The user has only a first_name or a last_name or no name
        else:
            name = first_name or last_name or self.username
        return name

    def reset_password(self, password=None):
        """
        Reset the password for the user to his default-password.
        """
        if password is None:
            password = self.default_password
        self.set_password(password)

    def get_view_class(self):
        """
        Returns the main view class (viewset class) that should be unlocked
        if the user (means its name) appears on a slide.
        """
        from .views import UserViewSet
        return UserViewSet
