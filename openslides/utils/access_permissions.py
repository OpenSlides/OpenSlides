from django.dispatch import Signal

from .dispatch import SignalConnectMetaClass


class BaseAccessPermissions(object, metaclass=SignalConnectMetaClass):
    """
    Base access permissions container.

    Every app which has autoupdate models has to create classes subclassing
    from this base class for every autoupdate root model. Each subclass has
    to have a globally unique name. The metaclass (SignalConnectMetaClass)
    does the rest of the magic.
    """
    signal = Signal()

    def __init__(self, **kwargs):
        """
        Initializes the access permission instance. This is done when the
        signal is sent.

        Because of Django's signal API, we have to take wildcard keyword
        arguments. But they are not used here.
        """
        pass

    @classmethod
    def get_dispatch_uid(cls):
        """
        Returns the classname as a unique string for each class. Returns None
        for the base class so it will not be connected to the signal.
        """
        if not cls.__name__ == 'BaseAccessPermissions':
            return cls.__name__

    def check_permissions(self, user):
        """
        Returns True if the user has read access to model instances.
        """
        return False

    def get_serializer_class(self, user=None):
        """
        Returns different serializer classes according to users permissions.

        This should return the serializer for full data access if user is
        None. See get_full_data().
        """
        raise NotImplementedError(
            "You have to add the method 'get_serializer_class' to your "
            "access permissions class.".format(self))

    def get_full_data(self, instance):
        """
        Returns all possible serialized data for the given instance.
        """
        return self.get_serializer_class(user=None)(instance).data

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        Returns None if the user has no read access. Returns reduced data
        if the user has limited access. Default: Returns full data if the
        user has read access to model instances.

        Hint: You should override this method if your get_serializer_class()
        method returns different serializers for different users or if you
        have access restrictions in your view or viewset in methods like
        retrieve() or list().
        """
        if self.check_permissions(user):
            data = full_data
        else:
            data = None
        return data

    def get_projector_data(self, full_data):
        """
        Returns the serialized data for the projector. Returns None if the
        user has no access to this specific data. Returns reduced data if
        the user has limited access. Default: Returns full data.
        """
        return full_data
