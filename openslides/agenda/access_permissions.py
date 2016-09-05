from ..utils.access_permissions import BaseAccessPermissions


class ItemAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Item and ItemViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('agenda.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ItemSerializer

        return ItemSerializer

    def get_restricted_data(self, full_data, user, id):
        """
        Returns the restricted serialized data for the instance prepared
        for the user.
        """
        if (user.has_perm('agenda.can_see') and
            (not full_data['is_hidden'] or
             user.has_perm('agenda.can_see_hidden_items'))):
            data = full_data
        elif self.check_projector_requirements(user, id):
            # In this case it is already checked that the projector user needs
            # this item whether it is a hidden item or not. So we do not have
            # to care about this.
            data = full_data
        else:
            data = None
        return data
