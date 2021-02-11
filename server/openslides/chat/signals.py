from django.apps import apps


def get_permission_change_data(sender, permissions, **kwargs):
    """
    Yields all necessary collections from the topics app if
    'agenda.can_see' permission changes, because topics are strongly
    connected to the agenda items.
    """
    chat_app = apps.get_app_config(app_label="chat")
    for permission in permissions:
        # There could be only one 'agenda.can_see' and then we want to return data.
        if (
            permission.content_type.app_label == "chat"
            and permission.codename == "can_manage"
        ):
            yield from chat_app.get_startup_elements()
