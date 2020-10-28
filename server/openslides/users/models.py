import smtplib
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    Group as DjangoGroup,
    GroupManager as _GroupManager,
    Permission,
    PermissionsMixin,
)
from django.core import mail
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import models
from django.db.models import Prefetch
from django.utils import timezone
from jsonfield import JSONField

from openslides.utils.manager import BaseManager

from ..core.config import config
from ..utils.auth import GROUP_ADMIN_PK
from ..utils.autoupdate import inform_changed_data
from ..utils.models import (
    CASCADE_AND_AUTOUPDATE,
    SET_NULL_AND_AUTOUPDATE,
    RESTModelMixin,
)
from .access_permissions import (
    GroupAccessPermissions,
    PersonalNoteAccessPermissions,
    UserAccessPermissions,
)


class UserManager(BaseUserManager):
    """
    Customized manager that creates new users only with a password and a
    username. It also supports our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, ids=None):
        """
        Returns the normal queryset with all users. In the background all
        groups are prefetched from the database together with all permissions
        and content types.
        """
        queryset = self.get_queryset()
        if ids:
            queryset = queryset.filter(pk__in=ids)
        return queryset.prefetch_related(
            Prefetch(
                "groups",
                queryset=Group.objects.select_related("group_ptr").prefetch_related(
                    Prefetch(
                        "permissions",
                        queryset=Permission.objects.select_related("content_type"),
                    )
                ),
            ),
            "vote_delegated_from_users",
        )

    def create_user(self, username, password, skip_autoupdate=False, **kwargs):
        """
        Creates a new user only with a password and a username.
        """
        user = self.model(username=username, **kwargs)
        user.set_password(password)
        user.save(skip_autoupdate=skip_autoupdate, using=self._db)
        return user

    def create_or_reset_admin_user(self, skip_autoupdate=False):
        """
        Creates an user with the username 'admin'. If such a user already
        exists, resets it. The password is (re)set to 'admin'. The user
        becomes member of the group 'Admin'.
        """
        created = False
        try:
            admin = self.get(username="admin")
        except ObjectDoesNotExist:
            admin = self.model(username="admin", last_name="Administrator")
            created = True
        admin.default_password = "admin"
        admin.password = make_password(admin.default_password)
        admin.save(skip_autoupdate=skip_autoupdate)
        admin.groups.add(GROUP_ADMIN_PK)
        if not skip_autoupdate:
            inform_changed_data(admin)
        return created

    def generate_username(self, first_name, last_name):
        """
        Generates a username from first name and last name.
        """
        first_name = first_name.strip()
        last_name = last_name.strip()

        if first_name and last_name:
            base_name = " ".join((first_name, last_name))
        else:
            base_name = first_name or last_name
            if not base_name:
                raise ValueError(
                    "Either 'first_name' or 'last_name' must not be empty."
                )

        if not self.filter(username=base_name).exists():
            generated_username = base_name
        else:
            counter = 0
            while True:
                counter += 1
                test_name = f"{base_name} {counter}"
                if not self.filter(username=test_name).exists():
                    generated_username = test_name
                    break

        return generated_username


class User(RESTModelMixin, PermissionsMixin, AbstractBaseUser):
    """
    Model for users in OpenSlides. A client can login as an user with
    credentials. An user can also just be used as representation for a person
    in other OpenSlides apps like motion submitter or (assignment) election
    candidates.
    """

    access_permissions = UserAccessPermissions()

    USERNAME_FIELD = "username"

    username = models.CharField(max_length=255, unique=True, blank=True)

    auth_type = models.CharField(max_length=64, default="default")

    first_name = models.CharField(max_length=255, blank=True)

    last_name = models.CharField(max_length=255, blank=True)

    gender = models.CharField(max_length=255, blank=True)

    email = models.EmailField(blank=True)

    last_email_send = models.DateTimeField(blank=True, null=True)

    # TODO: Try to remove the default argument in the following fields.

    structure_level = models.CharField(max_length=255, blank=True, default="")

    title = models.CharField(max_length=50, blank=True, default="")

    number = models.CharField(max_length=50, blank=True, default="")

    about_me = models.TextField(blank=True, default="")

    comment = models.TextField(blank=True, default="")

    default_password = models.CharField(max_length=100, blank=True, default="")

    is_active = models.BooleanField(default=True)

    is_present = models.BooleanField(default=False)

    is_committee = models.BooleanField(default=False)

    vote_weight = models.DecimalField(
        default=Decimal("1"), max_digits=15, decimal_places=6, null=False, blank=True
    )

    vote_delegated_to = models.ForeignKey(
        "self",
        on_delete=SET_NULL_AND_AUTOUPDATE,
        null=True,
        blank=True,
        related_name="vote_delegated_from_users",
    )

    objects = UserManager()

    class Meta:
        default_permissions = ()
        permissions = (
            ("can_see_name", "Can see names of users"),
            (
                "can_see_extra_data",
                "Can see extra data of users (e.g. email and comment)",
            ),
            ("can_change_password", "Can change its own password"),
            ("can_manage", "Can manage users"),
        )
        ordering = ("last_name", "first_name", "username")

    def __str__(self):
        # Strip white spaces from the name parts
        first_name = self.first_name.strip()
        last_name = self.last_name.strip()

        # The user has a last_name and a first_name
        if first_name and last_name:
            name = " ".join((self.first_name, self.last_name))
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
        if kwargs.get("update_fields") == ["last_login"]:
            kwargs["skip_autoupdate"] = True
        return super().save(*args, **kwargs)

    def has_perm(self, perm):
        """
        This method is closed. Do not use it but use openslides.utils.auth.has_perm.
        """
        raise RuntimeError(
            "Do not use user.has_perm() but use openslides.utils.auth.has_perm"
        )

    def send_invitation_email(
        self, connection, subject, message, skip_autoupdate=False
    ):
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
                return ""

        message_format = format_dict(
            {
                "name": str(self),
                "event_name": config["general_event_name"],
                "url": config["users_pdf_url"],
                "username": self.username,
                "password": self.default_password,
            }
        )
        try:
            message = message.format(**message_format)
        except KeyError as err:
            raise ValidationError({"detail": "Invalid property {0}", "args": [err]})

        subject_format = format_dict(
            {"event_name": config["general_event_name"], "username": self.username}
        )
        try:
            subject = subject.format(**subject_format)
        except KeyError as err:
            raise ValidationError({"detail": "Invalid property {0}", "args": [err]})

        # Create an email and send it.
        email = mail.EmailMessage(
            subject,
            message,
            config["users_email_sender"] + " <" + settings.DEFAULT_FROM_EMAIL + ">",
            [self.email],
            reply_to=[config["users_email_replyto"]],
        )
        try:
            count = connection.send_messages([email])
        except smtplib.SMTPDataError as e:
            error = e.smtp_code
            helptext = ""
            if error == 554:  # The server does not accept our connection. The code is
                # something like "transaction failed" or "No SMTP service here"
                helptext = " Is the email sender correct?"
            connection.close()
            raise ValidationError(
                {
                    "detail": "Error {0}. Cannot send email.{1}",
                    "args": [error, helptext],
                }
            )
        except smtplib.SMTPRecipientsRefused:
            pass  # Run into returning false later
        except smtplib.SMTPAuthenticationError as e:
            # Nice error message on auth failure
            raise ValidationError(
                {
                    "detail": "Error {0}: Authentication failure. Please contact your local administrator.",
                    "args": [e.smtp_code],
                }
            )
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


class GroupManager(_GroupManager):
    """
    Customized manager that supports our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, ids=None):
        """
        Returns the normal queryset with all groups. In the background all
        permissions with the content types are prefetched from the database.
        """
        queryset = self.get_queryset()
        if ids:
            queryset = queryset.filter(pk__in=ids)
        return queryset.select_related("group_ptr").prefetch_related(
            Prefetch(
                "permissions",
                queryset=Permission.objects.select_related("content_type"),
            )
        )


class Group(RESTModelMixin, DjangoGroup):
    """
    Extend the django group with support of our REST and caching system.
    """

    access_permissions = GroupAccessPermissions()
    objects = GroupManager()

    class Meta:
        default_permissions = ()


class PersonalNoteManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all personal notes. In the background all
        users are prefetched from the database.
        """
        return super().get_prefetched_queryset(*args, **kwargs).select_related("user")


class PersonalNote(RESTModelMixin, models.Model):
    """
    Model for personal notes (e. g. likes/stars) of a user concerning different
    openslides objects like motions.
    """

    access_permissions = PersonalNoteAccessPermissions()

    personalized_model = True
    """
    Each model belongs to one user. This relation is set during creation and
    will not be changed.
    """

    objects = PersonalNoteManager()

    user = models.OneToOneField(User, on_delete=CASCADE_AND_AUTOUPDATE)
    notes = JSONField()

    class Meta:
        default_permissions = ()
