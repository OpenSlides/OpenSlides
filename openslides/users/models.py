import smtplib
from random import choice
from typing import List, Optional, Set

from asgiref.sync import async_to_sync
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password
from django.core import mail
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import models
from django.utils import timezone
from jsonfield import JSONField

from ..core.config import config
from ..core.models import Projector
from ..core.signals import permission_change
from ..utils.auth import GROUP_ADMIN_PK
from ..utils.autoupdate import Element, inform_changed_elements
from ..utils.cache import element_cache
from ..utils.models import RESTModelMixin
from .access_permissions import (
    GroupAccessPermissions,
    PersonalNoteAccessPermissions,
    UserAccessPermissions,
)


class UserManager(BaseUserManager):
    """
    Customized manager that creates new users only with a password and a
    username. It also supports our get_full_queryset method.
    """

    def create_user(self, username, password, skip_autoupdate=False, **kwargs):
        """
        Creates a new user only with a password and a username.
        """
        user = self.model(username=username, **kwargs)
        user.set_password(password)
        user.save(skip_autoupdate=skip_autoupdate, using=self._db)
        return user

    def create_or_reset_admin_user(self):
        """
        Creates an user with the username 'admin'. If such a user already
        exists, resets it. The password is (re)set to 'admin'. The user
        becomes member of the group 'Admin'.
        """
        created = False
        try:
            admin = self.get(username='admin')
        except ObjectDoesNotExist:
            admin = self.model(
                username='admin',
                last_name='Administrator',
            )
            created = True
        admin.default_password = 'admin'
        admin.password = make_password(admin.default_password)
        admin.save(skip_autoupdate=True)
        admin.groups.add(GROUP_ADMIN_PK)
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


class User(RESTModelMixin, AbstractBaseUser):
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

    email = models.EmailField(blank=True)

    last_email_send = models.DateTimeField(
        blank=True,
        null=True)

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

    groups = models.ManyToManyField('Group')

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
        # Strip white spaces from the name parts
        first_name = self.first_name.strip()
        last_name = self.last_name.strip()

        # The user has a last_name and a first_name
        if first_name and last_name:
            name = ' '.join((self.first_name, self.last_name))
        # The user has only a first_name or a last_name or no name
        else:
            name = first_name or last_name or self.username

        # Return result
        return name

    def save(self, *args, **kwargs):
        """
        Overridden method to skip autoupdate if only last_login field was
        updated as it is done during login.
        """
        if kwargs.get('update_fields') == ['last_login']:
            kwargs['skip_autoupdate'] = True
        return super().save(*args, **kwargs)

    def delete(self, skip_autoupdate=False, *args, **kwargs):
        """
        Customized method to delete an user. Ensures that a respective
        user projector element is disabled.
        """
        Projector.remove_any(
            skip_autoupdate=skip_autoupdate,
            name='users/user',
            id=self.pk)
        return super().delete(skip_autoupdate=skip_autoupdate, *args, **kwargs)  # type: ignore

    def has_perm(self, perm):
        """
        This method is closed. Do not use it but use openslides.utils.auth.has_perm.
        """
        raise RuntimeError('Do not use user.has_perm() but use openslides.utils.auth.has_perm')

    def send_invitation_email(self, connection, subject, message, skip_autoupdate=False):
        """
        Sends an invitation email to the users. Returns True on success, False on failiure.
        May raise an ValidationError, if something went wrong.
        """
        if not self.email:
            return False

        # Custom dict class that for formatstrings with entries like {not_existent}
        # no error is raised and this is replaced with ''.
        class format_dict(dict):
            def __missing__(self, key):
                return ''

        message_format = format_dict({
            'name': str(self),
            'event_name': config['general_event_name'],
            'url': config['users_pdf_url'],
            'username': self.username,
            'password': self.default_password})
        message = message.format(**message_format)

        subject_format = format_dict({'event_name': config['general_event_name']})
        subject = subject.format(**subject_format)

        # Create an email and send it.
        email = mail.EmailMessage(subject, message, config['users_email_sender'], [self.email])
        try:
            count = connection.send_messages([email])
        except smtplib.SMTPDataError as e:
            error = e.smtp_code
            helptext = ''
            if error == 554:
                helptext = ' Is the email sender correct?'
            connection.close()
            raise ValidationError({'detail': 'Error {}. Cannot send email.{}'.format(error, helptext)})
        except smtplib.SMTPRecipientsRefused:
            pass  # Run into returning false later
        else:
            if count == 1:
                self.email_send = True
                self.last_email_send = timezone.now()
                self.save(skip_autoupdate=skip_autoupdate)
                return True

        return False

    @property
    def session_auth_hash(self):
        """
        Returns the session auth hash of a user as attribute.

        Needed for the django rest framework.
        """
        return self.get_session_auth_hash()


class Group(RESTModelMixin, models.Model):
    """
    Extend the django group with support of our REST and caching system.
    """
    access_permissions = GroupAccessPermissions()

    name = models.CharField('name', max_length=80, unique=True)
    db_permissions = models.TextField()
    """
    Saves all permissions as comma separated string.
    """

    def save(self, *args, **kwargs):
        """
        Save the group. Updates the cache.
        """
        if self.id:
            old_permissions: Optional[Set[str]] = set(async_to_sync(element_cache.get_element_full_data)(self.get_collection_string(), self.id))
        else:
            # First creation of user
            old_permissions = None

        # Save the group in the db
        result = super().save(*args, **kwargs)

        # Delete the user chaches of all affected users
        for user in self.user_set.all():
            async_to_sync(element_cache.del_user)(user.pk)

        new_permissions = self.permissions - old_permissions

        # Some permissions are added.
        if len(new_permissions) > 0:
            elements: List[Element] = []
            signal_results = permission_change.send(None, permissions=new_permissions, action='added')
            all_full_data = async_to_sync(element_cache.get_all_full_data)()
            for receiver, signal_collections in signal_results:
                for cachable in signal_collections:
                    for full_data in all_full_data.get(cachable.get_collection_string(), {}):
                        elements.append(Element(
                            id=full_data['id'],
                            collection_string=cachable.get_collection_string(),
                            full_data=full_data,
                            information='',
                            user_id=None,
                            disable_history=True))
            inform_changed_elements(elements)

        # TODO: Some permissions are deleted.

        return result

    @property
    def permissions(self) -> Set[str]:
        """
        Get all permissions of the group.
        """
        if self.db_permissions == '':
            return []

        return self.db_permissions.split(',')

    @permissions.setter
    def permissions(self, permissions: Set[str]) -> None:
        """
        Set all permissions of the group. All existing groups are deleted.
        """
        self.db_permissions = ','.join(permissions)


class PersonalNoteManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all personal notes. In the background all
        users are prefetched from the database.
        """
        return self.get_queryset().select_related('user')


class PersonalNote(RESTModelMixin, models.Model):
    """
    Model for personal notes (e. g. likes/stars) of a user concerning different
    openslides objects like motions.
    """
    access_permissions = PersonalNoteAccessPermissions()

    objects = PersonalNoteManager()

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE)
    notes = JSONField()

    class Meta:
        default_permissions = ()
