from django.apps import apps
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.dispatch import Signal

from ..utils.collection import Collection

# This signal is send when the migrate command is done. That means it is sent
# after post_migrate sending and creating all Permission objects. Don't use it
# for other things than dealing with Permission objects.
post_permission_creation = Signal()

# This signal is sent if a permission is changed (e. g. a group gets a new
# permission). Connected receivers may yield Collections.
permission_change = Signal()


def delete_django_app_permissions(sender, **kwargs):
    """
    Deletes the permissions, Django creates by default. Only required
    for auth, contenttypes and sessions.
    """
    contenttypes = ContentType.objects.filter(
        Q(app_label='auth') |
        Q(app_label='contenttypes') |
        Q(app_label='sessions'))
    Permission.objects.filter(content_type__in=contenttypes).delete()


def get_permission_change_data(sender, permissions, **kwargs):
    """
    Yields all necessary collections if the respective permissions change.
    """
    core_app = apps.get_app_config(app_label='core')
    for permission in permissions:
        if permission.content_type.app_label == core_app.label:
            if permission.codename == 'can_see_projector':
                yield Collection(core_app.get_model('Projector').get_collection_string())
            elif permission.codename == 'can_manage_projector':
                yield Collection(core_app.get_model('ProjectorMessage').get_collection_string())
                yield Collection(core_app.get_model('Countdown').get_collection_string())
            elif permission.codename == 'can_use_chat':
                yield Collection(core_app.get_model('ChatMessage').get_collection_string())
