from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .models import User
from .views import GroupViewSet, UserViewSet


class UserSlide(ProjectorElement):
    """
    Slide definitions for user model.
    """
    name = 'users/user'

    def check_data(self):
        if not User.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('User does not exist.')

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            try:
                user = User.objects.get(pk=pk)
            except User.DoesNotExist:
                # User does not exist. Just do nothing.
                pass
            else:
                yield ProjectorRequirement(
                    view_class=UserViewSet,
                    view_action='retrieve',
                    pk=str(user.pk))
                for group in user.groups.all():
                    yield ProjectorRequirement(
                        view_class=GroupViewSet,
                        view_action='retrieve',
                        pk=str(group.pk))
