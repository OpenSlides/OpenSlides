from django.utils.translation import ugettext as _

from openslides.core.exceptions import ProjectorException
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import User
from .views import GroupViewSet, UserViewSet


class UserSlide(ProjectorElement):
    """
    Slide definitions for user model.
    """
    name = 'users/user'

    def get_context(self):
        pk = self.config_entry.get('id')
        if not User.objects.filter(pk=pk).exists():
            raise ProjectorException(_('User does not exist.'))
        return {'id': pk}

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            yield ProjectorRequirement(
                view_class=UserViewSet,
                view_action='retrive',
                pk=pk)

            for group in User.objects.get(pk=pk).groups.all():
                yield ProjectorRequirement(
                    view_class=GroupViewSet,
                    view_action='retrieve',
                    pk=str(group.pk))
