class AccessPermissions:
    def get_serializer_class(self, user):
        return None

    def can_retrieve(self, user):
        """
        TODO
        """
        return user.has_perm('core.can_see_projector')
