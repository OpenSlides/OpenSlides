from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import has_perm


class AssignmentAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Assignment and AssignmentViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'assignments.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns different serializer classes according to users permissions.
        """
        from .serializers import AssignmentFullSerializer, AssignmentShortSerializer

        if user is None or (has_perm(user, 'assignments.can_see') and has_perm(user, 'assignments.can_manage')):
            serializer_class = AssignmentFullSerializer
        else:
            serializer_class = AssignmentShortSerializer
        return serializer_class

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes unpublished polls for non admins so that they
        only get a result like the AssignmentShortSerializer would give them.
        """
        if has_perm(user, 'assignments.can_see') and has_perm(user, 'assignments.can_manage'):
            data = full_data
        elif has_perm(user, 'assignments.can_see'):
            data = full_data.copy()
            data['polls'] = [poll for poll in data['polls'] if poll['published']]
        else:
            data = None
        return data

    def get_projector_data(self, full_data):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several fields.
        """
        data = full_data.copy()
        data['polls'] = [poll for poll in data['polls'] if poll['published']]
        return data
