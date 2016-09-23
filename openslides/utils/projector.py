from django.dispatch import Signal

from .dispatch import SignalConnectMetaClass


class ProjectorElement(object, metaclass=SignalConnectMetaClass):
    """
    Base class for an element on the projector.

    Every app which wants to add projector elements has to create classes
    subclassing from this base class with different names. The name attribute
    has to be set. The metaclass (SignalConnectMetaClass) does the rest of the
    magic.
    """
    signal = Signal()
    name = None

    def __init__(self, **kwargs):
        """
        Initializes the projector element instance. This is done when the
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
        if not cls.__name__ == 'ProjectorElement':
            return cls.__name__

    def check_and_update_data(self, projector_object, config_entry):
        """
        Checks projector element data via self.check_data() and updates
        them via self.update_data(). The projector object and the config
        entry have to be given.
        """
        self.projector_object = projector_object
        self.config_entry = config_entry
        assert self.config_entry.get('name') == self.name, (
            'To get data of a projector element, the correct config entry has to be given.')
        self.check_data()
        return self.update_data() or {}

    def check_data(self):
        """
        Method can be overridden to validate projector element data. This
        may raise ProjectorException in case of an error.

        Default: Does nothing.
        """
        pass

    def update_data(self):
        """
        Method can be overridden to update the projector element data
        output. This should return a dictonary. Use this for server
        calculated data which have to be forwared to the client.

        Default: Does nothing.
        """
        pass

    def get_requirements(self, config_entry):
        """
        Returns an iterable of instances that are required for this projector
        element. The config_entry has to be given.
        """
        return ()

    def need_full_update_for_this(self, collection_element):
        """
        Returns True if this projector element needs to be updated with all
        instances as defined in get_requirements(). The given
        collection_element contains information about the changed instance.
        Default is False.
        """
        return False
