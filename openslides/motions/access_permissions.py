from copy import deepcopy

from ..core.config import config
from ..utils.access_permissions import (  # noqa
    BaseAccessPermissions,
    RestrictedData,
)
from ..utils.auth import has_perm
from ..utils.collection import Collection, CollectionElement


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

    def get_restricted_data(self, container, user):
        """
        Returns the restricted serialized data for the instance prepared for
        the user. Removes motion if the user has not the permission to see
        the motion in this state. Removes non public comment fields for
        some unauthorized users. Ensures that a user can only see his own
        personal notes.
        """
        # Expand full_data to a list if it is not one.
        full_data = container.get_full_data() if isinstance(container, Collection) else [container.get_full_data()]

        # Parse data.
        if has_perm(user, 'motions.can_see'):
            # TODO: Refactor this after personal_notes system is refactored.
            data = []
            for full in full_data:
                # Check if user is submitter of this motion.
                if isinstance(user, CollectionElement):
                    is_submitter = user.get_full_data()['id'] in full.get('submitters_id', [])
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
                    if has_perm(user, 'motions.can_see_and_manage_comments') or not full.get('comments'):
                        # Provide access to all fields.
                        motion = full
                    else:
                        # Set private comment fields to None.
                        full_copy = deepcopy(full)
                        for i, field in enumerate(config['motions_comments']):
                            if not field.get('public'):
                                try:
                                    full_copy['comments'][i] = None
                                except IndexError:
                                    # No data in range. Just do nothing.
                                    pass
                        motion = full_copy
                    data.append(motion)
        else:
            data = []

        # Reduce result to a single item or None if it was not a collection at
        # the beginning of the method.
        if isinstance(container, Collection):
            restricted_data = data  # type: RestrictedData
        elif data:
            restricted_data = data[0]
        else:
            restricted_data = None

        return restricted_data

    def get_projector_data(self, container):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several comment fields.
        """
        # Expand full_data to a list if it is not one.
        full_data = container.get_full_data() if isinstance(container, Collection) else [container.get_full_data()]

        # Parse data.
        data = []
        for full in full_data:
            # Set private comment fields to None.
            if full.get('comments') is not None:
                full_copy = deepcopy(full)
                for i, field in enumerate(config['motions_comments']):
                    if not field.get('public'):
                        try:
                            full_copy['comments'][i] = None
                        except IndexError:
                            # No data in range. Just do nothing.
                            pass
                data.append(full_copy)
            else:
                data.append(full)

        # Reduce result to a single item or None if it was not a collection at
        # the beginning of the method.
        if isinstance(container, Collection):
            projector_data = data  # type: RestrictedData
        elif data:
            projector_data = data[0]
        else:
            projector_data = None

        return projector_data


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
