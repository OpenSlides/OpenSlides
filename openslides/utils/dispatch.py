# -*- coding: utf-8 -*-


class SignalConnectMetaClass(type):
    """
    Metaclass to connect the children of a base class to a Django signal.

    Classes must have a signal argument and a get_dispatch_uid classmethod.
    The signal argument must be the Django signal the class should be
    connected to. The get_dispatch_uid classmethod must return a unique
    value for each child class and None for base classes because they will
    not be connected to the signal.

    The classmethod get_all_objects is added as get_all classmethod to every
    class using this metaclass. Calling this on a base class or on child
    classes will retrieve all connected children, one instance for each
    child class.

    These instances will have a check_permission method which returns True
    by default. You can override this method to return False on runtime if
    you want to filter some children.

    They will also have a get_default_weight method which returns the value
    of the default_weight attribute which is 0 by default. You can override
    the attribute or the method to sort the children.

    Don't forget to set up the __init__ method so that it is able to receive
    wildcard keyword arguments (see example below). This is necessary
    because of Django's signal API.

    Example:

    class Base(object):
        __metaclass__ = SignalConnectMetaClass
        signal = django.dispatch.Signal()
        @classmethod
        def get_dispatch_uid(cls):
            if not cls.__name__ == 'Base':
                return cls.__name__

    class Child(Base):
        def __init__(self, **kwargs):
            pass

    child = Base.get_all(request)[0]
    assert Child == type(child)
    """
    def __new__(metaclass, class_name, class_parents, class_attributes):
        """
        Creates the class and connects it to the signal if so. Adds all
        default attributes and methods.
        """
        class_attributes['get_all'] = get_all_objects
        new_class = super(SignalConnectMetaClass, metaclass).__new__(
            metaclass, class_name, class_parents, class_attributes)
        try:
            dispatch_uid = new_class.get_dispatch_uid()
        except AttributeError:
            raise NotImplementedError('Your class %s must have a get_dispatch_uid classmethod.' % class_name)
        if dispatch_uid is not None:
            try:
                signal = new_class.signal
            except AttributeError:
                raise NotImplementedError('Your class %s must have a signal argument, which must be a Django Signal instance.' % class_name)
            else:
                signal.connect(new_class, dispatch_uid=dispatch_uid)
        attributes = {'check_permission': check_permission,
                      'get_default_weight': get_default_weight,
                      'default_weight': 0}
        for name, attribute in attributes.items():
            if not hasattr(new_class, name):
                setattr(new_class, name, attribute)
        return new_class


@classmethod
def get_all_objects(cls, request):
    """
    Collects all objects of the class created by the SignalConnectMetaClass
    from all apps via signal. They are sorted using the get_default_weight
    method. Does not return objects where check_permission returns False.

    Expects a django.http.HttpRequest object.

    This classmethod is added as get_all classmethod to every class using
    the SignalConnectMetaClass.
    """
    all_objects = [obj for __, obj in cls.signal.send(sender=cls, request=request) if obj.check_permission()]
    all_objects.sort(key=lambda obj: obj.get_default_weight())
    return all_objects


def check_permission(self):
    """
    Returns True by default. Override this to filter some children on runtime.

    This method is added to every instance of classes using the
    SignalConnectMetaClass.
    """
    return True


def get_default_weight(self):
    """
    Returns the value of the default_weight attribute by default. Override
    this to sort some children on runtime.

    This method is added to every instance of classes using the
    SignalConnectMetaClass.
    """
    return self.default_weight
