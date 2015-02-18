from django.dispatch import Signal

from .dispatch import SignalConnectMetaClass


class ProjectorElement(object, metaclass=SignalConnectMetaClass):
    """
    Base class for an element on the projector.

    Every app which wants to add projector elements has to create classes
    subclassing from this base class with different names. The name and
    scripts attributes have to be set. The metaclass
    (SignalConnectMetaClass) does the rest of the magic.
    """
    signal = Signal()
    name = None
    scripts = None

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

    def get_data(self, projector_object, config_entry):
        """
        Returns all data to be sent to the client. The projector object and
        the config entry have to be given.
        """
        self.projector_object = projector_object
        self.config_entry = config_entry
        assert self.config_entry.get('name') == self.name, (
            'To get data of a projector element, the correct config entry has to be given.')
        return {
            'scripts': self.get_scripts(),
            'context': self.get_context()}

    def get_scripts(self):
        """
        Returns ...?
        """
        # TODO: Write docstring
        if self.scripts is None:
            raise NotImplementedError(
                'A projector element class must define either a '
                'get_scripts method or have a scripts argument.')
        return self.scripts

    def get_context(self):
        """
        Returns the context of the projector element.
        """
        return None
