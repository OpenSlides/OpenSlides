class BaseAccessPermissions:
    """
    Base access permissions container.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return False

    def get_serializer_class(self, user):
        """
        Returns different serializer classes according to users permissions.
        """
        raise NotImplementedError(
            "You have to add the classmethod 'get_serializer_class' to your "
            "access permissions class.".format(self))

    def get_serialized_data(self, instance, user):
        """
        Returns the serialized data for the instance prepared for the user.

        Returns None if the user has no read access.
        """
        if self.can_retrieve(user):
            serializer_class = self.get_serializer_class(user)
            data = serializer_class(instance).data
        else:
            data = None
        return data
