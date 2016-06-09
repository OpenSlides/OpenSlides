from django.contrib.sessions.backends.db import \
    SessionStore as DjangoSessionStore


class SessionStore(DjangoSessionStore):
    """
    Like the Django db Session store, but saves the user into the db field.
    """

    @classmethod
    def get_model_class(cls):
        # Avoids a circular import
        from .models import Session
        return Session

    def create_model_instance(self, data):
        """
        Set the user from data to the db field. Set to None, if its a session
        from an anonymous user.
        """
        model = super().create_model_instance(data)
        model.user_id = data['_auth_user_id'] if '_auth_user_id' in data else None
        return model
