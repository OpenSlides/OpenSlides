from ..utils.access_permissions import BaseAccessPermissions


class AssignmentAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Assignment and AssignmentViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('assignments.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns different serializer classes according to users permissions.
        """
        from .serializers import AssignmentFullSerializer, AssignmentShortSerializer

        if user is None or user.has_perm('assignments.can_manage'):
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
        if user.has_perm('assignments.can_manage'):
            data = full_data
        else:
            data = full_data.copy()
            data['polls'] = [poll for poll in data['polls'] if poll['published']]
        return data
