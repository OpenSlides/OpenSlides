from django.apps import apps
from django.dispatch import Signal


# This signal is sent if a permission is changed (e. g. a group gets a new
# permission). Connected receivers may yield Collections.
permission_change = Signal()


def get_permission_change_data(sender, permissions, **kwargs):
    """
    Yields all necessary Cachables if the respective permissions change.
    """
    core_app = apps.get_app_config(app_label='core')
    for permission in permissions:
        if permission.content_type.app_label == core_app.label:
            if permission.codename == 'can_see_projector':
                yield core_app.get_model('Projector')
            elif permission.codename == 'can_manage_projector':
                yield core_app.get_model('ProjectorMessage')
                yield core_app.get_model('Countdown')
            elif permission.codename == 'can_use_chat':
                yield core_app.get_model('ChatMessage')
