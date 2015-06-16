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

    def get_requirements(self, config_entry):
        """
        Returns an iterable of ProjectorRequirement instances to setup
        which views should be accessable for projector clients if the
        projector element is active. The config_entry has to be given.
        """
        return ()


class ProjectorRequirement:
    """
    Container for required views. Such a view is defined by its class, its
    action and its kwargs which come from the URL path.
    """
    def __init__(self, view_class, view_action, **kwargs):
        self.view_class = view_class
        self.view_action = view_action
        self.kwargs = kwargs

    def is_currently_required(self, view_instance):
        """
        Returns True if the view_instance matches the initiated data of this
        requirement.
        """
        if not type(view_instance) == self.view_class:
            result = False
        elif not view_instance.action == self.view_action:
            result = False
        else:
            result = True
            for key in view_instance.kwargs:
                if not self.kwargs[key] == view_instance.kwargs[key]:
                    result = False
                    break
        return result
