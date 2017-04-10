from django.apps import apps
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.dispatch import Signal

from ..utils.auth import has_perm
from ..utils.collection import Collection
from .models import ChatMessage

# This signal is send when the migrate command is done. That means it is sent
# after post_migrate sending and creating all Permission objects. Don't use it
# for other things than dealing with Permission objects.
post_permission_creation = Signal()

# This signal is sent if a permission is changed (e. g. a group gets a new
# permission). Connected receivers may yield Collections.
permission_change = Signal()

# This signal is sent if someone wants to see basic user data. Connected
# receivers may answer True if the user data is required for the request user
# (this can be anything that is allowd as argument for utils.auth.has_perm())
# e. g. as motion submitter or assignment candidate.
user_data_required = Signal(providing_args=['request_user', 'user_data'])


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


def is_user_data_required(sender, request_user, user_data, **kwargs):
    """
    Returns True if request user can use chat and user_data is required
    to be displayed as chatter.
    """
    result = False
    if has_perm(request_user, 'core.can_use_chat'):
        for chat_message_collection_element in Collection(ChatMessage.get_collection_string()).element_generator():
            full_data = chat_message_collection_element.get_full_data()
            if user_data['id'] == full_data['user_id']:
                result = True
                break
    return result
