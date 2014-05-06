# -*- coding: utf-8 -*-

from django.dispatch import Signal

from .dispatch import SignalConnectMetaClass


class PersonalInfo(object):
    """
    Base class for a personal info collection for the personal info widget
    on the dashboard.

    Every app which wants to add info has to create a class subclassing
    from this base class. For the content the headline attribute, the
    default_weight attribute and the get_queryset method have to be set.
    The __metaclass__ attribute (SignalConnectMetaClass) does the rest of
    the magic.
    """
    __metaclass__ = SignalConnectMetaClass
    signal = Signal(providing_args=['request'])
    headline = None
    default_weight = 0

    def __init__(self, sender, request, **kwargs):
        """
        Initializes the personal info instance. This is done when the
        signal is sent.

        Only the required request argument is used. Because of Django's signal
        API, we have to take also a sender argument and wildcard keyword
        arguments. But they are not used here.
        """
        self.request = request

    @classmethod
    def get_dispatch_uid(cls):
        """
        Returns the classname as a unique string for each class. Returns
        None for the base class so it will not be connected to the signal.
        """
        if not cls.__name__ == 'PersonalInfo':
            return cls.__name__

    def get_queryset(self):
        """
        Returns a queryset of objects for the personal info widget.
        """
        raise NotImplementedError('Your class %s has to define a get_queryset method.' % self.__class__)

    def is_active(self):
        """
        Returns True if the infoblock is shown in the widget.
        """
        return self.get_queryset() is not None
