from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
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
        try:
            user = User.objects.get(pk=config_entry.get('id'))
        except User.DoesNotExist:
            # User does not exist. Just do nothing.
            pass
        else:
            yield user
