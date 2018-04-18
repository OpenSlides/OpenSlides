from typing import Any, Dict, List, Optional

from ..utils.access_permissions import BaseAccessPermissions  # noqa
from ..utils.auth import has_perm
from ..utils.collection import CollectionElement


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

    def get_restricted_data(
            self,
            full_data: List[Dict[str, Any]],
            user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes unpublished polls for non admins so that they
        only get a result like the AssignmentShortSerializer would give them.
        """
        # Parse data.
        if has_perm(user, 'assignments.can_see') and has_perm(user, 'assignments.can_manage'):
            data = full_data
        elif has_perm(user, 'assignments.can_see'):
            # Exclude unpublished poll votes.
            data = []
            for full in full_data:
                full_copy = full.copy()
                polls = full_copy['polls']
                for poll in polls:
                    if not poll['published']:
                        for option in poll['options']:
                            option['votes'] = []  # clear votes for not published polls
                        poll['has_votes'] = False  # A user should see, if there are votes.
                data.append(full_copy)
        else:
            data = []

        return data

    def get_projector_data(self, full_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes unpublished polls.
        """
        # Parse data. Exclude unpublished polls.
        data = []
        for full in full_data:
            full_copy = full.copy()
            full_copy['polls'] = [poll for poll in full['polls'] if poll['published']]
            data.append(full_copy)

        return data
