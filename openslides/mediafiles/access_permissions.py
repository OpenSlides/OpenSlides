from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import has_perm
from ..utils.collection import Collection


class MediafileAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Mediafile and MediafileViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'mediafiles.can_see')

    def get_restricted_data(self, container, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes hidden mediafiles for  some users.
        """
        # Expand full_data to a list if it is not one.
        full_data = container.get_full_data() if isinstance(container, Collection) else [container.get_full_data()]

        # Parse data.
        if has_perm(user, 'mediafiles.can_see') and has_perm(user, 'mediafiles.can_see_hidden'):
            data = full_data
        elif has_perm(user, 'mediafiles.can_see'):
            # Exclude hidden mediafiles.
            data = [full for full in full_data if not full['hidden']]
        else:
            data = []

        # Reduce result to a single item or None if it was not a collection at
        # the beginning of the method.
        if isinstance(container, Collection):
            restricted_data = data
        elif data:
            restricted_data = data[0]
        else:
            restricted_data = None

        return restricted_data
