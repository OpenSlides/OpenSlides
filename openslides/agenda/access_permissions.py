from ..utils.access_permissions import BaseAccessPermissions


class ItemAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Item and ItemViewSet.
    """
    def can_retrieve(self, user):
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

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user.
        """
        if (self.can_retrieve(user) and
            (not full_data['is_hidden'] or
             user.has_perm('agenda.can_see_hidden_items'))):
            data = full_data
        else:
            data = None
        return data
