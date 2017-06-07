from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import has_perm
from ..utils.collection import Collection


class AssignmentAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Assignment and AssignmentViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'assignments.can_see')

    def get_restricted_data(self, container, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes unpublished polls for non admins so that they
        only get a result like the AssignmentShortSerializer would give them.
        """
        # Expand full_data to a list if it is not one.
        full_data = container.get_full_data() if isinstance(container, Collection) else [container.get_full_data()]

        # Parse data.
        if has_perm(user, 'assignments.can_see') and has_perm(user, 'assignments.can_manage'):
            data = full_data
        elif has_perm(user, 'assignments.can_see'):
            # Exclude unpublished polls.
            data = []
            for full in full_data:
                full_copy = full.copy()
                full_copy['polls'] = [poll for poll in full['polls'] if poll['published']]
                data.append(full_copy)
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

    def get_projector_data(self, full_data):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several fields.
        """
        data = full_data.copy()
        data['polls'] = [poll for poll in data['polls'] if poll['published']]
        return data
