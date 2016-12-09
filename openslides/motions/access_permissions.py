from copy import deepcopy

from ..core.config import config
from ..utils.access_permissions import BaseAccessPermissions


class MotionAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Motion and MotionViewSet.
    """
    def check_permissions(self, user):
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

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared for
        the user. Removes motion if the user has not the permission to see
        the motion in this state. Removes non public comment fields for
        some unauthorized users.
        """
        required_permission_to_see = full_data.get('state_required_permission_to_see')
        if (not required_permission_to_see or
                user.has_perm(required_permission_to_see) or
                user.has_perm('motions.can_manage') or
                user.pk in full_data.get('submitters_id', [])):
            if user.has_perm('motions.can_see_and_manage_comments') or not full_data.get('comments'):
                data = full_data
            else:
                data = deepcopy(full_data)
                for i, field in enumerate(config['motions_comments']):
                    if not field.get('public'):
                        try:
                            data['comments'][i] = None
                        except IndexError:
                            # No data in range. Just do nothing.
                            pass
        else:
            data = None
        return data

    def get_projector_data(self, full_data):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several fields.
        """
        data = full_data.copy()
        if data.get('comments') is not None:
            for i, field in enumerate(config['motions_comments']):
                if not field.get('public'):
                    try:
                        data['comments'][i] = None
                    except IndexError:
                        # No data in range. Just do nothing.
                        pass
        return data


class MotionChangeRecommendationAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for MotionChangeRecommendation and MotionChangeRecommendationViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import MotionChangeRecommendationSerializer

        return MotionChangeRecommendationSerializer


class CategoryAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Category and CategoryViewSet.
    """
    def check_permissions(self, user):
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


class MotionBlockAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Category and CategoryViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import MotionBlockSerializer

        return MotionBlockSerializer


class WorkflowAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Workflow and WorkflowViewSet.
    """
    def check_permissions(self, user):
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
