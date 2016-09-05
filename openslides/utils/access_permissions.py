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

    def can_retrieve(self, user, id=None):
        """
        Returns True of the user has read access because of his permissions or
        because of a projector requirement.
        """
        # TODO: Rename this method because it is also for list and perhaps for metadata views.
        return self.check_permissions(user) or self.check_projector_requirements(user, id)

    def check_permissions(self, user):
        """
        Returns True if the user has read access because of his permissions.
        """
        return False

    def check_projector_requirements(self, user, id):
        """
        Returns True if the user has read access because of a projector
        requirement.
        """
        from openslides.core.models import Projector

        result = False
        if user.has_perm('core.can_see_projector'):
            for requirement in Projector.get_all_requirements():
                if requirement.is_currently_required(access_permissions=self, id=id):
                    result = True
                    break
        return result

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

    def get_restricted_data(self, full_data, user, id):
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        Returns None if the user has no read access. Returns reduced data
        if the user has limited access. Default: Returns full data if the
        user has read access to model instances.

        Hint: You should override this method if your
        get_serializer_class() method returns different serializers for
        different users or if you have access restrictions in your view or
        viewset in methods like retrieve() or check_object_permissions().
        """
        if self.can_retrieve(user, id):
            data = full_data
        else:
            data = None
        return data
