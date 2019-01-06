from django.apps import apps


def get_permission_change_data(sender, permissions=None, **kwargs):
    """
    Yields all necessary collections if 'mediafiles.can_see' permission changes.
    """
    mediafiles_app = apps.get_app_config(app_label="mediafiles")
    for permission in permissions:
        # There could be only one 'mediafiles.can_see' and then we want to return data.
        if (
            permission.content_type.app_label == mediafiles_app.label
            and permission.codename == "can_see"
        ):
            yield from mediafiles_app.get_startup_elements()
