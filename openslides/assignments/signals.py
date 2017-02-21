from django.apps import apps


def get_permission_change_data(sender, permissions=None, **kwargs):
    """
    Returns all necessary collections if a 'can_see' permission changes.
    """
    assignments_app = apps.get_app_config(app_label='assignments')
    for permission in permissions:
        # There could be only one 'assignment.can_see' and then we want to return data.
        if permission.content_type.app_label == assignment_app.label and permission.codename == 'can_see':
            return assignment_app.get_startup_elements()
    return None
