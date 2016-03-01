from ..utils.access_permissions import BaseAccessPermissions


class MotionAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Motion and MotionViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import MotionSerializer

        return MotionSerializer


class CategoryAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Category and CategoryViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import CategorySerializer

        return CategorySerializer


class WorkflowAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Workflow and WorkflowViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import WorkflowSerializer

        return WorkflowSerializer
