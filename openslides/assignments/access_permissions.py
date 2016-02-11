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

    def get_serializer_class(self, user):
        """
        Returns different serializer classes according to users permissions.
        """
        from .serializers import AssignmentFullSerializer, AssignmentShortSerializer

        if user.has_perm('assignments.can_manage'):
            serializer_class = AssignmentFullSerializer
        else:
            serializer_class = AssignmentShortSerializer
        return serializer_class
