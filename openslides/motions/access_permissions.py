from copy import deepcopy
from typing import Any, Dict, List, Optional

from ..core.config import config
from ..utils.access_permissions import BaseAccessPermissions  # noqa
from ..utils.auth import has_perm
from ..utils.collection import CollectionElement


class MotionAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Motion and MotionViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import MotionSerializer

        return MotionSerializer

    def get_restricted_data(
            self,
            full_data: List[Dict[str, Any]],
            user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared for
        the user. Removes motion if the user has not the permission to see
        the motion in this state. Removes non public comment fields for
        some unauthorized users. Ensures that a user can only see his own
        personal notes.
        """
        # Parse data.
        if has_perm(user, 'motions.can_see'):
            # TODO: Refactor this after personal_notes system is refactored.
            data = []
            for full in full_data:
                # Check if user is submitter of this motion.
                if isinstance(user, CollectionElement):
                    is_submitter = user.get_full_data()['id'] in [
                        submitter['user_id'] for submitter in full.get('submitters', [])]
                else:
                    # Anonymous users can not be submitters.
                    is_submitter = False

                # Check see permission for this motion.
                required_permission_to_see = full['state_required_permission_to_see']
                permission = (
                    not required_permission_to_see or
                    has_perm(user, required_permission_to_see) or
                    has_perm(user, 'motions.can_manage') or
                    is_submitter)

                # Parse single motion.
                if permission:
                    if has_perm(user, 'motions.can_see_comments') or not full.get('comments'):
                        # Provide access to all fields.
                        motion = full
                    else:
                        # Set private comment fields to None.
                        full_copy = deepcopy(full)
                        for i, field in config['motions_comments'].items():
                            if field is None or not field.get('public'):
                                try:
                                    full_copy['comments'][i] = None
                                except IndexError:
                                    # No data in range. Just do nothing.
                                    pass
                        motion = full_copy
                    data.append(motion)
        else:
            data = []

        return data

    def get_projector_data(self, full_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several comment fields.
        """
        # Parse data.
        data = []
        for full in full_data:
            # Set private comment fields to None.
            if full.get('comments') is not None:
                full_copy = deepcopy(full)
                for i, field in config['motions_comments'].items():
                    if field is None or not field.get('public'):
                        try:
                            full_copy['comments'][i] = None
                        except IndexError:
                            # No data in range. Just do nothing.
                            pass
                data.append(full_copy)
            else:
                data.append(full)

        return data


class MotionChangeRecommendationAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for MotionChangeRecommendation and MotionChangeRecommendationViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'motions.can_see')

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
        return has_perm(user, 'motions.can_see')

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
        return has_perm(user, 'motions.can_see')

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
        return has_perm(user, 'motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import WorkflowSerializer

        return WorkflowSerializer
