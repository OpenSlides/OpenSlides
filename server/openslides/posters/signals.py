from django.apps import apps


def get_permission_change_data(sender, permissions, **kwargs):
    """
    Yields all necessary collections from the posters app if
    'posters.can_see' permission changes.
    """
    posters_app = apps.get_app_config(app_label="posters")
    for permission in permissions:
        if (
            permission.content_type.app_label == "posters"
            and permission.codename == "can_see"
        ):
            yield from posters_app.get_startup_elements()
