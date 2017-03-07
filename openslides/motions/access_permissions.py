from copy import deepcopy

from django.contrib.auth import get_user_model

from ..core.config import config
from ..utils.access_permissions import BaseAccessPermissions
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

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared for
        the user. Removes motion if the user has not the permission to see
        the motion in this state. Removes non public comment fields for
        some unauthorized users.
        """
        if isinstance(user, get_user_model()):
            # Converts a user object to a collection element.
            # from_instance can not be used because the user serializer loads
            # the group from the db. So each call to from_instance(user) consts
            # one db query.
            user = CollectionElement.from_values('users/user', user.id)

        if isinstance(user, CollectionElement):
            is_submitter = user.get_full_data()['id'] in full_data.get('submitters_id', [])
        else:
            # Anonymous users can not be submitters
            is_submitter = False

        required_permission_to_see = full_data['state_required_permission_to_see']
        data = None
        if has_perm(user, 'motions.can_see'):
            if (not required_permission_to_see or
                    has_perm(user, required_permission_to_see) or
                    has_perm(user, 'motions.can_manage') or
                    is_submitter):
                if has_perm(user, 'motions.can_see_and_manage_comments') or not full_data.get('comments'):
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
