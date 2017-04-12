from django.apps import apps

from ..utils.auth import has_perm
from ..utils.collection import Collection
from .models import Mediafile


def get_permission_change_data(sender, permissions=None, **kwargs):
    """
    Yields all necessary collections if 'mediafiles.can_see' permission changes.
    """
    mediafiles_app = apps.get_app_config(app_label='mediafiles')
    for permission in permissions:
        # There could be only one 'mediafiles.can_see' and then we want to return data.
        if permission.content_type.app_label == mediafiles_app.label and permission.codename == 'can_see':
            yield from mediafiles_app.get_startup_elements()


def is_user_data_required(sender, request_user, user_data, **kwargs):
    """
    Returns True if request user can see mediafiles and user_data is required
    to be displayed as uploader.
    """
    result = False
    if has_perm(request_user, 'mediafiles.can_see'):
        for mediafile_collection_element in Collection(Mediafile.get_collection_string()).element_generator():
            full_data = mediafile_collection_element.get_full_data()
            if user_data['id'] == full_data['uploader_id']:
                result = True
                break
    return result
