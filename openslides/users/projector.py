from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .access_permissions import UserAccessPermissions
from .models import User


class UserSlide(ProjectorElement):
    """
    Slide definitions for User model.
    """
    name = 'users/user'

    def check_data(self):
        if not User.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('User does not exist.')

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            yield ProjectorRequirement(
                access_permissions=UserAccessPermissions,
                id=str(pk))

            # Hint: We do not have to yield any ProjectorRequirement
            # instances for groups because groups are always available for
            # everyone.
