# TODO: Check every app, that they do not import Group or User from here.

from django.contrib.auth.models import (PermissionsMixin, AbstractBaseUser,
                                        BaseUserManager)

# TODO: Do not import the Group in here, but in core.models (if necessary)
from django.contrib.auth.models import Group  # noqa
from django.core.urlresolvers import reverse
from django.db import models
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import config
from openslides.projector.models import SlideMixin
from openslides.utils.models import AbsoluteUrlMixin
from openslides.utils.rest_api import RESTModelMixin


class UserManager(BaseUserManager):
    """
    UserManager that creates new users only with a password and a username.
    """

    def create_user(self, username, password, **kwargs):
        user = self.model(username=username, **kwargs)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(RESTModelMixin, SlideMixin, AbsoluteUrlMixin, PermissionsMixin, AbstractBaseUser):
    USERNAME_FIELD = 'username'
    slide_callback_name = 'user'

    username = models.CharField(
        ugettext_lazy('Username'), max_length=255, unique=True)

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

    def get_absolute_url(self, link='detail'):
        """
        Returns the URL to the user.
        """
        if link == 'detail':
            url = reverse('user_detail', args=[str(self.pk)])
        elif link == 'update':
            url = reverse('user_update', args=[str(self.pk)])
        elif link == 'delete':
            url = reverse('user_delete', args=[str(self.pk)])
        else:
            url = super().get_absolute_url(link)
        return url

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
