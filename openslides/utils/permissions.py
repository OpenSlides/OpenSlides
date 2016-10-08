from django.apps import apps

class Permission:
    def __init__(self, app, code, name, default_groups=None):
        """
        Creates a permission.

        app has to be an app_config object.
        code has to be a string that is used to represent this permission
        name is a human readable string
        default_groups can be an iterable of group ids, that have this permission
        as default.
        """
        self.app = app
        self.code = code
        self.name = name
        self.default_groups = default_groups or tuple()

    def as_choices(self):
        """
        Returns a tuple where the first element is the full code of this permission
        and the second element the human readable string.
        """
        return (self.get_full_code(), self.name)

    def get_full_code(self):
        """
        Returns a combination of the app name and the code.
        """
        return "{}.{}".format(self.app.name, self.code)


def permission_choices():
    """
    Generator that yields any permission defined by any app.
    """
    for app_config in apps.get_app_configs():
        try:
            app_permissions = app_config.get_permissions
        except AttributeError:
            # The app has no permissions defined. Skip it.
            continue
        for permission in app_permissions():
            yield permission.as_choices()
