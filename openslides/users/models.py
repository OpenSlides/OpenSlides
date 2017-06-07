from random import choice

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Group as DjangoGroup
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    GroupManager,
    Permission,
    PermissionsMixin,
)
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import Prefetch, Q

from ..utils.collection import CollectionElement
from ..utils.models import RESTModelMixin
from .access_permissions import GroupAccessPermissions, UserAccessPermissions


class PersonalNote(models.Model):
    """
    Model for personal notes and likes (stars) of a user concerning different
    openslides models like motions.

    To use this in your app simply run e. g.

        user.set_personal_note(motion, note, star)

    in a setter view and add a SerializerMethodField to your serializer that
    calls get_data for all users.
    """
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='personal_notes')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey()
    note = models.TextField(blank=True)
    star = models.BooleanField(default=False, blank=True)

    class Meta:
        default_permissions = ()

    def get_data(self):
        """
        Returns note and star to be serialized in content object serializers.
        """
        return {
            'user_id': self.user_id,
            'note': self.note,
            'star': self.star,
        }


class UserManager(BaseUserManager):
    """
    Customized manager that creates new users only with a password and a
    username. It also supports our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all users. In the background all
        groups are prefetched from the database together with all permissions
        and content types.
        """
        return self.get_queryset().prefetch_related(Prefetch(
            'groups',
            queryset=Group.objects
                          .select_related('group_ptr')
                          .prefetch_related(Prefetch(
                              'permissions',
                              queryset=Permission.objects.select_related('content_type')))))

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

    @classmethod
    def get_serializer_class(self):
        from .serializers import UserFullSerializer
        return UserFullSerializer

    def save(self, *args, **kwargs):
        """
        Overridden method to skip autoupdate if only last_login field was
        updated as it is done during login.
        """
        if kwargs.get('update_fields') == ['last_login']:
            kwargs['skip_autoupdate'] = True
            CollectionElement.from_instance(self)
        return super().save(*args, **kwargs)

    def has_perm(self, perm):
        """
        This method is closed. Do not use it but use openslides.utils.auth.has_perm.
        """
        raise RuntimeError('Do not use user.has_perm() but use openslides.utils.auth.has_perm')

    def set_personal_note(self, content_object, note=None, star=None):
        """
        Saves or overrides a personal note for this user for a given object
        like motion.
        """
        changes = {}
        if note is not None:
            changes['note'] = note
        if star is not None:
            changes['star'] = star
        if changes:
            # TODO: This is prone to race-conditions in rare cases. Fix it.
            personal_note, created = PersonalNote.objects.update_or_create(
                user=self,
                content_type=ContentType.objects.get_for_model(content_object),
                object_id=content_object.id,
                user_id=self.id,
                defaults=changes,
            )
        else:
            personal_note = None
        return personal_note


class GroupManager(GroupManager):
    """
    Customized manager that supports our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all groups. In the background all
        permissions with the content types are prefetched from the database.
        """
        return (self.get_queryset()
                    .select_related('group_ptr')
                    .prefetch_related(Prefetch(
                        'permissions',
                        queryset=Permission.objects.select_related('content_type'))))


class Group(RESTModelMixin, DjangoGroup):
    """
    Extend the django group with support of our REST and caching system.
    """
    access_permissions = GroupAccessPermissions()
    objects = GroupManager()

    class Meta:
        default_permissions = ()

    @classmethod
    def get_serializer_class(self):
        from .serializers import GroupSerializer
        return GroupSerializer
