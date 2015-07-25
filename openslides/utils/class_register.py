class RegisterSubclasses(type):
    """
    Metaclass to register subclasses of a class.

    The metaclass adds an attribute 'subclasses' to the base class. This
    attribute is a set containing all derivated classes.

    After a new subclass is created, the classmethod on_subclass_created is
    called.

    Example:
    class Base(metaclass=RegisterSubclasses):
        pass

    class Child(Base):
        pass

    assert Child in Base.subclasses
    """

    def __init__(cls, *args, **kwargs):
        # Try to add the cls to cls.subclasses. If it does not have the
        # attribute subclasses, then this is the base class, which should not
        # be registered
        try:
            cls.subclasses.add(cls)
        except AttributeError:
            cls.subclasses = set()
        else:
            try:
                cls.on_subclass_created()
            except Exception as exception:
                # If on_subclass_created() raises any exception, then the class
                # should not be in cls.subclasses.
                cls.subclasses.remove(cls)
                # Raise the exception afterwards
                raise exception
        super().__init__(*args, **kwargs)

    def on_subclass_created(cls):
        """
        This method is called when a new subclass is created.

        Do nothing as default.
        """
        pass
