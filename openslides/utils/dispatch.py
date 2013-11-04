# -*- coding: utf-8 -*-


class SignalConnectMetaClass(type):
    """
    Metaclass to connect the children of a base class to a given signal
    receiver.

    Classes must have a receiver argument and a get_dispatch_uid classmethod
    which must return a unique value for each child class or None for the base
    class.
    """
    def __new__(metaclass, class_name, class_parents, class_attributes):
        """
        Creates the class and calls the given
        """
        new_class = super(SignalConnectMetaClass, metaclass).__new__(
            metaclass, class_name, class_parents, class_attributes)
        dispatch_uid = new_class.get_dispatch_uid()
        if dispatch_uid is not None:
            new_class.receiver.connect(new_class, dispatch_uid=dispatch_uid)
        return new_class
